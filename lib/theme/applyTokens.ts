import type { M3Scheme } from "./generateScheme";

export function applyTokens(scheme: M3Scheme) {
  const root = document.documentElement;
  Object.entries(scheme).forEach(([key, value]) => {
    root.style.setProperty(`--md-${key}`, value);
  });
}
