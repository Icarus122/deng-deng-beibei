const DISPLAY_WIDTH = 60;
const DISPLAY_HEIGHT = 80;
export const STRIDE_PX = 46;

// These source rectangles deliberately stay explicit.  The imported legacy
// sheets do not divide cleanly at their visual limbs, and replacement sheets
// use the same named-frame contract at 240 x 320 per frame.
const RUN_FRAMES = {
  beibei: [
    { x: 0, y: 0, w: 240, h: 320, originX: 0, originY: 320 },
    { x: 240, y: 0, w: 240, h: 320, originX: 0, originY: 320 },
    { x: 480, y: 0, w: 240, h: 320, originX: 0, originY: 320 },
    { x: 720, y: 0, w: 240, h: 320, originX: 0, originY: 320 },
  ],
  meng: [
    { x: 0, y: 0, w: 240, h: 320, originX: 0, originY: 320 },
    { x: 240, y: 0, w: 240, h: 320, originX: 0, originY: 320 },
    { x: 480, y: 0, w: 240, h: 320, originX: 0, originY: 320 },
    { x: 720, y: 0, w: 240, h: 320, originX: 0, originY: 320 },
  ],
};

export function getCharacterPose(character) {
  if (character.pose) return character.pose;
  if (character.mode === 'downed') return 'downed';
  if (character.mode === 'cry') return 'cry';
  if (character.mode === 'tap') return 'tap';
  if (character.slipTimerMs > 0) return 'slip';
  return character.grounded ? 'run' : 'jump';
}

export function getRunFrameIndex(distanceTravelled = 0) {
  return Math.floor(Math.abs(distanceTravelled) / STRIDE_PX) % 4;
}

function getStillPortrait(portrait) {
  return portrait?.still ?? portrait;
}

function drawStillPortrait(ctx, portrait, x, y, width = DISPLAY_WIDTH, height = DISPLAY_HEIGHT) {
  const stillPortrait = getStillPortrait(portrait);
  if (stillPortrait?.naturalWidth) {
    ctx.drawImage(stillPortrait, x, y, width, height);
    return true;
  }
  return false;
}

function drawRunCycle(ctx, portrait, distanceTravelled) {
  const runCycle = portrait?.runCycle;
  const frames = RUN_FRAMES[portrait?.runnerId];
  if (!runCycle?.naturalWidth || !frames) return false;
  const frame = frames[getRunFrameIndex(distanceTravelled)];
  const scaleX = DISPLAY_WIDTH / frame.w;
  const scaleY = DISPLAY_HEIGHT / frame.h;
  const anchorOffsetX = frame.originX * scaleX;
  const anchorOffsetY = (frame.h - frame.originY) * scaleY;
  ctx.drawImage(
    runCycle,
    frame.x,
    frame.y,
    frame.w,
    frame.h,
    -DISPLAY_WIDTH / 2 - anchorOffsetX,
    -DISPLAY_HEIGHT + anchorOffsetY,
    DISPLAY_WIDTH,
    DISPLAY_HEIGHT,
  );
  return true;
}

function drawPose(ctx, character, portrait, pose) {
  const poseImage = portrait?.poses?.[pose];
  if (poseImage?.naturalWidth) {
    const width = pose === 'cry' ? 54 : DISPLAY_WIDTH;
    ctx.drawImage(poseImage, -width / 2, -DISPLAY_HEIGHT, width, DISPLAY_HEIGHT);
    return true;
  }
  return false;
}

function drawCurrentOutfit(ctx, character, portrait, pose) {
  if (drawPose(ctx, character, portrait, pose)) return;
  // Until dedicated pose art is available, use the current HD run-frame—not
  // the legacy portrait—so jumping, sliding and crying never switch outfits.
  if (!drawRunCycle(ctx, portrait, 0)) drawStillPortrait(ctx, portrait, -DISPLAY_WIDTH / 2, -DISPLAY_HEIGHT);
}

export function drawCharacter(ctx, character, portrait) {
  const pose = getCharacterPose(character);
  const facing = character.facing ?? 1;
  const distanceTravelled = character.distanceTravelled ?? character.x ?? 0;
  const centreX = character.x + (character.width ?? 24) / 2;
  const baselineY = character.y + (character.height ?? 32);
  ctx.save();
  ctx.translate(centreX, baselineY);
  ctx.scale(facing, 1);
  if (portrait?.runnerId === 'meng') {
    // His dark hair and denim jacket otherwise disappear into dusk/lake art on
    // smaller phone screens; retain the supplied glasses while lifting contrast.
    ctx.filter = 'brightness(1.18) saturate(1.14) drop-shadow(0 1px 1px rgba(255,255,255,.48))';
  }

  if (pose === 'downed') {
    ctx.rotate(Math.PI / 2);
    drawCurrentOutfit(ctx, character, portrait, pose);
  } else if (pose === 'cry') {
    drawCurrentOutfit(ctx, character, portrait, pose);
    ctx.fillStyle = '#74d7ee';
    ctx.fillRect(4, -27, 3, 12);
    ctx.fillRect(14, -24, 3, 9);
  } else {
    if (pose === 'jump') ctx.rotate(-0.07);
    if (pose === 'run' && !drawRunCycle(ctx, portrait, distanceTravelled)) drawCurrentOutfit(ctx, character, portrait, pose);
    if (pose !== 'run') drawCurrentOutfit(ctx, character, portrait, pose);
    if (pose === 'tap') {
      ctx.fillStyle = '#fff3a5';
      ctx.fillRect(22, -22, 14, 5);
      ctx.fillRect(27, -28, 5, 14);
    }
  }
  ctx.restore();

  if (pose === 'run' && getRunFrameIndex(distanceTravelled) % 2 === 1) {
    const trailDirection = facing > 0 ? -1 : 1;
    ctx.fillStyle = '#fff0c7';
    ctx.fillRect(character.x + trailDirection * 7, baselineY - 4, 8, 3);
    ctx.fillRect(character.x + trailDirection * 16, baselineY - 2, 5, 2);
  }
}
