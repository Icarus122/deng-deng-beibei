import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { drawCharacter, getCharacterPose, getRunFrameIndex, getRunFrameRect, RUN_CYCLE_DISTANCE_PX, RUN_FRAME_DISTANCE_PX } from '../character-renderer.js';

test('character pose comes from each character state rather than the other runner', () => {
  assert.equal(getCharacterPose({ grounded: true, slipTimerMs: 0, mode: 'cruise' }), 'run');
  assert.equal(getCharacterPose({ grounded: false, velocityY: -160, slipTimerMs: 0, mode: 'cruise' }), 'jump-up');
  assert.equal(getCharacterPose({ grounded: false, velocityY: 0, slipTimerMs: 0, mode: 'cruise' }), 'jump-apex');
  assert.equal(getCharacterPose({ grounded: false, velocityY: 160, slipTimerMs: 0, mode: 'cruise' }), 'fall');
  assert.equal(getCharacterPose({ grounded: true, slipTimerMs: 600, mode: 'cruise' }), 'slip');
  assert.equal(getCharacterPose({ grounded: true, slipTimerMs: 0, mode: 'downed' }), 'downed');
});

test('running animation advances through twelve distance-driven full-body frames', () => {
  assert.equal(getRunFrameIndex(0), 0);
  assert.equal(RUN_CYCLE_DISTANCE_PX, 96);
  assert.equal(RUN_FRAME_DISTANCE_PX, 8);
  for (let index = 0; index < 12; index += 1) assert.equal(getRunFrameIndex(index * RUN_FRAME_DISTANCE_PX), index);
  assert.equal(getRunFrameIndex(RUN_CYCLE_DISTANCE_PX), 0);
  assert.equal(getRunFrameIndex(-RUN_FRAME_DISTANCE_PX), 1);
  assert.equal(getRunFrameRect('beibei', 11).x, 720);
  assert.equal(getRunFrameRect('beibei', 11).y, 640);
  assert.equal(getRunFrameRect('meng', 12).x, 0);
  assert.equal(getRunFrameRect('unknown', 0), null);
});

test('replacement atlases use the shared 4 by 3 transparent-HD frame specification', async () => {
  for (const runner of ['beibei', 'meng']) {
    const bytes = await readFile(new URL(`../assets/${runner}-run-cycle-v3.png`, import.meta.url));

    assert.equal(bytes.readUInt32BE(16), 960);
    assert.equal(bytes.readUInt32BE(20), 960);
    assert.equal(bytes[25], 6, 'the PNG must retain an RGBA alpha channel');
  }
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
  const image = { naturalWidth: 960, naturalHeight: 960 };

  drawCharacter(ctx, { x: 120, y: 200, grounded: true, facing: 1, slipTimerMs: 0, runDistanceTravelled: 24 }, { still: image, runnerId: 'beibei', runCycle: image });

  assert.equal(drawCalls.length, 1);
  assert.deepEqual(drawCalls[0].slice(1, 5), [720, 0, 240, 320]);
  assert.deepEqual(drawCalls[0].slice(5, 9), [-33, -88, 66, 88]);
});

test('running character does not draw legacy fallback blocks while art is unavailable', () => {
  const fallbackDraws = [];
  const ctx = {
    save() {}, translate() {}, scale() {}, rotate() {}, restore() {},
    drawImage() { throw new Error('an unloaded image must not be drawn'); },
    fillRect(...args) { fallbackDraws.push(args); },
    set fillStyle(value) {},
  };
  const unavailableImage = { naturalWidth: 0, naturalHeight: 0 };

  drawCharacter(ctx, { x: 120, y: 200, grounded: true, facing: 1, slipTimerMs: 0 }, { runnerId: 'beibei', still: unavailableImage, runCycle: unavailableImage }, 0);

  assert.equal(fallbackDraws.length, 0, 'the loading gate should prevent old fallback blocks from appearing');
});
