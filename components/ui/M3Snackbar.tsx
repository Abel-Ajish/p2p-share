"use client";

import { useEffect } from "react";

interface M3SnackbarProps { message: string | null; tone?: "default" | "error"; onDismiss: () => void; durationMs?: number; }

export function M3Snackbar({ message, tone = "default", onDismiss, durationMs = 4000 }: M3SnackbarProps) {
  useEffect(() => { if (!message) return; const t = setTimeout(onDismiss, durationMs); return () => clearTimeout(t); }, [message, durationMs, onDismiss]);
  const safeMessage = message ? String(message) : "";
  if (!safeMessage) return null;
  return (
    <div role="status" className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-m3-sm shadow-elevation-3 animate-fade-up font-body text-sm flex items-center gap-3 ${tone === "error" ? "bg-error-container text-on-error" : "bg-surface-container-highest text-on-surface"}`}>
      {safeMessage}
      <button onClick={onDismiss} className="text-xs uppercase tracking-wide font-medium text-primary hover:opacity-80">Dismiss</button>
    </div>
  );
}