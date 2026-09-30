import test from 'node:test';
import assert from 'node:assert/strict';
import { interpolateRenderState } from '../render-state.js';
import { comicClickAction, getComicPanels } from '../comic-player.js';
import { ACADEMY_FRAMES, ACADEMY_POSES, ACADEMY_HEIGHT_RATIO } from '../academy-frames.js';
import { drawCharacter } from '../character-renderer.js';
import { createGame } from '../game-logic.js';
import { advanceCamera } from '../camera.js';

test('render interpolation smooths positions without changing simulation state or interpolating a respawn', () => {
  const before = createGame(1);
  const after = {...before,player:{...before.player,x:before.player.x+8},elapsedMs:33};
  assert.equal(interpolateRenderState(before,after,.5).player.x,before.player.x+4);
  assert.equal(before.player.x,70);
  assert.equal(after.player.x,78);
  const respawn={...after,player:{...after.player,x:500}};
  assert.equal(interpolateRenderState(after,respawn,.5).player.x,500);
});

test('first comic click reveals the page and only the next click continues', () => {
  assert.equal(comicClickAction(1,3),'reveal');
  assert.equal(comicClickAction(3,3),'continue');
  for(const id of [1,'journey-02','journey-03']) {
    const panels=getComicPanels(id,'intro');
    assert.equal(panels.length,3);
    assert.ok(panels.every(p=>p.x>=0 && p.y>=0 && p.x+p.w<=1672 && p.y+p.h<=941));
  }
});

test('academy assets use isolated explicit source frames, stable scale and visible height ratio', () => {
  assert.equal(ACADEMY_HEIGHT_RATIO.cao,183/170);
  assert.equal(ACADEMY_HEIGHT_RATIO.meng,ACADEMY_HEIGHT_RATIO.beibei);
  for(const id of ['beibei','meng','cao']) {
    assert.equal(ACADEMY_FRAMES[id].length,12);
    assert.equal(ACADEMY_POSES[id].length,3);
    for(const frame of [...ACADEMY_FRAMES[id],...ACADEMY_POSES[id]]) {
      assert.ok(frame.x>=0 && frame.y>=0 && frame.x+frame.w<=1254 && frame.y+frame.h<=1254);
      assert.ok(frame.originY>0);
    }
    const calls=[];
    const ctx={save(){},restore(){},scale(){},translate(){},drawImage(...args){calls.push(args);}};
    const portrait={academy:true,runnerId:id,runCycle:{naturalWidth:1254},poseAtlas:{naturalWidth:1254}};
    for(const character of [{grounded:true},{grounded:false,velocityY:-100},{grounded:true,mode:'stomach'}]) drawCharacter(ctx,{x:0,y:0,...character},portrait);
    assert.equal(calls.length,3);
    assert.ok(calls.every(call=>Math.abs(call[7]/call[3]-call[8]/call[4])<1e-10),'uniform scaling, no per-frame stretching');
  }
});

test('return camera shows the approaching route on the left', () => {
  assert.ok(advanceCamera(5000,5500,210,1280,18500,-240) < advanceCamera(5000,5500,210,1280,18500,240));
});
