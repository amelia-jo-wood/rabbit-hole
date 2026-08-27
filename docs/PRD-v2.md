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

## Feature 1: Accounts — ✅ built

### Problem

Nothing persists across devices or browsers. Clearing browser data wipes
everything. There's no way to say "this history is mine."

### Requirements

- Sign up / log in — **decided: all three of email/password, Google
  login, and (initially considered, then dropped in favor of the other
  two) email magic link**. Magic links aren't actually less secure than a
  password, but the two chosen methods covered what was wanted here.
- Once logged in, a rabbit hole, its chapter progress, and its saved
  sources are stored server-side, tied to that account
- Existing localStorage history should not just vanish — imported into
  the account automatically on first login (see below)

### Decisions made

1. **Guest-first, confirmed**: generating and reading never requires
   login. Logging in only changes where saves go — local-only (guest) vs.
   local *and* cloud (logged in).
2. **Import on login is automatic, not an offered choice**: the moment
   someone logs in or signs up on a device that has local history, every
   local entry is upserted into their account. This is safe to run on
   every login (each entry is keyed by its own id, so re-running it just
   re-saves the same rows) and avoids an extra decision/screen for a
   non-technical user.

### Technical approach (as built)

- **Supabase** — Postgres database + auth, free tier, no card required.
- One table, not four — `rabbit_holes`, with `chapters`, `sources`,
  `read_chapters`, and `saved_sources` stored as `jsonb` columns on the
  same row rather than split into separate tables. The app always reads
  and writes a whole rabbit hole at once (it's never queried
  chapter-by-chapter), so one row matches the real access pattern and
  needs no joins. Row Level Security restricts every row to its
  `user_id = auth.uid()`, so the same table safely holds every user's
  data. Exact SQL:

  ```sql
  create table rabbit_holes (
    id uuid primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    title text not null,
    teaser text,
    hero_tag text,
    synthesis_threads jsonb,
    depth text,
    interest_labels jsonb,
    chapters jsonb not null,
    sources jsonb,
    read_chapters jsonb not null default '[]',
    saved_sources jsonb not null default '[]',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  );

  alter table rabbit_holes enable row level security;

  create policy "Users can manage their own rabbit holes"
    on rabbit_holes
    for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
  ```

- `@supabase/supabase-js` is the one exception to this project's
  fetch-only style (see main README) — auth's token refresh and OAuth
  redirect handling are exactly the kind of thing worth using a
  maintained client for instead of hand-rolling.
- The existing API routes (`/api/rabbit-hole`, `/api/sources`) are
  unchanged; what's new is `HomeWizard.tsx` also writing each result to
  Supabase (via `src/lib/cloudStorage.ts`) whenever someone's logged in,
  alongside the existing localStorage write.
- Known limitation, not a bug: Supabase's free tier pauses a project
  after a week of no activity. Data isn't lost, but the next request
  needs a manual "unpause" click in the Supabase dashboard first.

---

## Feature 2: Real source curation — ✅ built

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
