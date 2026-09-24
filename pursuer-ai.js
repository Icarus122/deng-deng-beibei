import { findLandingPlatform } from './platform-physics.js';

const CRUISE_SPEED = 136;
const EVADE_SPEED = 205;
const FINAL_CHASE_SPEED = 132;
const SLOWED_SPEED = 92;
const GROUND_Y = 510;
const RUNNER_WIDTH = 24;
const RUNNER_HEIGHT = 32;
const GRAVITY = 1400;
const JUMP_SPEED = 560;
const DOUBLE_JUMP_SPEED = 450;
const ROUTE_HOP_SPEED = 420;
const SHORT_GAP_JUMP_SPEED = 450;
const HAZARD_JUMP_SPEED = 450;
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
    dropThroughGroup: null,
    distanceTravelled: 0,
    runDistanceTravelled: 0,
  };
}

function getActiveSurface(pursuer, platforms) {
  if (!pursuer.grounded) return null;
  const supports = (platform) => pursuer.x + RUNNER_WIDTH > platform.x
    && pursuer.x < platform.x + platform.width
    && Math.abs(pursuer.y + RUNNER_HEIGHT - platform.y) <= 3;
  const current = platforms.find((platform) => platform.id === pursuer.groundedPlatformId);
  if (current && supports(current)) return current;
  return platforms.find(supports) ?? null;
}

function landingTime(startY, targetY, jumpSpeed = JUMP_SPEED) {
  const discriminant = jumpSpeed ** 2 + 2 * GRAVITY * (targetY - startY);
  if (discriminant < 0) return null;
  return (jumpSpeed + Math.sqrt(discriminant)) / GRAVITY;
}

function singleJumpReach(startY, targetY, speed, jumpSpeed = JUMP_SPEED, safetyPx = JUMP_SAFETY_PX) {
  const airtime = landingTime(startY, targetY, jumpSpeed);
  return airtime === null ? -Infinity : speed * airtime - safetyPx;
}

function getJumpPlan(startY, targetY, horizontalDistance, speed, jumpSpeed = JUMP_SPEED, safetyPx = JUMP_SAFETY_PX) {
  if (horizontalDistance <= singleJumpReach(startY, targetY, speed, jumpSpeed, safetyPx)) {
    return { double: false };
  }

  const apexY = startY - jumpSpeed ** 2 / (2 * GRAVITY);
  const secondTime = landingTime(apexY, targetY, DOUBLE_JUMP_SPEED);
  if (secondTime === null) return null;
  const doubleReach = speed * (jumpSpeed / GRAVITY + secondTime);
  return horizontalDistance <= doubleReach - safetyPx ? { double: true } : null;
}

function canLandOnRoutePlatform(x, startY, platform, speed) {
  const horizontalGap = Math.max(0, platform.x - (x + RUNNER_WIDTH));
  const jumpSpeed = startY - platform.y <= 12 ? ROUTE_HOP_SPEED : JUMP_SPEED;
  const plan = getJumpPlan(startY, platform.y, horizontalGap, speed, jumpSpeed);
  if (!plan || plan.double) return false;
  const flightTime = landingTime(startY, platform.y, jumpSpeed);
  if (flightTime === null) return false;
  const landingX = x + speed * flightTime;
  return landingX + RUNNER_WIDTH > platform.x + 4
    && landingX < platform.x + platform.width - 4;
}

function canLandAfterShortJump(x, surface, speed, platforms, jumpSpeed) {
  const airtime = landingTime(surface.y, surface.y, jumpSpeed);
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
  const gap = pursuer.x - player.x;
  const proximityEscape = progress < FINAL_WINDOW_PROGRESS && gap < 220;
  const mode = proximityEscape ? 'evade' : heldMode ? pursuer.mode : rhythm;
  const modeTimerMs = proximityEscape ? 0 : heldMode ? timer : rhythm === 'evade' ? RHYTHM_MS - cycleElapsedMs % RHYTHM_MS : 0;
  const baseVelocity = mode === 'evade' ? EVADE_SPEED
    : mode === 'finalChase' ? FINAL_CHASE_SPEED
      : mode === 'slowed' ? SLOWED_SPEED
        : mode === 'downed' ? 0 : CRUISE_SPEED;
  // Before the catch window Meng visibly pulls ahead instead of being moved
  // forward by a post-update clamp. The lead can still be cut with a ball.
  const velocity = proximityEscape
    ? Math.max(baseVelocity, 265)
    : baseVelocity;
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
  let dropThroughGroup = pursuer.dropThroughGroup ?? null;

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

  let activeSurface = getActiveSurface({ x, y, grounded, groundedPlatformId }, platforms);
  const hasGroundPlane = platforms.some((platform) => platform.y === GROUND_Y);
  if (grounded && !activeSurface && hasGroundPlane) {
    grounded = false;
    groundedPlatformId = null;
  } else if (activeSurface) {
    groundedPlatformId = activeSurface.id;
  }
  const routePursuer = { ...pursuer, x, y, grounded, groundedPlatformId };
  const { routeNode, legacyTarget } = routeFor(routePursuer, progress, level);
  const routePlatforms = routeNode
    ? platforms.filter((platform) => platform.route === routeNode.route).sort((a, b) => a.x - b.x)
    : [];
  const supportY = activeSurface?.y ?? GROUND_Y;
  const routeEdgeDistance = activeSurface && routeNode
    ? activeSurface.x + activeSurface.width - (x + RUNNER_WIDTH)
    : Infinity;
  const lowerExitSurface = activeSurface?.route && routeNode
    ? routePlatforms.filter((platform) => platform.y > activeSurface.y + 1
      && platform.x < x + RUNNER_WIDTH
      && platform.x + platform.width > x)
      .sort((a, b) => a.y - b.y)[0]
    : null;
  const lowerExitFallTime = lowerExitSurface
    ? Math.sqrt(2 * (lowerExitSurface.y - activeSurface.y) / GRAVITY)
    : 0;
  const lowerExitLandingX = x + velocity * lowerExitFallTime;
  const lowerExitLandingFits = lowerExitSurface
    && lowerExitLandingX + RUNNER_WIDTH > lowerExitSurface.x + 8
    && lowerExitLandingX < lowerExitSurface.x + lowerExitSurface.width - 8;
  const shouldDropToLower = mode !== 'downed'
    && grounded
    && routeNode
    && activeSurface?.route === routeNode.route
    && routeNode.end - (activeSurface.x + activeSurface.width) <= 40
    && routeEdgeDistance <= 90
    && routeEdgeDistance >= 0
    && lowerExitLandingFits;
  const routeCandidates = routePlatforms.filter((platform) => platform.id !== groundedPlatformId
    && platform.y <= supportY + 1
    && platform.x + platform.width > x + RUNNER_WIDTH);
  const singleReachableRoute = routeCandidates.find((platform) => {
    const gap = Math.max(0, platform.x - (x + RUNNER_WIDTH));
    const jumpSpeed = supportY - platform.y <= 12 ? ROUTE_HOP_SPEED : JUMP_SPEED;
    return getJumpPlan(supportY, platform.y, gap, planningSpeed, jumpSpeed)?.double === false
      && canLandOnRoutePlatform(x, supportY, platform, planningSpeed);
  });
  const sameHeightRoute = routeCandidates.find((platform) => platform.y === supportY
    && canLandOnRoutePlatform(x, supportY, platform, planningSpeed));
  const reachableRoute = routeCandidates.find((platform) => canLandOnRoutePlatform(x, supportY, platform, planningSpeed));
  const targetSurface = singleReachableRoute ?? sameHeightRoute ?? reachableRoute ?? null;
  const legacyPlatform = legacyTarget ? platforms.find((platform) => platform.id === legacyTarget.platformId) : null;
  const routeEntry = Boolean(routeNode && grounded && !activeSurface?.route
    && routePlatforms.some((platform) => platform.x <= x + RUNNER_WIDTH + 70
      && platform.x + platform.width > x));
  const nextRoutePlatform = targetSurface ?? (routeEntry
    ? routePlatforms.find((platform) => platform.x + platform.width > x + RUNNER_WIDTH)
    : legacyPlatform);

  let shouldJump = false;
  let shouldDoubleJump = false;
  let jumpSpeed = JUMP_SPEED;
  if (grounded && nextRoutePlatform) {
    const horizontalGap = Math.max(0, nextRoutePlatform.x - (x + RUNNER_WIDTH));
    const rise = (activeSurface?.y ?? GROUND_Y) - nextRoutePlatform.y;
    const sameRoute = Boolean(activeSurface?.route && activeSurface.route === nextRoutePlatform.route);
    const plannedJumpSpeed = sameRoute && rise <= 12 ? ROUTE_HOP_SPEED : JUMP_SPEED;
    const wantsRouteJump = routeEntry || Boolean(legacyTarget)
      || (sameRoute && (rise > 12 || horizontalGap > RUNNER_WIDTH));
    const plan = getJumpPlan(activeSurface?.y ?? GROUND_Y, nextRoutePlatform.y, horizontalGap, planningSpeed, plannedJumpSpeed);
    if (wantsRouteJump && plan && !plan.double) {
      shouldJump = true;
      jumpSpeed = plannedJumpSpeed;
    }
  }

  if (grounded && activeSurface) {
    const nextGround = platforms.filter((platform) => platform.y === activeSurface.y
      && platform.x >= activeSurface.x + activeSurface.width)
      .sort((a, b) => a.x - b.x)[0];
    const gap = nextGround ? nextGround.x - (activeSurface.x + activeSurface.width) : Infinity;
    const distanceToEdge = activeSurface.x + activeSurface.width - (x + RUNNER_WIDTH);
    const distanceToNext = nextGround ? Math.max(0, nextGround.x - (x + RUNNER_WIDTH)) : Infinity;
    const gapJumpSpeed = gap <= 80 ? SHORT_GAP_JUMP_SPEED : JUMP_SPEED;
    const jumpSafety = gap <= 80 ? 4 : JUMP_SAFETY_PX;
    const gapPlan = nextGround && gap > 6
      ? getJumpPlan(activeSurface.y, nextGround.y, distanceToNext, planningSpeed, gapJumpSpeed, jumpSafety)
      : null;
    if (!activeSurface.route && gapPlan && distanceToEdge <= 260 && distanceToEdge >= -RUNNER_WIDTH) {
      shouldJump = true;
      shouldDoubleJump = gapPlan.double;
      jumpSpeed = gapPlan.double ? JUMP_SPEED : gapJumpSpeed;
    }
  }

  const damagingHazards = [...(level.hazards ?? []), ...(level.obstacles ?? [])].filter((hazard) => (
    ['spikes', 'blocker', 'patrol', 'constructionBox', 'bookbag', 'barrier'].includes(hazard.type)
    && (hazard.warning !== true)
  ));
  if (grounded && activeSurface && canLandAfterShortJump(x, activeSurface, velocity, platforms, HAZARD_JUMP_SPEED)
    && damagingHazards.some((hazard) => {
    const isOnPath = hazard.y + hazard.height > y && hazard.y < y + RUNNER_HEIGHT;
    const distanceAhead = hazard.x - (x + RUNNER_WIDTH);
    return isOnPath && distanceAhead >= -RUNNER_WIDTH && distanceAhead <= 78;
  })) {
    shouldJump = true;
    shouldDoubleJump = false;
    jumpSpeed = HAZARD_JUMP_SPEED;
  }

  let velocityY = pursuer.velocityY ?? 0;
  let ignoredOneWayGroup = dropThroughGroup;
  if (mode === 'downed') {
    velocityY = 0;
  } else if (grounded && shouldDropToLower) {
    grounded = false;
    groundedPlatformId = null;
    dropThroughGroup = activeSurface.oneWayGroup ?? activeSurface.id;
    ignoredOneWayGroup = dropThroughGroup;
  } else if (grounded && shouldJump) {
    velocityY = -jumpSpeed;
    grounded = false;
    groundedPlatformId = null;
    jumpsUsed = 1;
    doubleJumpQueued = shouldDoubleJump;
  } else if (!grounded && doubleJumpQueued && velocityY >= -24) {
    velocityY = -DOUBLE_JUMP_SPEED;
    jumpsUsed = 2;
    doubleJumpQueued = false;
  }

  const nextX = x + velocity * seconds;
  if (grounded) {
    const nextSupport = getActiveSurface({ x: nextX, y, grounded: true, groundedPlatformId }, platforms);
    if (nextSupport) groundedPlatformId = nextSupport.id;
    else if (activeSurface || hasGroundPlane) {
      grounded = false;
      groundedPlatformId = null;
    }
  }

  const previousBottom = previousCharacter.y + RUNNER_HEIGHT;
  const previousMotionCharacter = { ...previousCharacter };
  const previousMotionPlatforms = previousPlatforms;
  if (!grounded) {
    velocityY += GRAVITY * seconds;
    y += velocityY * seconds;
  }
  if (!grounded) {
    const landing = findLandingPlatform({
      x: nextX,
      y,
      width: RUNNER_WIDTH,
      height: RUNNER_HEIGHT,
      velocityY,
      grounded: false,
    }, platforms, previousBottom, ignoredOneWayGroup, previousMotionCharacter, previousMotionPlatforms);
    if (landing) {
      y = landing.y - RUNNER_HEIGHT;
      velocityY = 0;
      const landedSurface = getActiveSurface({
        x: nextX,
        y,
        grounded: true,
        groundedPlatformId: landing.id,
      }, platforms);
      grounded = Boolean(landedSurface);
      groundedPlatformId = landedSurface?.id ?? null;
      if (grounded) {
        jumpsUsed = 0;
        doubleJumpQueued = false;
        dropThroughGroup = null;
      }
    }
  }
  if (!grounded && dropThroughGroup) {
    const ignoredSurface = platforms.find((platform) => (platform.oneWayGroup ?? platform.id) === dropThroughGroup);
    if (!ignoredSurface || y + RUNNER_HEIGHT > ignoredSurface.y + 3) dropThroughGroup = null;
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
    jumpsUsed = 0;
    doubleJumpQueued = false;
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
    dropThroughGroup,
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
