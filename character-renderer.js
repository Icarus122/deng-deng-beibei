const DISPLAY_WIDTH = 66;
const DISPLAY_HEIGHT = 88;
export const RUN_CYCLE_DISTANCE_PX = 96;
export const RUN_FRAME_DISTANCE_PX = RUN_CYCLE_DISTANCE_PX / 12;

// Both replacement atlases are 960 x 960: twelve 240 x 320 frames in a
// 4-column by 3-row layout. Pivots are source-space coordinates at the same
// horizontal center and ground baseline for every pose.
const RUN_FRAME_LAYOUT = [
  { x: 0, y: 0, w: 240, h: 320, originX: 120, originY: 320 },
  { x: 240, y: 0, w: 240, h: 320, originX: 120, originY: 320 },
  { x: 480, y: 0, w: 240, h: 320, originX: 120, originY: 320 },
  { x: 720, y: 0, w: 240, h: 320, originX: 120, originY: 320 },
  { x: 0, y: 320, w: 240, h: 320, originX: 120, originY: 320 },
  { x: 240, y: 320, w: 240, h: 320, originX: 120, originY: 320 },
  { x: 480, y: 320, w: 240, h: 320, originX: 120, originY: 320 },
  { x: 720, y: 320, w: 240, h: 320, originX: 120, originY: 320 },
  { x: 0, y: 640, w: 240, h: 320, originX: 120, originY: 320 },
  { x: 240, y: 640, w: 240, h: 320, originX: 120, originY: 320 },
  { x: 480, y: 640, w: 240, h: 320, originX: 120, originY: 320 },
  { x: 720, y: 640, w: 240, h: 320, originX: 120, originY: 320 },
];

const RUN_FRAMES = { beibei: RUN_FRAME_LAYOUT, meng: RUN_FRAME_LAYOUT };
const JUMP_POSE_INDEX = {
  'jump-up': 0,
  'jump-apex': 1,
  fall: 2,
};

export function getCharacterPose(character) {
  if (character.pose) return character.pose;
  if (character.mode === 'downed') return 'downed';
  if (character.mode === 'cry') return 'cry';
  if (character.mode === 'tap') return 'tap';
  if (character.slipTimerMs > 0) return 'slip';
  if (character.grounded) return 'run';
  if (character.velocityY < -80) return 'jump-up';
  if (character.velocityY > 80) return 'fall';
  return 'jump-apex';
}

export function getRunFrameIndex(distanceTravelled = 0) {
  return Math.floor(Math.abs(distanceTravelled) / RUN_FRAME_DISTANCE_PX) % RUN_FRAME_LAYOUT.length;
}

export function getRunFrameRect(runnerId, frameIndex) {
  const frames = RUN_FRAMES[runnerId];
  if (!frames) return null;
  return frames[((frameIndex % frames.length) + frames.length) % frames.length];
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
  const frame = getRunFrameRect(portrait?.runnerId, getRunFrameIndex(distanceTravelled));
  if (!runCycle?.naturalWidth || runCycle.naturalWidth < 960 || runCycle.naturalHeight < 960 || !frame) return false;
  const scaleX = DISPLAY_WIDTH / frame.w;
  const scaleY = DISPLAY_HEIGHT / frame.h;
  ctx.drawImage(
    runCycle,
    frame.x,
    frame.y,
    frame.w,
    frame.h,
    -frame.originX * scaleX,
    -frame.originY * scaleY,
    DISPLAY_WIDTH,
    DISPLAY_HEIGHT,
  );
  return true;
}

function drawPose(ctx, portrait, pose) {
  if (JUMP_POSE_INDEX[pose] !== undefined) {
    const jumpSheet = portrait?.poses?.jump;
    if (jumpSheet?.naturalWidth) {
      const frameWidth = jumpSheet.naturalWidth / 3;
      ctx.drawImage(
        jumpSheet,
        frameWidth * JUMP_POSE_INDEX[pose],
        0,
        frameWidth,
        jumpSheet.naturalHeight,
        -DISPLAY_WIDTH / 2,
        -DISPLAY_HEIGHT,
        DISPLAY_WIDTH,
        DISPLAY_HEIGHT,
      );
      return true;
    }
  }
  const poseImage = portrait?.poses?.[pose];
  if (poseImage?.naturalWidth) {
    ctx.drawImage(poseImage, -DISPLAY_WIDTH / 2, -DISPLAY_HEIGHT, DISPLAY_WIDTH, DISPLAY_HEIGHT);
    return true;
  }
  return false;
}

function drawCurrentOutfit(ctx, portrait, pose, distanceTravelled) {
  if (drawPose(ctx, portrait, pose)) return;
  // Use the current outfit sheet when a dedicated pose is not available.
  if (!drawRunCycle(ctx, portrait, distanceTravelled)) {
    drawStillPortrait(ctx, portrait, -DISPLAY_WIDTH / 2, -DISPLAY_HEIGHT);
  }
}

export function drawCharacter(ctx, character, portrait) {
  const pose = getCharacterPose(character);
  const facing = character.facing ?? 1;
  const distanceTravelled = character.runDistanceTravelled ?? character.distanceTravelled ?? 0;
  const centreX = character.x + (character.width ?? 24) / 2;
  const baselineY = character.y + (character.height ?? 32);
  const landingProgress = Math.max(0, Math.min(1, (character.landTimerMs ?? 0) / 120));
  const landingEase = Math.sin(landingProgress * Math.PI);
  const landScaleX = 1 + landingEase * 0.02;
  const landScaleY = 1 - landingEase * 0.03;

  ctx.save();
  ctx.translate(centreX, baselineY);
  ctx.scale(facing * landScaleX, landScaleY);
  if (portrait?.runnerId === 'meng') {
    ctx.filter = 'brightness(1.18) saturate(1.14) drop-shadow(0 1px 1px rgba(255,255,255,.48))';
  }

  if (pose === 'downed') {
    ctx.rotate(Math.PI / 2);
    drawCurrentOutfit(ctx, portrait, pose, distanceTravelled);
  } else if (pose === 'cry') {
    drawCurrentOutfit(ctx, portrait, pose, distanceTravelled);
    ctx.fillStyle = '#74d7ee';
    ctx.fillRect(4, -27, 3, 12);
    ctx.fillRect(14, -24, 3, 9);
  } else {
    if (pose === 'run' && !drawRunCycle(ctx, portrait, distanceTravelled)) {
      drawCurrentOutfit(ctx, portrait, pose, distanceTravelled);
    }
    if (pose !== 'run') drawCurrentOutfit(ctx, portrait, pose, distanceTravelled);
    if (pose === 'tap') {
      ctx.fillStyle = '#fff3a5';
      ctx.fillRect(22, -22, 14, 5);
      ctx.fillRect(27, -28, 5, 14);
    }
  }
  ctx.restore();
}
