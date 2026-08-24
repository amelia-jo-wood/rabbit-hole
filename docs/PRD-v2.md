# PRD: rabbit. v2 — Accounts & Real Source Curation

*A PRD (Product Requirements Doc) is just a written answer to "what are we
building, why, and what does 'done' look like" — written before the code,
so decisions get made once instead of mid-build. Nothing here is locked in;
it's meant to be edited as you learn more.*

## Background

v1 is live: pick interests, pick depth, get an AI-generated topic and
chapter-by-chapter mini-course. Two known gaps, both flagged as stretch
goals when v1 shipped:

- History and progress live only in one browser's localStorage — nothing
  syncs, nothing survives clearing browser data.
- The "Sources & Files" screen shows AI-*guessed* sources (plausible titles,
  not real links) — a deliberate v1 shortcut, not what the original design
  implied.

v2 closes both gaps.

## Goals

- History, progress, and saved sources follow you across devices.
- The sources screen shows real, clickable sources instead of AI guesses.

## Non-goals (explicitly out of scope for v2)

- Payments or a paid tier (separate future phase)
- Sharing a rabbit hole with someone else / public links
- Anything beyond the existing responsive web app (no native mobile app)

## Constraint carried over from v1

Free resources only, no subscriptions. Every new dependency below needs to
clear that bar — flagged wherever it isn't confirmed yet.

---

## Feature 1: Accounts

### Problem

Nothing persists across devices or browsers. Clearing browser data wipes
everything. There's no way to say "this history is mine."

### Requirements

- Sign up / log in (simplest: email magic link, so there's no password to
  manage or lose)
- Once logged in, a rabbit hole, its chapter progress, and its saved
  sources are stored server-side, tied to that account
- Existing localStorage history should not just vanish — offer to import it
  into the account on first login

### Open questions (decide before building)

1. **Require login to generate at all, or let people try it as a guest
   first and create an account only if they want to save?** The app's whole
   pitch is low-friction ("fall down the hole" right now) — a signup wall
   up front cuts against that. Leaning toward: generate as a guest, prompt
   to save/log in afterward.
2. What exactly happens to a guest's in-progress localStorage history the
   first time they log in — import all of it, or just offer it as a
   one-time choice?

### Technical approach (proposed)

- **Supabase** — Postgres database + auth, free tier, no card required.
  Replaces localStorage as the source of truth once a user is logged in.
- New tables, roughly: `rabbit_holes` (topic + metadata), `chapters`,
  `read_progress`, `saved_sources` — each row tied to a `user_id`.
- The existing API routes (`/api/rabbit-hole`, `/api/sources`) stay mostly
  the same; what changes is where the *result* gets saved after — Supabase
  instead of (or alongside) localStorage.

---

## Feature 2: Real source curation

### Problem

The sources screen currently invents plausible-sounding titles and
descriptions — not real links. It says so in the UI, but it doesn't do
what the original design implied (real, bookmarkable files).

### Requirements

- The sources screen shows results from an actual search — real title,
  real URL, real source/domain shown to the user
- Reasonable mix of types (article/video/podcast) where the results allow
  it, but real results take priority over a forced mix
- If a search comes back thin, show fewer sources rather than backfilling
  with invented ones

### Open questions (decide before building)

1. **Which search API actually meets the free/no-card constraint?** Not
   confirmed yet — needs a quick check right before this gets built, the
   same way the AI provider needed checking. Candidates to evaluate:
   Tavily, Brave Search API, Google Programmable Search.
2. What happens to rabbit holes generated under v1 that already have
   AI-guessed sources saved? (Leaning toward: leave them as-is, label them
   as "AI-suggested," only new generations get real sources.)

### Technical approach (proposed)

- New server-side call from `/api/sources` out to whichever search API is
  chosen, using the chapter topics as the query.
- Store the returned links (not just re-fetch every time) so history keeps
  working even if a link later goes dead.

---

## Suggested build order

1. Confirm a search API that's genuinely free/no-card (small research
   spike, not a full build)
2. Accounts — bigger change, and source-saving depends on having an
   account to save *to*
3. Real source curation

## Success criteria

- Log in on your phone and your laptop, see the same history on both.
- Click a source on the sources screen and it opens a real page.
