import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { drawCharacter, getCharacterPose, getRunFrameIndex } from '../character-renderer.js';

test('character pose comes from each character state rather than the other runner', () => {
  assert.equal(getCharacterPose({ grounded: true, slipTimerMs: 0, mode: 'cruise' }), 'run');
  assert.equal(getCharacterPose({ grounded: false, slipTimerMs: 0, mode: 'cruise' }), 'jump');
  assert.equal(getCharacterPose({ grounded: true, slipTimerMs: 600, mode: 'cruise' }), 'slip');
  assert.equal(getCharacterPose({ grounded: true, slipTimerMs: 0, mode: 'downed' }), 'downed');
});

test('running animation advances through the four full-body sprite frames', () => {
  assert.equal(getRunFrameIndex(0), 0);
  assert.equal(getRunFrameIndex(46), 1);
  assert.equal(getRunFrameIndex(92), 2);
  assert.equal(getRunFrameIndex(138), 3);
  assert.equal(getRunFrameIndex(184), 0);
});

test('running animation keeps each whole-character frame crisp', async () => {
  const source = await readFile(new URL('../character-renderer.js', import.meta.url), 'utf8');
  const runCycle = source.match(/function drawRunCycle[\s\S]*?\n}/);

  assert.ok(runCycle, 'drawRunCycle should remain available');
  assert.doesNotMatch(runCycle[0], /globalAlpha/, 'whole-character frames must not be crossfaded');
});

test('running character draws without relying on a browser global', () => {
  const drawCalls = [];
  const ctx = {
    save() {}, translate() {}, scale() {}, rotate() {}, restore() {}, fillRect() {},
    drawImage(...args) { drawCalls.push(args); },
    set fillStyle(value) {},
  };
  const image = { naturalWidth: 400, naturalHeight: 120 };

  drawCharacter(ctx, { x: 120, y: 200, grounded: true, facing: 1, slipTimerMs: 0 }, { still: image, runCycle: image }, 0);

  assert.equal(drawCalls.length, 1);
});

test('running character remains visible while its portrait image is unavailable', () => {
  const fallbackDraws = [];
  const ctx = {
    save() {}, translate() {}, scale() {}, rotate() {}, restore() {},
    drawImage() { throw new Error('an unloaded image must not be drawn'); },
    fillRect(...args) { fallbackDraws.push(args); },
    set fillStyle(value) {},
  };
  const unavailableImage = { naturalWidth: 0, naturalHeight: 0 };

  drawCharacter(ctx, { x: 120, y: 200, grounded: true, facing: 1, slipTimerMs: 0 }, { runnerId: 'beibei', still: unavailableImage, runCycle: unavailableImage }, 0);

  assert.ok(fallbackDraws.length > 0, 'a code-drawn runner should cover slow or failed image loads');
});
