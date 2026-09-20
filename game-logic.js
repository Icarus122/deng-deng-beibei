import { sweptOverlaps } from './entities.js';
import { createBasketball, updateBasketball } from './basketball-logic.js';
import { getDynamicHazards, isCollapseGone, resolveHazardContact } from './hazard-logic.js';
import { CHAPTERS, JOURNEY } from './level-data.js?v=20260920f';
import { createPursuer, updatePursuer } from './pursuer-ai.js?v=20260920h';
import { findLandingPlatform } from './platform-physics.js';

const PLAYER_WIDTH = 24;
const PLAYER_HEIGHT = 32;
const GROUND_Y = 510;
const SAFE_CHASE_GAP = 100;
// Rendered bodies are 60px wide.  A catch must now look like a real tap,
// rather than succeeding with a character-sized empty gap between them.
const CATCH_CONTACT_GAP = 56;
const CATCH_WINDOW_PROGRESS = 0.85;
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

export const LEVELS = { 1: JOURNEY, ...CHAPTERS };

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

function placeOnSurface(player, platforms, previousBottom, ignoredOneWayGroup = null, previousPlayer = null, previousPlatforms = platforms) {
  const platform = findLandingPlatform(player, platforms, previousBottom, ignoredOneWayGroup, previousPlayer, previousPlatforms);
  if (platform) {
    return {
      ...player,
      y: platform.y - player.height,
      velocityY: 0,
      jumpsUsed: 0,
      grounded: true,
      groundedPlatformId: platform.id,
      dropThroughGroup: null,
      dropThroughMs: 0,
    };
  }
  return { ...player, grounded: false, groundedPlatformId: null };
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
    horizontalSpeed: 150,
    velocityY: 0,
    grounded: true,
    groundedPlatformId: level.platforms.find((platform) => platform.y === GROUND_Y && 70 >= platform.x && 70 < platform.x + platform.width)?.id ?? null,
    jumpsUsed: 0,
    facing: 1,
    distanceTravelled: 0,
    runDistanceTravelled: 0,
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
    damageCount: 0,
    sprinted: false,
    basketball: null,
    coins: 0,
    collectedCoinIds: [],
    elapsedMs: 0,
    hitCooldownMs: 0,
    hazardHitCooldownMs: 0,
    damageContactIds: [],
    invulnerabilityMs: 0,
    hearts: 3,
    maxHearts: 3,
    collectedHeartIds: [],
    hazardSlowTimerMs: 0,
    windTimerMs: 0,
    windContactIds: [],
    platformBoostTimerMs: 0,
    speedPadTimerMs: 0,
    hitStopMs: 0,
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

const REGIONAL_TAUNTS = {
  gate: {
    cruise: '孟培杰：校门口有弹簧台，敢不敢借它跳一段？',
    evade: '孟培杰：我要加速啦，别被香蕉皮绊住！',
    slowed: '孟培杰：哎，球场那边的篮球还挺有劲！',
    downed: '孟培杰：等等，我刚才是不是被球砸倒了？',
    finalChase: '孟培杰：校门这段最后冲刺，看谁先到！',
  },
  court: {
    cruise: '孟培杰：篮球场的球可不是摆设，小心我把它踢走！',
    evade: '孟培杰：球场直道，我要冲刺咯！',
    slowed: '孟培杰：糟了，篮球把我绊住了！',
    downed: '孟培杰：你这球传得也太准了吧！',
    finalChase: '孟培杰：穿过球场就到下一段啦！',
  },
  ginkgo: {
    cruise: '孟培杰：银杏叶下面藏着硬币，眼睛放亮点！',
    evade: '孟培杰：落叶路有点滑，我还是跑快点吧！',
    slowed: '孟培杰：我慢下来啦，趁现在追上来！',
    downed: '孟培杰：哎哟，刚才那一下可真重！',
    finalChase: '孟培杰：穿过银杏林，我们再比一段！',
  },
  lakeside: {
    cruise: '孟培杰：看施工箱的影子，预判它要落在哪儿！',
    evade: '孟培杰：施工区不等人，我先冲过去啦！',
    slowed: '孟培杰：挡板把我拦住了，快追！',
    downed: '孟培杰：等会儿，我先缓一下……',
    finalChase: '孟培杰：湖畔尽头见，别被箱子砸到！',
  },
  bridge: {
    cruise: '孟培杰：横风变强了，弹簧能送你上天桥高路！',
    evade: '孟培杰：桥上风大，我先加速啦！',
    slowed: '孟培杰：风把我吹慢了，你快跟上！',
    downed: '孟培杰：在高路上也能追到我？服啦！',
    finalChase: '孟培杰：天桥尽头见！这次你可别松劲！',
  },
};

export function getPursuerTaunt(progress, mode = 'cruise', regionId = null) {
  const regional = REGIONAL_TAUNTS[regionId];
  if (regional) return regional[mode] ?? regional.cruise;
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
  const nextElapsedMs = state.elapsedMs + stepMs;
  if ((state.hitStopMs ?? 0) > 0) {
    return {
      ...state,
      elapsedMs: nextElapsedMs,
      event: 'none',
      hitStopMs: Math.max(0, state.hitStopMs - stepMs),
      invulnerabilityMs: Math.max(0, (state.invulnerabilityMs ?? 0) - stepMs),
      player: {
        ...state.player,
        landTimerMs: Math.max(0, (state.player.landTimerMs ?? 0) - stepMs),
        dustTimerMs: Math.max(0, (state.player.dustTimerMs ?? 0) - stepMs),
      },
    };
  }

  const seconds = stepMs / 1000;
  const collapseStarts = { ...(state.collapseStarts ?? {}) };
  const previousPlatforms = getRenderPlatforms(state.levelId, state.elapsedMs, collapseStarts);
  const platforms = getRenderPlatforms(state.levelId, nextElapsedMs, collapseStarts);
  const previousHazards = getDynamicHazards(level, state.elapsedMs, collapseStarts);
  let hazards = getDynamicHazards(level, nextElapsedMs, collapseStarts);
  let previousPlayer = clonePlayer(state.player);
  const player = clonePlayer(state.player);
  let pursuer = state.pursuer ? { ...state.pursuer } : createPursuer(state.player.x + state.initialDistance);
  let mistakes = state.mistakes ?? 0;
  let damageCount = state.damageCount ?? 0;
  let hearts = state.hearts ?? 3;
  let sprinted = state.sprinted ?? false;
  let basketball = state.basketball ? { ...state.basketball } : null;
  let coins = state.coins ?? 0;
  const collectedObstacle = new Set(state.collectedObstacleIds ?? []);
  const collectedCoins = new Set(state.collectedCoinIds ?? []);
  const collectedHearts = new Set(state.collectedHeartIds ?? []);
  const collectedEnergy = new Set(state.collectedEnergyIds ?? []);
  const previousDamageContacts = new Set(state.damageContactIds ?? []);
  const currentDamageContacts = new Set();
  player.slipTimerMs = Math.max(0, (player.slipTimerMs ?? 0) - stepMs);
  player.dropThroughMs = Math.max(0, (player.dropThroughMs ?? 0) - stepMs);
  let energyTimerMs = Math.max(0, state.energyTimerMs - stepMs);
  let energyMeter = clamp(state.energyMeter ?? 0, 0, 100);
  let invulnerabilityMs = Math.max(0, (state.invulnerabilityMs ?? 0) - stepMs);
  let hazardSlowTimerMs = Math.max(0, (state.hazardSlowTimerMs ?? 0) - stepMs);
  let platformBoostTimerMs = Math.max(0, (state.platformBoostTimerMs ?? 0) - stepMs);
  let speedPadTimerMs = Math.max(0, (state.speedPadTimerMs ?? 0) - stepMs);
  let windTimerMs = Math.max(0, (state.windTimerMs ?? 0) - stepMs);
  const previousWindContacts = new Set(state.windContactIds ?? []);
  const currentWindContacts = new Set();
  let hitStopMs = 0;
  let event = 'none';

  if (player.grounded && player.groundedPlatformId) {
    const oldPlatform = previousPlatforms.find((platform) => platform.id === player.groundedPlatformId);
    const movedPlatform = platforms.find((platform) => platform.id === player.groundedPlatformId);
    if (oldPlatform && movedPlatform) {
      player.x += movedPlatform.x - oldPlatform.x;
      player.y += movedPlatform.y - oldPlatform.y;
    } else if (oldPlatform) {
      player.grounded = false;
      player.groundedPlatformId = null;
    }
  }

  const wasGrounded = player.grounded;
  let coyoteTimerMs = player.grounded
    ? COYOTE_TIME_MS
    : Math.max(0, (player.coyoteTimerMs ?? 0) - stepMs);
  let jumpBufferMs = Math.max(0, (player.jumpBufferMs ?? 0) - stepMs);
  player.landTimerMs = Math.max(0, (player.landTimerMs ?? 0) - stepMs);
  player.dustTimerMs = Math.max(0, (player.dustTimerMs ?? 0) - stepMs);
  if (input.jumpPressed) jumpBufferMs = JUMP_BUFFER_MS;
  if (input.jumpReleased && player.velocityY < 0) player.velocityY *= SHORT_JUMP_FACTOR;

  let droppedThrough = false;
  if (input.jumpPressed && input.down && player.grounded) {
    const currentPlatform = platforms.find((platform) => platform.id === player.groundedPlatformId);
    if (currentPlatform?.oneWay) {
      player.dropThroughGroup = currentPlatform.oneWayGroup ?? currentPlatform.id;
      player.dropThroughMs = 320;
      player.grounded = false;
      player.groundedPlatformId = null;
      player.velocityY = 135;
      player.jumpsUsed = 2;
      coyoteTimerMs = 0;
      jumpBufferMs = 0;
      droppedThrough = true;
      event = 'dropThrough';
    }
  }

  const consumeBufferedJump = () => {
    if (jumpBufferMs === 0 || player.slipTimerMs > 0) return false;
    if (!player.grounded && coyoteTimerMs === 0 && player.jumpsUsed >= 2) return false;
    player.velocityY = -JUMP_SPEED;
    player.grounded = false;
    player.groundedPlatformId = null;
    player.dropThroughGroup = null;
    player.dropThroughMs = 0;
    player.jumpsUsed += 1;
    coyoteTimerMs = 0;
    jumpBufferMs = 0;
    return true;
  };
  if (!droppedThrough) consumeBufferedJump();

  const direction = input.left && !input.right ? -1 : 1;
  const sprinting = Boolean(input.sprint || input.right) && direction > 0 && energyMeter > 0 && player.slipTimerMs === 0 && hazardSlowTimerMs === 0;
  if (sprinting) {
    sprinted = true;
    energyMeter = Math.max(0, energyMeter - seconds * 24);
    energyTimerMs = 160;
    if (energyMeter === 0) event = 'energyEmpty';
  }
  const runSpeed = sprinting ? 240 : 150;
  const movementSpeed = player.slipTimerMs > 0 ? 52 : hazardSlowTimerMs > 0 ? 88 : windTimerMs > 0 ? 135 : direction < 0 ? 105 : Math.max(runSpeed, platformBoostTimerMs > 0 ? 190 : 0, speedPadTimerMs > 0 ? 215 : 0);
  player.facing = direction;
  const previousX = player.x;
  player.x = clamp(player.x + direction * movementSpeed * seconds, 0, level.worldEnd - PLAYER_WIDTH);
  player.horizontalSpeed = direction * movementSpeed;
  const horizontalDistance = Math.abs(player.x - previousX);
  player.distanceTravelled = (player.distanceTravelled ?? 0) + horizontalDistance;
  const previousBottom = previousPlayer.y + player.height;
  player.velocityY += (player.velocityY > 0 ? FALL_GRAVITY : GRAVITY) * seconds;
  player.y += player.velocityY * seconds;
  const ignoredOneWayGroup = player.dropThroughMs > 0 ? player.dropThroughGroup : null;
  Object.assign(player, placeOnSurface(player, platforms, previousBottom, ignoredOneWayGroup, previousPlayer, previousPlatforms));
  if (player.dropThroughGroup) {
    const groupPlatform = platforms.find((platform) => platform.oneWay
      && (platform.oneWayGroup ?? platform.id) === player.dropThroughGroup);
    if (!groupPlatform || player.y >= groupPlatform.y + groupPlatform.height || player.dropThroughMs === 0) {
      player.dropThroughGroup = null;
      player.dropThroughMs = 0;
    }
  }
  if (wasGrounded && player.grounded && player.slipTimerMs === 0) {
    player.runDistanceTravelled = (player.runDistanceTravelled ?? 0) + horizontalDistance;
  }
  if (player.grounded) coyoteTimerMs = COYOTE_TIME_MS;
  if (!wasGrounded && player.grounded) {
    player.landTimerMs = LAND_SQUASH_MS;
    player.dustTimerMs = DUST_MS;
    consumeBufferedJump();
  }
  player.coyoteTimerMs = coyoteTimerMs;
  player.jumpBufferMs = jumpBufferMs;
  const boostPlatform = player.grounded && platforms.find((platform) => platform.boost
    && player.x + player.width > platform.x
    && player.x < platform.x + platform.width
    && Math.abs(player.y + player.height - platform.y) < 2);
  if (boostPlatform) platformBoostTimerMs = 180;

  const hazardResult = resolveHazardContact({ player, collapseStarts, hazardSlowTimerMs }, hazards, nextElapsedMs, {
    previousPlayer,
    previousHazards,
  });
  Object.assign(collapseStarts, hazardResult.collapseStarts);
  if (hazardResult.event !== 'none') {
    hazardSlowTimerMs = hazardResult.hazardSlowTimerMs;
    if (event === 'none' && !['constructionHit', 'blockerHit', 'patrolHit', 'spikesHit'].includes(hazardResult.event)) event = hazardResult.event;
  }
  hazards = getDynamicHazards(level, nextElapsedMs, collapseStarts);

  const playerBox = player;
  for (const energy of level.energy ?? []) {
    if (!collectedEnergy.has(energy.id) && sweptOverlaps(previousPlayer, playerBox, energy)) {
      energyMeter = clamp(energyMeter + 40, 0, 100);
      energyTimerMs = 900;
      pursuer.x -= 38;
      event = 'energy';
      collectedEnergy.add(energy.id);
    }
  }

  for (const coin of level.coins ?? []) {
    if (!collectedCoins.has(coin.id) && sweptOverlaps(previousPlayer, playerBox, coin)) {
      collectedCoins.add(coin.id);
      coins += 1;
      pursuer.x -= 14;
      event = 'coin';
    }
  }

  for (const heart of level.heartPickups ?? []) {
    if (!collectedHearts.has(heart.id) && hearts < (state.maxHearts ?? 3) && sweptOverlaps(previousPlayer, playerBox, heart)) {
      collectedHearts.add(heart.id);
      hearts = Math.min(state.maxHearts ?? 3, hearts + 1);
      event = 'heart';
    }
  }

  for (const obstacle of level.obstacles ?? []) {
    if (collectedObstacle.has(obstacle.id) || !sweptOverlaps(previousPlayer, playerBox, obstacle)) continue;
    if (obstacle.type === 'surprise' && player.velocityY < 0) {
      collectedObstacle.add(obstacle.id);
      coins += 1;
      energyMeter = clamp(energyMeter + 20, 0, 100);
      energyTimerMs = 600;
      pursuer.x -= 28;
      event = 'surprise';
    } else if (obstacle.type === 'spring' && player.velocityY >= 0) {
      player.velocityY = -620;
      player.grounded = false;
      player.groundedPlatformId = null;
      player.jumpsUsed = 0;
      event = 'spring';
    }
    if (obstacle.type === 'basketball') {
      basketball = createBasketball(player, pursuer);
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
      currentWindContacts.add(obstacle.id);
      windTimerMs = 480;
      if (!previousWindContacts.has(obstacle.id) && event === 'none') event = 'wind';
    }
  }

  const damagingHazards = hazardResult.damagingContacts;
  const damagingObstacles = (level.obstacles ?? []).filter((obstacle) => (
    ['bookbag', 'barrier'].includes(obstacle.type) && sweptOverlaps(previousPlayer, playerBox, obstacle)
  ));
  const damageCandidates = [...damagingHazards, ...damagingObstacles];
  damageCandidates.forEach((hazard) => currentDamageContacts.add(hazard.id));
  const newDamageContact = damageCandidates.find((hazard) => !previousDamageContacts.has(hazard.id));
  if (newDamageContact && invulnerabilityMs === 0) {
    hearts = Math.max(0, hearts - 1);
    damageCount += 1;
    mistakes += 1;
    invulnerabilityMs = 1200;
    hitStopMs = HIT_STOP_MS;
    event = newDamageContact.type === 'spikes' ? 'spikesHit'
      : newDamageContact.type === 'constructionBox' ? 'constructionHit'
        : newDamageContact.type === 'blocker' ? 'blockerHit'
          : newDamageContact.type === 'patrol' ? 'patrolHit' : 'hit';
  }

  let checkpointX = state.checkpointX;
  let checkpointPlatformId = state.checkpointPlatformId ?? level.platforms.find((platform) => platform.y === GROUND_Y && state.checkpointX >= platform.x && state.checkpointX < platform.x + platform.width)?.id ?? null;
  for (const checkpoint of level.checkpoints ?? []) {
    if (player.x >= checkpoint.x && checkpoint.respawnX > checkpointX) {
      checkpointX = checkpoint.respawnX;
      checkpointPlatformId = level.platforms.find((platform) => platform.y === GROUND_Y && checkpointX >= platform.x && checkpointX < platform.x + platform.width)?.id ?? null;
      if (event === 'none') event = 'checkpoint';
    }
  }

  if (player.y > FALL_Y) {
    hearts = Math.max(0, hearts - 1);
    damageCount += 1;
    mistakes += 1;
    const distanceBeforeFall = pursuer.x - player.x;
    player.x = checkpointX;
    player.y = GROUND_Y - PLAYER_HEIGHT;
    previousPlayer = { ...player };
    player.velocityY = 0;
    player.grounded = true;
    player.groundedPlatformId = checkpointPlatformId;
    player.jumpsUsed = 0;
    player.dropThroughGroup = null;
    player.dropThroughMs = 0;
    player.coyoteTimerMs = COYOTE_TIME_MS;
    invulnerabilityMs = Math.max(invulnerabilityMs, 1500);
    pursuer = {
      ...pursuer,
      x: player.x + Math.min(level.maxDistance - 40, distanceBeforeFall + 48),
      y: GROUND_Y - PLAYER_HEIGHT,
      velocityY: 0,
      grounded: true,
      groundedPlatformId: null,
      mode: 'cruise',
      modeTimerMs: 0,
      evadeCooldownMs: 0,
    };
    event = 'fell';
    hitStopMs = HIT_STOP_MS;
  }

  const previousPursuer = { ...pursuer };
  pursuer = updatePursuer(pursuer, player, stepMs, {
    ...level,
    previousPlatforms,
    platforms,
    elapsedMs: nextElapsedMs,
    hazards,
  });
  if (basketball?.active) {
    const result = updateBasketball(basketball, previousPursuer, pursuer, stepMs, level.worldEnd, random);
    basketball = result.ball;
    pursuer = result.pursuer;
    if (result.event !== 'none') event = result.event;
  }

  const progress = level.finishX ? player.x / level.finishX : 1;
  let finalWindowOpened = state.finalWindowOpened ?? false;
  if (progress >= CATCH_WINDOW_PROGRESS && !finalWindowOpened) {
    pursuer = { ...pursuer, x: Math.min(pursuer.x, player.x + FINAL_APPROACH_GAP) };
    finalWindowOpened = true;
    event = 'catchWindowOpened';
  }
  if (progress < CATCH_WINDOW_PROGRESS && pursuer.x - player.x < SAFE_CHASE_GAP) {
    pursuer = { ...pursuer, x: player.x + SAFE_CHASE_GAP };
  }
  if (level.finishX && player.x < level.finishX) pursuer.x = Math.max(player.x + 30, pursuer.x);
  const distance = pursuer.x - player.x;
  const verticalOverlap = player.y < pursuer.y + PLAYER_HEIGHT
    && player.y + PLAYER_HEIGHT > pursuer.y;
  const reachedWorldEnd = player.x >= level.worldEnd - PLAYER_WIDTH;
  let phase = 'playing';
  if (hearts <= 0) {
    phase = 'lost';
    event = 'lost';
  } else if (progress >= CATCH_WINDOW_PROGRESS && distance <= CATCH_CONTACT_GAP && verticalOverlap) {
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
    checkpointPlatformId,
    energyTimerMs,
    energyMeter,
    collectedEnergyIds: [...collectedEnergy],
    collectedObstacleIds: [...collectedObstacle],
    collectedHeartIds: [...collectedHearts],
    hearts,
    mistakes,
    damageCount,
    sprinted,
    basketball,
    coins,
    collectedCoinIds: [...collectedCoins],
    elapsedMs: nextElapsedMs,
    invulnerabilityMs,
    damageContactIds: [...currentDamageContacts],
    hazardSlowTimerMs,
    platformBoostTimerMs,
    speedPadTimerMs,
    hitStopMs,
    finalWindowOpened,
    windTimerMs,
    windContactIds: [...currentWindContacts],
    collapseStarts,
    hazards,
    event,
  };
}
