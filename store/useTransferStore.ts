import { create } from "zustand";
import type { TransferStatus } from "@/lib/types";

export interface Transfer { id: string; peerId: string; name: string; size: number; progress: number; status: TransferStatus; startedAt: number; bytesTransferred: number; }

interface TransferState {
  transfers: Record<string, Transfer>;
  startTransfer: (id: string, peerId: string, name: string, size: number, status: TransferStatus) => void;
  setProgress: (id: string, progress: number, bytesTransferred: number) => void;
  completeTransfer: (id: string) => void;
  failTransfer: (id: string) => void;
  clearCompleted: () => void;
}

export const useTransferStore = create<TransferState>((set) => ({
  transfers: {},
  startTransfer: (id, peerId, name, size, status) => set((s) => ({ transfers: { ...s.transfers, [id]: { id, peerId, name, size, progress: 0, status, startedAt: Date.now(), bytesTransferred: 0 } } })),
  setProgress: (id, progress, bytesTransferred) => set((s) => s.transfers[id] ? { transfers: { ...s.transfers, [id]: { ...s.transfers[id], progress, bytesTransferred } } } : s),
  completeTransfer: (id) => set((s) => s.transfers[id] ? { transfers: { ...s.transfers, [id]: { ...s.transfers[id], progress: 100, status: "done" } } } : s),
  failTransfer: (id) => set((s) => s.transfers[id] ? { transfers: { ...s.transfers, [id]: { ...s.transfers[id], status: "error" } } } : s),
  clearCompleted: () => set((s) => ({ transfers: Object.fromEntries(Object.entries(s.transfers).filter(([, t]) => t.status !== "done")) })),
}));