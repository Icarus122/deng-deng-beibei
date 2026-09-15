import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { getCharacterPose, getRunFrameIndex } from '../character-renderer.js';

test('character pose comes from each character state rather than the other runner', () => {
  assert.equal(getCharacterPose({ grounded: true, slipTimerMs: 0, mode: 'cruise' }), 'run');
  assert.equal(getCharacterPose({ grounded: false, slipTimerMs: 0, mode: 'cruise' }), 'jump');
  assert.equal(getCharacterPose({ grounded: true, slipTimerMs: 600, mode: 'cruise' }), 'slip');
  assert.equal(getCharacterPose({ grounded: true, slipTimerMs: 0, mode: 'downed' }), 'downed');
});

test('running animation advances through the four full-body sprite frames', () => {
  assert.equal(getRunFrameIndex(0), 0);
  assert.equal(getRunFrameIndex(95), 1);
  assert.equal(getRunFrameIndex(190), 2);
  assert.equal(getRunFrameIndex(285), 3);
  assert.equal(getRunFrameIndex(380), 0);
});

test('running animation keeps each whole-character frame crisp', async () => {
  const source = await readFile(new URL('../character-renderer.js', import.meta.url), 'utf8');
  const runCycle = source.match(/function drawRunCycle[\s\S]*?\n}\r?\n\r?\nexport function drawCharacter/);

  assert.ok(runCycle, 'drawRunCycle should remain available');
  assert.doesNotMatch(runCycle[0], /globalAlpha/, 'whole-character frames must not be crossfaded');
});
