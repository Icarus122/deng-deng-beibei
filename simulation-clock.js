const FAST_FRAME_MS = 22;
const SLOW_FRAME_MS = 28;
const SLOW_FRAMES_TO_FALLBACK = 45;
const FAST_FRAMES_TO_RECOVER = 180;

export function createSimulationClock() {
  return {
    accumulatorMs: 0,
    fastFrames: 0,
    slowFrames: 0,
    targetFps: 60,
  };
}

export function advanceSimulationClock(clock, elapsedMs) {
  const safeElapsedMs = Math.min(Math.max(elapsedMs, 0), 100);
  const next = { ...clock };

  if (safeElapsedMs > SLOW_FRAME_MS) {
    next.slowFrames += 1;
    next.fastFrames = 0;
  } else if (safeElapsedMs < FAST_FRAME_MS) {
    next.fastFrames += 1;
    next.slowFrames = 0;
  } else {
    next.fastFrames = 0;
    next.slowFrames = 0;
  }

  if (next.targetFps === 60 && next.slowFrames >= SLOW_FRAMES_TO_FALLBACK) {
    next.targetFps = 30;
    next.fastFrames = 0;
  }
  if (next.targetFps === 30 && next.fastFrames >= FAST_FRAMES_TO_RECOVER) {
    next.targetFps = 60;
    next.slowFrames = 0;
  }

  const stepMs = 1000 / next.targetFps;
  next.accumulatorMs += safeElapsedMs;
  const steps = Math.min(4, Math.floor((next.accumulatorMs + 0.001) / stepMs));
  next.accumulatorMs -= steps * stepMs;

  return { clock: next, steps, stepMs, targetFps: next.targetFps };
}
