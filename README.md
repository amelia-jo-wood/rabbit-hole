# rabbit. 🐇

"Fall down the hole." Pick what you're curious about, pick how deep you want
to go, and get a synthesized, chapter-by-chapter rabbit hole with real
sources — video, podcast, and article — to explore next.

v1 matched a Figma prototype (mobile app design, red/coral branding, hobby
picker → depth picker → generated course → sources screen). v2 (this
version) replaces v1's AI-guessed sources with real, clickable search
results, and adds accounts (email/password + Google login, via Supabase)
so a rabbit hole and its progress can follow you across devices — see
[`docs/PRD-v2.md`](./docs/PRD-v2.md) and
[`docs/PRD-v1.md`](./docs/PRD-v1.md) for the planning behind each version.
Generating and reading is still guest-friendly — no login needed until you
want it to sync somewhere else.

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
- **Supabase** (free tier, no card) — Postgres database + auth (email/
  password and Google login). Once logged in, a rabbit hole and its
  progress sync to the account instead of staying on one device.
- **localStorage** — always used as the on-device copy (works offline,
  and is the *only* copy for a guest who hasn't logged in). This is the
  "@supabase/supabase-js" package's one exception to this project's
  fetch-only style: auth involves token refresh, OAuth redirects, and
  secure session storage that the maintained client handles correctly and
  hand-rolled `fetch` calls would not.

## Setup

```bash
npm install
cp .env.example .env.local
# then edit .env.local and fill in all four keys/URLs
npm run dev
```

Open http://localhost:3000.

- Gemini key (free, no card): https://aistudio.google.com/apikey
- Tavily key (free, no card, 1,000 searches/month): https://app.tavily.com
- Supabase URL + anon key (free, no card): create a project at
  https://supabase.com, then Project Settings → API. Also run the SQL in
  `docs/PRD-v2.md`'s Feature 1 section to create the `rabbit_holes`
  table, and enable Google under Authentication → Providers (with a free
  Google Cloud OAuth client) if you want Google login too.
- One thing worth knowing: Supabase's free tier pauses a project after a
  week with no activity. Nothing is lost — it just needs a manual
  "unpause" click in the Supabase dashboard the next time it's used.

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
  pulls 8-10 raw candidates (not just the up-to-4 shown per type) and then
  narrows them:
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
- `src/lib/storage.ts` — the on-device (localStorage) copy: history,
  per-chapter read state, and saved sources.
- `src/lib/cloudStorage.ts` / `src/lib/supabaseClient.ts` — the account
  (Supabase) copy of the same data. `HomeWizard.tsx` writes to both on
  every change when someone's logged in; `src/app/history/page.tsx` reads
  from the cloud when logged in, localStorage otherwise.
- `src/components/AuthProvider.tsx` / `AuthModal.tsx` — session state
  (via React context) and the login/signup UI, including the one-time
  merge of a guest's local history into their account right after they
  log in for the first time on a given device.
- `src/lib/gemini.ts` / `src/lib/tavily.ts` — thin fetch wrappers for each
  API, no SDK dependency to version-track.

## Stretch goals

Both v2 features (real sources, accounts) are now built — see
`docs/PRD-v2.md` for the reasoning behind each. Beyond that:

- **Usage limits + a paid tier** (Stripe) — the single highest-value SaaS
  feature to add for a portfolio, and still not built here.
- **Shareable course links** and **PDF export** of a finished rabbit hole.

## Note on how this was built

Hand-written in a sandboxed environment without package-registry access, so
`npm install` / `next build` haven't been run in that environment — they
have been run and confirmed working in the real deployment (Vercel). If
you're pulling this repo fresh, `npm install` is still your first step.
