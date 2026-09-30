import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('academy home has an original illustration and a separate flag-based campaign map', async () => {
  const css = await readFile(new URL('../campaign.css', import.meta.url), 'utf8');
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');

  assert.match(css, /home-academy-v1\.webp/);
  assert.doesNotMatch(html, /portrait-row|>VS</);
  assert.match(html, /id="level-select-dialog"/);
  assert.match(html, /id="map-nodes"/);
  assert.match(html, /id="level-intro-dialog"/);
});
