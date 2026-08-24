const TAVILY_API_URL = "https://api.tavily.com/search";

interface TavilyResult {
  title: string;
  url: string;
  content: string;
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
 */
export async function tavilySearch(
  query: string,
  includeDomains: string[] | undefined,
  maxResults: number
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
      search_depth: "basic",
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
