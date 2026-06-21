"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useWebRTC } from "@/hooks/useWebRTC";
import { useFileTransfer } from "@/hooks/useFileTransfer";
import { usePeerStore } from "@/store/usePeerStore";
import { generatePeerId } from "@/lib/utils/id";
import { M3Card } from "@/components/ui/M3Card";
import { M3Button } from "@/components/ui/M3Button";
import { M3Snackbar } from "@/components/ui/M3Snackbar";
import { ThemePicker } from "@/components/ThemePicker";
import { DropZone } from "@/components/DropZone";
import { PeerList } from "@/components/PeerList";
import { TransferQueue } from "@/components/TransferQueue";
import { setAudioMuted, isAudioMuted } from "@/lib/audioFX";

interface RoomPageProps { params: { roomId: string }; }

export default function RoomPage({ params }: RoomPageProps) {
  const { roomId } = params;
  const [selfId] = useState(() => generatePeerId());
  const [snackbar, setSnackbar] = useState<{ message: string; tone?: "default" | "error" } | null>(null);
  const [muted, setMuted] = useState(false);
  const [copied, setCopied] = useState(false);
  const setSelfId = usePeerStore((s) => s.setSelfId);
  const peers = usePeerStore((s) => s.peers);
  const reset = usePeerStore((s) => s.reset);
  const { sendFile, handleIncomingMessage } = useFileTransfer();
  const onChannelReady = useCallback(() => { setSnackbar({ message: "Peer connected - ready to send" }); }, []);
  const onChannelMessage = useCallback((event: MessageEvent, peerId: string) => { handleIncomingMessage(event, peerId).catch((err) => { console.error("room: onChannelMessage handler failed for peer", peerId, err); setSnackbar({ message: "Error receiving file data", tone: "error" }); }); }, [handleIncomingMessage]);
  const { connected, connectionError, peersRef } = useWebRTC({ roomId, selfId, onChannelReady, onChannelMessage });
  useEffect(() => { if (connectionError) setSnackbar({ message: connectionError, tone: "error" }); }, [connectionError]);
  useEffect(() => { setSelfId(selfId); return () => reset(); }, [selfId, setSelfId, reset]);
  const connectedPeerIds = Object.values(peers).filter((p) => p.status === "connected").map((p) => p.id);
  const handleFiles = useCallback((files: File[]) => {
    if (connectedPeerIds.length === 0) { setSnackbar({ message: "No peer connected yet", tone: "error" }); return; }
    connectedPeerIds.forEach((peerId) => {
      try {
        const channel = peersRef.current.get(peerId)?.channel;
        if (channel && channel.readyState === "open") files.forEach((file) => sendFile(channel, file, peerId));
        else { setSnackbar({ message: `Channel to peer ${peerId.slice(0, 6)} is not open`, tone: "error" }); }
      } catch (err) { console.error("room: failed to send file to peer", peerId, err); setSnackbar({ message: "Failed to start file transfer", tone: "error" }); }
    });
  }, [connectedPeerIds, peersRef, sendFile]);
  const copyLink = async () => {
    try {
      const url = `${window.location.origin}/room/${roomId}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (err) { console.error("room: failed to copy link", err); setSnackbar({ message: "Failed to copy link", tone: "error" }); }
  };
  const toggleMute = () => { const next = !isAudioMuted(); setAudioMuted(next); setMuted(next); };

  return (
    <main className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-5 sm:px-8 py-5 border-b border-outline-variant/40">
        <div className="flex items-center gap-3">
          <a href="/" className="font-display text-lg font-semibold text-on-surface">Signal</a>
          <span className="font-mono text-xs text-on-surface-variant px-2 py-1 rounded-m3-xs bg-surface-container-high">{roomId}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggleMute} aria-label={muted ? "Unmute sounds" : "Mute sounds"} className="text-on-surface-variant hover:text-on-surface transition-colors p-2 rounded-m3-full hover:bg-surface-container-high">
            {muted ? <IconMuted /> : <IconSound />}
          </button>
          <ThemePicker />
          <M3Button variant="tonal" onClick={copyLink} className="hidden sm:inline-flex">{copied ? "Copied" : "Copy link"}</M3Button>
        </div>
      </header>
      <div className="flex-1 grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6 px-5 sm:px-8 py-6 max-w-6xl w-full mx-auto">
        <aside className="md:border-r md:border-outline-variant/40 md:pr-6">
          <h2 className="font-display text-sm font-medium text-on-surface-variant uppercase tracking-wide mb-3">Peers</h2>
          <PeerList />
          <M3Button variant="text" onClick={copyLink} className="sm:hidden w-full mt-4 justify-center">{copied ? "Copied" : "Copy room link"}</M3Button>
        </aside>
        <section className="flex flex-col gap-8">
          <DropZone onFiles={handleFiles} disabled={connectedPeerIds.length === 0} />
          <div>
            <h2 className="font-display text-sm font-medium text-on-surface-variant uppercase tracking-wide mb-3">Transfers</h2>
            <M3Card variant="outlined" className="p-4"><TransferQueue /></M3Card>
          </div>
        </section>
      </div>
      <M3Snackbar message={snackbar?.message ?? null} tone={snackbar?.tone} onDismiss={() => setSnackbar(null)} />
    </main>
  );
}

function IconSound() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
      <path d="M4 9v6h4l5 5V4L8 9H4z" strokeLinejoin="round" />
      <path d="M16.5 8.5a5 5 0 010 7" strokeLinecap="round" />
    </svg>
  );
}

function IconMuted() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
      <path d="M4 9v6h4l5 5V4L8 9H4z" strokeLinejoin="round" />
      <path d="M17 9l4 6m0-6l-4 6" strokeLinecap="round" />
    </svg>
  );
}