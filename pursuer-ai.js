const CRUISE_SPEED = 136;
const EVADE_SPEED = 205;
const SLOWED_SPEED = 92;

export function createPursuer(startX) {
  return { x: startX, velocity: CRUISE_SPEED, facing: 1, mode: 'cruise', modeTimerMs: 0, evadeCooldownMs: 0 };
}

export function updatePursuer(pursuer, player, elapsedMs) {
  const stepMs = Math.min(elapsedMs, 50);
  const seconds = stepMs / 1000;
  const timer = Math.max(0, pursuer.modeTimerMs - stepMs);
  const cooldown = Math.max(0, pursuer.evadeCooldownMs - stepMs);
  const gap = pursuer.x - player.x;
  let mode = timer > 0 ? pursuer.mode : 'cruise';
  let modeTimerMs = timer;
  let evadeCooldownMs = cooldown;

  if (timer === 0 && pursuer.mode !== 'slowed' && pursuer.mode !== 'downed' && gap >= 80 && gap <= 190 && cooldown === 0) {
    mode = 'evade';
    modeTimerMs = 900;
    evadeCooldownMs = 2000;
  }

  const velocity = mode === 'evade' ? EVADE_SPEED : mode === 'slowed' ? SLOWED_SPEED : mode === 'downed' ? 0 : CRUISE_SPEED;
  return { ...pursuer, x: pursuer.x + velocity * seconds, velocity, facing: 1, mode, modeTimerMs, evadeCooldownMs };
}
