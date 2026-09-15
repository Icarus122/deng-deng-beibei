const OUTFITS = {
  beibei: { arm: '#f3c19f', leg: '#283d72', shoe: '#3b3154' },
  meng: { arm: '#e3ad88', leg: '#3d4a5e', shoe: '#29303f' },
};

export function getCharacterPose(character) {
  if (character.pose) return character.pose;
  if (character.mode === 'downed') return 'downed';
  if (character.mode === 'cry') return 'cry';
  if (character.mode === 'tap') return 'tap';
  if (character.slipTimerMs > 0) return 'slip';
  return character.grounded ? 'run' : 'jump';
}

function drawLimbs(ctx, pose, stride, outfit) {
  const armSwing = pose === 'run' ? stride : pose === 'jump' ? 8 : pose === 'slip' ? -12 : pose === 'tap' ? 14 : 0;
  const legSwing = pose === 'run' ? -stride : pose === 'jump' ? -8 : pose === 'slip' ? 14 : 0;
  ctx.fillStyle = outfit.arm;
  ctx.fillRect(-22 + armSwing, -49, 8, 26);
  ctx.fillRect(14 - armSwing, -49, 8, 26);
  ctx.fillStyle = outfit.leg;
  ctx.fillRect(-11 + legSwing, -24, 10, 27);
  ctx.fillRect(3 - legSwing, -24, 10, 27);
  ctx.fillStyle = outfit.shoe;
  ctx.fillRect(-14 + legSwing, 2, 16, 6);
  ctx.fillRect(0 - legSwing, 2, 16, 6);
}

export function drawCharacter(ctx, character, portrait, elapsedMs, { style = 'beibei' } = {}) {
  const pose = getCharacterPose(character);
  const facing = character.facing ?? 1;
  const stride = Math.round(Math.sin(elapsedMs / 78) * 7);
  const bob = pose === 'run' ? Math.abs(stride) * 0.4 : 0;
  const outfit = OUTFITS[style];
  ctx.save();
  ctx.translate(character.x + 28, character.y + 30 + bob);
  ctx.scale(facing, 1);

  if (pose === 'downed') {
    ctx.rotate(Math.PI / 2);
    ctx.drawImage(portrait, -42, -35, 84, 70);
  } else if (pose === 'cry') {
    ctx.scale(0.82, 0.72);
    ctx.drawImage(portrait, -42, -74, 84, 84);
    ctx.fillStyle = '#74d7ee';
    ctx.fillRect(5, -35, 5, 17);
    ctx.fillRect(20, -31, 5, 13);
  } else {
    if (pose === 'jump') ctx.rotate(-0.1);
    drawLimbs(ctx, pose, stride, outfit);
    if (portrait.naturalWidth) {
      ctx.drawImage(portrait, 0, 0, portrait.naturalWidth, portrait.naturalHeight * 0.64, -38, -82, 76, 60);
    } else {
      ctx.drawImage(portrait, -38, -82, 76, 88);
    }
    if (pose === 'tap') {
      ctx.fillStyle = '#fff3a5';
      ctx.fillRect(35, -28, 18, 6);
      ctx.fillRect(41, -34, 6, 18);
    }
  }
  ctx.restore();

  if (pose === 'run' && Math.abs(stride) > 4) {
    const trailDirection = facing > 0 ? -1 : 1;
    ctx.fillStyle = '#fff0c7';
    ctx.fillRect(character.x + trailDirection * 8, character.y + 28, 10, 4);
    ctx.fillRect(character.x + trailDirection * 20, character.y + 33, 7, 3);
  }
}
