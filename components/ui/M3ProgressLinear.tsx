interface M3ProgressLinearProps { value: number; indeterminate?: boolean; tone?: "primary" | "success" | "error"; }
const toneClasses = { primary: "bg-primary", success: "bg-success", error: "bg-error" };

export function M3ProgressLinear({ value, indeterminate = false, tone = "primary" }: M3ProgressLinearProps) {
  return (
    <div className="relative w-full h-1.5 rounded-m3-full bg-surface-variant overflow-hidden" role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}>
      {indeterminate ? (
        <div className={`absolute inset-0 ${toneClasses[tone]} opacity-70 bg-[length:200%_100%] animate-shimmer`} style={{ backgroundImage: `linear-gradient(90deg, transparent, currentColor, transparent)` }} />
      ) : (
        <div className={`h-full rounded-m3-full ${toneClasses[tone]} transition-[width] duration-300 ease-out`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
      )}
    </div>
  );
}