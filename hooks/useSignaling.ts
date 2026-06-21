"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { SignalMessage, SignalKind } from "@/lib/types";

interface UseSignalingOptions {
  roomId: string;
  selfId: string;
  onMessage: (message: SignalMessage) => void;
}

export function useSignaling({ roomId, selfId, onMessage }: UseSignalingOptions) {
  const [connected, setConnected] = useState(false);
  const sourceRef = useRef<EventSource | null>(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const send = useCallback(
    async (kind: SignalKind, toId: string | undefined, payload?: unknown) => {
      await fetch(`/api/signal/${roomId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind, fromId: selfId, toId, payload }),
        keepalive: true,
      });
    },
    [roomId, selfId]
  );

  useEffect(() => {
    if (!roomId || !selfId) return;

    let cancelled = false;

    function connect() {
      const url = `/api/signal/stream?roomId=${encodeURIComponent(roomId)}&selfId=${encodeURIComponent(selfId)}`;
      const es = new EventSource(url);
      sourceRef.current = es;

      es.addEventListener("connected", () => setConnected(true));

      es.addEventListener("signal", (e) => {
        const messages: SignalMessage[] = JSON.parse((e as MessageEvent).data);
        messages.forEach((m) => onMessageRef.current(m));
      });

      es.addEventListener("reconnect", () => {
        es.close();
        if (!cancelled) connect();
      });

      es.onerror = () => {
        setConnected(false);
        es.close();
        if (!cancelled) setTimeout(connect, 1000);
      };
    }

    connect();
    send("join", undefined);

    return () => {
      cancelled = true;
      sourceRef.current?.close();
      send("leave", undefined);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, selfId]);

  return { connected, send };
}
