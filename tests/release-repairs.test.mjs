import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, updateGame, hasCatchContact, LEVELS } from '../game-logic.js';
import { createPursuer, updatePursuer } from '../pursuer-ai.js';

test('basketball effects survive proximity escape and expire normally', () => {
  for (const mode of ['downed','slowed']) {
    const p={...createPursuer(270),mode,modeTimerMs:1000};
    const next=updatePursuer(p,{x:70},16,{finishX:23500});
    assert.equal(next.mode,mode);
    assert.equal(next.modeTimerMs,984);
    assert.equal(next.velocity,mode==='downed'?0:92);
    assert.equal(updatePursuer({...next,modeTimerMs:1},{x:70},16,{finishX:23500}).mode,'evade');
  }
});
test('a target far behind is not a win and contact is swept in both directions', () => {
  const start=createGame('journey-02');
  const result=updateGame({...start,player:{...start.player,x:16000},pursuer:{...start.pursuer,x:15800},finalWindowOpened:true},{},16);
  assert.equal(result.phase,'playing');
  const p={x:100,y:478},m={x:300,y:478};
  assert.equal(hasCatchContact(p,p,m,m),false);
  assert.equal(hasCatchContact(p,{...p,x:320},m,m),true);
  assert.equal(hasCatchContact({...p,x:400},{...p,x:280},m,m),true);
  assert.equal(hasCatchContact(p,{...p,x:320},{...m,y:300},{...m,y:300}),false);
});
test('second stage respawns before a readable damage-free runway', () => {
  const level=LEVELS['journey-02'];
  for(const cp of level.checkpoints){
    assert.ok(level.platforms.some(p=>p.y===510&&cp.respawnX>=p.x&&cp.respawnX+360<p.x+p.width),cp.id);
    for(const h of level.hazards.filter(h=>h.type!=='collapse')){
      const left=h.x-(h.motion?.range??0),right=h.x+h.width+(h.motion?.range??0);
      const bottom=(h.groundY??h.y)+h.height;
      if(bottom<478)continue;
      assert.ok(right<=cp.respawnX||left>=cp.respawnX+360,`${cp.id}: ${h.id}`);
    }
  }
});
