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
import { useAuth } from "./AuthProvider";
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
import { fetchCloudEntryById, upsertCloudRabbitHole } from "@/lib/cloudStorage";

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
  const { user } = useAuth();

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

  const applyEntry = useCallback((entry: HistoryEntry) => {
    setTopic(entry.topic);
    setChapters(entry.chapters ?? []);
    setReadChapters(entry.readChapters ?? []);
    setSources(entry.sources ?? null);
    setSavedSources(entry.savedSources ?? []);
    setStep("overview");
  }, []);

  // Loading a saved entry from History (?id=...). Checks this device's
  // localStorage first (instant, works offline), and only reaches out to
  // the cloud if it's not there - which happens whenever the entry was
  // saved from a different device than this one.
  useEffect(() => {
    const id = searchParams.get("id");
    if (!id) return;

    const local = getEntryByTopicId(id);
    if (local && local.chapters) {
      applyEntry(local);
      return;
    }

    if (user) {
      fetchCloudEntryById(id)
        .then((entry) => {
          if (entry) applyEntry(entry);
        })
        .catch(() => {
          // Link just won't load - no good fallback, and not worth
          // interrupting the rest of the app over.
        });
    }
  }, [searchParams, user, applyEntry]);

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
      if (user) {
        upsertCloudRabbitHole({
          topic: newTopic,
          chapters: newChapters,
          sources: null,
          readChapters: [],
          savedSources: [],
        }).catch(() => {
          // Cloud sync is a bonus on top of the local save above, which
          // already succeeded - don't interrupt the flow over it.
        });
      }
      router.replace(`/?id=${newTopic.id}`);
      setStep("overview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setStep("digging");
    }
  }, [depth, selectedInterests, router, user]);

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
          topicTeaser: topic.teaser,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      const newSources = data.sources as SourceItem[];
      setSources(newSources);
      saveSources(topic.id, newSources);
      if (user) {
        upsertCloudRabbitHole({
          topic,
          chapters,
          sources: newSources,
          readChapters,
          savedSources,
        }).catch(() => {});
      }
    } catch (err) {
      setSourcesError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setSourcesLoading(false);
    }
  }, [topic, sources, chapters, readChapters, savedSources, user]);

  const jumpIn = useCallback(() => {
    const firstUnread = chapters.findIndex((_, i) => !readChapters.includes(i));
    setChapterIndex(firstUnread === -1 ? 0 : firstUnread);
    setStep("chapter");
  }, [chapters, readChapters]);

  const continueChapter = useCallback(() => {
    if (!topic) return;
    markChapterRead(topic.id, chapterIndex);
    const nextRead = readChapters.includes(chapterIndex)
      ? readChapters
      : [...readChapters, chapterIndex];
    setReadChapters(nextRead);
    if (user) {
      upsertCloudRabbitHole({
        topic,
        chapters,
        sources,
        readChapters: nextRead,
        savedSources,
      }).catch(() => {});
    }

    if (chapterIndex + 1 < chapters.length) {
      setChapterIndex((i) => i + 1);
    } else {
      fetchSources();
    }
  }, [
    topic,
    chapterIndex,
    chapters,
    sources,
    readChapters,
    savedSources,
    user,
    fetchSources,
  ]);

  const toggleSave = useCallback(
    (index: number) => {
      if (!topic) return;
      toggleSavedSource(topic.id, index);
      const nextSaved = savedSources.includes(index)
        ? savedSources.filter((i) => i !== index)
        : [...savedSources, index];
      setSavedSources(nextSaved);
      if (user) {
        upsertCloudRabbitHole({
          topic,
          chapters,
          sources,
          readChapters,
          savedSources: nextSaved,
        }).catch(() => {});
      }
    },
    [topic, chapters, sources, readChapters, savedSources, user]
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
