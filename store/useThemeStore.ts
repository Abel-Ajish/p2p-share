import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ThemeState {
  seedColor: string;
  mode: "light" | "dark";
  setSeedColor: (hex: string) => void;
  toggleMode: () => void;
  setMode: (mode: "light" | "dark") => void;
}

export const useThemeStore = create<ThemeState>()(
  persist((set) => ({
    seedColor: "#2B5FE0",
    mode: "dark",
    setSeedColor: (hex) => set({ seedColor: hex }),
    toggleMode: () => set((s) => ({ mode: s.mode === "dark" ? "light" : "dark" })),
    setMode: (mode) => set({ mode }),
  }), { name: "p2p-share-theme" })
);