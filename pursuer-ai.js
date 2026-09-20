import { findLandingPlatform } from './platform-physics.js';

const CRUISE_SPEED = 136;
const EVADE_SPEED = 205;
const FINAL_CHASE_SPEED = 170;
const SLOWED_SPEED = 92;
const GROUND_Y = 510;
const RUNNER_WIDTH = 24;
const RUNNER_HEIGHT = 32;
const GRAVITY = 1400;
const JUMP_SPEED = 690;
const CRUISE_MS = 12000;
const EVADE_MS = 3000;
const RHYTHM_MS = CRUISE_MS + EVADE_MS;
const FINAL_WINDOW_PROGRESS = 0.85;

export function getPursuitRhythm(cycleElapsedMs, progress) {
  if (progress >= FINAL_WINDOW_PROGRESS) return 'finalChase';
  return cycleElapsedMs % RHYTHM_MS >= CRUISE_MS ? 'evade' : 'cruise';
}

export function createPursuer(startX) {
  return {
    x: startX,
    y: GROUND_Y - RUNNER_HEIGHT,
    velocityY: 0,
    grounded: true,
    groundedPlatformId: null,
    targetPlatformId: null,
    targetRoute: null,
    velocity: CRUISE_SPEED,
    facing: 1,
    mode: 'cruise',
    modeTimerMs: 0,
    evadeCooldownMs: 0,
    cycleElapsedMs: 0,
    distanceTravelled: 0,
    runDistanceTravelled: 0,
  };
}

function getActiveSurface(pursuer, platforms) {
  return platforms.find((platform) => platform.id === pursuer.groundedPlatformId)
    ?? (pursuer.grounded ? platforms.find((platform) => platform.y === GROUND_Y
      && pursuer.x + RUNNER_WIDTH > platform.x
      && pursuer.x < platform.x + platform.width) : null);
}

function routeFor(pursuer, progress, level) {
  const routeNode = level.shortcutNodes?.find((node) => node.route
    && (pursuer.targetRoute === node.route || (pursuer.x >= node.start && pursuer.x < node.end)));
  if (routeNode) return { routeNode, legacyTarget: null };
  if (progress >= 0.7 || !pursuer.grounded) return { routeNode: null, legacyTarget: null };
  const legacyTarget = level.shortcutNodes?.find((node) => node.platformId
    && pursuer.x >= node.start && pursuer.x <= node.end);
  return { routeNode: null, legacyTarget };
}

export function updatePursuer(pursuer, player, elapsedMs, level = {}) {
  const stepMs = Math.min(elapsedMs, 50);
  const seconds = stepMs / 1000;
  const timer = Math.max(0, pursuer.modeTimerMs - stepMs);
  const cycleElapsedMs = (pursuer.cycleElapsedMs ?? 0) + stepMs;
  const progress = level.finishX ? player.x / level.finishX : 0;
  const rhythm = getPursuitRhythm(cycleElapsedMs, progress);
  const heldMode = timer > 0 && ['slowed', 'downed'].includes(pursuer.mode);
  const mode = heldMode ? pursuer.mode : rhythm;
  const modeTimerMs = heldMode ? timer : rhythm === 'evade' ? RHYTHM_MS - cycleElapsedMs % RHYTHM_MS : 0;
  const velocity = mode === 'evade' ? EVADE_SPEED
    : mode === 'finalChase' ? FINAL_CHASE_SPEED
      : mode === 'slowed' ? SLOWED_SPEED
        : mode === 'downed' ? 0 : CRUISE_SPEED;
  const platforms = level.platforms ?? [];
  const previousPlatforms = level.previousPlatforms ?? platforms;
  let x = pursuer.x;
  let y = pursuer.y ?? GROUND_Y - RUNNER_HEIGHT;
  let grounded = Boolean(pursuer.grounded);
  let groundedPlatformId = pursuer.groundedPlatformId ?? null;

  if (grounded && groundedPlatformId) {
    const previous = previousPlatforms.find((platform) => platform.id === groundedPlatformId);
    const current = platforms.find((platform) => platform.id === groundedPlatformId);
    if (previous && current) {
      x += current.x - previous.x;
      y += current.y - previous.y;
    } else if (previous) {
      grounded = false;
      groundedPlatformId = null;
    }
  }

  const routePursuer = { ...pursuer, x, y, grounded, groundedPlatformId };
  const { routeNode, legacyTarget } = routeFor(routePursuer, progress, level);
  const routePlatforms = routeNode
    ? platforms.filter((platform) => platform.route === routeNode.route).sort((a, b) => a.x - b.x)
    : [];
  const activeSurface = getActiveSurface(routePursuer, platforms);
  const targetSurface = routePlatforms.find((platform) => platform.id !== groundedPlatformId
    && platform.y <= (activeSurface?.y ?? GROUND_Y) + 1
    && platform.x + platform.width > x + RUNNER_WIDTH);
  const legacyPlatform = legacyTarget ? platforms.find((platform) => platform.id === legacyTarget.platformId) : null;
  const routeEntry = Boolean(routeNode && grounded && !activeSurface?.route
    && routePlatforms.some((platform) => platform.x <= x + RUNNER_WIDTH + 70
      && platform.x + platform.width > x));
  const nextRoutePlatform = targetSurface ?? (routeEntry
    ? routePlatforms.find((platform) => platform.x + platform.width > x + RUNNER_WIDTH)
    : legacyPlatform);

  let shouldJump = false;
  if (grounded && nextRoutePlatform) {
    const horizontalGap = nextRoutePlatform.x - (x + RUNNER_WIDTH);
    const rise = (activeSurface?.y ?? GROUND_Y) - nextRoutePlatform.y;
    const sameRoute = Boolean(activeSurface?.route && activeSurface.route === nextRoutePlatform.route);
    shouldJump = routeEntry
      || Boolean(legacyTarget)
      || (sameRoute && rise > 12 && horizontalGap <= 75 && horizontalGap >= -RUNNER_WIDTH)
      || (sameRoute && horizontalGap > 30 && horizontalGap <= 85);
  }

  if (grounded && activeSurface) {
    const nextGround = platforms.filter((platform) => platform.y === activeSurface.y
      && platform.x >= activeSurface.x + activeSurface.width)
      .sort((a, b) => a.x - b.x)[0];
    const gap = nextGround ? nextGround.x - (activeSurface.x + activeSurface.width) : Infinity;
    const distanceToEdge = activeSurface.x + activeSurface.width - (x + RUNNER_WIDTH);
    if (!activeSurface.route && gap > 24 && gap <= 170 && distanceToEdge <= 82 && distanceToEdge >= -RUNNER_WIDTH) shouldJump = true;
  }

  const damagingHazards = [...(level.hazards ?? []), ...(level.obstacles ?? [])].filter((hazard) => (
    ['spikes', 'blocker', 'patrol', 'constructionBox', 'bookbag', 'barrier'].includes(hazard.type)
    && (hazard.warning !== true)
  ));
  if (grounded && damagingHazards.some((hazard) => {
    const isOnPath = hazard.y + hazard.height > y && hazard.y < y + RUNNER_HEIGHT;
    const distanceAhead = hazard.x - (x + RUNNER_WIDTH);
    return isOnPath && distanceAhead >= -RUNNER_WIDTH && distanceAhead <= 78;
  })) shouldJump = true;

  let velocityY = pursuer.velocityY ?? 0;
  if (mode === 'downed') {
    velocityY = 0;
  } else if (grounded && shouldJump) {
    velocityY = -JUMP_SPEED;
    grounded = false;
    groundedPlatformId = null;
  }

  const previousBottom = y + RUNNER_HEIGHT;
  if (!grounded) {
    velocityY += GRAVITY * seconds;
    y += velocityY * seconds;
  }
  const nextX = x + velocity * seconds;
  if (!grounded) {
    const landing = findLandingPlatform({
      x: nextX,
      y,
      width: RUNNER_WIDTH,
      height: RUNNER_HEIGHT,
      velocityY,
      grounded: false,
    }, platforms, previousBottom);
    if (landing) {
      y = landing.y - RUNNER_HEIGHT;
      velocityY = 0;
      grounded = true;
      groundedPlatformId = landing.id;
    }
  }
  if (y > GROUND_Y - RUNNER_HEIGHT && level.platforms === undefined) {
    y = GROUND_Y - RUNNER_HEIGHT;
    velocityY = 0;
    grounded = true;
    groundedPlatformId = null;
  }
  if (y > GROUND_Y + 160) {
    y = GROUND_Y - RUNNER_HEIGHT;
    velocityY = 0;
    grounded = true;
    groundedPlatformId = null;
  }

  const runDistanceTravelled = (pursuer.runDistanceTravelled ?? 0)
    + (pursuer.grounded && grounded && mode !== 'downed' ? Math.abs(nextX - pursuer.x) : 0);
  return {
    ...pursuer,
    x: nextX,
    y,
    velocityY,
    grounded,
    groundedPlatformId,
    targetPlatformId: nextRoutePlatform?.id ?? groundedPlatformId,
    targetRoute: routeNode && nextX < routeNode.end ? routeNode.route : null,
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
