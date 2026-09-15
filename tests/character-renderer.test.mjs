import test from 'node:test';
import assert from 'node:assert/strict';

import { getCharacterPose } from '../character-renderer.js';

test('character pose comes from each character state rather than the other runner', () => {
  assert.equal(getCharacterPose({ grounded: true, slipTimerMs: 0, mode: 'cruise' }), 'run');
  assert.equal(getCharacterPose({ grounded: false, slipTimerMs: 0, mode: 'cruise' }), 'jump');
  assert.equal(getCharacterPose({ grounded: true, slipTimerMs: 600, mode: 'cruise' }), 'slip');
  assert.equal(getCharacterPose({ grounded: true, slipTimerMs: 0, mode: 'downed' }), 'downed');
});
