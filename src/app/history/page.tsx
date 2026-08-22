"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { HistoryEntry } from "@/lib/types";
import { clearHistory, getHistory } from "@/lib/storage";

export default function HistoryPage() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setEntries(getHistory());
    setLoaded(true);
  }, []);

  const handleClear = () => {
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
