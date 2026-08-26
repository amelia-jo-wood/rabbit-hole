# rabbit. 🐇

"Fall down the hole." Pick what you're curious about, pick how deep you want
to go, and get a synthesized, chapter-by-chapter rabbit hole with real
sources — video, podcast, and article — to explore next.

v1 matched a Figma prototype (mobile app design, red/coral branding, hobby
picker → depth picker → generated course → sources screen). v2 (this
version) replaces v1's AI-guessed sources with real, clickable search
results — see [`docs/PRD-v2.md`](./docs/PRD-v2.md) and
[`docs/PRD-v1.md`](./docs/PRD-v1.md) for the planning behind each version.

## Stack

- **Next.js 15** (App Router, TypeScript) — one project, no separate backend
- **Tailwind CSS** — styling, coral/white theme matching the prototype
- **Gemini API** (`gemini-3.6-flash`, free tier) — generates the topic and
  all chapters in one call. Plain `fetch`, no SDK. Topics are now required
  to be real (not invented) events/subjects, specifically so the sources
  step below has something real to find.
- **Tavily API** (free tier, 1,000 searches/month) — three real web
  searches per rabbit hole (video, podcast, article), run server-side so
  the results are genuine, clickable links instead of AI guesses. Results
  are then filtered for relevance (see below) before they reach the user.
- **localStorage** — history, read-progress per chapter, and saved sources.
  No accounts or database yet (see `docs/PRD-v2.md`, Feature 1).

## Setup

```bash
npm install
cp .env.example .env.local
# then edit .env.local and add GEMINI_API_KEY and TAVILY_API_KEY
npm run dev
```

Open http://localhost:3000.

- Gemini key (free, no card): https://aistudio.google.com/apikey
- Tavily key (free, no card, 1,000 searches/month): https://app.tavily.com

## How it's put together

The whole flow is one client component, `src/components/HomeWizard.tsx`,
acting as a step machine (`landing → interests → depth → digging → overview
→ chapter → sources`) rather than separate Next.js routes per screen. That
was a deliberate choice: passing the in-progress selections (interests,
depth, generated topic) between real routes would mean serializing state
through URLs or a client store, and this app doesn't need shareable URLs
for every step — only the finished result (`/?id=...`) needs to be a real,
reloadable link, since that's what History links to.

- `src/app/api/rabbit-hole/route.ts` — one Gemini call that both picks a
  specific *real* topic from the selected interests *and* writes all the
  chapters, sized by depth (1 chapter for "Casual Snacker", 4 for "The
  Explorer", 6 for "Deeply Obsessed").
- `src/app/api/sources/route.ts` — three Tavily searches in parallel
  (video-only domains, podcast-only domains, general web), run lazily when
  the user reaches the sources screen. Uses `Promise.allSettled`, not
  `Promise.all`: if one of the three searches has a hiccup, the other two
  still show results instead of the whole screen failing. Each search
  pulls 5 raw candidates (not just the 2 shown) and then narrows them:
  - Anything below Tavily's own relevance score cutoff is dropped — this
    is what used to let through, say, drone footage of San Francisco for
    a topic about "the lost city of San Mateo," or an unrelated comic
    book that happened to share a word with the topic's title.
  - Podcast results are kept only if the link points at one specific
    episode (Spotify `/episode/…`, Apple's `?i=` param, Overcast's `/+`
    permalinks) — a link to a show's homepage technically "links to the
    topic" but leaves the user to hunt through every episode themselves,
    so those are filtered out in `src/lib/tavily.ts`'s
    `isPodcastEpisodeUrl`.
  - The surviving candidates (titles + snippets only, never URLs) go to
    Gemini once, asked to pick which are genuinely about the exact topic
    versus merely sharing a word with it. Gemini only returns which
    candidates to *keep* — it never sees or invents a URL, so a real
    Tavily result can never be swapped for a hallucinated one. If that
    call fails, the route falls back to the score/episode-filtered list
    rather than losing the sources screen entirely.
- `src/lib/storage.ts` — history, per-chapter read state, and saved
  sources, isolated from the UI so swapping localStorage for a real
  backend later (see PRD-v2) is a one-file change.
- `src/lib/gemini.ts` / `src/lib/tavily.ts` — thin fetch wrappers for each
  API, no SDK dependency to version-track.

## Stretch goals

See `docs/PRD-v2.md` for the two next features already scoped: accounts
(so history/progress sync across devices) and — once accounts exist —
letting a guest save a rabbit hole to their account. Beyond that:

- **Usage limits + a paid tier** (Stripe) — the single highest-value SaaS
  feature to add for a portfolio, and still not built here.
- **Shareable course links** and **PDF export** of a finished rabbit hole.

## Note on how this was built

Hand-written in a sandboxed environment without package-registry access, so
`npm install` / `next build` haven't been run in that environment — they
have been run and confirmed working in the real deployment (Vercel). If
you're pulling this repo fresh, `npm install` is still your first step.
