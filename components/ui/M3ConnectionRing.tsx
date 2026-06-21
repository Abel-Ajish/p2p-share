interface M3ConnectionRingProps { state: "connecting" | "connected" | "disconnected"; size?: number; }

export function M3ConnectionRing({ state, size = 14 }: M3ConnectionRingProps) {
  const dimension = `${size}px`;
  if (state === "disconnected") return <div className="rounded-full bg-error/70" style={{ width: dimension, height: dimension }} aria-label="Disconnected" />;
  return (
    <div className="relative flex items-center justify-center" style={{ width: dimension, height: dimension }}>
      {state === "connecting" && <span className="absolute inset-0 rounded-full border border-primary animate-pulse-ring" aria-hidden />}
      <span className={`relative rounded-full ${state === "connected" ? "bg-success" : "bg-primary"}`} style={{ width: dimension, height: dimension }} aria-label={state === "connected" ? "Connected" : "Connecting"} />
    </div>
  );
}

export function M3RadarSweep({ active = true }: { active?: boolean }) {
  return (
    <div className="relative w-40 h-40 flex items-center justify-center">
      <span className="absolute inset-0 rounded-full border border-outline-variant" />
      <span className="absolute inset-[20%] rounded-full border border-outline-variant" />
      <span className="absolute inset-[40%] rounded-full border border-outline-variant" />
      {active && (
        <div className="absolute inset-0 animate-radar-sweep" style={{ transformOrigin: "50% 50%" }}>
          <div className="absolute top-1/2 left-1/2 w-1/2 h-1/2 origin-top-left" style={{ background: "conic-gradient(from 0deg, color-mix(in srgb, var(--md-primary) 35%, transparent), transparent 70deg)", borderRadius: "0 100% 0 0" }} />
        </div>
      )}
      <span className="relative w-3 h-3 rounded-full bg-primary shadow-elevation-2" />
    </div>
  );
}