const TAUNT_DURATION_MS = 1200;

export function createTaunt(text, elapsedMs) {
  return { text, expiresAtMs: elapsedMs + TAUNT_DURATION_MS };
}

export function isTauntActive(taunt, elapsedMs) {
  return Boolean(taunt) && elapsedMs < taunt.expiresAtMs;
}
