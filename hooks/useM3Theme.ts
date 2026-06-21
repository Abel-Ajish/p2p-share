"use client";

import { useEffect, useMemo } from "react";
import { useThemeStore } from "@/store/useThemeStore";
import { generateScheme } from "@/lib/theme/generateScheme";
import { applyTokens } from "@/lib/theme/applyTokens";

export function useM3Theme() {
  const { seedColor, mode, setSeedColor, toggleMode, setMode } = useThemeStore();
  const scheme = useMemo(() => generateScheme(seedColor, mode), [seedColor, mode]);
  useEffect(() => { applyTokens(scheme); document.documentElement.dataset.theme = mode; }, [scheme, mode]);
  return { seedColor, mode, setSeedColor, toggleMode, setMode, scheme };
}
