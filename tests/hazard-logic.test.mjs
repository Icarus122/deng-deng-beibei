import test from 'node:test';
import assert from 'node:assert/strict';

import { getDynamicHazards, resolveHazardContact } from '../hazard-logic.js';

test('moving blocker changes its horizontal position', () => {
  const level = {
    hazards: [{ id: 'blocker-a', type: 'blocker', x: 400, y: 450, width: 34, height: 60, motion: { range: 80, period: 1000 } }],
  };

  assert.notEqual(getDynamicHazards(level, 0, {}).at(0).x, getDynamicHazards(level, 250, {}).at(0).x);
});

test('collapse platform disappears after its warning duration', () => {
  const level = { hazards: [{ id: 'collapse-a', type: 'collapse', x: 400, y: 430, width: 90, height: 18 }] };

  const hazards = getDynamicHazards(level, 900, { 'collapse-a': 200 });
  assert.equal(hazards.some((hazard) => hazard.id === 'collapse-a'), false);
});

test('construction box contact reports damage without teleporting Meng', () => {
  const state = { player: { x: 420, y: 460, width: 24, height: 32 }, distance: 120, collapseStarts: {}, hazardSlowTimerMs: 0 };
  const hazards = [{ id: 'box-a', type: 'constructionBox', x: 414, y: 458, width: 34, height: 38 }];

  const result = resolveHazardContact(state, hazards, 600);
  assert.equal(Object.hasOwn(result, 'distanceDelta'), false);
  assert.equal(result.event, 'constructionHit');
});

test('spikes are recognized as a damaging hazard', () => {
  const state = { player: { x: 420, y: 460, width: 24, height: 32 }, collapseStarts: {}, hazardSlowTimerMs: 0 };
  const hazards = [{ id: 'spikes-a', type: 'spikes', x: 414, y: 458, width: 34, height: 38 }];

  assert.equal(resolveHazardContact(state, hazards, 600).event, 'spikesHit');
});

test('landing on a collapse platform starts its warning timer', () => {
  const state = { player: { x: 420, y: 398, width: 24, height: 32, grounded: true, groundedPlatformId: 'collapse-a' }, distance: 120, collapseStarts: {}, hazardSlowTimerMs: 0 };
  const hazards = [{ id: 'collapse-a', type: 'collapse', x: 400, y: 430, width: 90, height: 18 }];

  const result = resolveHazardContact(state, hazards, 600);
  assert.equal(result.event, 'collapseWarning');
  assert.equal(result.collapseStarts['collapse-a'], 600);
});

test('a swept moving blocker is reported once even when it crosses between frames', () => {
  const state = {
    player: { x: 200, y: 450, width: 24, height: 32 },
    collapseStarts: {},
    hazardSlowTimerMs: 0,
  };
  const previousPlayer = { ...state.player, x: 100 };
  const oldBlocker = { id: 'blocker-fast', type: 'blocker', x: 160, y: 440, width: 18, height: 60 };
  const newBlocker = { ...oldBlocker, x: 40 };
  const result = resolveHazardContact(state, [newBlocker], 600, {
    previousPlayer,
    previousHazards: [oldBlocker],
  });

  assert.deepEqual(result.damagingContacts.map(({ id }) => id), ['blocker-fast']);
  assert.equal(result.event, 'blockerHit');
});

test('same-frame hazard resolution collects every contact instead of returning early', () => {
  const state = {
    player: { x: 420, y: 460, width: 24, height: 32 },
    collapseStarts: {},
    hazardSlowTimerMs: 0,
  };
  const hazards = [
    { id: 'box-a', type: 'constructionBox', x: 414, y: 458, width: 34, height: 38, warning: false },
    { id: 'spikes-a', type: 'spikes', x: 414, y: 458, width: 34, height: 38 },
  ];
  const result = resolveHazardContact(state, hazards, 600);

  assert.deepEqual(result.damagingContacts.map(({ id }) => id), ['box-a', 'spikes-a']);
  assert.equal(result.contacts.length, 2);
});

test('passing upward through a one-way collapse platform does not start its timer', () => {
  const state = {
    player: { x: 420, y: 400, width: 24, height: 32, grounded: false, velocityY: -400 },
    collapseStarts: {},
    hazardSlowTimerMs: 0,
  };
  const previousPlayer = { ...state.player, y: 450, velocityY: -450 };
  const hazard = { id: 'collapse-a', type: 'collapse', x: 400, y: 430, width: 90, height: 18 };
  const result = resolveHazardContact(state, [hazard], 700, { previousPlayer });

  assert.equal(result.event, 'none');
  assert.deepEqual(result.collapseStarts, {});
});
