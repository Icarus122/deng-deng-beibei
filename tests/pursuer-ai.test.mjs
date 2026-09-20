import test from 'node:test';
import assert from 'node:assert/strict';

import { createPursuer, getPursuitRhythm, updatePursuer } from '../pursuer-ai.js';
import { JOURNEY } from '../level-data.js';
import { getRenderPlatforms } from '../game-logic.js';

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

test('Meng keeps an independent ground-running distance and pauses it while airborne', () => {
  const grounded = updatePursuer(createPursuer(500), { x: 300 }, 50);
  const airborne = updatePursuer({ ...createPursuer(500), y: 300, grounded: false, velocityY: -20 }, { x: 300 }, 50);

  assert.ok(Math.abs(grounded.runDistanceTravelled - 6.8) < 1e-9);
  assert.equal(airborne.runDistanceTravelled, 0);
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

test('Meng plans an independent double jump across a 160px pit despite a midair speed change', () => {
  const level = {
    finishX: 5000,
    platforms: [
      { id: 'near-bank', x: 2265, y: 510, width: 440, height: 22 },
      { id: 'far-bank', x: 2865, y: 510, width: 600, height: 22 },
    ],
  };
  for (const frameMs of [1000 / 60, 1000 / 30]) {
    let pursuer = { ...createPursuer(2484), groundedPlatformId: 'near-bank', cycleElapsedMs: 13800 };
    let sawDoubleJump = false;
    let fellBelowWorld = false;
    for (let time = 0; time < 3500; time += frameMs) {
      pursuer = updatePursuer(pursuer, { x: 0 }, frameMs, level);
      sawDoubleJump ||= pursuer.jumpsUsed === 2;
      fellBelowWorld ||= pursuer.y > 600;
    }

    assert.equal(sawDoubleJump, true, `${Math.round(1000 / frameMs)} FPS: use the planned second jump`);
    assert.equal(fellBelowWorld, false, `${Math.round(1000 / frameMs)} FPS: do not fall into the pit`);
    assert.equal(pursuer.grounded, true, `${Math.round(1000 / frameMs)} FPS: land on the far bank`);
    assert.equal(pursuer.groundedPlatformId, 'far-bank');
  }
});

test('Meng keeps valid platform footing, descends from every upper route, and clears pits at 30 and 60 FPS', () => {
  const routeNodes = JOURNEY.shortcutNodes.filter((node) => node.route);

  for (const fps of [30, 60]) {
    const stepMs = 1000 / fps;
    let pursuer = createPursuer(0);
    let previousPlatforms = getRenderPlatforms(1, 0, {});
    let highestJumpFromGround = 0;
    let fellOutOfWorld = false;
    const routeResults = Object.fromEntries(routeNodes.map((node) => [node.route, {
      reached: false,
      returnedToGround: false,
      stayedHighAfterExit: false,
    }]));

    for (let timeMs = stepMs; timeMs < 190000 && pursuer.x < JOURNEY.finishX; timeMs += stepMs) {
      const platforms = getRenderPlatforms(1, timeMs, {});
      pursuer = updatePursuer(pursuer, { x: pursuer.x - 260, facing: 1 }, stepMs, {
        ...JOURNEY,
        platforms,
        previousPlatforms,
      });
      previousPlatforms = platforms;

      const support = platforms.find((platform) => platform.id === pursuer.groundedPlatformId);
      if (pursuer.grounded) {
        assert.ok(support, `${fps} FPS at x=${pursuer.x}: grounded state has no platform`);
        assert.ok(pursuer.x + 24 > support.x && pursuer.x < support.x + support.width,
          `${fps} FPS at x=${pursuer.x}: grounded state is outside platform ${support.id}`);
        assert.ok(Math.abs(pursuer.y + 32 - support.y) <= 3,
          `${fps} FPS at x=${pursuer.x}: feet are not on platform ${support.id}`);
      }
      if (pursuer.y > 600) fellOutOfWorld = true;
      highestJumpFromGround = Math.max(highestJumpFromGround, 478 - pursuer.y);

      for (const route of routeNodes) {
        const result = routeResults[route.route];
        if (support?.route === route.route) result.reached = true;
        if (pursuer.x > route.end + 20 && pursuer.x < route.end + 120 && support?.route === route.route) {
          result.stayedHighAfterExit = true;
        }
        if (route.route !== 'bridge-route'
          && pursuer.x > route.end + 20
          && pursuer.x < route.end + 260
          && support?.kind === 'ground') result.returnedToGround = true;
      }
    }

    assert.equal(fellOutOfWorld, false, `${fps} FPS: Meng must not fall into a pit`);
    assert.ok(highestJumpFromGround <= 285, `${fps} FPS: route/avoidance jump grew to ${highestJumpFromGround}px`);
    for (const route of routeNodes) {
      const result = routeResults[route.route];
      assert.equal(result.reached, true, `${fps} FPS: did not ride ${route.route}`);
      assert.equal(result.stayedHighAfterExit, false, `${fps} FPS: remained on ${route.route} after its exit`);
      if (route.route !== 'bridge-route') {
        assert.equal(result.returnedToGround, true, `${fps} FPS: did not descend from ${route.route}`);
      }
    }
  }
});
