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
