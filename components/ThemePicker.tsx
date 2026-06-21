"use client";

import { useM3Theme } from "@/hooks/useM3Theme";

const SWATCHES = [
  { hex: "#2B5FE0", label: "Signal blue" },
  { hex: "#1C6B46", label: "Field green" },
  { hex: "#9C3D54", label: "Beacon rose" },
  { hex: "#B8860B", label: "Antenna gold" },
  { hex: "#5B4B8A", label: "Static violet" },
];

export function ThemePicker() {
  const { seedColor, mode, setSeedColor, toggleMode } = useM3Theme();
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5">
        {SWATCHES.map((s) => (
          <button key={s.hex} onClick={() => setSeedColor(s.hex)} aria-label={s.label} title={s.label}
            className={`w-5 h-5 rounded-full transition-transform duration-150 hover:scale-110 ${seedColor === s.hex ? "ring-2 ring-offset-2 ring-offset-surface ring-on-surface" : ""}`}
            style={{ backgroundColor: s.hex }} />
        ))}
      </div>
      <button onClick={toggleMode} aria-label={`Switch to ${mode === "dark" ? "light" : "dark"} mode`}
        className="text-xs font-mono text-on-surface-variant hover:text-on-surface transition-colors px-2 py-1 rounded-m3-xs hover:bg-surface-container-high">
        {mode === "dark" ? "DARK" : "LIGHT"}
      </button>
    </div>
  );
}
