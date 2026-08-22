interface Props {
  statusLine: string;
  subLine: string;
  error: string | null;
  onRetry: () => void;
}

export default function StepDigging({ statusLine, subLine, error, onRetry }: Props) {
  if (error) {
    return (
      <div className="flex flex-col items-center text-center">
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 rounded-full bg-coral px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center pt-10 text-center">
      <div className="relative flex h-40 w-40 items-center justify-center">
        <span className="absolute h-40 w-40 rounded-full bg-haze" />
        <span className="absolute h-28 w-28 rounded-full bg-line" />
        <span className="absolute h-16 w-16 rounded-full bg-coral-soft" />
        <span className="absolute h-6 w-6 animate-ping-soft rounded-full bg-coral" />
        <span className="absolute h-6 w-6 rounded-full bg-coral" />
      </div>

      <h1 className="mt-8 font-display text-xl font-bold text-ink animate-pulse-soft">
        Digging your hole…
      </h1>
      <p className="mt-3 text-sm font-semibold text-coral">{statusLine}</p>
      <p className="mt-1 text-xs text-ink/50">{subLine}</p>
      <p className="mt-10 text-xs text-ink/40">Please do not close the app.</p>
    </div>
  );
}
