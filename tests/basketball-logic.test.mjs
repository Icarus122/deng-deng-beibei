import test from 'node:test';
import assert from 'node:assert/strict';

import { createBasketball, updateBasketball } from '../basketball-logic.js';
import { createPursuer } from '../pursuer-ai.js';

const player = { x: 100, y: 478, width: 24, height: 32, facing: 1 };

test('automatic kick starts in front of Beibei and gives the ball an arc and spin', () => {
  const pursuer = createPursuer(360);
  const ball = createBasketball(player, pursuer);
  const moved = updateBasketball(ball, pursuer, { ...pursuer, x: pursuer.x + 6.8 }, 50, 2000);

  assert.ok(ball.x > player.x + player.width);
  assert.ok(ball.velocityX > 150);
  assert.ok(moved.ball.x > ball.x + 30);
  assert.ok(moved.ball.y < ball.y);
  assert.ok(moved.ball.rotation > 0);
});

test('swept basketball hit reaches Meng on a high platform at 30 FPS', () => {
  let previousPursuer = { ...createPursuer(360), y: 378 };
  let pursuer = { ...previousPursuer };
  let ball = createBasketball(player, pursuer);
  let result = null;
  for (let frame = 0; frame < 24 && ball; frame += 1) {
    const nextPursuer = { ...pursuer, x: pursuer.x + 136 / 30 };
    result = updateBasketball(ball, previousPursuer, nextPursuer, 1000 / 30, 2000, () => 0.9);
    ball = result.ball;
    previousPursuer = pursuer;
    pursuer = result.pursuer ?? nextPursuer;
    if (result.event !== 'none') break;
  }

  assert.equal(result.event, 'pursuerSlowed');
  assert.equal(result.ball, null);
  assert.equal(pursuer.mode, 'slowed');
});

test('missed basketball expires instead of remaining active forever', () => {
  const pursuer = { ...createPursuer(360), y: -800 };
  let ball = createBasketball(player, pursuer);
  for (let frame = 0; frame < 60 && ball; frame += 1) {
    ball = updateBasketball(ball, pursuer, pursuer, 50, 2000).ball;
  }

  assert.equal(ball, null);
});
