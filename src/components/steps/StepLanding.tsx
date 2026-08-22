import Logo from "@/components/Logo";

interface Props {
  onStart: () => void;
}

const STEPS = [
  { n: "01", title: "Select Hobbies", desc: "Choose normal or weird interests." },
  { n: "02", title: "Set Your Depth", desc: "From casual reading to full obsession." },
  { n: "03", title: "Jump In", desc: "Get instantly synthesized curiosity lanes." },
];

export default function StepLanding({ onStart }: Props) {
  return (
    <div className="flex flex-col items-center text-center">
      <Logo size="lg" />
      <p className="mt-1 text-sm font-semibold text-coral">Fall down the hole.</p>

      <div className="mt-8 w-full rounded-2xl border border-line bg-white p-6 text-left shadow-sm">
        <span className="inline-block rounded-full bg-ink px-3 py-1 text-[10px] font-bold tracking-wide text-white">
          WARNING
        </span>
        <h1 className="mt-3 font-display text-2xl font-bold text-ink">
          Highly Addictive Curiosity Engine.
        </h1>
        <p className="mt-2 text-sm text-ink/70">
          Tell us what normally keeps you up at 2 AM. We&apos;ll generate
          specialized, hyper-curated rabbit holes complete with guided
          chapters and weird source files.
        </p>

        <ul className="mt-5 space-y-4">
          {STEPS.map((s) => (
            <li key={s.n} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-haze text-xs font-bold text-ink/60">
                {s.n}
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">{s.title}</p>
                <p className="text-xs text-ink/50">{s.desc}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <button
        type="button"
        onClick={onStart}
        className="mt-8 w-full rounded-full bg-coral py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
      >
        Dig my first hole
      </button>
    </div>
  );
}
