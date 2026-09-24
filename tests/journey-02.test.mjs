import test from 'node:test';
import assert from 'node:assert/strict';

import { createBasketball, updateBasketball } from '../basketball-logic.js';
import { LEVELS, createGame, getRenderPlatforms, updateGame } from '../game-logic.js';
import { JOURNEY } from '../level-data.js';
import { loadProgress, markStorySeen, recordLevelResult } from '../level-progress.js';
import { getStoryScene } from '../story-scenes.js';
import { jumpInput, runBot } from '../tools/level-bot.mjs';

const stage = LEVELS['journey-02'];

test('first story finish is on continuous solid ground', () => {
  const ground = JOURNEY.platforms.filter((platform) => platform.y === 510)
    .sort((a, b) => a.x - b.x);
  const atFinish = ground.find((platform) => platform.x <= JOURNEY.finishX
    && platform.x + platform.width > JOURNEY.finishX);
  assert.ok(atFinish);
  assert.ok(atFinish.x <= JOURNEY.finishX - 40);
});

test('second story stage is independent, complete, and finishes on stable ground', () => {
  assert.equal(stage.finishX, 18000);
  assert.deepEqual(stage.regions.map(({ id }) => id), ['riverside', 'clocktower']);
  for (const field of ['platforms', 'hazards', 'obstacles', 'coins', 'energy', 'heartPickups', 'checkpoints']) {
    assert.ok(Array.isArray(stage[field]) && stage[field].length > 0, field);
  }
  assert.ok(stage.platforms.some((platform) => platform.y === 510
    && platform.x <= stage.finishX && platform.x + platform.width >= stage.worldEnd));
  assert.equal(createGame('journey-02').phase, 'playing');
});

test('basketball switch opens only the optional upper connecting platform', () => {
  const switchTarget = stage.switches[0];
  assert.ok(!getRenderPlatforms('journey-02', 0).some((platform) => platform.requiresSwitch));
  assert.ok(getRenderPlatforms('journey-02', 0, {}, [switchTarget.id]).some((platform) => platform.requiresSwitch));

  const player = { x: 5230, y: 478, width: 24, height: 32 };
  const pursuer = { x: 5510, y: 478, width: 24, height: 32, velocity: 136 };
  let ball = createBasketball(player, pursuer, switchTarget);
  let event = 'none';
  for (let index = 0; index < 80 && ball; index += 1) {
    const result = updateBasketball(ball, pursuer, pursuer, 16, stage.worldEnd, () => 0, stage.switches);
    ball = result.ball;
    event = result.event;
    if (event === 'switchActivated') {
      assert.equal(result.activatedSwitchId, switchTarget.id);
      break;
    }
  }
  assert.equal(event, 'switchActivated');
});

test('touching the scripted basketball activates the bridge in live simulation', () => {
  let state = createGame('journey-02');
  state = {
    ...state,
    player: { ...state.player, x: 5230 },
    pursuer: { ...state.pursuer, x: 5600 },
  };
  for (let frame = 0; frame < 80 && !state.activatedSwitchIds.length; frame += 1) {
    state = updateGame(state, {}, 16, { random: () => .9 });
  }
  assert.deepEqual(state.activatedSwitchIds, ['river-switch-1']);
  assert.ok(getRenderPlatforms(state.levelId, state.elapsedMs, state.collapseStarts, state.activatedSwitchIds)
    .some((platform) => platform.id === 'river-switch-bridge'));
});

test('first-story wins unlock the second stage without converting old practice records', () => {
  const legacy = { unlockedThrough: 4, records: { 1: { wins: 1, bestProgress: 1, bestCoins: 8 } } };
  const migrated = loadProgress({ getItem() { return JSON.stringify(legacy); } });
  assert.equal(migrated.campaignUnlocked, true);
  assert.equal(migrated.unlockedThrough, 4);
  assert.equal(migrated.records['journey-02'], undefined);

  const initial = loadProgress(null);
  const win = recordLevelResult(initial, 1, { phase: 'caught', player: { x: 22000 }, coins: 0 }, LEVELS[1]);
  assert.equal(win.unlockedLevel, 'journey-02');
  assert.equal(win.progress.campaignUnlocked, true);
  const seen = markStorySeen(win.progress, '1:intro');
  assert.deepEqual(markStorySeen(seen, '1:intro').storySeen, ['1:intro']);
  assert.equal(getStoryScene('journey-02', 'intro').length, 3);
});

test('second stage has a controllable ground-route win after the 85 percent window', () => {
  for (const stepMs of [1000 / 60, 1000 / 30]) {
    const result = runBot('second-ground', (state) => jumpInput(state, true, false), { levelId: 'journey-02', stepMs });
    assert.equal(result.phase, 'caught');
    assert.ok(result.progress >= .85);
    assert.ok(result.minPreWindowGap > 56);
    assert.equal(result.falls.length, 0);
  }
});

test('first stage prevents visual overlap before opening the catch window', () => {
  const result = runBot('first-high', (state) => jumpInput(state, true, true));
  assert.equal(result.phase, 'caught');
  assert.ok(result.minPreWindowGap > 56);
});
