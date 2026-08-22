import { INTERESTS, InterestId } from "@/lib/types";

interface Props {
  selected: InterestId[];
  onToggle: (id: InterestId) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function StepInterests({ selected, onToggle, onNext, onBack }: Props) {
  const canProceed = selected.length > 0;

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
        What sparks your curiosity?
      </h1>

      <div className="mt-6 grid grid-cols-2 gap-3">
        {INTERESTS.map((interest) => {
          const active = selected.includes(interest.id);
          return (
            <button
              key={interest.id}
              type="button"
              onClick={() => onToggle(interest.id)}
              className={`rounded-xl border p-4 text-left transition-colors ${
                active
                  ? "border-coral bg-coral-soft"
                  : "border-line bg-white hover:border-ink/20"
              }`}
            >
              <span className="text-xl">{interest.icon}</span>
              <p className="mt-2 text-sm font-semibold text-ink">
                {interest.label}
              </p>
              <p className="text-xs text-ink/50">{interest.sublabel}</p>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onNext}
        disabled={!canProceed}
        className="mt-8 w-full rounded-full bg-coral py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Next: choose depth
      </button>
    </div>
  );
}
