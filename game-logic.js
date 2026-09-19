import { overlaps } from './entities.js';
import { getDynamicHazards, isCollapseGone, resolveHazardContact } from './hazard-logic.js';
import { JOURNEY } from './level-data.js';
import { createPursuer, updatePursuer } from './pursuer-ai.js';

const PLAYER_WIDTH = 24;
const PLAYER_HEIGHT = 32;
const GROUND_Y = 510;
const SAFE_CHASE_GAP = 100;
// Rendered bodies are 60px wide.  A catch must now look like a real tap,
// rather than succeeding with a character-sized empty gap between them.
const CATCH_CONTACT_GAP = 56;
const CATCH_WINDOW_PROGRESS = 0.98;
const FINAL_APPROACH_GAP = 100;
const GRAVITY = 1400;
const FALL_GRAVITY = 1750;
const JUMP_SPEED = 580;
const FALL_Y = 640;
const COYOTE_TIME_MS = 100;
const JUMP_BUFFER_MS = 120;
const SHORT_JUMP_FACTOR = 0.45;
const HIT_STOP_MS = 50;
const LAND_SQUASH_MS = 120;
const DUST_MS = 180;
const IMPACT_SHAKE_MS = 90;

export const LEVELS = { 1: JOURNEY };

function clonePlayer(player) {
  return { ...player };
}

function movingPlatform(platform, elapsedMs) {
  if (!platform.motion) return platform;
  const wave = Math.sin((elapsedMs / platform.motion.period) * Math.PI * 2) * platform.motion.range;
  return {
    ...platform,
    x: platform.motion.axis === 'x' ? platform.x + wave : platform.x,
    y: platform.motion.axis === 'y' ? platform.y + wave : platform.y,
  };
}

function placeOnSurface(player, platforms, previousBottom) {
  const bottom = player.y + player.height;
  const surfaces = platforms.filter((platform) => {
    const coversPlayer = player.x + player.width > platform.x && player.x < platform.x + platform.width;
    const crossedTop = previousBottom <= platform.y && bottom >= platform.y;
    const canStepSlope = platform.slope && player.grounded && previousBottom >= platform.y && previousBottom - platform.y <= 6;
    return coversPlayer && (crossedTop || canStepSlope) && player.velocityY >= 0;
  }).sort((a, b) => a.y - b.y);
  if (surfaces.length > 0) {
    const platform = surfaces[0];
    return { ...player, y: platform.y - player.height, velocityY: 0, jumpsUsed: 0, grounded: true };
  }
  return { ...player, grounded: false };
}

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}

export function createGame(levelId) {
  const level = LEVELS[levelId];
  if (!level) throw new Error(`Unknown level ${levelId}`);
  const initialDistance = level.finishX ? 260 : 180;
  const player = {
    x: 70,
    y: GROUND_Y - PLAYER_HEIGHT,
    width: PLAYER_WIDTH,
    height: PLAYER_HEIGHT,
    velocityY: 0,
    grounded: true,
    jumpsUsed: 0,
    facing: 1,
    distanceTravelled: 0,
    coyoteTimerMs: COYOTE_TIME_MS,
    jumpBufferMs: 0,
    landTimerMs: 0,
    dustTimerMs: 0,
  };
  return {
    levelId,
    phase: 'playing',
    player,
    initialDistance,
    distance: initialDistance,
    maxDistance: level.maxDistance,
    pursuer: createPursuer(player.x + initialDistance),
    checkpointX: 70,
    energyTimerMs: 0,
    energyMeter: 0,
    collectedEnergyIds: [],
    collectedObstacleIds: [],
    mistakes: 0,
    basketball: null,
    coins: 0,
    collectedCoinIds: [],
    elapsedMs: 0,
    hitCooldownMs: 0,
    hazardHitCooldownMs: 0,
    hazardSlowTimerMs: 0,
    platformBoostTimerMs: 0,
    speedPadTimerMs: 0,
    hitStopMs: 0,
    shakeTimerMs: 0,
    impactTimerMs: 0,
    finalWindowOpened: false,
    collapseStarts: {},
    hazards: getDynamicHazards(level, 0, {}),
    event: 'none',
  };
}

export function resetLevel(levelId) {
  return createGame(levelId);
}

export function getPursuerRenderState(pursuer) {
  return { ...pursuer, y: pursuer.y ?? GROUND_Y - PLAYER_HEIGHT, grounded: pursuer.grounded ?? true };
}

export function getPursuerTaunt(progress, mode = 'cruise') {
  if (mode === 'evade') return '孟培杰：三秒爆发，跟得上吗？';
  if (mode === 'finalChase') return '孟培杰：天桥尽头见！';
  if (progress < 0.3) return '孟培杰：等等？你也太慢啦！';
  if (progress < 0.7) return '孟培杰：前面有惊喜方块，敢不敢顶？';
  return '孟培杰：快追上了？那就来呀！';
}

export function getRenderPlatforms(levelId, elapsedMs, collapseStarts = {}) {
  return LEVELS[levelId].platforms
    .filter((platform) => !platform.collapse || !isCollapseGone(platform.id, elapsedMs, collapseStarts))
    .map((platform) => movingPlatform(platform, elapsedMs));
}

export function updateGame(state, input, elapsedMs, { random = Math.random } = {}) {
  if (state.phase !== 'playing') return state;

  const level = LEVELS[state.levelId];
  const stepMs = clamp(elapsedMs, 0, 50);
  if ((state.hitStopMs ?? 0) > 0) {
    return {
      ...state,
      elapsedMs: state.elapsedMs + stepMs,
      event: 'none',
      hitStopMs: Math.max(0, state.hitStopMs - stepMs),
      shakeTimerMs: Math.max(0, (state.shakeTimerMs ?? 0) - stepMs),
      impactTimerMs: Math.max(0, (state.impactTimerMs ?? 0) - stepMs),
      player: {
        ...state.player,
        landTimerMs: Math.max(0, (state.player.landTimerMs ?? 0) - stepMs),
        dustTimerMs: Math.max(0, (state.player.dustTimerMs ?? 0) - stepMs),
      },
    };
  }
  const seconds = stepMs / 1000;
  const nextElapsedMs = state.elapsedMs + stepMs;
  const collapseStarts = { ...(state.collapseStarts ?? {}) };
  const platforms = getRenderPlatforms(state.levelId, nextElapsedMs, collapseStarts);
  let hazards = getDynamicHazards(level, nextElapsedMs, collapseStarts);
  const player = clonePlayer(state.player);
  let pursuer = state.pursuer ? { ...state.pursuer } : createPursuer(state.player.x + state.initialDistance);
  let mistakes = state.mistakes ?? 0;
  let basketball = state.basketball ? { ...state.basketball } : null;
  let coins = state.coins ?? 0;
  const collectedObstacle = new Set(state.collectedObstacleIds ?? []);
  const collectedCoins = new Set(state.collectedCoinIds ?? []);
  player.slipTimerMs = Math.max(0, (player.slipTimerMs ?? 0) - stepMs);
  let energyTimerMs = Math.max(0, state.energyTimerMs - stepMs);
  let energyMeter = clamp(state.energyMeter ?? 0, 0, 100);
  let hitCooldownMs = Math.max(0, state.hitCooldownMs - stepMs);
  let hazardHitCooldownMs = Math.max(0, (state.hazardHitCooldownMs ?? 0) - stepMs);
  let hazardSlowTimerMs = Math.max(0, (state.hazardSlowTimerMs ?? 0) - stepMs);
  let platformBoostTimerMs = Math.max(0, (state.platformBoostTimerMs ?? 0) - stepMs);
  let speedPadTimerMs = Math.max(0, (state.speedPadTimerMs ?? 0) - stepMs);
  let windTimerMs = Math.max(0, (state.windTimerMs ?? 0) - stepMs);
  let hitStopMs = 0;
  let shakeTimerMs = Math.max(0, (state.shakeTimerMs ?? 0) - stepMs);
  let impactTimerMs = Math.max(0, (state.impactTimerMs ?? 0) - stepMs);
  let event = 'none';

  const wasGrounded = player.grounded;
  let coyoteTimerMs = player.grounded
    ? COYOTE_TIME_MS
    : Math.max(0, (player.coyoteTimerMs ?? 0) - stepMs);
  let jumpBufferMs = Math.max(0, (player.jumpBufferMs ?? 0) - stepMs);
  player.landTimerMs = Math.max(0, (player.landTimerMs ?? 0) - stepMs);
  player.dustTimerMs = Math.max(0, (player.dustTimerMs ?? 0) - stepMs);
  if (input.jumpPressed) jumpBufferMs = JUMP_BUFFER_MS;
  if (input.jumpReleased && player.velocityY < 0) player.velocityY *= SHORT_JUMP_FACTOR;

  const consumeBufferedJump = () => {
    if (jumpBufferMs === 0 || player.slipTimerMs > 0) return false;
    if (!player.grounded && coyoteTimerMs === 0 && player.jumpsUsed >= 2) return false;
    player.velocityY = -JUMP_SPEED;
    player.grounded = false;
    player.jumpsUsed += 1;
    coyoteTimerMs = 0;
    jumpBufferMs = 0;
    return true;
  };
  consumeBufferedJump();

  const direction = input.left && !input.right ? -1 : 1;
  const sprinting = Boolean(input.sprint || input.right) && direction > 0 && energyMeter > 0 && player.slipTimerMs === 0 && hazardSlowTimerMs === 0;
  if (sprinting) {
    energyMeter = Math.max(0, energyMeter - seconds * 24);
    energyTimerMs = 160;
  }
  const runSpeed = sprinting ? 240 : 150;
  const movementSpeed = player.slipTimerMs > 0 ? 52 : hazardSlowTimerMs > 0 ? 88 : windTimerMs > 0 ? 135 : direction < 0 ? 105 : Math.max(runSpeed, platformBoostTimerMs > 0 ? 190 : 0, speedPadTimerMs > 0 ? 215 : 0);
  player.facing = direction;
  const previousX = player.x;
  player.x = clamp(player.x + direction * movementSpeed * seconds, 0, level.worldEnd - PLAYER_WIDTH);
  player.distanceTravelled = (player.distanceTravelled ?? 0) + Math.abs(player.x - previousX);
  const previousBottom = player.y + player.height;
  player.velocityY += (player.velocityY > 0 ? FALL_GRAVITY : GRAVITY) * seconds;
  player.y += player.velocityY * seconds;
  Object.assign(player, placeOnSurface(player, platforms, previousBottom));
  if (player.grounded) coyoteTimerMs = COYOTE_TIME_MS;
  if (!wasGrounded && player.grounded) {
    player.landTimerMs = LAND_SQUASH_MS;
    player.dustTimerMs = DUST_MS;
    shakeTimerMs = Math.max(shakeTimerMs, IMPACT_SHAKE_MS);
    consumeBufferedJump();
  }
  player.coyoteTimerMs = coyoteTimerMs;
  player.jumpBufferMs = jumpBufferMs;
  const boostPlatform = player.grounded && platforms.find((platform) => platform.boost
    && player.x + player.width > platform.x
    && player.x < platform.x + platform.width
    && Math.abs(player.y + player.height - platform.y) < 2);
  if (boostPlatform) platformBoostTimerMs = 180;

  if (hazardHitCooldownMs === 0) {
    const hazardResult = resolveHazardContact({ player, collapseStarts, hazardSlowTimerMs }, hazards, nextElapsedMs);
    Object.assign(collapseStarts, hazardResult.collapseStarts);
    if (hazardResult.event !== 'none') {
      pursuer.x += hazardResult.distanceDelta;
      hazardSlowTimerMs = hazardResult.hazardSlowTimerMs;
      event = hazardResult.event;
      if (hazardResult.distanceDelta > 0) {
        hazardHitCooldownMs = 650;
        hitStopMs = HIT_STOP_MS;
        shakeTimerMs = Math.max(shakeTimerMs, IMPACT_SHAKE_MS);
        impactTimerMs = IMPACT_SHAKE_MS;
      }
    }
  }
  hazards = getDynamicHazards(level, nextElapsedMs, collapseStarts);

  const playerBox = player;
  const collectedEnergy = new Set(state.collectedEnergyIds);
  for (const energy of level.energy) {
    if (!collectedEnergy.has(energy.id) && overlaps(playerBox, energy)) {
      energyMeter = clamp(energyMeter + 80, 0, 100);
      energyTimerMs = 900;
      pursuer.x -= 38;
      event = 'energy';
      collectedEnergy.add(energy.id);
    }
  }
  const collectedEnergyIds = [...collectedEnergy];

  for (const coin of level.coins ?? []) {
    if (!collectedCoins.has(coin.id) && overlaps(playerBox, coin)) {
      collectedCoins.add(coin.id);
      coins += 1;
      pursuer.x -= 14;
      event = 'coin';
    }
  }

  for (const obstacle of level.obstacles) {
    if (collectedObstacle.has(obstacle.id) || !overlaps(playerBox, obstacle)) continue;
    if (obstacle.type === 'surprise' && player.velocityY < 0) {
      collectedObstacle.add(obstacle.id);
      coins += 1;
      energyMeter = clamp(energyMeter + 34, 0, 100);
      energyTimerMs = 600;
      pursuer.x -= 28;
      event = 'surprise';
    } else if (obstacle.type === 'spring') {
      collectedObstacle.add(obstacle.id);
      player.velocityY = -620;
      player.grounded = false;
      player.jumpsUsed = 0;
      event = 'spring';
    }
    if (obstacle.type === 'basketball') {
      basketball = { x: obstacle.x, y: obstacle.y, width: obstacle.width, height: obstacle.height, velocityX: 520, active: true };
      collectedObstacle.add(obstacle.id);
      event = 'basketball';
    }
    if (obstacle.type === 'banana') {
      player.slipTimerMs = 700;
      mistakes += 1;
      collectedObstacle.add(obstacle.id);
      event = 'slip';
    }
    if (obstacle.type === 'speedPad') {
      speedPadTimerMs = 900;
      if (event === 'none') event = 'speedPad';
    }
    if (obstacle.type === 'wind') {
      windTimerMs = 480;
      if (event === 'none') event = 'wind';
    }
  }

  if (hitCooldownMs === 0 && level.obstacles.some((obstacle) => ['bookbag', 'barrier'].includes(obstacle.type) && overlaps(playerBox, obstacle))) {
    pursuer.x += 34;
    hitCooldownMs = 650;
    event = 'hit';
    hitStopMs = HIT_STOP_MS;
    shakeTimerMs = Math.max(shakeTimerMs, IMPACT_SHAKE_MS);
    impactTimerMs = IMPACT_SHAKE_MS;
  }

  let checkpointX = state.checkpointX;
  for (const checkpoint of level.checkpoints) {
    if (player.x >= checkpoint.x && checkpoint.respawnX > checkpointX) {
      checkpointX = checkpoint.respawnX;
      if (event === 'none') event = 'checkpoint';
    }
  }

  if (player.y > FALL_Y) {
    const distanceBeforeFall = pursuer.x - player.x;
    player.x = checkpointX;
    player.y = GROUND_Y - PLAYER_HEIGHT;
    player.velocityY = 0;
    player.grounded = true;
    player.jumpsUsed = 0;
    pursuer = {
      ...pursuer,
      x: player.x + Math.min(level.maxDistance - 40, distanceBeforeFall + 48),
      mode: 'cruise',
      modeTimerMs: 0,
      evadeCooldownMs: 0,
    };
    event = 'fell';
    hitStopMs = HIT_STOP_MS;
    shakeTimerMs = Math.max(shakeTimerMs, IMPACT_SHAKE_MS);
    impactTimerMs = IMPACT_SHAKE_MS;
  }

  pursuer = updatePursuer(pursuer, player, stepMs, { ...level, platforms });
  if (basketball?.active) {
    basketball.x += basketball.velocityX * seconds;
    const pursuerBox = { x: pursuer.x, y: pursuer.y ?? GROUND_Y - PLAYER_HEIGHT, width: PLAYER_WIDTH, height: PLAYER_HEIGHT };
    if (overlaps(basketball, pursuerBox)) {
      const downed = random() < 0.25;
      pursuer = { ...pursuer, mode: downed ? 'downed' : 'slowed', modeTimerMs: downed ? 900 : 2000 };
      basketball = null;
      event = downed ? 'pursuerDowned' : 'pursuerSlowed';
    }
  }
  const progress = level.finishX ? player.x / level.finishX : 1;
  let finalWindowOpened = state.finalWindowOpened ?? false;
  if (progress >= CATCH_WINDOW_PROGRESS && !finalWindowOpened) {
    pursuer = { ...pursuer, x: Math.min(pursuer.x, player.x + FINAL_APPROACH_GAP) };
    finalWindowOpened = true;
  }
  if (progress < CATCH_WINDOW_PROGRESS && pursuer.x - player.x < SAFE_CHASE_GAP) {
    pursuer = {
      ...pursuer,
      x: player.x + SAFE_CHASE_GAP,
    };
  }
  if (level.finishX && player.x < level.finishX) pursuer.x = Math.max(player.x + 30, pursuer.x);
  const distance = pursuer.x - player.x;

  const reachedWorldEnd = player.x >= level.worldEnd - PLAYER_WIDTH;
  let phase = 'playing';
  if (progress >= CATCH_WINDOW_PROGRESS && distance <= CATCH_CONTACT_GAP) {
    phase = 'caught';
    event = 'caught';
  } else if (distance >= level.maxDistance || reachedWorldEnd) {
    phase = 'lost';
    event = 'lost';
  }

  return {
    ...state,
    phase,
    player,
    distance,
    pursuer,
    checkpointX,
    energyTimerMs,
    energyMeter,
    collectedEnergyIds,
    collectedObstacleIds: [...collectedObstacle],
    mistakes,
    basketball,
    coins,
    collectedCoinIds: [...collectedCoins],
    elapsedMs: nextElapsedMs,
    hitCooldownMs,
    hazardHitCooldownMs,
    hazardSlowTimerMs,
    platformBoostTimerMs,
    speedPadTimerMs,
    hitStopMs,
    shakeTimerMs,
    impactTimerMs,
    finalWindowOpened,
    windTimerMs,
    collapseStarts,
    hazards,
    event,
  };
}
