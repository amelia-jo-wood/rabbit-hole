import { supabase } from "./supabaseClient";
import { Chapter, DepthId, HistoryEntry, SourceItem, Topic } from "./types";

interface RabbitHoleRow {
  id: string;
  title: string;
  teaser: string | null;
  hero_tag: string | null;
  synthesis_threads: string[] | null;
  depth: string | null;
  interest_labels: string[] | null;
  chapters: Chapter[];
  sources: SourceItem[] | null;
  read_chapters: number[] | null;
  saved_sources: number[] | null;
  created_at: string;
}

function rowToEntry(row: RabbitHoleRow): HistoryEntry {
  const topic: Topic = {
    id: row.id,
    title: row.title,
    teaser: row.teaser ?? "",
    heroTag: row.hero_tag ?? "CURIOSITY",
    synthesisThreads: row.synthesis_threads ?? [],
    depth: (row.depth as DepthId) ?? "explorer",
    interestLabels: row.interest_labels ?? [],
    createdAt: row.created_at,
  };
  return {
    topic,
    chapters: row.chapters,
    sources: row.sources,
    readChapters: row.read_chapters ?? [],
    savedSources: row.saved_sources ?? [],
  };
}

/** All of the signed-in user's saved rabbit holes, newest first. RLS on the
 * table means this can never return another user's rows even though no
 * user_id filter is written here. */
export async function fetchCloudHistory(): Promise<HistoryEntry[]> {
  const { data, error } = await supabase
    .from("rabbit_holes")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as RabbitHoleRow[]).map(rowToEntry);
}

/** A single saved rabbit hole by its id - used for opening a `?id=...`
 * link (e.g. from History) that isn't in this device's localStorage,
 * which happens whenever it was saved from a different device. */
export async function fetchCloudEntryById(
  id: string
): Promise<HistoryEntry | null> {
  const { data, error } = await supabase
    .from("rabbit_holes")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToEntry(data as RabbitHoleRow) : null;
}

/** Writes the full current state of one rabbit hole. Always sends the
 * whole row (insert-or-overwrite) rather than granular field patches -
 * simpler to reason about, and the payload is tiny either way. */
export async function upsertCloudRabbitHole(entry: HistoryEntry): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase.from("rabbit_holes").upsert({
    id: entry.topic.id,
    user_id: user.id,
    title: entry.topic.title,
    teaser: entry.topic.teaser,
    hero_tag: entry.topic.heroTag,
    synthesis_threads: entry.topic.synthesisThreads,
    depth: entry.topic.depth,
    interest_labels: entry.topic.interestLabels,
    chapters: entry.chapters,
    sources: entry.sources,
    read_chapters: entry.readChapters,
    saved_sources: entry.savedSources,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

/** Deletes every rabbit hole belonging to the signed-in user - the cloud
 * side of the History screen's "Clear" button. */
export async function deleteCloudHistory(): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;
  const { error } = await supabase
    .from("rabbit_holes")
    .delete()
    .eq("user_id", user.id);
  if (error) throw error;
}

/** Pushes this device's local (guest) history up into the account, run
 * once right after a successful sign-in. Each entry is an upsert keyed on
 * its own randomUUID() topic id, so running this more than once - or on a
 * device that's already synced - just re-writes the same rows, nothing
 * duplicates and nothing already in the cloud is lost. */
export async function mergeLocalIntoCloud(
  localEntries: HistoryEntry[]
): Promise<void> {
  for (const entry of localEntries) {
    await upsertCloudRabbitHole(entry);
  }
}
