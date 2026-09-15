import test from 'node:test';
import assert from 'node:assert/strict';

import { createTaunt, isTauntActive } from '../taunt.js';

test('Meng taunt expires after one point two seconds', () => {
  const taunt = createTaunt('孟培杰：追不上吧？', 5000);

  assert.equal(isTauntActive(taunt, 6199), true);
  assert.equal(isTauntActive(taunt, 6200), false);
});
