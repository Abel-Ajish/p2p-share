import type { SignalMessage } from "./types";

const ROOM_TTL_SECONDS = 60 * 30;
const MAX_QUEUE_LENGTH = 200;

let kv: typeof import("@vercel/kv").kv | null = null;
const memoryStore = new Map<string, SignalMessage[]>();

async function getKv() {
  if (kv) return kv;
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    const mod = await import("@vercel/kv");
    kv = mod.kv;
    return kv;
  }
  return null;
}

function roomKey(roomId: string) {
  return `room:${roomId}:queue`;
}

export async function pushSignal(roomId: string, message: SignalMessage) {
  const client = await getKv();
  const key = roomKey(roomId);

  if (client) {
    await client.rpush(key, JSON.stringify(message));
    await client.ltrim(key, -MAX_QUEUE_LENGTH, -1);
    await client.expire(key, ROOM_TTL_SECONDS);
  } else {
    const queue = memoryStore.get(key) ?? [];
    queue.push(message);
    if (queue.length > MAX_QUEUE_LENGTH) queue.shift();
    memoryStore.set(key, queue);
  }
}

export async function pollSignals(
  roomId: string,
  selfId: string,
  sinceTs: number
): Promise<SignalMessage[]> {
  const client = await getKv();
  const key = roomKey(roomId);

  let all: SignalMessage[] = [];

  if (client) {
    const raw = await client.lrange<string>(key, 0, -1);
    all = raw.map((r) => (typeof r === "string" ? JSON.parse(r) : r));
  } else {
    all = memoryStore.get(key) ?? [];
  }

  return all.filter(
    (m) => m.ts > sinceTs && m.fromId !== selfId && (!m.toId || m.toId === selfId)
  );
}
