import test from 'node:test';
import assert from 'node:assert/strict';

import { loadProgress, PROGRESS_STORAGE_KEY, recordLevelResult, saveProgress } from '../level-progress.js';

function fakeStorage(initial = null) {
  let value = initial;
  return {
    getItem(key) { assert.equal(key, PROGRESS_STORAGE_KEY); return value; },
    setItem(key, next) { assert.equal(key, PROGRESS_STORAGE_KEY); value = next; },
    read() { return value; },
  };
}

test('chapter results persist unlocks, best progress, coins, wins, and challenge badges', () => {
  const storage = fakeStorage();
  const initial = loadProgress(storage);
  const level = { finishX: 4600, worldEnd: 4800, coins: [{}, {}] };
  const state = {
    phase: 'caught', player: { x: 4500 }, coins: 2, collectedCoinIds: ['a', 'b'], damageCount: 0, sprinted: false,
  };
  const result = recordLevelResult(initial, 2, state, level);

  assert.equal(result.progress.unlockedThrough, 3);
  assert.equal(result.unlockedLevel, 3);
  assert.deepEqual(result.earnedBadges, ['无伤追逐', '硬币全收', '节能大师']);
  assert.equal(saveProgress(result.progress, storage), true);

  const restored = loadProgress(storage);
  assert.equal(restored.records[2].bestCoins, 2);
  assert.equal(restored.records[2].wins, 1);
  assert.deepEqual(restored.records[2].badges, result.earnedBadges);
});

test('losses keep best progress but do not unlock chapters or grant badges', () => {
  const level = { finishX: 4600, worldEnd: 4800, coins: [{}] };
  const result = recordLevelResult(loadProgress(null), 2, {
    phase: 'lost', player: { x: 3200 }, coins: 1, damageCount: 0, sprinted: false,
  }, level);

  assert.equal(result.progress.unlockedThrough, 2);
  assert.equal(result.progress.records[2].bestProgress, 3200 / 4600);
  assert.deepEqual(result.earnedBadges, []);
});

test('invalid or unavailable storage degrades to fresh local progress', () => {
  assert.deepEqual(loadProgress({ getItem() { return '{'; } }), { schemaVersion: 2, unlockedThrough: 2, campaignUnlocked: false, storySeen: [], records: {} });
  assert.equal(saveProgress({ unlockedThrough: 4, records: {} }, null), false);
});
