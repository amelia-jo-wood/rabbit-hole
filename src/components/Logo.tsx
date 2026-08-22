interface Props {
  size?: "sm" | "lg";
}

export default function Logo({ size = "sm" }: Props) {
  if (size === "lg") {
    return (
      <div className="flex flex-col items-center">
        <div className="relative flex h-40 w-40 items-center justify-center">
          <span className="absolute h-40 w-40 rounded-full bg-haze" />
          <span className="absolute h-28 w-28 rounded-full bg-line" />
          <span className="absolute h-16 w-16 rounded-full bg-coral-soft" />
          <span className="absolute h-6 w-6 animate-ping-soft rounded-full bg-coral" />
          <span className="absolute h-6 w-6 rounded-full bg-coral" />
        </div>
        <p className="mt-6 font-display text-4xl font-bold text-ink">
          rabbit<span className="text-coral">.</span>
        </p>
      </div>
    );
  }

  return (
    <span className="font-display text-xl font-bold text-ink">
      rabbit<span className="text-coral">.</span>
    </span>
  );
}
