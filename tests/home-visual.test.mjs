import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('home screen shares the first story stage painting and has a separate level selector', async () => {
  const css = await readFile(new URL('../style.css', import.meta.url), 'utf8');
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');

  assert.match(css, /\.home-screen[\s\S]*?bg-gate-story-v2\.webp/);
  assert.doesNotMatch(html, /portrait-row|>VS</);
  assert.match(html, /id="level-select-dialog"/);
  assert.match(html, /data-level-id="1"/);
  assert.match(html, /data-level-id="journey-02"/);
});
