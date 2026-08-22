import { DEPTHS, DepthId } from "@/lib/types";

interface Props {
  selected: DepthId | null;
  onSelect: (id: DepthId) => void;
  onGenerate: () => void;
  onBack: () => void;
}

export default function StepDepth({ selected, onSelect, onGenerate, onBack }: Props) {
  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="mb-4 text-lg text-ink/50 hover:text-ink"
        aria-label="Back"
      >
        ←
      </button>
      <h1 className="font-display text-2xl font-bold text-ink">
        How deep do we dig?
      </h1>
      <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-haze">
        <div className="h-full w-2/3 rounded-full bg-coral" />
      </div>

      <div className="mt-6 space-y-3">
        {DEPTHS.map((depth) => {
          const active = selected === depth.id;
          return (
            <button
              key={depth.id}
              type="button"
              onClick={() => onSelect(depth.id)}
              className={`block w-full rounded-xl border p-4 text-left transition-colors ${
                active
                  ? "border-coral bg-coral-soft"
                  : "border-line bg-white hover:border-ink/20"
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-ink">{depth.label}</p>
                <span className="rounded-full bg-ink px-2 py-0.5 text-[10px] font-bold tracking-wide text-white">
                  {depth.badge}
                </span>
              </div>
              <p className="mt-1 text-xs font-medium text-coral">
                {depth.timeLabel}
              </p>
              <p className="mt-1 text-xs text-ink/50">{depth.description}</p>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onGenerate}
        disabled={!selected}
        className="mt-8 w-full rounded-full bg-coral py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Generate rabbit hole
      </button>
    </div>
  );
}
