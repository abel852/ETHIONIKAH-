let cachedCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioCtx) return null;
  if (!cachedCtx) {
    try {
      cachedCtx = new AudioCtx();
    } catch {
      return null;
    }
  }
  if (cachedCtx.state === "suspended") {
    cachedCtx.resume().catch(() => {});
  }
  return cachedCtx;
}

export function playMessageSound(type: "send" | "receive" | "error" = "send") {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    if (type === "receive") {
      oscillator.frequency.setValueAtTime(587.33, ctx.currentTime);
      oscillator.frequency.setValueAtTime(783.99, ctx.currentTime + 0.08);
    } else if (type === "error") {
      oscillator.frequency.setValueAtTime(311.13, ctx.currentTime);
      oscillator.frequency.setValueAtTime(233.08, ctx.currentTime + 0.1);
    } else {
      oscillator.frequency.setValueAtTime(880, ctx.currentTime);
      oscillator.frequency.setValueAtTime(659.25, ctx.currentTime + 0.06);
    }

    oscillator.type = type === "error" ? "square" : "sine";
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.25);
  } catch {
    // ignore
  }
}
