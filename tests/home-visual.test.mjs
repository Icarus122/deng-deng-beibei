import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('home screen uses Beibei key art as its scenic background', async () => {
  const css = await readFile(new URL('../style.css', import.meta.url), 'utf8');

  assert.match(css, /\.home-screen[\s\S]*?beibei-key-art\.png/);
});
