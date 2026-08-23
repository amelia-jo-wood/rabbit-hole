# rabbit. 🐇

"Fall down the hole." Pick what you're curious about, pick how deep you want
to go, and get a synthesized, chapter-by-chapter rabbit hole with AI-suggested
further reading at the end.

This is v1 — rebuilt to match a Figma prototype (mobile app design, red/coral
branding, hobby picker → depth picker → generated course → sources screen)
after v0 (a simpler single-category random-topic generator).

## Stack

- **Next.js 15** (App Router, TypeScript) — one project, no separate backend
- **Tailwind CSS** — styling, coral/white theme matching the prototype
- **Gemini API** (`gemini-2.5-flash`, free tier) — generates the topic + all
  chapters in one call, and a second call for the sources screen. Plain
  `fetch`, no SDK. Chosen over the Claude API specifically to keep this
  project's running cost at $0 — free tier, no credit card.
- **localStorage** — history, read-progress per chapter, and saved sources.
  No accounts or database in this version (see Stretch Goals).

## Setup

```bash
npm install
cp .env.example .env.local
# then edit .env.local and add your GEMINI_API_KEY
npm run dev
```

Open http://localhost:3000. Get a free API key (no credit card, 1,500
requests/day) at https://aistudio.google.com/apikey.

## How it's put together

The whole flow is one client component, `src/components/HomeWizard.tsx`,
acting as a step machine (`landing → interests → depth → digging → overview →
chapter → sources`) rather than separate Next.js routes per screen. That was
a deliberate choice: passing the in-progress selections (interests, depth,
generated topic) between real routes would mean serializing state through
URLs or a client store, and this app doesn't need shareable URLs for every
step — only the finished result (`/?id=...`) needs to be a real, reloadable
link, since that's what History links to.

- `src/app/api/rabbit-hole/route.ts` — one Gemini call that both picks a
  specific topic from the selected interests *and* writes all the chapters,
  sized by depth (1 chapter for "Casual Snacker", 4 for "The Explorer", 6 for
  "Deeply Obsessed"). Combining topic + course into one call matches the
  design's single "Digging your hole…" loading step.
- `src/app/api/sources/route.ts` — a second, smaller call for the Sources &
  Files screen, run lazily (only when the user reaches it).
- `src/lib/storage.ts` — history, per-chapter read state, and saved sources,
  isolated from the UI so swapping localStorage for a real backend later is a
  one-file change.
- `src/lib/gemini.ts` — fetch wrapper + JSON extractor (same pattern as v0's
  Claude version, swapped to Gemini's free tier and its native JSON response
  mode).

## A deliberate departure from the design

The Figma design's "Sources & Files" screen implies real, fetchable source
files (open a file, sync to Notion). This version generates *plausible
AI-suggested* sources instead — titles and descriptions of the kind of
video/article/podcast that would exist — and says so in the UI. Building real
source curation would mean a live web-search integration, which means another
API key and likely another cost on top of the free Gemini one. For a version
meant to run at $0, one free API key felt like the right tradeoff. The "open
source file" link from the design was replaced with a working bookmark/save
toggle instead, so the screen still does something real rather than
something that only looks real.

## Stretch goals

- **Real source curation** via a search API, once a second API key is an
  acceptable cost.
- **Accounts + a database** so history/progress sync across devices.
- **Usage limits + a paid tier** (Stripe) — the single highest-value SaaS
  feature to add for a portfolio, and still not built here.
- **Shareable course links** and **PDF export** of a finished rabbit hole.

## Note on how this was built

Hand-written in a sandboxed environment without package-registry access, so
`npm install` / `next build` have not been run yet — that's your first step.
Reviewed manually and partially type-checked; treat your first `npm run dev`
as the real first build check.
