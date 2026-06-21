import { NextRequest, NextResponse } from "next/server";
import { pushSignal, pollSignals } from "@/lib/signalingStore";
import type { SignalMessage } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteParams { params: { roomId: string } }

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { roomId } = params;
    const body = await req.json();
    const message: SignalMessage = { id: crypto.randomUUID(), kind: body.kind, fromId: body.fromId, toId: body.toId, payload: body.payload, ts: Date.now() };
    if (!message.fromId || !message.kind) return NextResponse.json({ error: "fromId and kind are required" }, { status: 400 });
    await pushSignal(roomId, message);
    return NextResponse.json({ ok: true, ts: message.ts });
  } catch (err) { console.error("signal/[roomId] POST failed", err); return NextResponse.json({ error: "Internal server error" }, { status: 500 }); }
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { roomId } = params;
    const selfId = req.nextUrl.searchParams.get("selfId") ?? "";
    const since = Number(req.nextUrl.searchParams.get("since") ?? "0");
    const messages = await pollSignals(roomId, selfId, since);
    return NextResponse.json({ messages, ts: Date.now() });
  } catch (err) { console.error("signal/[roomId] GET failed", err); return NextResponse.json({ error: "Internal server error" }, { status: 500 }); }
}
