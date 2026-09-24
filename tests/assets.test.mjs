import test from 'node:test';
import assert from 'node:assert/strict';

import { BACKGROUND_SOURCES } from '../assets.js';

test('both story stages use lazy WebP backgrounds', () => {
  assert.deepEqual(Object.keys(BACKGROUND_SOURCES), ['gate', 'court', 'ginkgo', 'lakeside', 'bridge', 'riverside', 'clocktower']);
  for (const sources of Object.values(BACKGROUND_SOURCES)) {
    assert.match(sources[0], /\.webp$/);
    assert.ok(sources.length >= 1);
  }
});
