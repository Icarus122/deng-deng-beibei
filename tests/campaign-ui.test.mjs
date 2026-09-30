import test from 'node:test';
import assert from 'node:assert/strict';
import { access } from 'node:fs/promises';
import { CAMPAIGN, isCampaignUnlocked } from '../campaign.js';
import { loadProgress, recordLevelResult } from '../level-progress.js';
import { LEVELS } from '../game-logic.js';

test('every map node has a distinct image-space anchor and an existing road preview', async () => {
  const anchors = new Set();
  for (const level of CAMPAIGN) {
    assert.ok(level.x > 0 && level.x < 100 && level.y > 0 && level.y < 100);
    anchors.add(`${level.x},${level.y}`);
    assert.match(level.art, /^assets\/bg-.*\.webp$/);
    await access(new URL('../' + level.art, import.meta.url));
  }
  assert.equal(anchors.size, CAMPAIGN.length);
});

test('campaign flags distinguish available, locked and planned nodes across unlocks', () => {
  const initial = loadProgress(null);
  assert.deepEqual(CAMPAIGN.map(level => isCampaignUnlocked(level.id, initial)), [true, false, false, false, false, false]);
  const win = {phase:'caught', player:{x:18500}, coins:0, collectedCoinIds:[], damageCount:0};
  const first = recordLevelResult(initial, 1, win, LEVELS[1]).progress;
  const second = recordLevelResult(first, 'journey-02', win, LEVELS['journey-02']).progress;
  assert.deepEqual(CAMPAIGN.map(level => isCampaignUnlocked(level.id, second)), [true, true, true, false, false, false]);
});
