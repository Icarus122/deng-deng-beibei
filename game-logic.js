const PLAYER_WIDTH = 24;
const PLAYER_HEIGHT = 32;
const GROUND_Y = 510;
const GRAVITY = 1400;
const JUMP_SPEED = 500;
const FALL_Y = 640;

function createContinuousJourney() {
  const platforms = [];
  const obstacles = [];
  const energy = [];
  const checkpoints = [];
  const segmentLength = 1000;

  for (let segment = 0; segment < 42; segment += 1) {
    const start = segment * segmentLength;
    const gapWidth = segment === 0 || segment === 25 ? 0 : 145 + (segment % 3) * 20;
    const groundWidth = segment === 41 ? 1000 : segmentLength - gapWidth;
    platforms.push({ x: start, y: GROUND_Y, width: groundWidth, height: 30 });
    platforms.push({ x: start + 265, y: 414 - (segment % 2) * 24, width: 118, height: 18 });
    platforms.push({ x: start + 565, y: 442, width: 105, height: 18 });

    if (segment % 2 === 1) {
      platforms.push({
        x: start + 765,
        y: 390,
        width: 96,
        height: 18,
        motion: { axis: segment % 4 === 1 ? 'x' : 'y', range: 46, period: 1500 + segment * 35 },
      });
    }
    if (segment > 0) obstacles.push({ id: `bag-${segment}`, x: start + 135, y: 478, width: 28, height: 32, type: 'bookbag' });
    energy.push({ id: `energy-${segment + 1}`, x: start + 260, y: 468, width: 22, height: 22 });
    if (segment % 2 === 1 && segment < 41) checkpoints.push({ x: start + 740, respawnX: start + 700 });
  }

  return {
    name: '等到天桥尽头',
    worldEnd: 42000,
    finishX: 41280,
    maxDistance: 520,
    pursuerSpeed: 136,
    districts: [
      { name: '校园入口', start: 0, end: 14000, palette: 'morning' },
      { name: '林荫操场', start: 14000, end: 28000, palette: 'afternoon' },
      { name: '黄昏天桥', start: 28000, end: 42000, palette: 'sunset' },
    ],
    platforms,
    obstacles,
    energy,
    checkpoints,
  };
}

export const LEVELS = {
  1: createContinuousJourney(),
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

function overlaps(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
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
    checkpointX: 70,
    energyTimerMs: 0,
    collectedEnergyIds: [],
    elapsedMs: 0,
    hitCooldownMs: 0,
    event: 'none',
  };
}

export function resetLevel(levelId) {
  return createGame(levelId);
}

export function getRenderPlatforms(levelId, elapsedMs) {
  return LEVELS[levelId].platforms.map((platform) => movingPlatform(platform, elapsedMs));
}

export function updateGame(state, input, elapsedMs) {
  if (state.phase !== 'playing') return state;

  const level = LEVELS[state.levelId];
  const stepMs = clamp(elapsedMs, 0, 50);
  const seconds = stepMs / 1000;
  const nextElapsedMs = state.elapsedMs + stepMs;
  const platforms = getRenderPlatforms(state.levelId, nextElapsedMs);
  const player = clonePlayer(state.player);
  let distance = state.distance;
  let energyTimerMs = Math.max(0, state.energyTimerMs - stepMs);
  let hitCooldownMs = Math.max(0, state.hitCooldownMs - stepMs);
  let event = 'none';

  if (input.jumpPressed && (player.grounded || player.jumpsUsed < 2)) {
    player.velocityY = -JUMP_SPEED;
    player.grounded = false;
    player.jumpsUsed += 1;
  }

  const direction = input.left && !input.right ? -1 : 1;
  const runSpeed = energyTimerMs > 0 ? 240 : 150;
  const movementSpeed = direction < 0 ? 75 : runSpeed;
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
      event = 'energy';
      collectedEnergy.add(energy.id);
    }
  }
  const collectedEnergyIds = [...collectedEnergy];

  if (hitCooldownMs === 0 && level.obstacles.some((obstacle) => overlaps(playerBox, obstacle))) {
    distance += 34;
    hitCooldownMs = 650;
    event = 'hit';
  }

  let checkpointX = state.checkpointX;
  for (const checkpoint of level.checkpoints) {
    if (player.x >= checkpoint.x && checkpoint.respawnX > checkpointX) {
      checkpointX = checkpoint.respawnX;
      event = 'checkpoint';
    }
  }

  if (player.y > FALL_Y) {
    player.x = checkpointX;
    player.y = GROUND_Y - PLAYER_HEIGHT;
    player.velocityY = 0;
    player.grounded = true;
    player.jumpsUsed = 0;
    distance += 48;
    event = 'fell';
  }

  const playerProgress = direction > 0 ? runSpeed : -75;
  distance += (level.pursuerSpeed - playerProgress) * seconds;
  const minimumLead = level.finishX && player.x < level.finishX ? 30 : 0;
  distance = Math.max(minimumLead, distance);

  let phase = 'playing';
  if (distance >= level.maxDistance) {
    phase = 'lost';
    event = 'lost';
  } else if (distance <= 1 && (!level.finishX || player.x >= level.finishX)) {
    phase = 'caught';
    event = 'caught';
  }

  return {
    ...state,
    phase,
    player,
    distance,
    pursuerX: player.x + distance,
    checkpointX,
    energyTimerMs,
    collectedEnergyIds,
    elapsedMs: nextElapsedMs,
    hitCooldownMs,
    event,
  };
}
