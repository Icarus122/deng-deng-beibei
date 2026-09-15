import { overlaps } from './entities.js';
import { JOURNEY } from './level-data.js';
import { createPursuer, updatePursuer } from './pursuer-ai.js';

const PLAYER_WIDTH = 24;
const PLAYER_HEIGHT = 32;
const GROUND_Y = 510;
const SAFE_CHASE_GAP = 150;
const CATCH_CONTACT_GAP = 120;
const GRAVITY = 1400;
const JUMP_SPEED = 500;
const FALL_Y = 640;

export const LEVELS = {
  1: JOURNEY,
  2: {
    name: '黄昏天桥',
    worldEnd: 2150,
    maxDistance: 300,
    pursuerSpeed: 165,
    platforms: [
      { x: 0, y: GROUND_Y, width: 410, height: 30 },
      { x: 535, y: GROUND_Y, width: 310, height: 30 },
      { x: 980, y: GROUND_Y, width: 365, height: 30 },
      { x: 1485, y: GROUND_Y, width: 665, height: 30 },
      { x: 350, y: 410, width: 100, height: 18 },
      { x: 470, y: 370, width: 86, height: 18, motion: { axis: 'y', range: 50, period: 1600 } },
      { x: 780, y: 420, width: 92, height: 18 },
      { x: 880, y: 380, width: 96, height: 18, motion: { axis: 'x', range: 70, period: 1800 } },
      { x: 1270, y: 405, width: 105, height: 18 },
      { x: 1385, y: 360, width: 95, height: 18, motion: { axis: 'y', range: 45, period: 1400 } },
    ],
    obstacles: [
      { id: 'bag-4', x: 350, y: 478, width: 28, height: 32, type: 'bookbag' },
      { id: 'bag-5', x: 720, y: 478, width: 28, height: 32, type: 'bookbag' },
      { id: 'bag-6', x: 1190, y: 478, width: 28, height: 32, type: 'bookbag' },
      { id: 'bag-7', x: 1800, y: 478, width: 28, height: 32, type: 'bookbag' },
    ],
    energy: [
      { id: 'energy-4', x: 250, y: 468, width: 22, height: 22 },
      { id: 'energy-5', x: 645, y: 468, width: 22, height: 22 },
      { id: 'energy-6', x: 1090, y: 468, width: 22, height: 22 },
      { id: 'energy-7', x: 1620, y: 468, width: 22, height: 22 },
    ],
    checkpoints: [
      { x: 980, respawnX: 950 },
      { x: 1540, respawnX: 1510 },
    ],
  },
};

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
  for (const platform of platforms) {
    const coversPlayer = player.x + player.width > platform.x && player.x < platform.x + platform.width;
    const crossedTop = previousBottom <= platform.y && bottom >= platform.y;
    if (coversPlayer && crossedTop && player.velocityY >= 0) {
      return { ...player, y: platform.y - player.height, velocityY: 0, jumpsUsed: 0, grounded: true };
    }
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
  };
  return {
    levelId,
    phase: 'playing',
    player,
    initialDistance,
    distance: initialDistance,
    maxDistance: level.maxDistance,
    pursuerX: player.x + initialDistance,
    pursuer: createPursuer(player.x + initialDistance),
    checkpointX: 70,
    energyTimerMs: 0,
    collectedEnergyIds: [],
    collectedObstacleIds: [],
    mistakes: 0,
    basketball: null,
    catchRollCooldownMs: 0,
    catchAttempts: 0,
    coins: 0,
    collectedCoinIds: [],
    elapsedMs: 0,
    hitCooldownMs: 0,
    event: 'none',
  };
}

export function resetLevel(levelId) {
  return createGame(levelId);
}

export function getPursuerRenderState(pursuer) {
  return { ...pursuer, y: pursuer.y ?? GROUND_Y - PLAYER_HEIGHT, grounded: pursuer.grounded ?? true };
}

export function getPursuerTaunt(progress) {
  if (progress < 0.3) return '孟培杰：等等？你也太慢啦！';
  if (progress < 0.7) return '孟培杰：前面有惊喜方块，敢不敢顶？';
  return '孟培杰：快追上了？那就来呀！';
}

export function getRenderPlatforms(levelId, elapsedMs) {
  return LEVELS[levelId].platforms.map((platform) => movingPlatform(platform, elapsedMs));
}

export function updateGame(state, input, elapsedMs, { random = Math.random } = {}) {
  if (state.phase !== 'playing') return state;

  const level = LEVELS[state.levelId];
  const stepMs = clamp(elapsedMs, 0, 50);
  const seconds = stepMs / 1000;
  const nextElapsedMs = state.elapsedMs + stepMs;
  const platforms = getRenderPlatforms(state.levelId, nextElapsedMs);
  const player = clonePlayer(state.player);
  let distance = state.distance;
  let pursuer = state.pursuer ? { ...state.pursuer } : createPursuer(state.pursuerX);
  let mistakes = state.mistakes ?? 0;
  let basketball = state.basketball ? { ...state.basketball } : null;
  let catchRollCooldownMs = Math.max(0, (state.catchRollCooldownMs ?? 0) - stepMs);
  let catchAttempts = state.catchAttempts ?? 0;
  let coins = state.coins ?? 0;
  const collectedObstacle = new Set(state.collectedObstacleIds ?? []);
  const collectedCoins = new Set(state.collectedCoinIds ?? []);
  player.slipTimerMs = Math.max(0, (player.slipTimerMs ?? 0) - stepMs);
  let energyTimerMs = Math.max(0, state.energyTimerMs - stepMs);
  let hitCooldownMs = Math.max(0, state.hitCooldownMs - stepMs);
  let event = 'none';

  if (input.jumpPressed && player.slipTimerMs === 0 && (player.grounded || player.jumpsUsed < 2)) {
    player.velocityY = -JUMP_SPEED;
    player.grounded = false;
    player.jumpsUsed += 1;
  }

  const direction = input.left && !input.right ? -1 : 1;
  const runSpeed = energyTimerMs > 0 ? 240 : 150;
  const movementSpeed = player.slipTimerMs > 0 ? 52 : direction < 0 ? 75 : runSpeed;
  player.facing = direction;
  player.x = clamp(player.x + direction * movementSpeed * seconds, 0, level.worldEnd - PLAYER_WIDTH);
  const previousBottom = player.y + player.height;
  player.velocityY += GRAVITY * seconds;
  player.y += player.velocityY * seconds;
  Object.assign(player, placeOnSurface(player, platforms, previousBottom));

  const playerBox = player;
  const collectedEnergy = new Set(state.collectedEnergyIds);
  for (const energy of level.energy) {
    if (!collectedEnergy.has(energy.id) && overlaps(playerBox, energy)) {
      energyTimerMs = 1800;
      distance = Math.max(0, distance - 38);
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
      distance = Math.max(0, distance - 14);
      pursuer.x -= 14;
      event = 'coin';
    }
  }

  for (const obstacle of level.obstacles) {
    if (collectedObstacle.has(obstacle.id) || !overlaps(playerBox, obstacle)) continue;
    if (obstacle.type === 'surprise' && player.velocityY < 0) {
      collectedObstacle.add(obstacle.id);
      coins += 1;
      energyTimerMs = 1200;
      distance = Math.max(0, distance - 28);
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
  }

  if (hitCooldownMs === 0 && level.obstacles.some((obstacle) => ['bookbag', 'barrier'].includes(obstacle.type) && overlaps(playerBox, obstacle))) {
    distance += 34;
    pursuer.x += 34;
    hitCooldownMs = 650;
    event = 'hit';
  }

  let checkpointX = state.checkpointX;
  for (const checkpoint of level.checkpoints) {
    if (player.x >= checkpoint.x && checkpoint.respawnX > checkpointX) {
      checkpointX = checkpoint.respawnX;
      if (event === 'none') event = 'checkpoint';
    }
  }

  if (player.y > FALL_Y) {
    player.x = checkpointX;
    player.y = GROUND_Y - PLAYER_HEIGHT;
    player.velocityY = 0;
    player.grounded = true;
    player.jumpsUsed = 0;
    distance += 48;
    pursuer = { ...pursuer, x: player.x + distance, mode: 'cruise', modeTimerMs: 0, evadeCooldownMs: 0 };
    event = 'fell';
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
  distance = pursuer.x - player.x;
  const progress = level.finishX ? player.x / level.finishX : 1;
  if (progress < 0.7 && distance < SAFE_CHASE_GAP) {
    pursuer = {
      ...pursuer,
      x: player.x + SAFE_CHASE_GAP,
      velocity: 205,
      mode: 'evade',
      modeTimerMs: 900,
      evadeCooldownMs: 2000,
    };
    distance = SAFE_CHASE_GAP;
  }
  const minimumLead = level.finishX && player.x < level.finishX ? 30 : 0;
  distance = Math.max(minimumLead, distance);

  const reachedFinish = Boolean(level.finishX && player.x >= level.finishX);
  let phase = 'playing';
  if (reachedFinish) {
    phase = 'caught';
    event = 'caught';
  } else if (distance >= level.maxDistance) {
    phase = 'lost';
    event = 'lost';
  } else {
    const catchReady = progress >= 0.7 && distance <= CATCH_CONTACT_GAP && catchRollCooldownMs === 0;
    const catchChance = Math.min(0.95, (progress >= 0.85 ? 0.7 : 0.35) + catchAttempts * 0.2 + (pursuer.mode === 'slowed' ? 0.18 : 0) + (pursuer.mode === 'downed' ? 0.45 : 0));
    if (catchReady) {
      event = 'catchRoll';
      if (random() < catchChance) {
        phase = 'caught';
        event = 'caught';
      } else {
        catchRollCooldownMs = 1100;
        catchAttempts += 1;
        pursuer = {
          ...pursuer,
          x: player.x + SAFE_CHASE_GAP,
          velocity: 205,
          mode: 'evade',
          modeTimerMs: 900,
          evadeCooldownMs: 2000,
        };
        distance = SAFE_CHASE_GAP;
        event = 'escaped';
      }
    }
  }

  return {
    ...state,
    phase,
    player,
    distance,
    pursuerX: pursuer.x,
    pursuer,
    checkpointX,
    energyTimerMs,
    collectedEnergyIds,
    collectedObstacleIds: [...collectedObstacle],
    mistakes,
    basketball,
    catchRollCooldownMs,
    catchAttempts,
    coins,
    collectedCoinIds: [...collectedCoins],
    elapsedMs: nextElapsedMs,
    hitCooldownMs,
    event,
  };
}
