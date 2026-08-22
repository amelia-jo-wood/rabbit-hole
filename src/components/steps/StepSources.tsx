import { SourceItem } from "@/lib/types";

interface Props {
  topicTitle: string;
  sources: SourceItem[];
  loading: boolean;
  error: string | null;
  savedSources: number[];
  onToggleSave: (index: number) => void;
  onFinish: () => void;
}

const TYPE_ICON: Record<SourceItem["type"], string> = {
  video: "🎬",
  article: "📰",
  podcast: "🎧",
};

export default function StepSources({
  topicTitle,
  sources,
  loading,
  error,
  savedSources,
  onToggleSave,
  onFinish,
}: Props) {
  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink">
        Sources &amp; Files
      </h1>
      <p className="mt-2 text-sm text-ink/60">
        AI-suggested further reading on {topicTitle}. Bookmark the ones worth
        chasing down for real.
      </p>

      {loading && (
        <p className="mt-6 text-sm text-ink/50 animate-pulse-soft">
          Gathering sources…
        </p>
      )}

      {error && (
        <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {!loading && !error && (
        <ul className="mt-6 space-y-3">
          {sources.map((source, i) => {
            const saved = savedSources.includes(i);
            return (
              <li
                key={i}
                className="rounded-xl border border-line bg-white p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-coral">
                      {TYPE_ICON[source.type]} {source.type} ·{" "}
                      {source.durationLabel}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-ink">
                      {source.title}
                    </p>
                    <p className="mt-1 text-xs text-ink/50">
                      {source.description}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onToggleSave(i)}
                    aria-label={saved ? "Remove bookmark" : "Save for later"}
                    className={`shrink-0 rounded-full border px-2 py-1 text-xs ${
                      saved
                        ? "border-coral bg-coral-soft text-coral"
                        : "border-line text-ink/40"
                    }`}
                  >
                    {saved ? "★ Saved" : "☆ Save"}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <button
        type="button"
        onClick={onFinish}
        className="mt-8 w-full rounded-full bg-coral py-3 text-sm font-semibold text-white hover:opacity-90"
      >
        Finish Rabbit Hole
      </button>
    </div>
  );
}
