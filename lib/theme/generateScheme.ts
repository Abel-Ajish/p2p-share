import { argbFromHex, themeFromSourceColor, hexFromArgb } from "@material/material-color-utilities";

export interface M3Scheme {
  primary: string; "on-primary": string; "primary-container": string; "on-primary-container": string;
  secondary: string; "on-secondary": string; surface: string; "surface-dim": string;
  "surface-bright": string; "surface-variant": string; "surface-container": string;
  "surface-container-low": string; "surface-container-high": string; "surface-container-highest": string;
  "on-surface": string; "on-surface-variant": string; outline: string; "outline-variant": string;
  error: string; "on-error": string; "error-container": string; success: string;
}

export function generateScheme(seedHex: string, mode: "light" | "dark"): M3Scheme {
  const theme = themeFromSourceColor(argbFromHex(seedHex));
  const s = mode === "dark" ? theme.schemes.dark : theme.schemes.light;
  const hex = (argb: number) => hexFromArgb(argb);
  return {
    primary: hex(s.primary), "on-primary": hex(s.onPrimary), "primary-container": hex(s.primaryContainer),
    "on-primary-container": hex(s.onPrimaryContainer), secondary: hex(s.secondary), "on-secondary": hex(s.onSecondary),
    surface: hex(s.surface), "surface-dim": hex((s as any).surfaceDim ?? s.surface),
    "surface-bright": hex((s as any).surfaceBright ?? s.surface), "surface-variant": hex(s.surfaceVariant),
    "surface-container": hex((s as any).surfaceContainer ?? s.surfaceVariant),
    "surface-container-low": hex((s as any).surfaceContainerLow ?? s.surfaceVariant),
    "surface-container-high": hex((s as any).surfaceContainerHigh ?? s.surfaceVariant),
    "surface-container-highest": hex((s as any).surfaceContainerHighest ?? s.surfaceVariant),
    "on-surface": hex(s.onSurface), "on-surface-variant": hex(s.onSurfaceVariant),
    outline: hex(s.outline), "outline-variant": hex(s.outlineVariant),
    error: hex(s.error), "on-error": hex(s.onError), "error-container": hex(s.errorContainer),
    success: mode === "dark" ? "#7dd6a8" : "#1c6b46",
  };
}
