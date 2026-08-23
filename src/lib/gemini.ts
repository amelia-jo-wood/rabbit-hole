const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

interface GeminiPart {
  text?: string;
}

interface GeminiResponse {
  candidates?: {
    content?: { parts?: GeminiPart[] };
  }[];
}

/**
 * Calls the Gemini API (free tier: generous daily request limit, no credit
 * card) with a single prompt and returns the raw text of the response.
 * Plain fetch, no SDK dependency to version-track.
 */
export async function callGemini(
  prompt: string,
  maxTokens = 1024
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not set. Add it to your .env.local file."
    );
  }

  const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: maxTokens,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(
      `Gemini API error (${res.status}): ${errText || res.statusText}`
    );
  }

  const data = (await res.json()) as GeminiResponse;
  const text = data.candidates?.[0]?.content?.parts
    ?.map((p) => p.text ?? "")
    .join("")
    .trim();

  if (!text) {
    throw new Error("Gemini API returned an empty response.");
  }

  return text;
}

/**
 * Gemini is asked to reply with pure JSON (responseMimeType is set to
 * application/json), but this still defensively strips a markdown code
 * fence and extracts the first balanced {...} block, in case a model
 * update changes that behavior.
 */
export function extractJson<T>(text: string): T {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;

  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new Error("Could not find a JSON object in the model response.");
  }

  const jsonSlice = candidate.slice(start, end + 1);
  return JSON.parse(jsonSlice) as T;
}
