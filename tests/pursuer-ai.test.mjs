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

test('Meng independently jumps toward a shortcut platform before 70 percent', () => {
  const level = {
    finishX: 23500,
    platforms: [{ id: 'shortcut-a', x: 400, y: 400, width: 180, height: 20 }],
    shortcutNodes: [{ platformId: 'shortcut-a', start: 380, end: 520 }],
  };
  const next = updatePursuer(createPursuer(420), { x: 1000 }, 1000 / 60, level);

  assert.equal(next.targetPlatformId, 'shortcut-a');
  assert.ok(next.velocityY < 0);
  assert.notEqual(next.y, 478);
});

test('Meng moves on from a finished shortcut to the next high route', () => {
  const level = {
    finishX: 23500,
    platforms: [
      { id: 'shortcut-a', x: 400, y: 400, width: 120, height: 20 },
      { id: 'shortcut-b', x: 650, y: 400, width: 160, height: 20 },
    ],
    shortcutNodes: [{ platformId: 'shortcut-b', start: 620, end: 720 }],
  };
  const pursuer = { ...createPursuer(630), y: 368, grounded: true, targetPlatformId: 'shortcut-a' };
  const next = updatePursuer(pursuer, { x: 1000 }, 1000 / 60, level);

  assert.equal(next.targetPlatformId, 'shortcut-b');
  assert.ok(next.velocityY < 0);
});
