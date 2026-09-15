import test from 'node:test';
import assert from 'node:assert/strict';

import { advanceSimulationClock, createSimulationClock } from '../simulation-clock.js';

test('simulation clock advances at sixty frames per second by default', () => {
  const result = advanceSimulationClock(createSimulationClock(), 1000 / 60);

  assert.equal(result.targetFps, 60);
  assert.equal(result.steps, 1);
  assert.ok(Math.abs(result.stepMs - 1000 / 60) < 0.01);
});

test('simulation clock falls back to thirty frames per second after sustained slow frames', () => {
  let clock = createSimulationClock();
  for (let frame = 0; frame < 45; frame += 1) {
    clock = advanceSimulationClock(clock, 36).clock;
  }

  const result = advanceSimulationClock(clock, 36);
  assert.equal(result.targetFps, 30);
  assert.ok(Math.abs(result.stepMs - 1000 / 30) < 0.01);
});

test('simulation clock returns to sixty frames per second after sustained recovery', () => {
  let clock = { ...createSimulationClock(), targetFps: 30 };
  for (let frame = 0; frame < 180; frame += 1) {
    clock = advanceSimulationClock(clock, 16).clock;
  }

  const result = advanceSimulationClock(clock, 16);
  assert.equal(result.targetFps, 60);
});
