import { Chapter, HistoryEntry, SourceItem, Topic } from "./types";

const STORAGE_KEY = "rabbit-hole-history-v1";
const MAX_ENTRIES = 50;

function isBrowser() {
  return typeof window !== "undefined";
}

export function getHistory(): HistoryEntry[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}

function writeHistory(entries: HistoryEntry[]) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(entries.slice(0, MAX_ENTRIES))
    );
  } catch {
    // quota / private-mode failures are non-fatal, history is a nice-to-have
  }
}

export function saveRabbitHole(topic: Topic, chapters: Chapter[]): void {
  const entries = getHistory().filter((e) => e.topic.id !== topic.id);
  const entry: HistoryEntry = {
    topic,
    chapters,
    sources: null,
    readChapters: [],
    savedSources: [],
  };
  writeHistory([entry, ...entries]);
}

export function saveSources(topicId: string, sources: SourceItem[]): void {
  const entries = getHistory();
  const idx = entries.findIndex((e) => e.topic.id === topicId);
  if (idx === -1) return;
  const updated = [...entries];
  updated[idx] = { ...updated[idx], sources };
  writeHistory(updated);
}

export function markChapterRead(topicId: string, chapterIndex: number): void {
  const entries = getHistory();
  const idx = entries.findIndex((e) => e.topic.id === topicId);
  if (idx === -1) return;
  const updated = [...entries];
  const existing = updated[idx].readChapters ?? [];
  if (!existing.includes(chapterIndex)) {
    updated[idx] = { ...updated[idx], readChapters: [...existing, chapterIndex] };
    writeHistory(updated);
  }
}

export function toggleSavedSource(topicId: string, sourceIndex: number): void {
  const entries = getHistory();
  const idx = entries.findIndex((e) => e.topic.id === topicId);
  if (idx === -1) return;
  const updated = [...entries];
  const existing = updated[idx].savedSources ?? [];
  const next = existing.includes(sourceIndex)
    ? existing.filter((i) => i !== sourceIndex)
    : [...existing, sourceIndex];
  updated[idx] = { ...updated[idx], savedSources: next };
  writeHistory(updated);
}

export function getEntryByTopicId(topicId: string): HistoryEntry | null {
  return getHistory().find((e) => e.topic.id === topicId) ?? null;
}

export function clearHistory(): void {
  writeHistory([]);
}
