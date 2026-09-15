import test from 'node:test';
import assert from 'node:assert/strict';

import { createPursuer, updatePursuer } from '../pursuer-ai.js';

test('pursuer enters a brief evade state when Beibei gets close', () => {
  const pursuer = createPursuer(500);
  const next = updatePursuer(pursuer, { x: 360, facing: 1 }, 50);

  assert.equal(next.mode, 'evade');
  assert.ok(next.velocity > pursuer.velocity);
});

test('a downed pursuer does not copy Beibei running movement', () => {
  const pursuer = { ...createPursuer(500), mode: 'downed', modeTimerMs: 800 };
  const next = updatePursuer(pursuer, { x: 430, facing: 1 }, 50);

  assert.equal(next.x, 500);
  assert.equal(next.mode, 'downed');
});
