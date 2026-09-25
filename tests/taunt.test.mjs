import test from 'node:test';
import assert from 'node:assert/strict';

import { advanceTauntCue, createTaunt, createTauntTracker, isTauntActive } from '../taunt.js';

test('Meng taunt expires after one point two seconds', () => {
  const taunt = createTaunt('孟培杰：追不上吧？', 5000);

  assert.equal(isTauntActive(taunt, 6199), true);
  assert.equal(isTauntActive(taunt, 6200), false);
});

test('rapid cruise and evade switches do not repeatedly restart a taunt', () => {
  let tracker = createTauntTracker();
  const cues = [];
  for (let elapsedMs = 0; elapsedMs <= 10000; elapsedMs += 100) {
    const mode = Math.floor(elapsedMs / 100) % 2 ? 'evade' : 'cruise';
    const result = advanceTauntCue(tracker, { elapsedMs, regionId: 'gate', mode });
    tracker = result.tracker;
    if (result.cue) cues.push(result.cue);
  }
  assert.deepEqual(cues, [{ regionId: 'gate', mode: 'cruise' }]);
});

test('a stable reaction waits for cooldown and is shown only once per region', () => {
  let tracker = createTauntTracker();
  const first = advanceTauntCue(tracker, { elapsedMs: 0, regionId: 'gate', mode: 'cruise' });
  tracker = first.tracker;
  for (const elapsedMs of [3000, 4000, 11000, 11900]) {
    const result = advanceTauntCue(tracker, { elapsedMs, regionId: 'gate', mode: 'evade' });
    tracker = result.tracker;
    assert.equal(result.cue, null);
  }
  const reaction = advanceTauntCue(tracker, { elapsedMs: 12000, regionId: 'gate', mode: 'evade' });
  assert.deepEqual(reaction.cue, { regionId: 'gate', mode: 'evade' });
  const repeat = advanceTauntCue(reaction.tracker, { elapsedMs: 26000, regionId: 'gate', mode: 'evade' });
  assert.equal(repeat.cue, null);
});

test('new region entry waits for existing taunt cooldown', () => {
  const first = advanceTauntCue(createTauntTracker(), { elapsedMs: 0, regionId: 'gate', mode: 'cruise' });
  const early = advanceTauntCue(first.tracker, { elapsedMs: 5000, regionId: 'court', mode: 'cruise' });
  assert.equal(early.cue, null);
  const later = advanceTauntCue(early.tracker, { elapsedMs: 12000, regionId: 'court', mode: 'cruise' });
  assert.deepEqual(later.cue, { regionId: 'court', mode: 'cruise' });
});
