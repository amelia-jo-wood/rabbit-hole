# PRD: rabbit. — a curiosity engine

*Written as the planning doc that should have come before any code — what
the app needed to do and why, before deciding how. (Written after the fact
here, since v1 already exists, but in the same voice you'd use starting
fresh — useful as a template for the next project too.)*

## Background

A small app to fall down a "rabbit hole": pick what you're curious about,
pick how deep you want to go, and get a synthesized, chapter-by-chapter
mini-course on a specific (ideally surprising) topic. Based on a Figma
prototype: mobile-style UI, red/coral branding, "rabbit." wordmark, tagline
"Fall down the hole."

Built as a portfolio project to learn AI-assisted ("vibe coding")
development and to have a real, working, deployed app to show for it — not
just a mockup.

## Goals

- A complete flow: interests → depth → generated topic → chapter-by-chapter
  course → further-reading suggestions.
- Visually matches the Figma design.
- Actually deployed and usable at a real URL, not just running locally.
- Costs $0/month to run.

## Target user

Primarily: the builder's own portfolio (a demo people can click through).
Secondarily: anyone who wants a low-effort way to learn something specific
and unexpected.

## Core user story

"As someone who's bored or curious, I want to pick a couple of things I'm
into and get one specific, interesting rabbit hole to go down — with just
enough structure (chapters, a time estimate) that I actually finish it
instead of bouncing off a wall of text."

## Functional requirements

- **Landing screen** — explains the concept, sets expectations ("addictive
  curiosity engine"), one clear call to action to start.
- **Interest picker** — multi-select from a fixed set of curiosity
  categories (not free-text — see Constraints).
- **Depth picker** — three tiers trading off length/effort: a quick single
  concept, a standard multi-chapter breakdown, and a long deep-dive.
  Chapter count and length should scale with the tier chosen.
- **Generation** — combine the selected interests into one specific topic
  (not a broad subject), with a loading state that doesn't feel broken
  during the wait.
- **Course view** — the generated topic, a summary, and a chapter list
  showing progress; reading moves chapter by chapter.
- **Sources screen** — further-reading suggestions after finishing the
  course.
- **History** — past rabbit holes are revisitable, at least within the same
  browser.

## Non-goals for v1 (explicitly deferred)

- **Accounts / cross-device sync** — v1 is single-browser only.
- **Real, verified source links** — v1's sources are AI-suggested reading
  ideas, clearly labeled as such, not fetched from a real search.
- Payments, sharing links, a native mobile app.

*(These first two became the subject of [PRD-v2](./PRD-v2.md) once v1 was
live and the gaps were clear in practice.)*

## Constraints

- **$0/month, no subscriptions, no credit card anywhere in the stack.**
  This shapes real requirements, not just a nice-to-have: the AI provider,
  the hosting, and the code repo all need genuinely free tiers.
- **The builder doesn't use a command line.** Whatever the build/deploy
  process is, it needs to work entirely through web UIs (GitHub's web
  upload, a host with git-based deploys) — no local Node install, no
  terminal commands.
- **No user free-text input into the AI prompts.** Interests come from a
  fixed list, not an open text box — keeps the topic space predictable and
  closes off most prompt-injection/abuse angles, which matters more for a
  public link than a local-only app.

## Decisions to make before building (open at the start)

1. **Which AI provider?** Needs to actually be free with no card. (Resolved
   during the build: Gemini's free tier, after ruling out Claude's API on
   cost grounds.)
2. **Which hosting?** Needs a git-based deploy with a free tier and no
   local build step required. (Resolved: GitHub + Vercel.)
3. **Are v1's sources real or AI-suggested?** Real sources need a search
   API — another free-tier dependency to qualify, and more build time.
   Decided to ship AI-suggested sources for v1 and revisit as v2 if the
   gap turned out to matter. (It did — see PRD-v2.)
4. **One multi-step page, or a separate route per screen?** A single
   step-machine component was chosen over separate Next.js routes, since
   the in-progress selections (interests, depth) don't need their own
   shareable URLs — only the finished result does.

## Success criteria

- A stranger can open the live URL, go through the whole flow, and get a
  coherent mini-course out the other end.
- The visual design is recognizably the Figma prototype.
- Nothing in the stack has a bill attached.
