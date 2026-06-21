"use client";

let ctx: AudioContext | null = null;
let muted = false;

export function setAudioMuted(value: boolean) { muted = value; }
export function isAudioMuted() { return muted; }

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

interface ToneOptions { type?: OscillatorType; gain?: number; attack?: number; release?: number; }

function tone(audioCtx: AudioContext, freq: number, startTime: number, duration: number, options: ToneOptions = {}) {
  const { type = "sine", gain = 0.15, attack = 0.01, release = 0.1 } = options;
  const osc = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);
  gainNode.gain.setValueAtTime(0, startTime);
  gainNode.gain.linearRampToValueAtTime(gain, startTime + attack);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, Math.max(startTime + attack + 0.01, startTime + duration - release));
  osc.connect(gainNode).connect(audioCtx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.05);
}

export function playPeerConnected() {
  if (muted) return;
  try {
    const audioCtx = getCtx();
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    [523.25, 659.25, 783.99].forEach((freq, i) => {
      tone(audioCtx, freq, now + i * 0.09, 0.28, { type: "sine", gain: 0.11, attack: 0.015, release: 0.18 });
    });
  } catch (err) { console.error("audioFX: playPeerConnected failed", err); }
}

export function playTransferStart() {
  if (muted) return;
  try {
    const audioCtx = getCtx();
    if (!audioCtx) return;
    tone(audioCtx, 880, audioCtx.currentTime, 0.09, { type: "triangle", gain: 0.1, attack: 0.004, release: 0.04 });
  } catch (err) { console.error("audioFX: playTransferStart failed", err); }
}

export function playTransferComplete() {
  if (muted) return;
  try {
    const audioCtx = getCtx();
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      tone(audioCtx, freq, now + i * 0.045, 0.65, { type: "sine", gain: 0.095, attack: 0.02, release: 0.45 });
    });
  } catch (err) { console.error("audioFX: playTransferComplete failed", err); }
}

export function playError() {
  if (muted) return;
  try {
    const audioCtx = getCtx();
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    tone(audioCtx, 180, now, 0.38, { type: "sawtooth", gain: 0.09, attack: 0.01, release: 0.22 });
    tone(audioCtx, 140, now + 0.06, 0.42, { type: "sawtooth", gain: 0.08, attack: 0.01, release: 0.26 });
  } catch (err) { console.error("audioFX: playError failed", err); }
}
