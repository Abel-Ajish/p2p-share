"use client";

import { useM3Theme } from "@/hooks/useM3Theme";

export function ThemeBootstrap({ children }: { children: React.ReactNode }) {
  useM3Theme();
  return <>{children}</>;
}
