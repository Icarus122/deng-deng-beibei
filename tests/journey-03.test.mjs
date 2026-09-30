import test from 'node:test';
import assert from 'node:assert/strict';
import { LEVELS, createGame, updateGame, beginReturn, retryReturn, getRuntimeLevel } from '../game-logic.js';
import { loadProgress, recordLevelResult } from '../level-progress.js';
import { isCampaignUnlocked } from '../campaign.js';
import { runRescue } from '../tools/campaign-bot.mjs';

function readyReturn() {
  let state = createGame('journey-03');
  state = { ...state, missionPhase:'chaseCao', player:{...state.player,x:17460},
    pursuer:{...state.pursuer,x:17480}, restingMeng:{...state.pursuer,x:9020,y:478,mode:'stomach'} };
  state = updateGame(state, {}, 1000/60);
  assert.equal(state.missionPhase,'returnReady');
  assert.equal(state.phase,'playing');
  return beginReturn(state);
}

test('third chapter starts with two independently advancing runners and switches at halfway', () => {
  const initial = createGame('journey-03');
  const first = updateGame(initial,{},1000/60);
  assert.equal(first.missionPhase,'chaseBoth');
  assert.notEqual(first.cao.x, initial.cao.x);
  const next = updateGame({...first,player:{...first.player,x:9000},pursuer:{...first.pursuer,x:9250},cao:{...first.cao,x:9390}}, {}, 1000/60);
  assert.equal(next.missionPhase,'chaseCao');
  assert.equal(next.restingMeng.mode,'stomach');
  assert.equal(next.pursuer.x,next.cao.x);
});

test('catching Cao starts a separate leftward timed return with different hazards', () => {
  const state = readyReturn();
  const next = updateGame(state,{left:true},1000/60);
  assert.ok(next.player.x < state.player.x);
  assert.equal(next.player.horizontalSpeed,-240);
  assert.ok(next.missionTimeMs < state.missionTimeMs);
  assert.equal(next.pursuer.x,9020);
  assert.notDeepEqual(getRuntimeLevel(state).hazards,LEVELS['journey-03'].hazards);
  assert.equal(next.phase,'playing');
});

test('return fall does not teleport resting Meng and retry preserves outbound completion', () => {
  const state = readyReturn();
  const fallen = updateGame({...state,player:{...state.player,y:650}}, {},1000/60);
  assert.equal(fallen.pursuer.x,9020);
  const retry = retryReturn({...fallen,phase:'lost'});
  assert.equal(retry.missionPhase,'return');
  assert.equal(retry.phase,'playing');
  assert.equal(retry.missionTimeMs,90000);
  assert.equal(retry.player.x,state.player.x);
});

test('delivery checks ground proximity and timeout does not award a win', () => {
  const state = readyReturn();
  const delivered = updateGame({...state,player:{...state.player,x:9040,y:478}}, {},1000/60);
  assert.equal(delivered.event,'delivered');
  assert.equal(delivered.phase,'caught');
  const timedOut = updateGame({...state,missionTimeMs:1},{},1000/60);
  assert.equal(timedOut.event,'deliveryTimeout');
  assert.equal(timedOut.phase,'lost');
});

test('second story win unlocks third and old practice wins do not', () => {
  const initial = loadProgress(null);
  const win = {phase:'caught',player:{x:18000},coins:0,collectedCoinIds:[],damageCount:0};
  assert.equal(isCampaignUnlocked('journey-03',recordLevelResult(initial,3,win,LEVELS[3]).progress),false);
  const saved = recordLevelResult(initial,'journey-02',win,LEVELS['journey-02']);
  assert.equal(saved.unlockedLevel,'journey-03');
  assert.equal(isCampaignUnlocked('journey-03',saved.progress),true);
});

test('complete rescue supports ground and upper routes at 30 and 60 FPS without dangling AI platforms', () => {
  for(const step of [1000/60,1000/30]) for(const high of [false,true]) {
    const report=runRescue(step,high);
    assert.equal(report.event,'delivered',JSON.stringify(report));
    assert.equal(report.phase,'caught');
    assert.equal(report.switches,1);
    assert.equal(report.falls,0);
    assert.deepEqual(report.errors,[]);
    assert.ok(report.caoGap>=100 && report.caoGap<=240);
    assert.ok(report.maximumAirMs<2000);
  }
});

test('return respawns have a continuous damage-free leftward runway', () => {
  const level=LEVELS['journey-03'];
  for(const cp of level.returnRoute.checkpoints) {
    assert.ok(level.platforms.some(p=>p.y===510 && p.x<=cp.respawnX-360 && p.x+p.width>=cp.respawnX+24),cp.id);
    assert.ok(!level.returnRoute.hazards.some(h=>h.x+(h.motion?.range??0)+h.width>cp.respawnX-360 && h.x-(h.motion?.range??0)<cp.respawnX),cp.id);
  }
});
