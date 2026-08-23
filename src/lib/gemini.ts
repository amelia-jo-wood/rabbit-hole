const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent";

interface GeminiPart {
  text?: string;
  thought?: boolean;
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
        // Give plenty of headroom: newer Gemini models spend some of
        // maxOutputTokens on internal "thinking" before the visible
        // answer, so a tight budget can get cut off before any JSON
        // is written. thinkingBudget: 0 turns that off entirely, since
        // this app just needs a direct JSON answer, not reasoning.
        maxOutputTokens: Math.max(maxTokens, 1024) * 2,
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 0 },
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
