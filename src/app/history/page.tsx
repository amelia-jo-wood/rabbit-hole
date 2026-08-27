"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { HistoryEntry } from "@/lib/types";
import { clearHistory, getHistory } from "@/lib/storage";
import { deleteCloudHistory, fetchCloudHistory } from "@/lib/cloudStorage";
import { useAuth } from "@/components/AuthProvider";

export default function HistoryPage() {
  const { user, loading: authLoading, openAuthModal } = useAuth();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [cloudError, setCloudError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;

    if (user) {
      fetchCloudHistory()
        .then((cloudEntries) => {
          if (cancelled) return;
          setEntries(cloudEntries);
          setCloudError(null);
        })
        .catch((err) => {
          if (cancelled) return;
          // Cloud read failed (offline, hiccup, etc.) - fall back to
          // whatever's on this device rather than showing a dead end.
          setCloudError(
            err instanceof Error ? err.message : "Couldn't load your synced history."
          );
          setEntries(getHistory());
        })
        .finally(() => {
          if (!cancelled) setLoaded(true);
        });
    } else {
      setEntries(getHistory());
      setLoaded(true);
    }

    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  const handleClear = async () => {
    if (user) {
      try {
        await deleteCloudHistory();
      } catch {
        // Fall through - clearing the local copy below still works, and
        // the cloud copy can be cleared again next time.
      }
    }
    clearHistory();
    setEntries([]);
  };

  if (!loaded) return null;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-ink">
          Where you&apos;ve been
        </h1>
        {entries.length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            className="text-xs font-semibold text-ink/40 hover:text-coral"
          >
            Clear
          </button>
        )}
      </div>

      {!user && (
        <button
          type="button"
          onClick={openAuthModal}
          className="mt-3 w-full rounded-lg bg-coral-soft px-4 py-3 text-left text-xs font-semibold text-coral"
        >
          Log in to save this across your devices →
        </button>
      )}

      {cloudError && (
        <p className="mt-3 rounded-lg bg-red-50 px-4 py-3 text-xs text-red-700">
          Couldn&apos;t load your synced history — showing what&apos;s saved
          on this device instead.
        </p>
      )}

      {entries.length === 0 ? (
        <p className="mt-6 text-sm text-ink/60">
          No rabbit holes yet.{" "}
          <Link href="/" className="font-semibold text-coral">
            Go find one.
          </Link>
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {entries.map((entry) => {
            const totalChapters = entry.chapters?.length ?? 0;
            const readCount = entry.readChapters?.length ?? 0;
            return (
              <li key={entry.topic.id}>
                <Link
                  href={`/?id=${entry.topic.id}`}
                  className="block rounded-xl border border-line bg-white p-4 transition-colors hover:border-coral/50"
                >
                  <p className="text-[10px] font-bold uppercase tracking-wide text-coral">
                    {entry.topic.heroTag}
                    {totalChapters > 0
                      ? ` · ${readCount}/${totalChapters} read`
                      : ""}
                  </p>
                  <p className="mt-1 font-display font-bold text-ink">
                    {entry.topic.title}
                  </p>
                  <p className="mt-1 text-sm text-ink/50">
                    {entry.topic.teaser}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
