import test from 'node:test';
import assert from 'node:assert/strict';

import { createPursuer, getPursuitRhythm, updatePursuer } from '../pursuer-ai.js';
import { JOURNEY } from '../level-data.js';

test('pursuer follows a learnable twelve-second cruise then three-second burst rhythm', () => {
  const pursuer = createPursuer(500);
  const close = updatePursuer(pursuer, { x: 360, facing: 1 }, 50);
  const burst = updatePursuer({ ...pursuer, cycleElapsedMs: 11950 }, { x: 360, facing: 1 }, 50);
  const reset = updatePursuer({ ...pursuer, cycleElapsedMs: 14950 }, { x: 360, facing: 1 }, 50);

  assert.equal(close.mode, 'cruise');
  assert.equal(burst.mode, 'evade');
  assert.equal(burst.velocity, 205);
  assert.equal(reset.mode, 'cruise');
  assert.equal(getPursuitRhythm(12000, 0.5), 'evade');
});

test('pursuer uses the catchable final pace after 85 percent progress', () => {
  const beforeWindow = updatePursuer(createPursuer(19000), { x: 19974, facing: 1 }, 50, { finishX: 23500 });
  const next = updatePursuer(createPursuer(20000), { x: 19975, facing: 1 }, 50, { finishX: 23500 });

  assert.notEqual(beforeWindow.mode, 'finalChase');
  assert.equal(next.mode, 'finalChase');
  assert.equal(next.velocity, 170);
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

test('Meng autonomously rides the bridge spring route without player input', () => {
  let pursuer = createPursuer(19500);
  const player = { x: 19100, facing: 1 };
  for (let frame = 0; frame < 20; frame += 1) pursuer = updatePursuer(pursuer, player, 50, JOURNEY);

  assert.equal(pursuer.targetRoute, 'bridge-upper-route');
  assert.ok(pursuer.y < 380);
  assert.ok(pursuer.x > 19570);
});
