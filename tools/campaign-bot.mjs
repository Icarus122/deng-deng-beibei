import { createGame, updateGame, beginReturn, getRuntimeLevel, getRenderPlatforms } from '../game-logic.js';
import { jumpInput } from './level-bot.mjs';

export function returnInput(state) {
  const level = getRuntimeLevel(state);
  const player = state.player;
  const platforms = getRenderPlatforms(state.levelId,state.elapsedMs,state.collapseStarts,state.activatedSwitchIds,'return');
  const support = platforms.some(p=>p.x<=player.x-30 && p.x+p.width>=player.x-30 && Math.abs(p.y-(player.y+32))<25);
  const danger = [...state.hazards,...level.obstacles].some(h=>['spikes','patrol','blocker','banana'].includes(h.type)
    && player.x-(h.x+h.width)>=-24 && player.x-(h.x+h.width)<70
    && h.y+h.height>player.y && h.y<player.y+32);
  const jump = player.grounded ? !support || danger : player.jumpsUsed<2 && player.velocityY>0 && !support;
  return {left:true,jumpPressed:jump,jumpHeld:true};
}

export function runRescue(stepMs = 1000/60, high = true) {
  let state = createGame('journey-03');
  const errors = [];
  let falls = 0;
  let switches = 0;
  let elapsed = 0;
  let returnElapsed = 0;
  let maximumAirMs = 0;
  let airMs = 0;
  for(let frame=0;frame<180000/stepMs && state.phase==='playing';frame++) {
    if(state.missionPhase==='returnReady') {
      state = beginReturn(state);
      switches++;
    }
    const returning = state.missionPhase==='return';
    state = updateGame(state,returning?returnInput(state):jumpInput(state,true,high),stepMs,{random:()=>.9});
    elapsed += stepMs;
    if(returning) returnElapsed+=stepMs;
    if(state.event==='fell') falls++;
    const platforms=getRenderPlatforms(state.levelId,state.elapsedMs,state.collapseStarts,state.activatedSwitchIds,state.missionPhase);
    const moving = returning ? state.cao : state.pursuer;
    if(moving.groundedPlatformId && !platforms.some(p=>p.id===moving.groundedPlatformId)) errors.push('invalid platform '+moving.groundedPlatformId);
    airMs=moving.grounded ? 0 : airMs+stepMs;
    maximumAirMs=Math.max(maximumAirMs,airMs);
  }
  return {fps:Math.round(1000/stepMs),high,phase:state.phase,event:state.event,missionPhase:state.missionPhase,
    hearts:state.hearts,falls,switches,elapsed:Math.round(elapsed),returnElapsed:Math.round(returnElapsed),
    playerX:Math.round(state.player.x),mengX:state.pursuer.x,caoGap:Math.round(state.cao.x-state.player.x),maximumAirMs:Math.round(maximumAirMs),errors};
}

if(process.argv[1]?.endsWith('campaign-bot.mjs')) {
  for(const step of [1000/60,1000/30]) for(const high of [false,true]) console.log(JSON.stringify(runRescue(step,high)));
}
