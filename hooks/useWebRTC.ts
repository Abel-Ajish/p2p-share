"use client";

import { useCallback, useEffect, useRef } from "react";
import { useSignaling } from "./useSignaling";
import { usePeerStore } from "@/store/usePeerStore";
import { ICE_SERVERS } from "@/lib/webrtc/constants";
import { playPeerConnected, playError } from "@/lib/audioFX";
import type { SignalMessage } from "@/lib/types";

interface PeerEntry {
  pc: RTCPeerConnection;
  channel?: RTCDataChannel;
}

type ChannelReadyHandler = (channel: RTCDataChannel, peerId: string) => void;
type ChannelMessageHandler = (event: MessageEvent, peerId: string) => void;

interface UseWebRTCOptions {
  roomId: string;
  selfId: string;
  onChannelReady: ChannelReadyHandler;
  onChannelMessage: ChannelMessageHandler;
}

type SendFn = (kind: SignalMessage["kind"], toId: string | undefined, payload?: unknown) => Promise<void>;

export function useWebRTC({ roomId, selfId, onChannelReady, onChannelMessage }: UseWebRTCOptions) {
  const peersRef = useRef<Map<string, PeerEntry>>(new Map());
  const { addPeer, removePeer, setPeerStatus } = usePeerStore();

  const onChannelReadyRef = useRef(onChannelReady);
  onChannelReadyRef.current = onChannelReady;
  const onChannelMessageRef = useRef(onChannelMessage);
  onChannelMessageRef.current = onChannelMessage;

  const createPeerConnection = useCallback(
    (peerId: string, isInitiator: boolean, send: SendFn) => {
      const existing = peersRef.current.get(peerId);
      if (existing) return existing.pc;

      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      const entry: PeerEntry = { pc };
      peersRef.current.set(peerId, entry);
      addPeer(peerId);

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          send("candidate", peerId, e.candidate.toJSON());
        }
      };

      pc.onconnectionstatechange = () => {
        setPeerStatus(peerId, pc.connectionState as any);
        if (pc.connectionState === "connected") playPeerConnected();
        if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
          playError();
        }
        if (pc.connectionState === "closed" || pc.connectionState === "failed") {
          peersRef.current.delete(peerId);
          removePeer(peerId);
        }
      };

      const wireChannel = (channel: RTCDataChannel) => {
        channel.binaryType = "arraybuffer";
        entry.channel = channel;
        channel.onopen = () => onChannelReadyRef.current(channel, peerId);
        channel.onmessage = (e) => onChannelMessageRef.current(e, peerId);
      };

      if (isInitiator) {
        const channel = pc.createDataChannel("fileTransfer", { ordered: true });
        wireChannel(channel);
      } else {
        pc.ondatachannel = (e) => wireChannel(e.channel);
      }

      return pc;
    },
    [addPeer, removePeer, setPeerStatus]
  );

  const handleSignal = useCallback(
    async (message: SignalMessage, send: SendFn) => {
      const { kind, fromId, payload } = message;

      if (kind === "join") {
        const pc = createPeerConnection(fromId, true, send);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        send("offer", fromId, offer);
        return;
      }

      if (kind === "leave") {
        peersRef.current.get(fromId)?.pc.close();
        peersRef.current.delete(fromId);
        removePeer(fromId);
        return;
      }

      if (kind === "offer") {
        const pc = createPeerConnection(fromId, false, send);
        await pc.setRemoteDescription(new RTCSessionDescription(payload as RTCSessionDescriptionInit));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        send("answer", fromId, answer);
        return;
      }

      if (kind === "answer") {
        const entry = peersRef.current.get(fromId);
        if (entry) {
          await entry.pc.setRemoteDescription(new RTCSessionDescription(payload as RTCSessionDescriptionInit));
        }
        return;
      }

      if (kind === "candidate") {
        const entry = peersRef.current.get(fromId);
        if (entry) {
          try {
            await entry.pc.addIceCandidate(new RTCIceCandidate(payload as RTCIceCandidateInit));
          } catch {
            // Benign if it arrives before remote description is set; ICE retries.
          }
        }
        return;
      }
    },
    [createPeerConnection, removePeer]
  );

  const handleSignalRef = useRef(handleSignal);
  handleSignalRef.current = handleSignal;

  const sendRef = useRef<SendFn>(async () => {});

  const { connected, send } = useSignaling({
    roomId,
    selfId,
    onMessage: (message) => handleSignalRef.current(message, sendRef.current),
  });

  useEffect(() => {
    sendRef.current = send;
  }, [send]);

  useEffect(() => {
    return () => {
      peersRef.current.forEach((entry) => entry.pc.close());
      peersRef.current.clear();
    };
  }, []);

  const getChannel = useCallback((peerId: string) => peersRef.current.get(peerId)?.channel, []);

  return { connected, peersRef, getChannel };
}
