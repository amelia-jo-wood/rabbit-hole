const TAVILY_API_URL = "https://api.tavily.com/search";

export interface TavilyResult {
  title: string;
  url: string;
  content: string;
  /** Tavily's own 0-1 relevance score for how well this result matches the query. */
  score?: number;
}

interface TavilyResponse {
  results?: TavilyResult[];
}

/**
 * Runs one Tavily search and returns its raw results. Tavily has no
 * built-in "give me a video" or "give me a podcast" filter - the way we
 * get typed results is by restricting `include_domains` to sites of that
 * type (youtube.com for video, the major podcast platforms for podcast)
 * and running a separate search per type. See callers in
 * src/app/api/sources/route.ts.
 *
 * search_depth defaults to "advanced" - it costs the same one search
 * against the free 1,000/month quota as "basic" but Tavily spends more
 * effort ranking results, which matters here since niche/real-but-obscure
 * topics are exactly where a shallow search turns up unrelated pages that
 * merely share a word with the topic title.
 */
export async function tavilySearch(
  query: string,
  includeDomains: string[] | undefined,
  maxResults: number,
  searchDepth: "basic" | "advanced" = "advanced"
): Promise<TavilyResult[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    throw new Error(
      "TAVILY_API_KEY is not set. Add it to your .env.local file."
    );
  }

  const res = await fetch(TAVILY_API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      query,
      search_depth: searchDepth,
      max_results: maxResults,
      ...(includeDomains ? { include_domains: includeDomains } : {}),
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(
      `Tavily API error (${res.status}): ${errText || res.statusText}`
    );
  }

  const data = (await res.json()) as TavilyResponse;
  return data.results ?? [];
}

export function domainFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/**
 * True only for a link that points at one specific episode, not a show's
 * homepage - Spotify episode URLs contain "/episode/", Apple Podcasts
 * episode URLs carry an "?i=" query param the show page lacks, and
 * Overcast's "/+" permalinks are always episode-specific. A show-homepage
 * link technically "links to the topic" but leaves the user to search
 * through every episode themselves, which is the exact complaint this
 * filter exists to fix.
 */
export function isPodcastEpisodeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    if (host === "open.spotify.com") {
      return parsed.pathname.includes("/episode/");
    }
    if (host === "podcasts.apple.com") {
      return parsed.searchParams.has("i");
    }
    if (host === "overcast.fm") {
      return parsed.pathname.startsWith("/+");
    }
    return false;
  } catch {
    return false;
  }
}
