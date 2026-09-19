import test from 'node:test';
import assert from 'node:assert/strict';

import { advanceCamera } from '../camera.js';
import { overlaps } from '../entities.js';
import { LEVELS, createGame, getPursuerRenderState, getPursuerTaunt, updateGame } from '../game-logic.js';
import { getHighRouteViolations, JOURNEY } from '../level-data.js';

test('journey has five visually and mechanically distinct regions', () => {
  assert.equal(JOURNEY.regions.length, 5);
  assert.deepEqual(JOURNEY.regions.map(({ id }) => id), ['gate', 'court', 'ginkgo', 'lakeside', 'bridge']);
  assert.equal(new Set(JOURNEY.regions.map(({ palette }) => palette)).size, 5);
  assert.equal(new Set(JOURNEY.regions.map(({ interaction }) => interaction)).size, 5);
});

test('shared hitboxes overlap only when their rectangles intersect', () => {
  assert.equal(overlaps({ x: 0, y: 0, width: 10, height: 10 }, { x: 8, y: 8, width: 10, height: 10 }), true);
  assert.equal(overlaps({ x: 0, y: 0, width: 10, height: 10 }, { x: 10, y: 0, width: 10, height: 10 }), false);
});

test('the continuous journey keeps five regions but fits a compact play session', () => {
  const journey = LEVELS[1];

  assert.ok(journey.worldEnd >= 20000);
  assert.ok(journey.worldEnd <= 26000);
  assert.equal(journey.districts.length, 5);
  assert.deepEqual(journey.districts.map((district) => district.name), ['校园入口', '篮球场', '银杏林路', '湖畔施工区', '黄昏天桥']);
  assert.ok(journey.checkpoints.length >= 6);
});

test('journey supplies dense elevated routes and varied hazards', () => {
  const elevatedPlatforms = JOURNEY.platforms.filter((platform) => platform.y < 470);

  assert.ok(elevatedPlatforms.length >= 24);
  assert.ok(JOURNEY.shortcutNodes.length >= 8);
  assert.ok(JOURNEY.obstacles.length >= 18);
});

test('every hand-authored high route stays within the double-jump reach budget', () => {
  assert.deepEqual(getHighRouteViolations(JOURNEY.platforms), []);
  assert.ok(JOURNEY.platforms.filter((platform) => platform.boost).length >= 40);
});

test('journey includes every announced interactive hazard type across all districts', () => {
  const types = new Set(JOURNEY.hazards.map((hazard) => hazard.type));

  for (const type of ['collapse', 'constructionBox', 'blocker', 'patrol']) assert.ok(types.has(type));
  assert.ok(new Set(JOURNEY.hazards.map((hazard) => hazard.district)).size >= 5);
});

test('intro route stays walkable until the first new hazard appears', () => {
  const firstHazardX = Math.min(...JOURNEY.hazards.map((hazard) => hazard.x));
  const openingGround = JOURNEY.platforms.find((platform) => platform.y === 510 && platform.x === 0);

  assert.ok(openingGround.x + openingGround.width >= firstHazardX);
});

test('auto-run reaches the first elevated hazard without falling', () => {
  let state = createGame(1);
  for (let step = 0; step < 180; step += 1) {
    state = updateGame(state, { left: false, right: false, jumpPressed: false }, 50);
  }

  assert.ok(state.player.x >= 1400);
  assert.notEqual(state.event, 'fell');
});

test('a low ramp is a walkable entrance to the high-speed route', () => {
  let state = createGame(1);
  state = { ...state, player: { ...state.player, x: 298, y: 478, grounded: true } };
  state = updateGame(state, { left: false, right: false, jumpPressed: false }, 50);

  assert.equal(state.player.y, 458);
  assert.ok(state.platformBoostTimerMs > 0);
});

test('allows exactly one air jump after a grounded jump', () => {
  let state = createGame(1);
  state = updateGame(state, { left: false, right: true, jumpPressed: true }, 16);
  assert.equal(state.player.jumpsUsed, 1);

  state = updateGame(state, { left: false, right: true, jumpPressed: true }, 16);
  assert.equal(state.player.jumpsUsed, 2);

  state = updateGame(state, { left: false, right: true, jumpPressed: true }, 16);
  assert.equal(state.player.jumpsUsed, 2);
});

test('coyote time accepts a jump shortly after leaving a platform', () => {
  let state = createGame(1);
  state = {
    ...state,
    player: { ...state.player, x: 1840, y: 478, grounded: false, jumpsUsed: 0, coyoteTimerMs: 80 },
  };

  state = updateGame(state, { left: false, right: false, jumpPressed: true }, 16);

  assert.equal(state.player.jumpsUsed, 1);
  assert.ok(state.player.velocityY < -400);
});

test('a jump pressed just before landing is buffered and launches on contact', () => {
  let state = createGame(1);
  state = {
    ...state,
    player: {
      ...state.player,
      x: 100,
      y: 470,
      velocityY: 100,
      grounded: false,
      jumpsUsed: 2,
      coyoteTimerMs: 0,
    },
  };

  state = updateGame(state, { left: false, right: false, jumpPressed: true }, 50);

  assert.equal(state.player.grounded, false);
  assert.equal(state.player.jumpsUsed, 1);
  assert.equal(state.player.velocityY, -500);
  assert.equal(state.player.landTimerMs, 120);
  assert.equal(state.player.dustTimerMs, 180);
});

test('releasing jump early creates a short hop and falling uses stronger gravity', () => {
  const shortHop = updateGame({
    ...createGame(1),
    player: { ...createGame(1).player, x: 100, y: 300, grounded: false, jumpsUsed: 1, coyoteTimerMs: 0, velocityY: -400 },
  }, { left: false, right: false, jumpPressed: false, jumpReleased: true }, 16);
  const falling = updateGame({
    ...createGame(1),
    player: { ...createGame(1).player, x: 100, y: 300, grounded: false, jumpsUsed: 1, coyoteTimerMs: 0, velocityY: 100 },
  }, { left: false, right: false, jumpPressed: false }, 50);

  assert.ok(shortHop.player.velocityY > -220);
  assert.equal(falling.player.velocityY, 187.5);
});

test('a hard obstacle collision briefly freezes the simulation and shakes the camera', () => {
  let state = createGame(1);
  state = { ...state, player: { ...state.player, x: 8200 } };
  state = updateGame(state, { left: false, right: false, jumpPressed: false }, 16);

  assert.equal(state.event, 'hit');
  assert.equal(state.hitStopMs, 50);
  assert.equal(state.shakeTimerMs, 90);
  const frozenX = state.player.x;
  state = updateGame(state, { left: false, right: false, jumpPressed: false }, 16);
  assert.equal(state.player.x, frozenX);
  assert.equal(state.hitStopMs, 34);
});

test('the long journey keeps Beibei moving forward without a held keyboard key', () => {
  const before = createGame(1);
  const after = updateGame(before, { left: false, right: false, jumpPressed: false }, 50);

  assert.ok(after.player.x > before.player.x);
});

test('holding left turns Beibei left and moves her back for precise positioning', () => {
  const before = createGame(1);
  const after = updateGame(before, { left: true, right: false, jumpPressed: false }, 50);

  assert.ok(after.player.x < before.player.x);
  assert.equal(after.player.facing, -1);
});

test('camera eases toward a runner who has passed the initial viewport', () => {
  const cameraX = advanceCamera(0, 2000, 50, 1280, 42000);

  assert.ok(cameraX > 0);
  assert.ok(cameraX < 1540);
});

test('touching a basketball launches it forward automatically', () => {
  let state = createGame(1);
  state = { ...state, player: { ...state.player, x: 6500 } };
  state = updateGame(state, { left: false, right: false, jumpPressed: false }, 16, { random: () => 0.9 });

  assert.equal(state.basketball.active, true);
  assert.ok(state.basketball.velocityX > 0);
});

test('banana peel records a mistake and temporarily slips Beibei', () => {
  let state = createGame(1);
  state = { ...state, player: { ...state.player, x: 11100 } };
  state = updateGame(state, { left: false, right: false, jumpPressed: false }, 16);

  assert.equal(state.event, 'slip');
  assert.equal(state.mistakes, 1);
  assert.ok(state.player.slipTimerMs > 0);
});

test('before 85 percent, Meng immediately opens a safe gap instead of allowing a catch', () => {
  let state = createGame(1);
  state = { ...state, player: { ...state.player, x: 18000 }, pursuer: { ...state.pursuer, x: 18040 } };
  state = updateGame(state, { left: false, right: false, jumpPressed: false }, 50, { random: () => 0 });

  assert.equal(state.phase, 'playing');
  assert.equal(state.pursuer.mode, 'evade');
  assert.ok(state.pursuer.x - state.player.x >= 150);
});

test('collecting a coin closes the gap and records Beibei coin progress', () => {
  let state = createGame(1);
  state = { ...state, player: { ...state.player, x: 1200, y: 424 } };
  state = updateGame(state, { left: false, right: false, jumpPressed: false }, 16);

  assert.equal(state.event, 'coin');
  assert.equal(state.coins, 1);
  assert.ok(state.distance < state.initialDistance);
});

test('jumping into a surprise block grants a coin and a short sprint', () => {
  let state = createGame(1);
  state = { ...state, player: { ...state.player, x: 2700, y: 378, velocityY: -260, grounded: false } };
  state = updateGame(state, { left: false, right: false, jumpPressed: false }, 16);

  assert.equal(state.event, 'surprise');
  assert.equal(state.coins, 1);
  assert.ok(state.energyTimerMs > 0);
});

test('landing on a spring launches Beibei into a high jump', () => {
  let state = createGame(1);
  state = { ...state, player: { ...state.player, x: 4600 } };
  state = updateGame(state, { left: false, right: false, jumpPressed: false }, 16);

  assert.equal(state.event, 'spring');
  assert.ok(state.player.velocityY < -500);
});

test('Meng render state stays on the ground when Beibei is in the air', () => {
  const renderPursuer = getPursuerRenderState({ x: 400, facing: 1, mode: 'cruise' });

  assert.equal(renderPursuer.y, 478);
  assert.equal(renderPursuer.grounded, true);
});

test('Meng has playful taunts that change across the chase', () => {
  assert.equal(getPursuerTaunt(0.12), '孟培杰：等等？你也太慢啦！');
  assert.equal(getPursuerTaunt(0.55), '孟培杰：前面有惊喜方块，敢不敢顶？');
  assert.equal(getPursuerTaunt(0.9), '孟培杰：快追上了？那就来呀！');
});

test('a close approach after 85 percent catches Meng', () => {
  let state = createGame(1);
  state = { ...state, player: { ...state.player, x: 20500 }, pursuer: { ...state.pursuer, x: 20550 } };
  state = updateGame(state, { left: false, right: false, jumpPressed: false }, 50, { random: () => 0 });

  assert.equal(state.phase, 'caught');
});

test('the catch window does not use injected randomness', () => {
  let state = createGame(1);
  state = { ...state, player: { ...state.player, x: 20500 }, pursuer: { ...state.pursuer, x: 20550 } };
  state = updateGame(state, { left: false, right: false, jumpPressed: false }, 50, { random: () => 0.34 });

  assert.equal(state.phase, 'caught');
});

test('a close approach at 85 percent catches Meng without a dice roll', () => {
  let state = createGame(1);
  state = { ...state, player: { ...state.player, x: 20500 }, pursuer: { ...state.pursuer, x: 20550 } };
  state = updateGame(state, { left: false, right: false, jumpPressed: false }, 50, { random: () => 0.99 });
  assert.equal(state.phase, 'caught');
  assert.equal(state.event, 'caught');
});

test('after 85 percent, Meng no longer gets an automatic escape burst', () => {
  let state = createGame(1);
  state = { ...state, player: { ...state.player, x: 20500 }, pursuer: { ...state.pursuer, x: 20550 } };
  state = updateGame(state, { left: false, right: false, jumpPressed: false }, 50, { random: () => 0.99 });

  assert.equal(state.phase, 'caught');
  assert.notEqual(state.pursuer.mode, 'evade');
});

test('the final bridge does not force a catch before close contact', () => {
  let state = createGame(1);
  state = { ...state, player: { ...state.player, x: 23000 }, pursuer: { ...state.pursuer, x: 23160 } };
  state = updateGame(state, { left: false, right: false, jumpPressed: false }, 16);

  assert.equal(state.phase, 'playing');
  assert.ok(state.distance > 120);
});

test('collecting Beibei energy starts a sprint and closes the gap', () => {
  let state = createGame(1);
  state = { ...state, player: { ...state.player, x: 4100 } };
  state = updateGame(state, { left: false, right: true, jumpPressed: false }, 16);

  assert.equal(state.event, 'energy');
  assert.ok(state.energyTimerMs > 0);
  assert.ok(state.distance < state.initialDistance);
});

test('a collected Beibei energy stays collected on later frames', () => {
  let state = createGame(1);
  state = { ...state, player: { ...state.player, x: 4100 } };
  state = updateGame(state, { left: false, right: true, jumpPressed: false }, 16);
  state = updateGame(state, { left: false, right: true, jumpPressed: false }, 16);

  assert.deepEqual(state.collectedEnergyIds, ['energy-1']);
});

test('falling returns Beibei to her checkpoint and widens the gap', () => {
  let state = createGame(1);
  state = {
    ...state,
    checkpointX: 420,
    player: { ...state.player, y: 700 },
    pursuer: { ...state.pursuer, x: 1200 },
  };
  state = updateGame(state, { left: false, right: false, jumpPressed: false }, 16);

  assert.equal(state.event, 'fell');
  assert.equal(state.player.x, 420);
  assert.ok(state.distance > state.initialDistance);
  assert.equal(state.phase, 'playing');
});

test('falling behind loses immediately and the finish line does not auto-win', () => {
  let lost = createGame(1);
  lost = { ...lost, distance: lost.maxDistance - 1, pursuer: { ...lost.pursuer, x: lost.player.x + lost.maxDistance - 1 } };
  lost = updateGame(lost, { left: true, right: false, jumpPressed: false }, 50);
  assert.equal(lost.phase, 'lost');

  let early = createGame(1);
  early = { ...early, distance: 1, player: { ...early.player, x: 1000 } };
  early = updateGame(early, { left: false, right: true, jumpPressed: false }, 50);
  assert.equal(early.phase, 'playing');

  let finish = createGame(1);
  finish = { ...finish, player: { ...finish.player, x: LEVELS[1].finishX }, pursuer: { ...finish.pursuer, x: LEVELS[1].finishX + finish.maxDistance } };
  finish = updateGame(finish, { left: false, right: true, jumpPressed: false }, 50);
  assert.equal(finish.phase, 'playing');
});
