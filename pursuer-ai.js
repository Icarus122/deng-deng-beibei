const CRUISE_SPEED = 136;
const EVADE_SPEED = 205;
const SLOWED_SPEED = 92;
const GROUND_Y = 478;
const GRAVITY = 1400;

export function createPursuer(startX) {
  return { x: startX, y: GROUND_Y, velocityY: 0, grounded: true, targetPlatformId: null, velocity: CRUISE_SPEED, facing: 1, mode: 'cruise', modeTimerMs: 0, evadeCooldownMs: 0, distanceTravelled: 0 };
}

export function updatePursuer(pursuer, player, elapsedMs, level = {}) {
  const stepMs = Math.min(elapsedMs, 50);
  const seconds = stepMs / 1000;
  const timer = Math.max(0, pursuer.modeTimerMs - stepMs);
  const cooldown = Math.max(0, pursuer.evadeCooldownMs - stepMs);
  const gap = pursuer.x - player.x;
  let mode = timer > 0 ? pursuer.mode : 'cruise';
  let modeTimerMs = timer;
  let evadeCooldownMs = cooldown;
  const progress = level.finishX ? player.x / level.finishX : 0;
  const currentPlatform = level.platforms?.find((item) => item.id === pursuer.targetPlatformId);
  const activeTargetPlatformId = currentPlatform && pursuer.x < currentPlatform.x + currentPlatform.width
    ? pursuer.targetPlatformId
    : null;
  const shortcut = progress < 0.7 && pursuer.grounded && !activeTargetPlatformId
    ? level.shortcutNodes?.find((node) => pursuer.x >= node.start && pursuer.x <= node.end)
    : null;
  const targetPlatformId = shortcut?.platformId ?? activeTargetPlatformId;
  const startingShortcut = Boolean(shortcut);

  // Meng only uses his brief escape burst before the final bridge stretch.
  // From 85% onward, the chase is intentionally skill-based: he can be caught.
  if (progress < 0.85 && timer === 0 && pursuer.mode !== 'slowed' && pursuer.mode !== 'downed' && gap >= 80 && gap <= 190 && cooldown === 0) {
    mode = 'evade';
    modeTimerMs = 900;
    evadeCooldownMs = 2000;
  }

  const velocity = mode === 'evade' ? EVADE_SPEED : mode === 'slowed' ? SLOWED_SPEED : mode === 'downed' ? 0 : CRUISE_SPEED;
  const verticalVelocity = startingShortcut ? -500 : (pursuer.velocityY ?? 0) + GRAVITY * seconds;
  const previousBottom = (pursuer.y ?? GROUND_Y) + 32;
  let y = (pursuer.y ?? GROUND_Y) + verticalVelocity * seconds;
  let velocityY = verticalVelocity;
  let grounded = false;
  const platform = targetPlatformId ? level.platforms?.find((item) => item.id === targetPlatformId) : null;
  if (platform && velocityY >= 0 && previousBottom <= platform.y && y + 32 >= platform.y && pursuer.x + velocity * seconds + 24 > platform.x && pursuer.x + velocity * seconds < platform.x + platform.width) {
    y = platform.y - 32;
    velocityY = 0;
    grounded = true;
  } else if (y >= GROUND_Y) {
    y = GROUND_Y;
    velocityY = 0;
    grounded = true;
  }
  return {
    ...pursuer,
    x: pursuer.x + velocity * seconds,
    y,
    velocityY,
    grounded,
    targetPlatformId,
    velocity,
    facing: 1,
    mode,
    modeTimerMs,
    evadeCooldownMs,
    distanceTravelled: (pursuer.distanceTravelled ?? 0) + Math.abs(velocity * seconds),
  };
}
