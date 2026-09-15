export function getCharacterPose(character) {
  if (character.pose) return character.pose;
  if (character.mode === 'downed') return 'downed';
  if (character.mode === 'cry') return 'cry';
  if (character.mode === 'tap') return 'tap';
  if (character.slipTimerMs > 0) return 'slip';
  return character.grounded ? 'run' : 'jump';
}

export function getRunFrameIndex(elapsedMs) {
  return Math.floor(elapsedMs / 95) % 4;
}

function getStillPortrait(portrait) {
  return portrait?.still ?? portrait;
}

function drawFallbackRunner(ctx, portrait, x, y, width, height) {
  const unit = width / 12;
  const beibei = portrait?.runnerId === 'beibei';
  const hair = beibei ? '#7a4b42' : '#252238';
  const outfit = beibei ? '#ef8f9b' : '#5c89b5';
  const collar = beibei ? '#f7d66f' : '#e8eef8';
  const skin = '#f2bf9f';
  const baseX = x + unit * 3;
  const baseY = y + unit * 2;

  ctx.fillStyle = hair;
  ctx.fillRect(baseX, baseY, unit * 6, unit * 4);
  ctx.fillStyle = skin;
  ctx.fillRect(baseX + unit, baseY + unit * 2, unit * 4, unit * 3);
  ctx.fillStyle = '#2c2540';
  ctx.fillRect(baseX + unit * 2, baseY + unit * 3, unit, unit);
  ctx.fillRect(baseX + unit * 4, baseY + unit * 3, unit, unit);
  if (!beibei) {
    ctx.fillStyle = '#dce4ef';
    ctx.fillRect(baseX + unit, baseY + unit * 3, unit * 4, unit / 2);
  }
  ctx.fillStyle = outfit;
  ctx.fillRect(baseX + unit, baseY + unit * 5, unit * 4, unit * 3);
  ctx.fillStyle = collar;
  ctx.fillRect(baseX + unit * 2, baseY + unit * 5, unit * 2, unit);
  ctx.fillStyle = '#2c2540';
  ctx.fillRect(baseX + unit, baseY + unit * 8, unit, unit * 2);
  ctx.fillRect(baseX + unit * 4, baseY + unit * 8, unit, unit * 2);
}

function drawStillPortrait(ctx, portrait, x, y, width = 96, height = 120) {
  const stillPortrait = getStillPortrait(portrait);
  if (stillPortrait?.naturalWidth) {
    ctx.drawImage(stillPortrait, x, y, width, height);
    return true;
  }
  drawFallbackRunner(ctx, portrait, x, y, width, height);
  return false;
}

function drawRunCycle(ctx, runCycle, elapsedMs) {
  if (!runCycle?.naturalWidth) return false;
  const frameWidth = runCycle.naturalWidth / 4;
  const frame = getRunFrameIndex(elapsedMs);
  ctx.drawImage(runCycle, frame * frameWidth, 0, frameWidth, runCycle.naturalHeight, -48, -112, 96, 120);
  return true;
}

export function drawCharacter(ctx, character, portrait, elapsedMs) {
  const pose = getCharacterPose(character);
  const facing = character.facing ?? 1;
  const runPose = getRunnerPose(elapsedMs, facing);
  const bob = pose === 'run' ? runPose.bob : 0;
  const runCycle = portrait?.runCycle;
  ctx.save();
  ctx.translate(character.x + 28, character.y + 30 + bob);
  ctx.scale(facing, 1);

  if (pose === 'downed') {
    ctx.rotate(Math.PI / 2);
    drawStillPortrait(ctx, portrait, -52, -38, 104, 76);
  } else if (pose === 'cry') {
    ctx.scale(0.82, 0.72);
    drawStillPortrait(ctx, portrait, -48, -112, 96, 120);
    ctx.fillStyle = '#74d7ee';
    ctx.fillRect(5, -35, 5, 17);
    ctx.fillRect(20, -31, 5, 13);
  } else {
    if (pose === 'jump') ctx.rotate(-0.1);
    if (pose === 'run') ctx.rotate(runPose.torsoTilt);
    if (pose !== 'run' || !drawRunCycle(ctx, runCycle, elapsedMs)) drawStillPortrait(ctx, portrait, -48, -112, 96, 120);
    if (pose === 'tap') {
      ctx.fillStyle = '#fff3a5';
      ctx.fillRect(35, -28, 18, 6);
      ctx.fillRect(41, -34, 6, 18);
    }
  }
  ctx.restore();

  if (pose === 'run' && getRunFrameIndex(elapsedMs) % 2 === 1) {
    const trailDirection = facing > 0 ? -1 : 1;
    ctx.fillStyle = '#fff0c7';
    ctx.fillRect(character.x + trailDirection * 8, character.y + 28, 10, 4);
    ctx.fillRect(character.x + trailDirection * 20, character.y + 33, 7, 3);
  }
}
import { getRunnerPose } from './runner-pose.js';
