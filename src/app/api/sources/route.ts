import { NextRequest, NextResponse } from "next/server";
import { domainFromUrl, tavilySearch } from "@/lib/tavily";
import { SourceItem, SourceType } from "@/lib/types";

interface SourcesRequestBody {
  topicTitle: string;
}

const VIDEO_DOMAINS = ["youtube.com"];
const PODCAST_DOMAINS = [
  "open.spotify.com",
  "podcasts.apple.com",
  "overcast.fm",
];

const RESULTS_PER_TYPE = 3;
const SHOWN_PER_TYPE = 2;

async function searchType(
  topicTitle: string,
  type: SourceType
): Promise<SourceItem[]> {
  const query =
    type === "video"
      ? `${topicTitle} video`
      : type === "podcast"
        ? `${topicTitle} podcast`
        : topicTitle;
  const includeDomains =
    type === "video" ? VIDEO_DOMAINS : type === "podcast" ? PODCAST_DOMAINS : undefined;

  const results = await tavilySearch(query, includeDomains, RESULTS_PER_TYPE);

  return results.slice(0, SHOWN_PER_TYPE).map((r) => ({
    type,
    title: r.title,
    url: r.url,
    domain: domainFromUrl(r.url),
    snippet: r.content.slice(0, 180).trim(),
  }));
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
  // plausible-sounding sources. Each result is a real, clickable link.
  // allSettled (not all): a hiccup on, say, the podcast search shouldn't
  // sink the video and article results too - just show fewer sources.
  const settled = await Promise.allSettled([
    searchType(body.topicTitle, "video"),
    searchType(body.topicTitle, "podcast"),
    searchType(body.topicTitle, "article"),
  ]);

  const sources = settled
    .filter((r): r is PromiseFulfilledResult<SourceItem[]> => r.status === "fulfilled")
    .flatMap((r) => r.value);

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

  return NextResponse.json({ sources });
}
