const PALETTES = {
  morning: { skyTop: '#7fbfdc', skyBottom: '#e9eeb5', ridge: '#87b9b3', far: '#b9d88c', tree: '#6bae75', trunk: '#8f654a', ground: '#5fae78', edge: '#286558', platform: '#d6b271', accent: '#ffe68c' },
  sports: { skyTop: '#8ecae6', skyBottom: '#f5e9a7', ridge: '#86b4bf', far: '#c3d588', tree: '#5caa78', trunk: '#77584b', ground: '#5cae77', edge: '#285f55', platform: '#d8ad67', accent: '#ff9f68' },
  golden: { skyTop: '#b8d5d1', skyBottom: '#f7dda0', ridge: '#9bad83', far: '#d5c66e', tree: '#b68845', trunk: '#805844', ground: '#83a65f', edge: '#4c6851', platform: '#d7b270', accent: '#ffe394' },
  lake: { skyTop: '#78b9cf', skyBottom: '#d9e5b2', ridge: '#7392a0', far: '#75bdc4', tree: '#587b75', trunk: '#5b4b4b', ground: '#4c8c89', edge: '#315f62', platform: '#bf9b67', accent: '#f7d47b' },
  sunset: { skyTop: '#865a97', skyBottom: '#f4a675', ridge: '#7d688a', far: '#a17c8d', tree: '#5e586f', trunk: '#59465f', ground: '#49767a', edge: '#284d5e', platform: '#b27c6f', accent: '#ffd579' },
};

export function getParallaxOffsets(cameraX) {
  return { far: cameraX * 0.16, middle: cameraX * 0.48, foreground: cameraX * 0.78 };
}

export function getPalette(region) {
  return PALETTES[region?.palette] ?? PALETTES.morning;
}

function repeat(start, stride, callback) {
  for (let x = start - stride; x < 1320; x += stride) callback(x);
}

function drawCloud(ctx, x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y + 18, 86, 20);
  ctx.fillRect(x + 18, y + 8, 36, 26);
  ctx.fillRect(x + 48, y, 28, 32);
}

function drawTree(ctx, x, palette, leafColor = palette.tree) {
  ctx.fillStyle = palette.trunk;
  ctx.fillRect(x + 76, 350, 22, 160);
  ctx.fillStyle = leafColor;
  ctx.fillRect(x + 42, 286, 94, 78);
  ctx.fillRect(x + 60, 252, 58, 60);
}

function drawGate(ctx, x, palette) {
  ctx.fillStyle = '#f7f0d7';
  ctx.fillRect(x + 510, 255, 190, 165);
  ctx.fillStyle = '#a95562';
  ctx.fillRect(x + 490, 238, 230, 30);
  ctx.fillRect(x + 536, 280, 24, 140);
  ctx.fillRect(x + 650, 280, 24, 140);
  ctx.fillStyle = palette.accent;
  ctx.fillRect(x + 580, 290, 58, 14);
}

function drawCourt(ctx, x, palette) {
  ctx.fillStyle = '#d5e4dc';
  ctx.fillRect(x + 520, 320, 280, 100);
  ctx.fillStyle = '#5c7386';
  for (let seat = x + 540; seat < x + 790; seat += 34) ctx.fillRect(seat, 342, 20, 18);
  ctx.fillStyle = '#ff8a5c';
  ctx.fillRect(x + 900, 230, 10, 190);
  ctx.fillRect(x + 844, 230, 122, 10);
  ctx.strokeStyle = '#fff9e9';
  ctx.lineWidth = 6;
  ctx.strokeRect(x + 888, 250, 44, 38);
}

function drawGinkgo(ctx, x, palette) {
  repeat(x, 190, (treeX) => drawTree(ctx, treeX, palette, '#d9ab46'));
  ctx.fillStyle = '#94634c';
  ctx.fillRect(x + 690, 424, 190, 18);
  ctx.fillRect(x + 715, 400, 15, 46);
  ctx.fillRect(x + 838, 400, 15, 46);
}

function drawLakeside(ctx, x, palette, elapsedMs) {
  ctx.fillStyle = '#76c4ca';
  ctx.fillRect(0, 432, 1300, 108);
  ctx.fillStyle = '#dcecb9';
  for (let ripple = x; ripple < 1320; ripple += 118) ctx.fillRect(ripple, 454 + Math.round(Math.sin((elapsedMs + ripple) / 130) * 4), 64, 5);
  ctx.fillStyle = '#565369';
  ctx.fillRect(x + 690, 150, 22, 270);
  ctx.fillRect(x + 712, 165, 190, 16);
  ctx.fillRect(x + 875, 180, 9, 130);
  ctx.fillStyle = '#f5bd64';
  ctx.fillRect(x + 852, 295, 50, 12);
}

function drawBridge(ctx, x, palette) {
  ctx.fillStyle = '#4b4763';
  for (let tower = x; tower < 1320; tower += 96) {
    const height = 82 + ((Math.floor(tower / 96) & 3) * 34);
    ctx.fillRect(tower, 360 - height, 68, height);
    ctx.fillStyle = '#ffd579';
    ctx.fillRect(tower + 15, 330 - height / 2, 11, 16);
    ctx.fillStyle = '#4b4763';
  }
  ctx.fillStyle = '#4b4763';
  ctx.fillRect(0, 306, 1300, 20);
  ctx.fillStyle = palette.accent;
  for (let lamp = x; lamp < 1300; lamp += 155) {
    ctx.fillRect(lamp, 283, 16, 23);
    ctx.fillStyle = '#4b4763';
    ctx.fillRect(lamp + 6, 245, 5, 38);
    ctx.fillStyle = palette.accent;
  }
}

function drawHdBackground(ctx, image, cameraX) {
  if (!image?.naturalWidth) return false;
  // A wide overscan lets the painting drift with the camera without tiling.
  const drift = -135 + Math.sin(cameraX / 1200) * 135;
  ctx.drawImage(image, drift, -57, 1550, 654);
  ctx.fillStyle = 'rgba(62, 60, 122, .12)';
  ctx.fillRect(0, 0, 1300, 540);
  ctx.fillStyle = 'rgba(255, 188, 124, .08)';
  ctx.fillRect(0, 0, 1300, 540);
  const shade = ctx.createLinearGradient(0, 310, 0, 540);
  shade.addColorStop(0, 'rgba(23, 31, 58, 0)');
  shade.addColorStop(1, 'rgba(16, 23, 48, .32)');
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, 1300, 540);
  return true;
}

function drawHdParallax(ctx, region, cameraX, elapsedMs) {
  const palette = getPalette(region);
  const offsets = getParallaxOffsets(cameraX);
  ctx.save();

  // Midground silhouettes move independently from the painted far background.
  ctx.globalAlpha = 0.3;
  const middleStart = -(offsets.middle % 340);
  repeat(middleStart, 340, (x) => {
    const glow = ctx.createRadialGradient(x + 70, 310, 3, x + 70, 310, 32);
    glow.addColorStop(0, `${palette.accent}cc`);
    glow.addColorStop(1, `${palette.accent}00`);
    ctx.fillStyle = glow;
    ctx.fillRect(x + 36, 276, 72, 68);
    ctx.fillStyle = '#28334f';
    ctx.fillRect(x + 66, 292, 7, 128);
    ctx.fillRect(x + 49, 286, 40, 8);
  });

  // Near rail, leaves and light streaks are intentionally translucent so the
  // HD painting remains the world rather than becoming a covered backdrop.
  ctx.globalAlpha = 0.42;
  const foregroundStart = -(offsets.foreground % 190);
  repeat(foregroundStart, 190, (x) => {
    ctx.fillStyle = '#1f2b42';
    ctx.fillRect(x, 494, 154, 3);
    ctx.fillRect(x + 18, 474, 4, 36);
    ctx.fillRect(x + 132, 474, 4, 36);
    if (region?.id === 'ginkgo' || region?.id === 'lakeside') {
      const leafY = 322 + ((x / 19) % 4) * 22 + Math.sin((elapsedMs + x) / 280) * 7;
      ctx.fillStyle = region?.id === 'ginkgo' ? '#f3c46b' : '#b8e0c8';
      ctx.beginPath();
      ctx.ellipse(x + 75, leafY, 7, 3, -0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  ctx.restore();
}

export function drawScene(ctx, { region, cameraX, elapsedMs, backgrounds }) {
  const palette = getPalette(region);
  const offsets = getParallaxOffsets(cameraX);
  const hasHdBackground = drawHdBackground(ctx, backgrounds?.[region?.id], cameraX);
  if (!hasHdBackground) {
    const gradient = ctx.createLinearGradient(0, 0, 0, 540);
    gradient.addColorStop(0, palette.skyTop);
    gradient.addColorStop(1, palette.skyBottom);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1300, 540);
    ctx.fillStyle = palette.accent;
    ctx.fillRect(1000, 70, 48, 48);
    ctx.fillStyle = `${palette.accent}88`;
    ctx.fillRect(986, 58, 76, 76);
    repeat(-(offsets.far % 320), 320, (x) => {
      drawCloud(ctx, x + 45, 68 + ((Math.floor(x / 320) & 1) * 35), '#fff9e9aa');
      ctx.fillStyle = palette.ridge; ctx.fillRect(x, 296, 320, 72); ctx.fillRect(x + 56, 258, 132, 72);
      ctx.fillStyle = palette.far; ctx.fillRect(x + 170, 326, 170, 58);
    });
    const middleX = -(offsets.middle % 480);
    if (region?.id === 'gate') drawGate(ctx, middleX, palette);
    if (region?.id === 'court') drawCourt(ctx, middleX, palette);
    if (region?.id === 'ginkgo') drawGinkgo(ctx, middleX, palette);
    if (region?.id === 'lakeside') drawLakeside(ctx, middleX, palette, elapsedMs);
    if (region?.id === 'bridge') drawBridge(ctx, middleX, palette);
    if (region?.id !== 'ginkgo') repeat(-(offsets.foreground % 170), 170, (x) => drawTree(ctx, x, palette));
  } else {
    drawHdParallax(ctx, region, cameraX, elapsedMs);
  }
}
