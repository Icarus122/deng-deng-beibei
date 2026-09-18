import test from 'node:test';
import assert from 'node:assert/strict';

import { BACKGROUND_SOURCES } from '../assets.js';

test('each region uses lazy WebP backgrounds with a PNG compatibility fallback', () => {
  assert.deepEqual(Object.keys(BACKGROUND_SOURCES), ['gate', 'court', 'ginkgo', 'lakeside', 'bridge']);
  for (const sources of Object.values(BACKGROUND_SOURCES)) {
    assert.match(sources[0], /\.webp$/);
    assert.match(sources[1], /\.png$/);
  }
});
