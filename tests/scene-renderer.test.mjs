import test from 'node:test';
import assert from 'node:assert/strict';

import { drawScene, getCoverSourceRect, getParallaxOffsets } from '../scene-renderer.js';

test('parallax layers move at distinct speeds for a moving camera', () => {
  const offsets = getParallaxOffsets(1000);

  assert.deepEqual(offsets, { far: 160, middle: 480, foreground: 780 });
});

test('cover crop center-crops tall 16:9 paintings to the wide game viewport', () => {
  const crop = getCoverSourceRect(1672, 941, 1550, 1550 * 540 / 1300);

  assert.equal(crop.x, 0);
  assert.equal(crop.width, 1672);
  assert.equal(crop.height, 1672 * 540 / 1300);
  assert.equal(crop.y, (941 - crop.height) / 2);
  assert.ok(Math.abs(crop.width / crop.height - 1300 / 540) < 1e-12);
});

test('cover crop center-crops wide source images without stretching', () => {
  const crop = getCoverSourceRect(3000, 900, 1550, 1550 * 540 / 1300);

  assert.equal(crop.y, 0);
  assert.equal(crop.height, 900);
  assert.equal(crop.width, 900 * 1300 / 540);
  assert.equal(crop.x, (3000 - crop.width) / 2);
  assert.ok(Math.abs(crop.width / crop.height - 1300 / 540) < 1e-12);
});

test('HD scene draws a centered source crop into the drift overscan frame', () => {
  const drawCalls = [];
  const ctx = {
    drawImage: (...args) => drawCalls.push(args),
    fillRect: () => {},
    createLinearGradient: () => ({ addColorStop: () => {} }),
    save() {}, restore() {}, beginPath() {}, moveTo() {}, quadraticCurveTo() {}, stroke() {},
    fill() {}, translate() {}, rotate() {},
  };
  const image = { naturalWidth: 1672, naturalHeight: 941 };

  drawScene(ctx, {
    region: { id: 'gate', palette: 'morning' },
    cameraX: 0,
    elapsedMs: 0,
    backgrounds: { gate: image },
  });

  const [drawnImage, sx, sy, sw, sh, dx, dy, dw, dh] = drawCalls[0];
  assert.equal(drawnImage, image);
  assert.equal(sx, 0);
  assert.equal(sw, image.naturalWidth);
  assert.ok(Math.abs(sy - (image.naturalHeight - sh) / 2) < 1e-12);
  assert.ok(Math.abs(sw / sh - dw / dh) < 1e-12);
  assert.equal(dx, -135);
  assert.equal(dw, 1550);
  assert.ok(Math.abs(dy - (540 - dh) / 2) < 1e-12);
});

test('HD paintings gain subtle moving bird and leaf depth without legacy rails', () => {
  const positionsAtCamera = (cameraX) => {
    const positions = [];
    const ctx = {
      drawImage() {}, fillRect() {}, createLinearGradient: () => ({ addColorStop() {} }),
      save() {}, restore() {}, beginPath() {}, moveTo(x, y) { positions.push([x, y]); },
      quadraticCurveTo() {}, stroke() {}, fill() {}, translate() {}, rotate() {},
    };
    drawScene(ctx, {
      region: { id: 'ginkgo', palette: 'golden' },
      cameraX,
      elapsedMs: 400,
      backgrounds: { ginkgo: { naturalWidth: 2560, naturalHeight: 1080 } },
    });
    return positions;
  };

  assert.notDeepEqual(positionsAtCamera(0), positionsAtCamera(900));
  assert.ok(positionsAtCamera(900).length >= 10);
});
