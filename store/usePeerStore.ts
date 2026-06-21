import { create } from "zustand";
import type { PeerConnectionStatus } from "@/lib/types";

export interface PeerInfo { id: string; status: PeerConnectionStatus; joinedAt: number; }

interface PeerState {
  selfId: string | null;
  peers: Record<string, PeerInfo>;
  setSelfId: (id: string) => void;
  addPeer: (id: string) => void;
  removePeer: (id: string) => void;
  setPeerStatus: (id: string, status: PeerConnectionStatus) => void;
  reset: () => void;
}

export const usePeerStore = create<PeerState>((set) => ({
  selfId: null,
  peers: {},
  setSelfId: (id) => set({ selfId: id }),
  addPeer: (id) => set((s) => ({ peers: s.peers[id] ? s.peers : { ...s.peers, [id]: { id, status: "connecting", joinedAt: Date.now() } } })),
  removePeer: (id) => set((s) => { const { [id]: _, ...rest } = s.peers; return { peers: rest }; }),
  setPeerStatus: (id, status) => set((s) => ({ peers: s.peers[id] ? { ...s.peers, [id]: { ...s.peers[id], status } } : s.peers })),
  reset: () => set({ peers: {} }),
}));