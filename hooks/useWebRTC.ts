"use client";

import { useCallback, useEffect, useRef } from "react";
import { useSignaling } from "./useSignaling";
import { usePeerStore } from "@/store/usePeerStore";
import {
  ICE_SERVERS,
  ICE_TRANSPORT_POLICY,
  CONNECTION_TIMEOUT_MS,
  ICE_RETRY_DELAY_MS,
} from "@/lib/webrtc/constants";
import { playPeerConnected, playError } from "@/lib/audioFX";
import type { SignalMessage } from "@/lib/types";

interface PeerEntry {
  pc: RTCPeerConnection;
  channel?: RTCDataChannel;
  connectionTimeout?: ReturnType<typeof setTimeout>;
  iceRetryCount: number;
  iceRetryTimeout?: ReturnType<typeof setTimeout>;
  retriedIceFailure: boolean;
}
type ChannelReadyHandler = (channel: RTCDataChannel, peerId: string) => void;
type ChannelMessageHandler = (event: MessageEvent, peerId: string) => void | Promise<void>;
interface UseWebRTCOptions { roomId: string; selfId: string; onChannelReady: ChannelReadyHandler; onChannelMessage: ChannelMessageHandler; }
type SendFn = (kind: SignalMessage["kind"], toId: string | undefined, payload?: unknown) => Promise<void>;

export function useWebRTC({ roomId, selfId, onChannelReady, onChannelMessage }: UseWebRTCOptions) {
  const peersRef = useRef<Map<string, PeerEntry>>(new Map());
  const { addPeer, removePeer, setPeerStatus } = usePeerStore();
  const onChannelReadyRef = useRef(onChannelReady); onChannelReadyRef.current = onChannelReady;
  const onChannelMessageRef = useRef(onChannelMessage); onChannelMessageRef.current = onChannelMessage;

  const cleanupPeer = useCallback((peerId: string, entry: PeerEntry) => {
    if (entry.connectionTimeout) clearTimeout(entry.connectionTimeout);
    if (entry.iceRetryTimeout) clearTimeout(entry.iceRetryTimeout);
    entry.pc.close();
    peersRef.current.delete(peerId);
    removePeer(peerId);
  }, [removePeer]);

  const createPeerConnection = useCallback((peerId: string, isInitiator: boolean, send: SendFn) => {
    const existing = peersRef.current.get(peerId);
    if (existing) return existing.pc;

    const pc = new RTCPeerConnection({
      iceServers: ICE_SERVERS,
      iceTransportPolicy: ICE_TRANSPORT_POLICY,
      iceCandidatePoolSize: 1,
      bundlePolicy: "max-bundle",
      rtcpMuxPolicy: "require",
    });

    const entry: PeerEntry = { pc, iceRetryCount: 0, retriedIceFailure: false };
    peersRef.current.set(peerId, entry);
    addPeer(peerId);

    const connectionTimeout = setTimeout(() => {
      if (pc.connectionState !== "connected") {
        console.log(`[WebRTC] Connection timeout for peer ${peerId} after ${CONNECTION_TIMEOUT_MS}ms`);
        cleanupPeer(peerId, entry);
      }
    }, CONNECTION_TIMEOUT_MS);
    entry.connectionTimeout = connectionTimeout;

    pc.onicecandidate = (e) => {
      if (e.candidate) { try { send("candidate", peerId, e.candidate.toJSON()); } catch (err) { console.error(`[WebRTC] Failed to send ICE candidate for peer ${peerId}`, err); } }
    };

    pc.oniceconnectionstatechange = () => {
      console.log(`[WebRTC] ICE connection state for ${peerId}: ${pc.iceConnectionState}`);
      setPeerStatus(peerId, pc.iceConnectionState as any);

      if (pc.iceConnectionState === "connected" || pc.iceConnectionState === "completed") {
        if (entry.connectionTimeout) clearTimeout(entry.connectionTimeout);
        playPeerConnected();
        console.log(`[WebRTC] Connected to peer ${peerId}`);
      }

      if (pc.iceConnectionState === "failed") {
        if (!entry.retriedIceFailure) {
          console.log(`[WebRTC] ICE failed for peer ${peerId}, retrying once...`);
          entry.retriedIceFailure = true;
          entry.iceRetryTimeout = setTimeout(() => {
            send("join", peerId);
          }, ICE_RETRY_DELAY_MS);
        } else {
          console.log(`[WebRTC] ICE failed again for peer ${peerId}, giving up`);
          playError();
          cleanupPeer(peerId, entry);
        }
      }

      if (pc.iceConnectionState === "disconnected") {
        console.log(`[WebRTC] ICE disconnected for peer ${peerId}, may recover...`);
      }
    };

    pc.onicegatheringstatechange = () => {
      console.log(`[WebRTC] ICE gathering state for ${peerId}: ${pc.iceGatheringState}`);
    };

    pc.onconnectionstatechange = () => {
      console.log(`[WebRTC] Connection state for ${peerId}: ${pc.connectionState}`);
      setPeerStatus(peerId, pc.connectionState as any);

      if (pc.connectionState === "connected") playPeerConnected();

      if (pc.connectionState === "failed") {
        playError();
        cleanupPeer(peerId, entry);
      }

      if (pc.connectionState === "disconnected") {
        console.log(`[WebRTC] Peer ${peerId} disconnected, attempting reconnect...`);
        setTimeout(() => send("join", peerId), 1000);
      }

      if (pc.connectionState === "closed") {
        peersRef.current.delete(peerId);
        removePeer(peerId);
      }
    };

    const wireChannel = (channel: RTCDataChannel) => {
      channel.binaryType = "arraybuffer";
      entry.channel = channel;
      channel.onopen = () => onChannelReadyRef.current(channel, peerId);
      channel.onmessage = (e) => { onChannelMessageRef.current(e, peerId); };
      channel.onerror = (e) => console.error(`[WebRTC] Data channel error for peer ${peerId}`, e);
    };

    if (isInitiator) {
      const channel = pc.createDataChannel("fileTransfer", { ordered: true });
      wireChannel(channel);
    } else {
      pc.ondatachannel = (e) => wireChannel(e.channel);
    }
    return pc;
  }, [addPeer, removePeer, setPeerStatus, cleanupPeer]);

  const handleSignal = useCallback(async (message: SignalMessage, send: SendFn) => {
    const { kind, fromId, payload } = message;
    try {
      if (kind === "join") {
        console.log(`[WebRTC] Peer ${fromId} joining, creating offer...`);
        const pc = createPeerConnection(fromId, true, send);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        send("offer", fromId, offer);
        return;
      }
      if (kind === "leave") {
        const entry = peersRef.current.get(fromId);
        if (entry) cleanupPeer(fromId, entry);
        return;
      }
      if (kind === "offer") {
        console.log(`[WebRTC] Received offer from ${fromId}`);
        const pc = createPeerConnection(fromId, false, send);
        await pc.setRemoteDescription(new RTCSessionDescription(payload as RTCSessionDescriptionInit));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        send("answer", fromId, answer);
        return;
      }
      if (kind === "answer") {
        console.log(`[WebRTC] Received answer from ${fromId}`);
        const entry = peersRef.current.get(fromId);
        if (entry) await entry.pc.setRemoteDescription(new RTCSessionDescription(payload as RTCSessionDescriptionInit));
        return;
      }
      if (kind === "candidate") {
        const entry = peersRef.current.get(fromId);
        if (entry) {
          try {
            await entry.pc.addIceCandidate(new RTCIceCandidate(payload as RTCIceCandidateInit));
          } catch (err) { console.error(`[WebRTC] Failed to add ICE candidate from ${fromId}`, err); }
        }
        return;
      }
    } catch (err) { console.error(`[WebRTC] handleSignal failed for kind=${kind} from=${fromId}`, err); }
  }, [createPeerConnection, cleanupPeer]);

  const handleSignalRef = useRef(handleSignal); handleSignalRef.current = handleSignal;
  const sendRef = useRef<SendFn>(async () => {});

  const { connected, connectionError, send } = useSignaling({ roomId, selfId, onMessage: (message) => handleSignalRef.current(message, sendRef.current) });

  useEffect(() => { sendRef.current = send; }, [send]);
  useEffect(() => {
    return () => {
      peersRef.current.forEach((entry, peerId) => cleanupPeer(peerId, entry));
      peersRef.current.clear();
    };
  }, [cleanupPeer]);
  const getChannel = useCallback((peerId: string) => peersRef.current.get(peerId)?.channel, []);
  return { connected, connectionError, peersRef, getChannel };
}
