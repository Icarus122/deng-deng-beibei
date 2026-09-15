import test from 'node:test';
import assert from 'node:assert/strict';

import { advanceCamera } from '../camera.js';
import { LEVELS, createGame, updateGame } from '../game-logic.js';

test('the continuous journey spans three named districts with enough distance for a long play session', () => {
  const journey = LEVELS[1];

  assert.ok(journey.worldEnd >= 40000);
  assert.equal(journey.districts.length, 3);
  assert.deepEqual(journey.districts.map((district) => district.name), ['校园入口', '林荫操场', '黄昏天桥']);
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

test('collecting Beibei energy starts a sprint and closes the gap', () => {
  let state = createGame(1);
  state = { ...state, player: { ...state.player, x: 260 } };
  state = updateGame(state, { left: false, right: true, jumpPressed: false }, 16);

  assert.equal(state.event, 'energy');
  assert.ok(state.energyTimerMs > 0);
  assert.ok(state.distance < state.initialDistance);
});

test('a collected Beibei energy stays collected on later frames', () => {
  let state = createGame(1);
  state = { ...state, player: { ...state.player, x: 260 } };
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
  };
  state = updateGame(state, { left: false, right: false, jumpPressed: false }, 16);

  assert.equal(state.event, 'fell');
  assert.equal(state.player.x, 420);
  assert.ok(state.distance > state.initialDistance);
});

test('falling behind loses immediately but catching is reserved for the journey finish', () => {
  let lost = createGame(1);
  lost = { ...lost, distance: lost.maxDistance - 1 };
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
