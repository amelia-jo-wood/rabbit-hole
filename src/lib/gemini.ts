const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent";

interface GeminiPart {
  text?: string;
}

interface GeminiResponse {
  candidates?: {
    content?: { parts?: GeminiPart[] };
    finishReason?: string;
  }[];
  promptFeedback?: { blockReason?: string };
}

/**
 * Calls the Gemini API (free tier: generous daily request limit, no credit
 * card) with a single prompt and returns the raw text of the response.
 * Plain fetch, no SDK dependency to version-track.
 *
 * maxOutputTokens is deliberately NOT inflated beyond the caller's own
 * estimate. Two earlier versions of this file raised it (to make room for
 * this model's internal "thinking" step) and both got hard-rejected with
 * a 400 INVALID_ARGUMENT - removing that increase is the one change so
 * far that has consistently avoided the 400. thinkingConfig.thinkingLevel
 * is set to "low" instead, to shrink how much of the (unchanged) budget
 * thinking eats into, leaving more of it for the actual answer.
 */
export async function callGemini(
  prompt: string,
  maxOutputTokens = 1024
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
        maxOutputTokens,
        responseMimeType: "application/json",
        thinkingConfig: { thinkingLevel: "low" },
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

  if (data.promptFeedback?.blockReason) {
    throw new Error(
      `Gemini blocked this request (${data.promptFeedback.blockReason}).`
    );
  }

  const candidate = data.candidates?.[0];
  const text = candidate?.content?.parts
    ?.map((p) => p.text ?? "")
    .join("")
    .trim();

  // A MAX_TOKENS finish means the response was cut off mid-generation -
  // whatever text came through is likely incomplete JSON, so fail clearly
  // here instead of handing broken text to the JSON parser downstream.
  if (candidate?.finishReason === "MAX_TOKENS") {
    throw new Error(
      `Gemini's response got cut off before finishing (hit the ${maxOutputTokens}-token limit). Try again, or ask for a shorter result.`
    );
  }

  if (!text) {
    throw new Error(
      `Gemini API returned an empty response (finishReason: ${
        candidate?.finishReason ?? "unknown"
      }).`
    );
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
    throw new Error(
      `Could not find a JSON object in the model response. Raw response started with: ${candidate
        .slice(0, 200)
        .replace(/\s+/g, " ")}`
    );
  }

  const jsonSlice = candidate.slice(start, end + 1);
  return JSON.parse(jsonSlice) as T;
}
