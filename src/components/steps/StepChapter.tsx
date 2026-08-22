import { Chapter } from "@/lib/types";

interface Props {
  chapter: Chapter;
  index: number;
  total: number;
  topicTitle: string;
  isLast: boolean;
  onContinue: () => void;
  onBackToOverview: () => void;
}

export default function StepChapter({
  chapter,
  index,
  total,
  topicTitle,
  isLast,
  onContinue,
  onBackToOverview,
}: Props) {
  return (
    <div>
      <button
        type="button"
        onClick={onBackToOverview}
        className="text-xs font-semibold uppercase tracking-wide text-ink/40 hover:text-coral"
      >
        ← {topicTitle}
      </button>

      <p className="mt-4 text-xs font-bold uppercase tracking-wide text-coral">
        {chapter.meta} · {index + 1} of {total}
      </p>
      <h1 className="mt-2 font-display text-2xl font-bold leading-snug text-ink">
        {chapter.heading}
      </h1>
      <p className="mt-4 whitespace-pre-line leading-relaxed text-ink/80">
        {chapter.content}
      </p>

      <button
        type="button"
        onClick={onContinue}
        className="mt-8 w-full rounded-full bg-coral py-3 text-sm font-semibold text-white hover:opacity-90"
      >
        {isLast ? "Explore Sources & Reading" : "Continue Reading"}
      </button>
    </div>
  );
}
