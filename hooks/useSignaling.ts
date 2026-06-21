"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SignalMessage, SignalKind } from "@/lib/types";

const MAX_RECONNECT_ATTEMPTS = 20;
const BASE_RECONNECT_DELAY_MS = 1000;
const MAX_RECONNECT_DELAY_MS = 10000;

interface UseSignalingOptions { roomId: string; selfId: string; onMessage: (message: SignalMessage) => void; }

export function useSignaling({ roomId, selfId, onMessage }: UseSignalingOptions) {
  const [connected, setConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const sourceRef = useRef<EventSource | null>(null);
  const onMessageRef = useRef(onMessage);
  const reconnectAttemptRef = useRef(0);
  onMessageRef.current = onMessage;

  const send = useCallback(async (kind: SignalKind, toId: string | undefined, payload?: unknown) => {
    try {
      await fetch(`/api/signal/${roomId}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind, fromId: selfId, toId, payload }), keepalive: true });
    } catch (err) { console.error("useSignaling: send failed", kind, err); }
  }, [roomId, selfId]);

  useEffect(() => {
    if (!roomId || !selfId) return;
    let cancelled = false;

    function connect() {
      if (cancelled) return;
      if (reconnectAttemptRef.current >= MAX_RECONNECT_ATTEMPTS) {
        console.error(`[Signaling] Max reconnect attempts (${MAX_RECONNECT_ATTEMPTS}) reached. Giving up.`);
        setConnected(false);
        return;
      }

      const url = `/api/signal/stream?roomId=${encodeURIComponent(roomId)}&selfId=${encodeURIComponent(selfId)}`;
      const es = new EventSource(url);
      sourceRef.current = es;

      es.addEventListener("connected", () => {
        reconnectAttemptRef.current = 0;
        setConnected(true);
        setConnectionError(null);
        console.log(`[Signaling] SSE connected`);
      });

      es.addEventListener("signal", (e) => {
        try {
          const messages: SignalMessage[] = JSON.parse((e as MessageEvent).data);
          messages.forEach((m) => onMessageRef.current(m));
        } catch (err) { console.error("useSignaling: failed to parse signal messages", err); }
      });

      es.addEventListener("reconnect", () => {
        console.log(`[Signaling] Server requested reconnect`);
        es.close();
        if (!cancelled) connect();
      });

      es.onerror = () => {
        const attempt = reconnectAttemptRef.current + 1;
        console.log(`[Signaling] SSE error, attempt ${attempt}/${MAX_RECONNECT_ATTEMPTS}`);
        setConnected(false);
        es.close();
        if (!cancelled) {
          if (reconnectAttemptRef.current >= MAX_RECONNECT_ATTEMPTS) {
            setConnectionError("Lost connection. Please refresh the page.");
            return;
          }
          setConnectionError(`Reconnecting... (attempt ${attempt})`);
          const delay = Math.min(BASE_RECONNECT_DELAY_MS * Math.pow(2, reconnectAttemptRef.current), MAX_RECONNECT_DELAY_MS);
          reconnectAttemptRef.current = attempt;
          console.log(`[Signaling] Reconnecting in ${delay}ms...`);
          setTimeout(connect, delay);
        }
      };
    }

    reconnectAttemptRef.current = 0;
    connect();
    send("join", undefined);
    return () => {
      cancelled = true;
      sourceRef.current?.close();
      send("leave", undefined);
    };
  }, [roomId, selfId]);

  return { connected, connectionError, send };
}
