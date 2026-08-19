"use client";

let audioContext: AudioContext | null = null;

function context(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!audioContext) audioContext = new Ctor();
  if (audioContext.state === "suspended") void audioContext.resume();
  return audioContext;
}

/** Short percussive click used as the wheel passes each slice. */
export function playTick(enabled: boolean, intensity = 1): void {
  if (!enabled) return;
  const ctx = context();
  if (!ctx) return;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "triangle";
  osc.frequency.setValueAtTime(760 + 240 * intensity, now);
  osc.frequency.exponentialRampToValueAtTime(320, now + 0.05);

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.06 * intensity + 0.01, now + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);

  osc.connect(gain).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.09);
}

/** Rising two-note chime for the winning slice. */
export function playWin(enabled: boolean): void {
  if (!enabled) return;
  const ctx = context();
  if (!ctx) return;

  const now = ctx.currentTime;
  [0, 0.12, 0.24].forEach((offset, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime([523.25, 659.25, 783.99][i], now + offset);
    gain.gain.setValueAtTime(0.0001, now + offset);
    gain.gain.exponentialRampToValueAtTime(0.14, now + offset + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.34);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now + offset);
    osc.stop(now + offset + 0.36);
  });
}

export function vibrate(enabled: boolean, pattern: number | number[]): void {
  if (!enabled || typeof navigator === "undefined" || !("vibrate" in navigator)) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    /* Some browsers reject vibration outside a user gesture — harmless. */
  }
}
