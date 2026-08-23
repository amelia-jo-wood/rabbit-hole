import { NextRequest, NextResponse } from "next/server";
import { callGemini, extractJson } from "@/lib/gemini";
import { Chapter, DepthId, getDepth } from "@/lib/types";
import { randomUUID } from "crypto";

interface GenerateRequestBody {
  interestLabels: string[];
  depth: DepthId;
  avoidTitles?: string[];
}

interface RawResult {
  title: string;
  teaser: string;
  heroTag: string;
  synthesisThreads: string[];
  chapters: Chapter[];
}

function maxTokensFor(depth: DepthId): number {
  const map: Record<DepthId, number> = {
    casual: 900,
    explorer: 2200,
    scholar: 3800,
  };
  return map[depth];
}

function buildPrompt(body: GenerateRequestBody): string {
  const depthOption = getDepth(body.depth);
  const interests = body.interestLabels.length
    ? body.interestLabels.join(", ")
    : "any area of human curiosity";

  const avoid =
    body.avoidTitles && body.avoidTitles.length > 0
      ? `Avoid repeating or closely resembling any of these already-seen topics: ${body.avoidTitles
          .map((t) => `"${t}"`)
          .join(", ")}.`
      : "";

  return `You are the engine behind "rabbit.", a curiosity app that turns someone's interests into ONE specific, fascinating rabbit-hole topic and a short mini-course about it.

The person selected these interests: ${interests}.
Pick (or invent) a SPECIFIC, surprising topic that sits at the intersection of two of these interests — specific like "The Great Emu War of 1932", never a broad subject like "history". ${avoid}

Depth level: "${depthOption.label}" — write exactly ${depthOption.chapterCount} chapter(s). ${depthOption.description}

For each chapter: a short heading, a "meta" string like "Chapter 01 • 3 mins" (use the chapter's real position, 01-indexed, and a realistic minute estimate), and 120-220 words of clear, engaging content that builds on the previous chapter (context/origins first, then the core story or mechanism, then why it's surprising or what it means, ending on a strong closing chapter).

Also provide:
- "heroTag": a short 1-3 word all-caps-style category label (e.g. "WEIRD SPORTS")
- "synthesisThreads": an array of 2-4 short phrases naming the angles being combined (e.g. ["History", "Cult Sports", "Local Culture"])
- "teaser": 1-2 sentence hook for the topic, no spoilers

Respond with ONLY a JSON object, no other text, in this exact shape:
{
  "title": "topic title",
  "teaser": "1-2 sentence hook",
  "heroTag": "SHORT TAG",
  "synthesisThreads": ["...", "..."],
  "chapters": [{"heading": "...", "meta": "Chapter 01 • 3 mins", "content": "..."}]
}`;
}

export async function POST(req: NextRequest) {
  let body: GenerateRequestBody;
  try {
    body = (await req.json()) as GenerateRequestBody;
  } catch {
    return NextResponse.json(
      { error: "Request body must be JSON." },
      { status: 400 }
    );
  }

  if (!body.depth) {
    return NextResponse.json({ error: "depth is required." }, { status: 400 });
  }

  try {
    const prompt = buildPrompt(body);
    const text = await callGemini(prompt, maxTokensFor(body.depth));
    const raw = extractJson<RawResult>(text);

    if (!raw.title || !Array.isArray(raw.chapters) || raw.chapters.length === 0) {
      throw new Error("Model response was missing required fields.");
    }

    const topicId = randomUUID();

    return NextResponse.json({
      topic: {
        id: topicId,
        title: raw.title.trim(),
        teaser: raw.teaser?.trim() ?? "",
        heroTag: raw.heroTag?.trim() || "CURIOSITY",
        synthesisThreads: raw.synthesisThreads ?? [],
        depth: body.depth,
        interestLabels: body.interestLabels ?? [],
        createdAt: new Date().toISOString(),
      },
      chapters: raw.chapters,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Couldn't dig this hole: ${message}` },
      { status: 500 }
    );
  }
}
