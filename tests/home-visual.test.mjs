import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('current academy home and map use separate art and road-introduction views', async () => {
  const html = await readFile(new URL('../godot/web/shell.html', import.meta.url), 'utf8');

  assert.match(html, /ui\/home\.webp/);
  assert.match(html, /ui\/world-map\.webp/);
  assert.doesNotMatch(html, /portrait-row|>VS</);
  assert.match(html, /class="map-plane"/);
  assert.match(html, /data-level=/);
  assert.match(html, /class="level-brief"/);
});
