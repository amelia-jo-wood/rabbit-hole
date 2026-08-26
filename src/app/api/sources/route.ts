import { NextRequest, NextResponse } from "next/server";
import { callGemini, extractJson } from "@/lib/gemini";
import {
  domainFromUrl,
  isPodcastEpisodeUrl,
  tavilySearch,
  TavilyResult,
} from "@/lib/tavily";
import { SourceItem, SourceType } from "@/lib/types";

interface SourcesRequestBody {
  topicTitle: string;
  topicTeaser?: string;
}

const VIDEO_DOMAINS = ["youtube.com"];
const PODCAST_DOMAINS = [
  "open.spotify.com",
  "podcasts.apple.com",
  "overcast.fm",
];

// Pull a wider pool of raw candidates than we'll ever show, so the
// relevance filtering below (score cutoff, episode-only podcasts, the
// Gemini pass) has real options to choose from instead of being stuck
// approving or rejecting the only 2 results that came back. Articles get
// a bigger pool than video/podcast since general web search (no domain
// restriction) naturally turns up more candidates.
const CANDIDATES_PER_TYPE = 8;
const ARTICLE_CANDIDATES = 10;
const SHOWN_PER_TYPE = 4;
// Tavily's own relevance score is 0-1. Below this, a result is often just
// a page that happens to share a word with the topic (a place name, a
// title) rather than being about the topic itself. Kept fairly loose
// on purpose - the Gemini pass below does the real semantic filtering,
// this just screens out the obvious noise before that.
const MIN_SCORE = 0.25;

interface Candidate {
  index: number;
  type: SourceType;
  title: string;
  url: string;
  domain: string;
  snippet: string;
}

async function searchType(
  topicTitle: string,
  type: SourceType
): Promise<TavilyResult[]> {
  const query =
    type === "video"
      ? `${topicTitle} video`
      : type === "podcast"
        ? `${topicTitle} podcast episode`
        : topicTitle;
  const includeDomains =
    type === "video" ? VIDEO_DOMAINS : type === "podcast" ? PODCAST_DOMAINS : undefined;
  const maxResults = type === "article" ? ARTICLE_CANDIDATES : CANDIDATES_PER_TYPE;

  return tavilySearch(query, includeDomains, maxResults, "advanced");
}

function toCandidates(
  results: TavilyResult[],
  type: SourceType,
  startIndex: number
): Candidate[] {
  let filtered = results.filter((r) => (r.score ?? 1) >= MIN_SCORE);
  if (type === "podcast") {
    filtered = filtered.filter((r) => isPodcastEpisodeUrl(r.url));
  }
  return filtered.map((r, i) => ({
    index: startIndex + i,
    type,
    title: r.title,
    url: r.url,
    domain: domainFromUrl(r.url),
    snippet: r.content.slice(0, 180).trim(),
  }));
}

/**
 * Asks Gemini to look at the candidate list (titles + snippets only - it
 * never sees or invents URLs) and pick which ones are genuinely about the
 * exact topic, dropping anything that merely shares a word with it (a
 * place with the same name, an unrelated show/book/comic with the same
 * title). Returns the *indexes* to keep, at most SHOWN_PER_TYPE per type -
 * curation, not generation, so a real Tavily result can never be replaced
 * with a hallucinated one.
 */
async function filterByRelevance(
  topicTitle: string,
  topicTeaser: string,
  candidates: Candidate[]
): Promise<number[]> {
  const list = candidates
    .map((c) => `${c.index}. [${c.type}] "${c.title}" — ${c.snippet}`)
    .join("\n");

  const prompt = `You are curating further-reading/watching/listening links for a short course on this exact topic:

Topic: "${topicTitle}"
About: ${topicTeaser || "(no extra description given)"}

Below are candidate sources found by web search, each with an index number. Some may be unrelated - for example a different place that happens to share a word with the topic's name, or an unrelated movie/book/show/comic that happens to share a word with its title. Keep ONLY candidates that are genuinely, directly about this specific topic.

${list}

Respond with ONLY a JSON object in this exact shape, listing the index numbers to keep, best first, at most ${SHOWN_PER_TYPE} per type:
{"keep": [1, 4, 7]}

If none of a given type are genuinely relevant, leave that type out entirely rather than forcing a weak match.`;

  const text = await callGemini(prompt, 400);
  const parsed = extractJson<{ keep?: number[] }>(text);
  return Array.isArray(parsed.keep) ? parsed.keep : [];
}

export async function POST(req: NextRequest) {
  let body: SourcesRequestBody;
  try {
    body = (await req.json()) as SourcesRequestBody;
  } catch {
    return NextResponse.json(
      { error: "Request body must be JSON." },
      { status: 400 }
    );
  }

  if (!body.topicTitle) {
    return NextResponse.json(
      { error: "topicTitle is required." },
      { status: 400 }
    );
  }

  // Three real searches (video-only domains, podcast-only domains, general
  // web) run in parallel, instead of one AI call that guesses
  // plausible-sounding sources. allSettled (not all): a hiccup on, say,
  // the podcast search shouldn't sink the video and article results too -
  // just show fewer sources.
  const settled = await Promise.allSettled([
    searchType(body.topicTitle, "video"),
    searchType(body.topicTitle, "podcast"),
    searchType(body.topicTitle, "article"),
  ]);

  const allFailed = settled.every((r) => r.status === "rejected");
  if (allFailed) {
    const firstError = settled.find(
      (r): r is PromiseRejectedResult => r.status === "rejected"
    );
    const message =
      firstError?.reason instanceof Error
        ? firstError.reason.message
        : "Unknown error";
    return NextResponse.json(
      { error: `Couldn't find sources: ${message}` },
      { status: 500 }
    );
  }

  const types: SourceType[] = ["video", "podcast", "article"];
  let candidates: Candidate[] = [];
  settled.forEach((result, i) => {
    if (result.status !== "fulfilled") return;
    candidates = candidates.concat(
      toCandidates(result.value, types[i], candidates.length)
    );
  });

  if (candidates.length === 0) {
    return NextResponse.json({ sources: [] });
  }

  // Relevance filtering is a refinement, not a requirement - if the
  // Gemini call has a hiccup, fall back to the score/episode-filtered
  // candidates (already real and on-domain) rather than failing the
  // whole sources screen over a curation step.
  let keepIndexes: number[];
  try {
    keepIndexes = await filterByRelevance(
      body.topicTitle,
      body.topicTeaser ?? "",
      candidates
    );
  } catch {
    keepIndexes = candidates.map((c) => c.index);
  }

  const byIndex = new Map(candidates.map((c) => [c.index, c]));
  const kept: Candidate[] =
    keepIndexes.length > 0
      ? keepIndexes
          .map((i) => byIndex.get(i))
          .filter((c): c is Candidate => Boolean(c))
      : candidates;

  const perType = new Map<SourceType, Candidate[]>();
  for (const c of kept) {
    const list = perType.get(c.type) ?? [];
    if (list.length < SHOWN_PER_TYPE) list.push(c);
    perType.set(c.type, list);
  }

  const sources: SourceItem[] = types.flatMap((t) =>
    (perType.get(t) ?? []).map((c) => ({
      type: c.type,
      title: c.title,
      url: c.url,
      domain: c.domain,
      snippet: c.snippet,
    }))
  );

  return NextResponse.json({ sources });
}
