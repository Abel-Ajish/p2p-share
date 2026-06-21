import { NextRequest } from "next/server";
import { pollSignals } from "@/lib/signalingStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const POLL_INTERVAL_MS = 1200;
const MAX_STREAM_MS = 50_000;

export async function GET(req: NextRequest) {
  const roomId = req.nextUrl.searchParams.get("roomId");
  const selfId = req.nextUrl.searchParams.get("selfId");
  if (!roomId || !selfId) return new Response("roomId and selfId are required", { status: 400 });
  let cursor = Date.now();
  const startedAt = Date.now();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const encoder = new TextEncoder();
        const send = (event: string, data: unknown) => { controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)); };
        send("connected", { ts: cursor });
        const interval = setInterval(async () => {
          try {
            const messages = await pollSignals(roomId, selfId, cursor);
            if (messages.length > 0) { cursor = Math.max(...messages.map((m) => m.ts)); send("signal", messages); } else { send("heartbeat", { ts: Date.now() }); }
            if (Date.now() - startedAt > MAX_STREAM_MS) { clearInterval(interval); send("reconnect", { ts: Date.now() }); controller.close(); }
          } catch (err) { console.error("signal/stream: pollSignals failed", err); clearInterval(interval); try { controller.error(err); } catch (_) {} }
        }, POLL_INTERVAL_MS);
        req.signal.addEventListener("abort", () => { clearInterval(interval); try { controller.close(); } catch (_) {} });
      } catch (err) { console.error("signal/stream: ReadableStream start failed", err); try { controller.error(err); } catch (_) {} }
    },
  });
  return new Response(stream, { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive" } });
}
