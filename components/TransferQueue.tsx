"use client";

import { useTransferStore } from "@/store/useTransferStore";
import { M3ProgressLinear } from "./ui/M3ProgressLinear";
import { formatBytes } from "@/lib/utils/formatBytes";

export function TransferQueue() {
  const transfers = useTransferStore((s) => s.transfers);
  const list = Object.values(transfers).sort((a, b) => b.startedAt - a.startedAt);
  if (list.length === 0) return <p className="text-sm text-on-surface-variant font-body py-6 text-center">No transfers yet</p>;
  return (
    <ul className="flex flex-col gap-3">
      {list.map((t) => (
        <li key={t.id} className="rounded-m3-lg bg-surface-container-low px-4 py-3 animate-fade-up">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="min-w-0 flex items-center gap-2">
              <DirectionIcon status={t.status === "receiving" ? "receiving" : "sending"} />
              <p className="text-sm text-on-surface truncate font-body">{t.name}</p>
            </div>
            <span className="font-mono text-xs text-on-surface-variant shrink-0">{t.status === "done" ? formatBytes(t.size) : `${formatBytes(t.bytesTransferred)} / ${formatBytes(t.size)}`}</span>
          </div>
          <M3ProgressLinear value={t.progress} tone={t.status === "error" ? "error" : t.status === "done" ? "success" : "primary"} />
          <p className="mt-1.5 text-[11px] text-on-surface-variant capitalize">{t.status === "done" ? "Complete" : t.status === "error" ? "Failed" : `${t.status}... ${t.progress}%`}</p>
        </li>
      ))}
    </ul>
  );
}

function DirectionIcon({ status }: { status: "sending" | "receiving" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`w-3.5 h-3.5 shrink-0 text-primary ${status === "sending" ? "" : "rotate-180"}`}>
      <path d="M12 4v16m0-16l5 5m-5-5L7 9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
