export type SignalKind = "join" | "leave" | "offer" | "answer" | "candidate";

export interface SignalMessage {
  id: string;
  kind: SignalKind;
  fromId: string;
  toId?: string;
  payload?: RTCSessionDescriptionInit | RTCIceCandidateInit;
  ts: number;
}

export interface FileMetaMsg {
  type: "meta";
  fileId: string;
  name: string;
  size: number;
  mime: string;
  totalChunks: number;
}

export interface FileEndMsg {
  type: "end";
  fileId: string;
}

export type FileControlMsg = FileMetaMsg | FileEndMsg;

export type TransferStatus = "sending" | "receiving" | "done" | "error";

export interface TransferRecord {
  id: string;
  peerId: string;
  name: string;
  size: number;
  progress: number;
  status: TransferStatus;
}

export type PeerConnectionStatus = "new" | "connecting" | "connected" | "disconnected" | "failed" | "closed";
