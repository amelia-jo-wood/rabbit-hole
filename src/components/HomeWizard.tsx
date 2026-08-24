"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import StepLanding from "./steps/StepLanding";
import StepInterests from "./steps/StepInterests";
import StepDepth from "./steps/StepDepth";
import StepDigging from "./steps/StepDigging";
import StepOverview from "./steps/StepOverview";
import StepChapter from "./steps/StepChapter";
import StepSources from "./steps/StepSources";
import {
  Chapter,
  DepthId,
  HistoryEntry,
  InterestId,
  SourceItem,
  Topic,
} from "@/lib/types";
import {
  getEntryByTopicId,
  getHistory,
  markChapterRead,
  saveRabbitHole,
  saveSources,
  toggleSavedSource,
} from "@/lib/storage";

type Step =
  | "landing"
  | "interests"
  | "depth"
  | "digging"
  | "overview"
  | "chapter"
  | "sources";

const DIGGING_VERBS = ["Synthesizing", "Cross-referencing", "Unearthing", "Piecing together"];

export default function HomeWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState<Step>("landing");
  const [selectedInterests, setSelectedInterests] = useState<InterestId[]>([]);
  const [depth, setDepth] = useState<DepthId | null>(null);

  const [topic, setTopic] = useState<Topic | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [chapterIndex, setChapterIndex] = useState(0);
  const [readChapters, setReadChapters] = useState<number[]>([]);

  const [sources, setSources] = useState<SourceItem[] | null>(null);
  const [savedSources, setSavedSources] = useState<number[]>([]);
  const [sourcesLoading, setSourcesLoading] = useState(false);
  const [sourcesError, setSourcesError] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  const digStatus = useMemo(() => {
    const verb = DIGGING_VERBS[Math.floor(Math.random() * DIGGING_VERBS.length)];
    const labels = selectedInterests.length
      ? selectedInterests.join(" and ")
      : "your curiosity";
    return {
      line: `${verb} ${labels}…`,
      sub: "Sifting through academic papers, forums, and podcasts.",
    };
  }, [selectedInterests]);

  // Loading a saved entry from History (?id=...)
  useEffect(() => {
    const id = searchParams.get("id");
    if (!id) return;
    const entry: HistoryEntry | null = getEntryByTopicId(id);
    if (entry && entry.chapters) {
      setTopic(entry.topic);
      setChapters(entry.chapters);
      setReadChapters(entry.readChapters ?? []);
      setSources(entry.sources ?? null);
      setSavedSources(entry.savedSources ?? []);
      setStep("overview");
    }
  }, [searchParams]);

  const toggleInterest = useCallback((id: InterestId) => {
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }, []);

  const generate = useCallback(async () => {
    if (!depth) return;
    setStep("digging");
    setError(null);
    try {
      const recentTitles = getHistory()
        .slice(0, 8)
        .map((e) => e.topic.title);

      const res = await fetch("/api/rabbit-hole", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          interestLabels: selectedInterests,
          depth,
          avoidTitles: recentTitles,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");

      const newTopic = data.topic as Topic;
      const newChapters = data.chapters as Chapter[];

      setTopic(newTopic);
      setChapters(newChapters);
      setReadChapters([]);
      setSources(null);
      setSavedSources([]);
      saveRabbitHole(newTopic, newChapters);
      router.replace(`/?id=${newTopic.id}`);
      setStep("overview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setStep("digging");
    }
  }, [depth, selectedInterests, router]);

  const fetchSources = useCallback(async () => {
    if (!topic) return;
    setStep("sources");
    if (sources) return;
    setSourcesLoading(true);
    setSourcesError(null);
    try {
      const res = await fetch("/api/sources", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          topicTitle: topic.title,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setSources(data.sources as SourceItem[]);
      saveSources(topic.id, data.sources as SourceItem[]);
    } catch (err) {
      setSourcesError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setSourcesLoading(false);
    }
  }, [topic, sources]);

  const jumpIn = useCallback(() => {
    const firstUnread = chapters.findIndex((_, i) => !readChapters.includes(i));
    setChapterIndex(firstUnread === -1 ? 0 : firstUnread);
    setStep("chapter");
  }, [chapters, readChapters]);

  const continueChapter = useCallback(() => {
    if (!topic) return;
    markChapterRead(topic.id, chapterIndex);
    setReadChapters((prev) =>
      prev.includes(chapterIndex) ? prev : [...prev, chapterIndex]
    );

    if (chapterIndex + 1 < chapters.length) {
      setChapterIndex((i) => i + 1);
    } else {
      fetchSources();
    }
  }, [topic, chapterIndex, chapters.length, fetchSources]);

  const toggleSave = useCallback(
    (index: number) => {
      if (!topic) return;
      toggleSavedSource(topic.id, index);
      setSavedSources((prev) =>
        prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
      );
    },
    [topic]
  );

  const restart = useCallback(() => {
    setSelectedInterests([]);
    setDepth(null);
    setTopic(null);
    setChapters([]);
    setChapterIndex(0);
    setReadChapters([]);
    setSources(null);
    setSavedSources([]);
    setError(null);
    router.replace("/");
    setStep("interests");
  }, [router]);

  switch (step) {
    case "landing":
      return <StepLanding onStart={() => setStep("interests")} />;

    case "interests":
      return (
        <StepInterests
          selected={selectedInterests}
          onToggle={toggleInterest}
          onNext={() => setStep("depth")}
          onBack={() => setStep("landing")}
        />
      );

    case "depth":
      return (
        <StepDepth
          selected={depth}
          onSelect={setDepth}
          onGenerate={generate}
          onBack={() => setStep("interests")}
        />
      );

    case "digging":
      return (
        <StepDigging
          statusLine={digStatus.line}
          subLine={digStatus.sub}
          error={error}
          onRetry={generate}
        />
      );

    case "overview":
      if (!topic) return null;
      return (
        <StepOverview
          topic={topic}
          chapters={chapters}
          readChapters={readChapters}
          onJumpIn={jumpIn}
          onExploreSources={fetchSources}
          onTryAnother={restart}
        />
      );

    case "chapter":
      if (!topic || chapters.length === 0) return null;
      return (
        <StepChapter
          chapter={chapters[chapterIndex]}
          index={chapterIndex}
          total={chapters.length}
          topicTitle={topic.title}
          isLast={chapterIndex === chapters.length - 1}
          onContinue={continueChapter}
          onBackToOverview={() => setStep("overview")}
        />
      );

    case "sources":
      if (!topic) return null;
      return (
        <StepSources
          topicTitle={topic.title}
          sources={sources ?? []}
          loading={sourcesLoading}
          error={sourcesError}
          savedSources={savedSources}
          onToggleSave={toggleSave}
          onFinish={() => setStep("overview")}
        />
      );

    default:
      return null;
  }
}
