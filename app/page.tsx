"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { M3Card } from "@/components/ui/M3Card";
import { M3Button } from "@/components/ui/M3Button";
import { ThemePicker } from "@/components/ThemePicker";
import { generateRoomId } from "@/lib/utils/id";

export default function HomePage() {
  const router = useRouter();
  const [joinCode, setJoinCode] = useState("");
  const createRoom = () => { router.push(`/room/${generateRoomId()}`); };
  const joinRoom = (e: React.FormEvent) => { e.preventDefault(); const code = joinCode.trim().toLowerCase(); if (code) router.push(`/room/${code}`); };
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-10">
      <div className="absolute top-6 right-6"><ThemePicker /></div>
      <div className="mb-10 text-center">
        <h1 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight text-on-surface">Signal</h1>
        <p className="mt-2 text-on-surface-variant font-body max-w-sm mx-auto">Files move straight from your browser to theirs. Nothing touches a server in between.</p>
      </div>
      <M3Card elevation={2} className="w-full max-w-sm p-7">
        <M3Button variant="filled" className="w-full" onClick={createRoom}>Create a room</M3Button>
        <div className="flex items-center gap-3 my-5">
          <div className="h-px flex-1 bg-outline-variant" />
          <span className="text-xs text-on-surface-variant font-mono">OR</span>
          <div className="h-px flex-1 bg-outline-variant" />
        </div>
        <form onSubmit={joinRoom} className="flex flex-col gap-3">
          <input value={joinCode} onChange={(e) => setJoinCode(e.target.value)} placeholder="room-code-12"
            className="w-full rounded-m3-md bg-surface-container-high px-4 py-2.5 text-sm font-mono text-on-surface placeholder:text-on-surface-variant/60 border border-transparent focus:border-primary outline-none transition-colors" />
          <M3Button type="submit" variant="outlined" className="w-full" disabled={!joinCode.trim()}>Join room</M3Button>
        </form>
      </M3Card>
      <p className="mt-8 text-xs text-on-surface-variant/70 font-body text-center max-w-xs">Rooms exist only while peers are present. Closing every tab clears all trace of the session.</p>
    </main>
  );
}