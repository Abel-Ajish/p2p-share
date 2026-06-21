"use client";

import { usePeerStore } from "@/store/usePeerStore";
import { M3ConnectionRing, M3RadarSweep } from "./ui/M3ConnectionRing";

export function PeerList() {
  const peers = usePeerStore((s) => s.peers);
  const peerList = Object.values(peers);
  if (peerList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12 text-center">
        <M3RadarSweep />
        <p className="mt-4 font-display text-sm text-on-surface-variant">Searching for signal</p>
        <p className="mt-1 text-xs text-on-surface-variant/70 font-body max-w-[18ch]">Share this room's link to connect a peer</p>
      </div>
    );
  }
  return (
    <ul className="flex flex-col gap-2">
      {peerList.map((peer) => (
        <li key={peer.id} className="flex items-center gap-3 px-3 py-2.5 rounded-m3-md bg-surface-container-low animate-fade-up">
          <M3ConnectionRing state={peer.status === "connected" ? "connected" : peer.status === "disconnected" || peer.status === "failed" || peer.status === "closed" ? "disconnected" : "connecting"} />
          <div className="min-w-0">
            <p className="font-mono text-xs text-on-surface truncate">{peer.id}</p>
            <p className="text-[11px] text-on-surface-variant capitalize">{peer.status}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
