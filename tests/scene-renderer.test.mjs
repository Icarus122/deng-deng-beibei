import test from 'node:test';
import assert from 'node:assert/strict';

import { getParallaxOffsets } from '../scene-renderer.js';

test('parallax layers move at distinct speeds for a moving camera', () => {
  const offsets = getParallaxOffsets(1000);

  assert.deepEqual(offsets, { far: 160, middle: 480, foreground: 780 });
});
