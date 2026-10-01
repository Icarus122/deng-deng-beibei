import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('one public entrance opens Godot and the actual game pack has a versioned URL', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /location\.replace/);
  assert.match(html, /godot-demo\//);
  const shell = await readFile(new URL('../godot/web/shell.html', import.meta.url), 'utf8');
  assert.match(shell, /config\.mainPack='index\.pck\?v=[a-z0-9-]+'/);
  assert.doesNotMatch(shell, /旧版试玩|>旧版<|返回旧版/);
});
