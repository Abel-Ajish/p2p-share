import type { SignalMessage } from "./types";

const ROOM_TTL_SECONDS = 60 * 30;
const MAX_QUEUE_LENGTH = 200;
const CLEANUP_INTERVAL_MS = 60 * 1000;
const ROOM_MAX_AGE_MS = 30 * 60 * 1000;

let kv: typeof import("@vercel/kv").kv | null = null;
let kvLoadAttempted = false;
const memoryStore = new Map<string, { messages: SignalMessage[]; lastAccess: number }>();

async function getKv() {
  if (kvLoadAttempted) return kv;
  kvLoadAttempted = true;
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    try {
      const mod = await import("@vercel/kv");
      kv = mod.kv;
    } catch {
      kv = null;
    }
  }
  return kv;
}

function roomKey(roomId: string) { return `room:${roomId}:queue`; }

let lastCleanup = Date.now();
function cleanupMemoryStore() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [key, room] of memoryStore.entries()) {
    if (now - room.lastAccess > ROOM_MAX_AGE_MS) {
      memoryStore.delete(key);
    }
  }
}

export async function pushSignal(roomId: string, message: SignalMessage) {
  try {
    const client = await getKv();
    const key = roomKey(roomId);
    if (client) {
      await client.rpush(key, JSON.stringify(message));
      await client.ltrim(key, -MAX_QUEUE_LENGTH, -1);
      await client.expire(key, ROOM_TTL_SECONDS);
    } else {
      cleanupMemoryStore();
      const room = memoryStore.get(key) ?? { messages: [], lastAccess: Date.now() };
      room.messages.push(message);
      if (room.messages.length > MAX_QUEUE_LENGTH) room.messages.shift();
      room.lastAccess = Date.now();
      memoryStore.set(key, room);
    }
  } catch (err) { console.error("signalingStore: pushSignal failed for room", roomId, err); }
}

export async function pollSignals(roomId: string, selfId: string, sinceTs: number): Promise<SignalMessage[]> {
  try {
    const client = await getKv();
    const key = roomKey(roomId);
    let all: SignalMessage[] = [];
    if (client) {
      const raw = await client.lrange<string>(key, 0, -1);
      all = raw.map((r) => { try { return typeof r === "string" ? JSON.parse(r) : r; } catch { return null; } }).filter(Boolean) as SignalMessage[];
    } else {
      cleanupMemoryStore();
      all = (memoryStore.get(key)?.messages) ?? [];
    }
    return all.filter((m) => m.ts > sinceTs && m.fromId !== selfId && (!m.toId || m.toId === selfId));
  } catch (err) { console.error("signalingStore: pollSignals failed for room", roomId, err); return []; }
}
