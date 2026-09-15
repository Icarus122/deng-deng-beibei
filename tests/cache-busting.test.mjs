import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('page loads the game module through a versioned URL', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');

  assert.match(html, /<script type="module" src="game\.js\?v=[a-z0-9]+"><\/script>/);
});
