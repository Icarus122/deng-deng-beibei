import test from 'node:test';
import assert from 'node:assert/strict';

import { findLandingPlatform } from '../platform-physics.js';

const platform = { id: 'upper', x: 100, y: 310, width: 180, height: 22, oneWay: true, oneWayGroup: 'upper-route' };

test('player and pursuer landing both require crossing the platform top while falling', () => {
  const fallingFromAbove = { x: 120, y: 280, width: 24, height: 32, velocityY: 160, grounded: false };
  const risingFromBelow = { ...fallingFromAbove, y: 320, velocityY: -160 };

  assert.equal(findLandingPlatform(fallingFromAbove, [platform], 305), platform);
  assert.equal(findLandingPlatform(risingFromBelow, [platform], 350), null);
});

test('down-through ignores one connected one-way group but still accepts a lower surface', () => {
  const connected = { ...platform, id: 'upper-next', x: 260, width: 180 };
  const lower = { id: 'lower', x: 100, y: 410, width: 340, height: 22, oneWay: true, oneWayGroup: 'lower-route' };
  const falling = { x: 120, y: 380, width: 24, height: 32, velocityY: 200, grounded: false };

  assert.equal(findLandingPlatform(falling, [platform, connected, lower], 408, 'upper-route'), lower);
});

test('a moving platform uses relative motion to catch a falling runner at 30 FPS', () => {
  const oldPlatform = { ...platform, x: 100, y: 310 };
  const newPlatform = { ...platform, x: 118, y: 310 };
  const previous = { x: 78, y: 270, width: 24, height: 32 };
  const current = { ...previous, x: 96, y: 285, velocityY: 300, grounded: false };

  assert.equal(findLandingPlatform(current, [newPlatform], 302, null, previous, [oldPlatform]), newPlatform);
});

test('landing checks horizontal overlap at the actual crossing time', () => {
  const previous = { x: 50, y: 273, width: 24, height: 32 };
  const sweptThroughAir = { ...previous, x: 80, y: 283, velocityY: 220, grounded: false };

  assert.equal(findLandingPlatform(sweptThroughAir, [platform], 305, null, previous), null);
});

test('stacked platforms choose the first surface crossed by the falling path', () => {
  const lower = { id: 'lower', x: 100, y: 350, width: 180, height: 22, oneWay: true };
  const higher = { id: 'higher', x: 100, y: 310, width: 180, height: 22, oneWay: true };
  const falling = { x: 120, y: 330, width: 24, height: 32, velocityY: 240, grounded: false };
  const previous = { x: 120, y: 280, width: 24, height: 32 };

  assert.equal(findLandingPlatform(falling, [lower, higher], 312, null, previous), higher);
});
