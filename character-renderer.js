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

function drawStillPortrait(ctx, portrait, x, y, width = 96, height = 120) {
  if (!portrait?.naturalWidth) return;
  ctx.drawImage(portrait, x, y, width, height);
}

function drawRunCycle(ctx, runCycle, elapsedMs) {
  if (!runCycle?.naturalWidth) return false;
  const frameWidth = runCycle.naturalWidth / 4;
  const frameDuration = 95;
  const framePosition = elapsedMs / frameDuration;
  const frame = Math.floor(framePosition) % 4;
  const nextFrame = (frame + 1) % 4;
  const mix = framePosition - Math.floor(framePosition);
  ctx.globalAlpha = 1 - mix;
  ctx.drawImage(runCycle, frame * frameWidth, 0, frameWidth, runCycle.naturalHeight, -48, -112, 96, 120);
  ctx.globalAlpha = mix;
  ctx.drawImage(runCycle, nextFrame * frameWidth, 0, frameWidth, runCycle.naturalHeight, -48, -112, 96, 120);
  ctx.globalAlpha = 1;
  return true;
}

export function drawCharacter(ctx, character, portrait, elapsedMs) {
  const pose = getCharacterPose(character);
  const facing = character.facing ?? 1;
  const runPose = getRunnerPose(elapsedMs, facing);
  const bob = pose === 'run' ? runPose.bob : 0;
  const stillPortrait = getStillPortrait(portrait);
  const runCycle = portrait?.runCycle;
  ctx.save();
  ctx.translate(character.x + 28, character.y + 30 + bob);
  ctx.scale(facing, 1);

  if (pose === 'downed') {
    ctx.rotate(Math.PI / 2);
    drawStillPortrait(ctx, stillPortrait, -52, -38, 104, 76);
  } else if (pose === 'cry') {
    ctx.scale(0.82, 0.72);
    drawStillPortrait(ctx, stillPortrait, -48, -112, 96, 120);
    ctx.fillStyle = '#74d7ee';
    ctx.fillRect(5, -35, 5, 17);
    ctx.fillRect(20, -31, 5, 13);
  } else {
    if (pose === 'jump') ctx.rotate(-0.1);
    if (pose === 'run') ctx.rotate(runPose.torsoTilt);
    if (pose !== 'run' || !drawRunCycle(ctx, runCycle, elapsedMs)) drawStillPortrait(ctx, stillPortrait, -48, -112, 96, 120);
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
