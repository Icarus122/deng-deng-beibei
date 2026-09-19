const CRUISE_SPEED = 136;
const EVADE_SPEED = 205;
const FINAL_CHASE_SPEED = 170;
const SLOWED_SPEED = 92;
const GROUND_Y = 478;
const GRAVITY = 1400;
const CRUISE_MS = 12000;
const EVADE_MS = 3000;
const RHYTHM_MS = CRUISE_MS + EVADE_MS;
const FINAL_WINDOW_PROGRESS = 0.85;

export function getPursuitRhythm(cycleElapsedMs, progress) {
  if (progress >= FINAL_WINDOW_PROGRESS) return 'finalChase';
  return cycleElapsedMs % RHYTHM_MS >= CRUISE_MS ? 'evade' : 'cruise';
}

export function createPursuer(startX) {
  return { x: startX, y: GROUND_Y, velocityY: 0, grounded: true, targetPlatformId: null, velocity: CRUISE_SPEED, facing: 1, mode: 'cruise', modeTimerMs: 0, evadeCooldownMs: 0, cycleElapsedMs: 0, distanceTravelled: 0, runDistanceTravelled: 0 };
}

export function updatePursuer(pursuer, player, elapsedMs, level = {}) {
  const stepMs = Math.min(elapsedMs, 50);
  const seconds = stepMs / 1000;
  const timer = Math.max(0, pursuer.modeTimerMs - stepMs);
  const cycleElapsedMs = (pursuer.cycleElapsedMs ?? 0) + stepMs;
  const progress = level.finishX ? player.x / level.finishX : 0;
  const rhythm = getPursuitRhythm(cycleElapsedMs, progress);
  let mode = timer > 0 && ['slowed', 'downed'].includes(pursuer.mode) ? pursuer.mode : rhythm;
  let modeTimerMs = timer > 0 && ['slowed', 'downed'].includes(pursuer.mode)
    ? timer
    : rhythm === 'evade' ? RHYTHM_MS - cycleElapsedMs % RHYTHM_MS : 0;
  // The rhythm is clock-driven, not proximity-driven: a player can learn when
  // Meng will burst instead of seeing an unexplained escape every time close.
  const velocity = mode === 'evade' ? EVADE_SPEED : mode === 'finalChase' ? FINAL_CHASE_SPEED : mode === 'slowed' ? SLOWED_SPEED : mode === 'downed' ? 0 : CRUISE_SPEED;
  const routeNode = level.shortcutNodes?.find((node) => node.route
    && (pursuer.targetRoute === node.route || (pursuer.x >= node.start && pursuer.x < node.end)));
  const startingRoute = Boolean(routeNode && !pursuer.targetRoute && pursuer.grounded);
  const currentPlatform = level.platforms?.find((item) => item.id === pursuer.targetPlatformId);
  const activeTargetPlatformId = currentPlatform && pursuer.x < currentPlatform.x + currentPlatform.width
    ? pursuer.targetPlatformId
    : null;
  const legacyShortcut = !routeNode && progress < 0.7 && pursuer.grounded && !activeTargetPlatformId
    ? level.shortcutNodes?.find((node) => node.platformId && pursuer.x >= node.start && pursuer.x <= node.end)
    : null;
  const routePlatform = routeNode
    ? level.platforms?.filter((item) => item.route === routeNode.route)
      .sort((a, b) => a.x - b.x)
      .find((item) => item.x + item.width > pursuer.x + velocity * seconds)
    : null;
  const targetPlatformId = routePlatform?.id ?? legacyShortcut?.platformId ?? activeTargetPlatformId;
  const startingShortcut = Boolean(startingRoute || legacyShortcut);

  const verticalVelocity = startingRoute ? -620 : legacyShortcut ? -500 : (pursuer.velocityY ?? 0) + GRAVITY * seconds;
  const previousBottom = (pursuer.y ?? GROUND_Y) + 32;
  let y = (pursuer.y ?? GROUND_Y) + verticalVelocity * seconds;
  let velocityY = verticalVelocity;
  let grounded = false;
  const platform = targetPlatformId ? level.platforms?.find((item) => item.id === targetPlatformId) : null;
  const canStepSlope = platform?.slope && pursuer.grounded && previousBottom >= platform.y && previousBottom - platform.y <= 6;
  if (platform && velocityY >= 0 && ((previousBottom <= platform.y && y + 32 >= platform.y) || canStepSlope) && pursuer.x + velocity * seconds + 24 > platform.x && pursuer.x + velocity * seconds < platform.x + platform.width) {
    y = platform.y - 32;
    velocityY = 0;
    grounded = true;
  } else if (y >= GROUND_Y) {
    y = GROUND_Y;
    velocityY = 0;
    grounded = true;
  }
  const nextX = pursuer.x + velocity * seconds;
  const runDistanceTravelled = (pursuer.runDistanceTravelled ?? 0)
    + (pursuer.grounded && grounded && mode !== 'downed' ? Math.abs(nextX - pursuer.x) : 0);
  return {
    ...pursuer,
    x: nextX,
    y,
    velocityY,
    grounded,
    targetPlatformId,
    targetRoute: routeNode && pursuer.x + velocity * seconds < routeNode.end ? routeNode.route : null,
    velocity,
    facing: 1,
    mode,
    modeTimerMs,
    evadeCooldownMs: 0,
    cycleElapsedMs,
    distanceTravelled: (pursuer.distanceTravelled ?? 0) + Math.abs(velocity * seconds),
    runDistanceTravelled,
  };
}
