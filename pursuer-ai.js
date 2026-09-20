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
const JUMP_SAFETY_PX = 12;

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
    jumpsUsed: 0,
    doubleJumpQueued: false,
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

function landingTime(startY, targetY) {
  const discriminant = JUMP_SPEED ** 2 + 2 * GRAVITY * (targetY - startY);
  if (discriminant < 0) return null;
  return (JUMP_SPEED + Math.sqrt(discriminant)) / GRAVITY;
}

function getJumpPlan(startY, targetY, horizontalDistance, speed) {
  const singleTime = landingTime(startY, targetY);
  if (singleTime !== null && horizontalDistance <= speed * singleTime - JUMP_SAFETY_PX) {
    return { double: false };
  }

  const apexY = startY - JUMP_SPEED ** 2 / (2 * GRAVITY);
  const secondTime = landingTime(apexY, targetY);
  if (secondTime === null) return null;
  const doubleReach = speed * (JUMP_SPEED / GRAVITY + secondTime);
  return horizontalDistance <= doubleReach - JUMP_SAFETY_PX ? { double: true } : null;
}

function canLandAfterShortJump(x, surface, speed, platforms) {
  const airtime = landingTime(surface.y, surface.y);
  if (airtime === null) return false;
  const landingX = x + speed * airtime;
  return platforms.some((platform) => platform.y === surface.y
    && landingX + RUNNER_WIDTH > platform.x
    && landingX < platform.x + platform.width);
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
  const planningSpeed = Math.min(velocity, CRUISE_SPEED);
  const platforms = level.platforms ?? [];
  const previousPlatforms = level.previousPlatforms ?? platforms;
  const previousCharacter = {
    x: pursuer.x,
    y: pursuer.y ?? GROUND_Y - RUNNER_HEIGHT,
    width: RUNNER_WIDTH,
    height: RUNNER_HEIGHT,
  };
  let x = pursuer.x;
  let y = pursuer.y ?? GROUND_Y - RUNNER_HEIGHT;
  let grounded = Boolean(pursuer.grounded);
  let groundedPlatformId = pursuer.groundedPlatformId ?? null;
  let jumpsUsed = pursuer.jumpsUsed ?? 0;
  let doubleJumpQueued = Boolean(pursuer.doubleJumpQueued);

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
  let shouldDoubleJump = false;
  if (grounded && nextRoutePlatform) {
    const horizontalGap = Math.max(0, nextRoutePlatform.x - (x + RUNNER_WIDTH));
    const rise = (activeSurface?.y ?? GROUND_Y) - nextRoutePlatform.y;
    const sameRoute = Boolean(activeSurface?.route && activeSurface.route === nextRoutePlatform.route);
    const wantsRouteJump = routeEntry || Boolean(legacyTarget)
      || (sameRoute && (rise > 12 || (horizontalGap > 30 && horizontalGap <= 85)));
    const plan = getJumpPlan(activeSurface?.y ?? GROUND_Y, nextRoutePlatform.y, horizontalGap, planningSpeed);
    if (wantsRouteJump && plan) {
      shouldJump = true;
      shouldDoubleJump = plan.double;
    }
  }

  if (grounded && activeSurface) {
    const nextGround = platforms.filter((platform) => platform.y === activeSurface.y
      && platform.x >= activeSurface.x + activeSurface.width)
      .sort((a, b) => a.x - b.x)[0];
    const gap = nextGround ? nextGround.x - (activeSurface.x + activeSurface.width) : Infinity;
    const distanceToEdge = activeSurface.x + activeSurface.width - (x + RUNNER_WIDTH);
    const distanceToNext = nextGround ? Math.max(0, nextGround.x - (x + RUNNER_WIDTH)) : Infinity;
    const gapPlan = nextGround && gap > 6
      ? getJumpPlan(activeSurface.y, nextGround.y, distanceToNext, planningSpeed)
      : null;
    if (!activeSurface.route && gapPlan && distanceToEdge <= 260 && distanceToEdge >= -RUNNER_WIDTH) {
      shouldJump = true;
      shouldDoubleJump = gapPlan.double;
    }
  }

  const damagingHazards = [...(level.hazards ?? []), ...(level.obstacles ?? [])].filter((hazard) => (
    ['spikes', 'blocker', 'patrol', 'constructionBox', 'bookbag', 'barrier'].includes(hazard.type)
    && (hazard.warning !== true)
  ));
  if (grounded && activeSurface && canLandAfterShortJump(x, activeSurface, velocity, platforms)
    && damagingHazards.some((hazard) => {
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
    jumpsUsed = 1;
    doubleJumpQueued = shouldDoubleJump;
  } else if (!grounded && doubleJumpQueued && velocityY >= -24) {
    velocityY = -JUMP_SPEED;
    jumpsUsed = 2;
    doubleJumpQueued = false;
  }

  const previousBottom = previousCharacter.y + RUNNER_HEIGHT;
  const previousMotionCharacter = { ...previousCharacter };
  const previousMotionPlatforms = previousPlatforms;
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
    }, platforms, previousBottom, null, previousMotionCharacter, previousMotionPlatforms);
    if (landing) {
      y = landing.y - RUNNER_HEIGHT;
      velocityY = 0;
      grounded = true;
      groundedPlatformId = landing.id;
      jumpsUsed = 0;
      doubleJumpQueued = false;
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
    jumpsUsed,
    doubleJumpQueued,
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
