import test from 'node:test';
import assert from 'node:assert/strict';

import { advanceCamera } from '../camera.js';
import { overlaps } from '../entities.js';
import { LEVELS, createGame, updateGame } from '../game-logic.js';
import { JOURNEY } from '../level-data.js';

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

test('the continuous journey spans five named regions with enough distance for a long play session', () => {
  const journey = LEVELS[1];

  assert.ok(journey.worldEnd >= 40000);
  assert.equal(journey.districts.length, 5);
  assert.deepEqual(journey.districts.map((district) => district.name), ['校园入口', '篮球场', '银杏林路', '湖畔施工区', '黄昏天桥']);
  assert.ok(journey.checkpoints.length >= 6);
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
  state = { ...state, player: { ...state.player, x: 10000 } };
  state = updateGame(state, { left: false, right: false, jumpPressed: false }, 16, { random: () => 0.9 });

  assert.equal(state.basketball.active, true);
  assert.ok(state.basketball.velocityX > 0);
});

test('banana peel records a mistake and temporarily slips Beibei', () => {
  let state = createGame(1);
  state = { ...state, player: { ...state.player, x: 19400 } };
  state = updateGame(state, { left: false, right: false, jumpPressed: false }, 16);

  assert.equal(state.event, 'slip');
  assert.equal(state.mistakes, 1);
  assert.ok(state.player.slipTimerMs > 0);
});

test('catch rolls cannot succeed before 70 percent progress', () => {
  let state = createGame(1);
  state = { ...state, player: { ...state.player, x: 32000 }, pursuer: { ...state.pursuer, x: 32100 } };
  state = updateGame(state, { left: false, right: false, jumpPressed: false }, 50, { random: () => 0 });

  assert.equal(state.phase, 'playing');
});

test('catch rolls can win after 70 percent when injected random succeeds', () => {
  let state = createGame(1);
  state = { ...state, player: { ...state.player, x: 34000 }, pursuer: { ...state.pursuer, x: 34100 } };
  state = updateGame(state, { left: false, right: false, jumpPressed: false }, 50, { random: () => 0 });

  assert.equal(state.phase, 'caught');
});

test('collecting Beibei energy starts a sprint and closes the gap', () => {
  let state = createGame(1);
  state = { ...state, player: { ...state.player, x: 5400 } };
  state = updateGame(state, { left: false, right: true, jumpPressed: false }, 16);

  assert.equal(state.event, 'energy');
  assert.ok(state.energyTimerMs > 0);
  assert.ok(state.distance < state.initialDistance);
});

test('a collected Beibei energy stays collected on later frames', () => {
  let state = createGame(1);
  state = { ...state, player: { ...state.player, x: 5400 } };
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

test('falling behind loses immediately but catching is reserved for the journey finish', () => {
  let lost = createGame(1);
  lost = { ...lost, distance: lost.maxDistance - 1, pursuer: { ...lost.pursuer, x: lost.player.x + lost.maxDistance - 1 } };
  lost = updateGame(lost, { left: true, right: false, jumpPressed: false }, 50);
  assert.equal(lost.phase, 'lost');

  let early = createGame(1);
  early = { ...early, distance: 1, player: { ...early.player, x: 1000 } };
  early = updateGame(early, { left: false, right: true, jumpPressed: false }, 50);
  assert.equal(early.phase, 'playing');

  let finish = createGame(1);
  finish = { ...finish, distance: 1, player: { ...finish.player, x: LEVELS[1].finishX } };
  finish = updateGame(finish, { left: false, right: true, jumpPressed: false }, 50);
  assert.equal(finish.phase, 'caught');
});
