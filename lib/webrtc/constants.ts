export const CHUNK_SIZE = 32 * 1024;
export const BUFFER_THRESHOLD = 1 * 1024 * 1024;
export const BUFFER_LOW_THRESHOLD = 256 * 1024;

export const ICE_SERVERS: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];
