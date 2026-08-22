import { NextRequest, NextResponse } from "next/server";
import { callClaude, extractJson } from "@/lib/anthropic";
import { SourceItem } from "@/lib/types";

interface SourcesRequestBody {
  topicTitle: string;
  chapterHeadings: string[];
}

interface RawSources {
  sources: SourceItem[];
}

function buildPrompt(body: SourcesRequestBody): string {
  return `Suggest 4 further-reading/watching/listening ideas for someone who just read a mini-course on "${body.topicTitle}" covering: ${body.chapterHeadings.join(
    ", "
  )}.

These are AI-suggested reading ideas (plausible titles/descriptions of the kind of source that would exist), not verified real links.

Mix the types across video, article, and podcast. For each: a type, a punchy plausible title, a 1-sentence description, and a duration label (e.g. "12 mins" for video/podcast, "6 min read" for article).

Respond with ONLY a JSON object, no other text, in this exact shape:
{"sources": [{"type": "video", "title": "...", "description": "...", "durationLabel": "12 mins"}]}`;
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

  try {
    const prompt = buildPrompt(body);
    const text = await callClaude(prompt, 700);
    const raw = extractJson<RawSources>(text);

    if (!Array.isArray(raw.sources)) {
      throw new Error("Model response was missing sources.");
    }

    return NextResponse.json({ sources: raw.sources });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Couldn't find sources: ${message}` },
      { status: 500 }
    );
  }
}
