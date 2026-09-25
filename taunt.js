const TAUNT_DURATION_MS = 1200;
const TAUNT_COOLDOWN_MS = 12000;
const MODE_STABLE_MS = 900;
const REACTION_MODES = new Set(['evade', 'slowed', 'downed', 'finalChase']);

export function createTauntTracker() {
  return { lastShownAtMs: -Infinity, shownKeys: [], observedMode: null, modeSinceMs: 0 };
}

export function advanceTauntCue(tracker, { elapsedMs, regionId, mode }) {
  const modeSinceMs = tracker.observedMode === mode ? tracker.modeSinceMs : elapsedMs;
  const next = { ...tracker, observedMode: mode, modeSinceMs };
  if (!regionId || elapsedMs - tracker.lastShownAtMs < TAUNT_COOLDOWN_MS) {
    return { tracker: next, cue: null };
  }
  const entryKey = `${regionId}:cruise`;
  const reactionKey = `${regionId}:${mode}`;
  const entryDue = !tracker.shownKeys.includes(entryKey);
  const reactionDue = REACTION_MODES.has(mode)
    && elapsedMs - modeSinceMs >= MODE_STABLE_MS
    && !tracker.shownKeys.includes(reactionKey);
  const cueMode = entryDue ? 'cruise' : reactionDue ? mode : null;
  if (!cueMode) return { tracker: next, cue: null };
  return {
    tracker: {
      ...next,
      lastShownAtMs: elapsedMs,
      shownKeys: [...tracker.shownKeys, `${regionId}:${cueMode}`],
    },
    cue: { regionId, mode: cueMode },
  };
}

export function createTaunt(text, elapsedMs) {
  return { text, expiresAtMs: elapsedMs + TAUNT_DURATION_MS };
}

export function isTauntActive(taunt, elapsedMs) {
  return Boolean(taunt) && elapsedMs < taunt.expiresAtMs;
}
