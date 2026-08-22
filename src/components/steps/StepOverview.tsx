import { Chapter, DEPTHS, Topic } from "@/lib/types";

interface Props {
  topic: Topic;
  chapters: Chapter[];
  readChapters: number[];
  onJumpIn: () => void;
  onExploreSources: () => void;
  onTryAnother: () => void;
}

function gradientFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  const hue = hash % 360;
  return `linear-gradient(135deg, hsl(${hue}, 70%, 40%), hsl(${(hue + 40) % 360}, 80%, 30%))`;
}

export default function StepOverview({
  topic,
  chapters,
  readChapters,
  onJumpIn,
  onExploreSources,
  onTryAnother,
}: Props) {
  const depthOption = DEPTHS.find((d) => d.id === topic.depth) ?? DEPTHS[1];
  const firstUnread = chapters.findIndex((_, i) => !readChapters.includes(i));
  const activeIndex = firstUnread === -1 ? chapters.length - 1 : firstUnread;

  return (
    <div>
      <div
        className="relative flex h-40 w-full items-end overflow-hidden rounded-2xl p-4"
        style={{ backgroundImage: gradientFor(topic.title) }}
      >
        <span className="absolute left-4 top-4 rounded-full bg-coral px-2.5 py-1 text-[10px] font-bold tracking-wide text-white">
          {topic.heroTag}
        </span>
        <span className="absolute right-4 top-4 rounded-full bg-black/40 px-2.5 py-1 text-[10px] font-bold text-white">
          {depthOption.timeLabel}
        </span>
      </div>

      <h1 className="mt-4 font-display text-2xl font-bold leading-snug text-ink">
        {topic.title}
      </h1>
      <p className="mt-2 text-sm text-ink/70">{topic.teaser}</p>

      <button
        type="button"
        onClick={onJumpIn}
        className="mt-4 w-full rounded-full border border-line py-2.5 text-sm font-semibold text-ink hover:border-ink/30"
      >
        {readChapters.length > 0 ? "Continue Reading" : "Start Reading"}
      </button>

      <div className="mt-6 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl border border-line p-3">
          <p className="text-[10px] font-semibold uppercase text-ink/40">
            Difficulty
          </p>
          <p className="mt-1 text-xs font-semibold text-ink">
            {depthOption.label}
          </p>
        </div>
        <div className="rounded-xl border border-line p-3">
          <p className="text-[10px] font-semibold uppercase text-ink/40">
            Synthesis
          </p>
          <p className="mt-1 text-xs font-semibold text-ink">
            {topic.synthesisThreads.slice(0, 2).join(", ") || "—"}
          </p>
        </div>
        <div className="rounded-xl border border-line p-3">
          <p className="text-[10px] font-semibold uppercase text-ink/40">
            Chapters
          </p>
          <p className="mt-1 text-xs font-semibold text-ink">
            {chapters.length} lessons
          </p>
        </div>
      </div>

      <h2 className="mt-6 font-display text-lg font-bold text-ink">Chapters</h2>
      <ul className="mt-3 space-y-2">
        {chapters.map((chapter, i) => {
          const done = readChapters.includes(i);
          const active = i === activeIndex && !done;
          return (
            <li
              key={i}
              className={`flex items-center gap-3 rounded-xl border p-3 ${
                active ? "border-coral bg-coral-soft" : "border-line bg-white"
              }`}
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  done
                    ? "bg-ink text-white"
                    : active
                      ? "bg-coral text-white"
                      : "bg-haze text-ink/50"
                }`}
              >
                {done ? "✓" : i + 1}
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">
                  {chapter.heading}
                </p>
                <p className="text-xs text-ink/50">{chapter.meta}</p>
              </div>
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        onClick={onJumpIn}
        className="mt-6 w-full rounded-full bg-coral py-3 text-sm font-semibold text-white hover:opacity-90"
      >
        Jump In
      </button>
      <button
        type="button"
        onClick={onExploreSources}
        className="mt-3 w-full rounded-full border border-line py-3 text-sm font-semibold text-ink hover:border-ink/30"
      >
        Explore Sources &amp; Reading
      </button>
      <button
        type="button"
        onClick={onTryAnother}
        className="mt-4 w-full text-center text-xs font-semibold uppercase tracking-wide text-ink/40 hover:text-coral"
      >
        Try another topic
      </button>
    </div>
  );
}
