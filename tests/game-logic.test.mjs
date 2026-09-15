import test from 'node:test';
import assert from 'node:assert/strict';

import { createGame, updateGame } from '../game-logic.js';

test('allows exactly one air jump after a grounded jump', () => {
  let state = createGame(1);
  state = updateGame(state, { left: false, right: true, jumpPressed: true }, 16);
  assert.equal(state.player.jumpsUsed, 1);

  state = updateGame(state, { left: false, right: true, jumpPressed: true }, 16);
  assert.equal(state.player.jumpsUsed, 2);

  state = updateGame(state, { left: false, right: true, jumpPressed: true }, 16);
  assert.equal(state.player.jumpsUsed, 2);
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

test('ending thresholds produce a loss or a catch', () => {
  let lost = createGame(1);
  lost = { ...lost, distance: lost.maxDistance - 1 };
  lost = updateGame(lost, { left: true, right: false, jumpPressed: false }, 50);
  assert.equal(lost.phase, 'lost');

  let caught = createGame(1);
  caught = { ...caught, distance: 1 };
  caught = updateGame(caught, { left: false, right: true, jumpPressed: false }, 50);
  assert.equal(caught.phase, 'caught');
});
