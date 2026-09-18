import { LEVELS, createGame, getPursuerRenderState, getPursuerTaunt, getRenderPlatforms, updateGame } from './game-logic.js';
import { advanceCamera } from './camera.js';
import { drawCharacter } from './character-renderer.js?v=20260918r2';
import { drawScene, getPalette } from './scene-renderer.js';
import { advanceSimulationClock, createSimulationClock } from './simulation-clock.js';
import { createTaunt, isTauntActive } from './taunt.js';
import { createLazyBackgrounds, preloadBackground } from './assets.js';

const canvas = document.querySelector('#game-canvas');
const ctx = canvas.getContext('2d');
const VIEWPORT_WIDTH = 1280;
const VIEWPORT_HEIGHT = 540;
const homeScreen = document.querySelector('#home-screen');
const gameScreen = document.querySelector('#game-screen');
const startButton = document.querySelector('#start-button');
const retryButton = document.querySelector('#retry-button');
const giveUpButton = document.querySelector('#give-up-button');
const nextLevelButton = document.querySelector('#next-level-button');
const replayButton = document.querySelector('#replay-button');
const homeButtons = document.querySelectorAll('.home-button');
const loseDialog = document.querySelector('#lose-dialog');
const winDialog = document.querySelector('#win-dialog');
const levelName = document.querySelector('#level-name');
const distanceFill = document.querySelector('#distance-fill');
const energyFill = document.querySelector('#energy-fill');
const gameStatus = document.querySelector('#game-status');
const winCopy = document.querySelector('#win-copy');
const winDetail = document.querySelector('#win-detail');

const beibeiPortrait = { runnerId: 'beibei', still: new Image(), runCycle: new Image() };
const mengPortrait = { runnerId: 'meng', still: new Image(), runCycle: new Image() };
const propsAtlas = new Image();
const backgroundImages = createLazyBackgrounds();
beibeiPortrait.still.src = 'assets/beibei-runner.png';
beibeiPortrait.runCycle.src = 'assets/beibei-run-v2.png';
mengPortrait.still.src = 'assets/meng-runner.png';
mengPortrait.runCycle.src = 'assets/meng-run-v2.png';
propsAtlas.src = 'assets/props-atlas-v1.png';

const input = { left: false, right: false, sprint: false, jumpPressed: false };
let currentLevel = 1;
let state = null;
let animationFrame = 0;
let lastFrame = 0;
let lastRenderElapsedMs = 0;
let cameraX = 0;
let endTimer = 0;
let resultPose = 'running';
let simulationClock = createSimulationClock();
let taunt = null;
let lastTauntDistrictId = null;

function configureCanvas() {
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = VIEWPORT_WIDTH * pixelRatio;
  canvas.height = VIEWPORT_HEIGHT * pixelRatio;
  canvas.style.aspectRatio = `${VIEWPORT_WIDTH} / ${VIEWPORT_HEIGHT}`;
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
}

configureCanvas();
ctx.imageSmoothingEnabled = true;
ctx.imageSmoothingQuality = 'high';

function closeDialogs() {
  [loseDialog, winDialog].forEach((dialog) => {
    if (dialog.open) dialog.close();
  });
}

function currentDistrict() {
  const districts = LEVELS[currentLevel].districts;
  return districts?.find((district) => state.player.x >= district.start && state.player.x < district.end) ?? districts?.at(-1);
}

function scenePalette() {
  return getPalette(currentDistrict());
}

function drawBackground(cameraX) {
  const district = currentDistrict();
  preloadBackground(backgroundImages, district?.id);
  const districtIndex = LEVELS[currentLevel].districts.findIndex((item) => item.id === district?.id);
  preloadBackground(backgroundImages, LEVELS[currentLevel].districts[districtIndex + 1]?.id);
  drawScene(ctx, { region: district, cameraX, elapsedMs: state.elapsedMs, backgrounds: backgroundImages });
}

function drawPlatform(platform, elapsedMs) {
  const palette = scenePalette();
  if (platform.y === 510) {
    // Keep the source painting's lower foreground visible.  This is a thin,
    // readable walkable curb instead of the old opaque 30px colour slab.
    const curb = ctx.createLinearGradient(0, 502, 0, 510);
    curb.addColorStop(0, 'rgba(255, 245, 208, .82)');
    curb.addColorStop(.45, palette.platform);
    curb.addColorStop(1, palette.edge);
    ctx.fillStyle = 'rgba(20, 31, 50, .24)';
    ctx.fillRect(platform.x, 507, platform.width, 7);
    ctx.fillStyle = curb;
    ctx.fillRect(platform.x, 503, platform.width, 5);
    ctx.fillStyle = 'rgba(255,255,255,.42)';
    ctx.fillRect(platform.x, 503, platform.width, 1);
    if (propsAtlas.naturalWidth) {
      for (let x = platform.x; x < platform.x + platform.width; x += 96) {
        drawAtlasProp('curb', x, 496, Math.min(96, platform.x + platform.width - x), 14);
      }
    }
    return;
  }
  if (!platform.collapse && !platform.motion && drawAtlasProp('platform', platform.x, platform.y - 6, platform.width, Math.max(30, platform.height + 12))) return;
  ctx.fillStyle = palette.edge;
  ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
  ctx.fillStyle = platform.collapse ? '#f39a5a' : palette.platform;
  ctx.fillRect(platform.x + 4, platform.y + 4, platform.width - 8, 13);
  ctx.fillStyle = '#fff0b2';
  for (let x = platform.x + 12; x < platform.x + platform.width - 6; x += 36) ctx.fillRect(x, platform.y + 9, 14, 3);
  if (platform.collapse) {
    ctx.fillStyle = Math.floor(elapsedMs / 80) % 2 ? '#fff4ce' : '#d95767';
    ctx.fillRect(platform.x + 7, platform.y + 2, platform.width - 14, 3);
  }
  if (platform.motion) {
    ctx.fillStyle = '#73d3d0';
    ctx.fillRect(platform.x + 8, platform.y + 17, platform.width - 16, 4);
    ctx.fillRect(platform.x + 4, platform.y + 3, 5, platform.height - 4);
    ctx.fillRect(platform.x + platform.width - 9, platform.y + 3, 5, platform.height - 4);
  }
}

const PROP_FRAMES = {
  basketball: [0, 0], banana: [1, 0], bookbag: [2, 0], barrier: [3, 0],
  crate: [0, 1], coin: [1, 1], energy: [2, 1], spring: [3, 1],
  surprise: [0, 2], checkpoint: [1, 2], platform: [2, 2], curb: [3, 2],
};

function drawAtlasProp(id, x, y, width, height) {
  const frame = PROP_FRAMES[id];
  if (!frame || !propsAtlas.naturalWidth) return false;
  ctx.drawImage(propsAtlas, frame[0] * 256, frame[1] * 256, 256, 256, x, y, width, height);
  return true;
}

function drawHazard(hazard, elapsedMs) {
  if (hazard.type === 'collapse') {
    ctx.fillStyle = '#fff4ce';
    ctx.fillRect(hazard.x + hazard.width / 2 - 4, hazard.y - 28, 8, 12);
    ctx.fillStyle = Math.floor(elapsedMs / 110) % 2 ? '#ff797f' : '#ffd85e';
    ctx.fillRect(hazard.x + hazard.width / 2 - 10, hazard.y - 18, 20, 14);
    return;
  }
  if (hazard.type === 'constructionBox') {
    if (drawAtlasProp('crate', hazard.x - 8, hazard.y - 6, hazard.width + 16, hazard.height + 16)) return;
    ctx.fillStyle = hazard.warning ? '#ffd85e' : '#bd6b43';
    ctx.fillRect(hazard.x, hazard.y, hazard.width, hazard.height);
    ctx.fillStyle = '#2c2540';
    ctx.fillRect(hazard.x + 4, hazard.y + 5, hazard.width - 8, 5);
    ctx.fillRect(hazard.x + 4, hazard.y + 17, hazard.width - 8, 5);
    if (hazard.warning) {
      ctx.fillStyle = '#ff797f';
      ctx.fillRect(hazard.x + 12, hazard.y - 22, 14, 12);
    }
    return;
  }
  if (hazard.type === 'blocker') {
    if (drawAtlasProp('barrier', hazard.x - 8, hazard.y - 8, hazard.width + 16, hazard.height + 16)) return;
    ctx.fillStyle = '#2c2540';
    ctx.fillRect(hazard.x, hazard.y, hazard.width, hazard.height);
    ctx.fillStyle = '#fff4ce';
    for (let y = hazard.y + 7; y < hazard.y + hazard.height - 5; y += 16) ctx.fillRect(hazard.x + 4, y, hazard.width - 8, 6);
    ctx.fillStyle = '#ff797f';
    ctx.fillRect(hazard.x - 6, hazard.y + hazard.height - 5, hazard.width + 12, 5);
    return;
  }
  if (hazard.type === 'patrol') {
    const blink = Math.floor(elapsedMs / 120) % 2;
    ctx.fillStyle = '#f3ae5b';
    ctx.fillRect(hazard.x + 5, hazard.y + 10, hazard.width - 10, hazard.height - 10);
    ctx.fillRect(hazard.x + 9, hazard.y + 4, hazard.width - 18, 8);
    ctx.fillStyle = blink ? '#ff797f' : '#fff4ce';
    ctx.fillRect(hazard.x + 11, hazard.y + 18, hazard.width - 22, 5);
    ctx.fillStyle = '#2c2540';
    ctx.fillRect(hazard.x + 4, hazard.y + hazard.height - 4, 6, 4);
    ctx.fillRect(hazard.x + hazard.width - 10, hazard.y + hazard.height - 4, 6, 4);
  }
}

function drawObstacle(obstacle, elapsedMs) {
  if (obstacle.type === 'wind') {
    const sway = Math.sin(elapsedMs / 140) * 6;
    ctx.save();
    ctx.globalAlpha = 0.68;
    ctx.strokeStyle = '#d9f5ff';
    ctx.lineWidth = 3;
    for (let y = obstacle.y + 18; y < obstacle.y + obstacle.height; y += 28) {
      ctx.beginPath();
      ctx.moveTo(obstacle.x, y);
      ctx.quadraticCurveTo(obstacle.x + obstacle.width * 0.45, y + sway, obstacle.x + obstacle.width, y - 4);
      ctx.stroke();
    }
    ctx.restore();
    return;
  }
  if (obstacle.type === 'surprise') {
    if (drawAtlasProp('surprise', obstacle.x - 7, obstacle.y - 7, obstacle.width + 14, obstacle.height + 14)) return;
    ctx.fillStyle = '#754f8f';
    ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    ctx.fillStyle = '#ffd85e';
    ctx.fillRect(obstacle.x + 4, obstacle.y + 4, obstacle.width - 8, obstacle.height - 8);
    ctx.fillStyle = '#754f8f';
    ctx.font = '20px monospace';
    ctx.fillText('?', obstacle.x + 8, obstacle.y + 23);
    return;
  }
  if (obstacle.type === 'spring') {
    if (drawAtlasProp('spring', obstacle.x - 6, obstacle.y - 10, obstacle.width + 12, obstacle.height + 20)) return;
    ctx.fillStyle = '#d95767';
    ctx.fillRect(obstacle.x, obstacle.y + 12, obstacle.width, 12);
    ctx.fillStyle = '#fff0b2';
    ctx.fillRect(obstacle.x + 4, obstacle.y + 5, obstacle.width - 8, 7);
    ctx.fillStyle = '#2c2540';
    for (let x = obstacle.x + 5; x < obstacle.x + obstacle.width - 4; x += 8) ctx.fillRect(x, obstacle.y + 12, 4, 8);
    return;
  }
  if (obstacle.type === 'basketball') {
    if (drawAtlasProp('basketball', obstacle.x - 3, obstacle.y - 3, obstacle.width + 6, obstacle.height + 6)) return;
    ctx.fillStyle = '#ef8c45';
    ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    ctx.fillStyle = '#6b3b3a';
    ctx.fillRect(obstacle.x + 10, obstacle.y, 3, obstacle.height);
    ctx.fillRect(obstacle.x, obstacle.y + 10, obstacle.width, 3);
    return;
  }
  if (obstacle.type === 'banana') {
    if (drawAtlasProp('banana', obstacle.x - 4, obstacle.y - 4, obstacle.width + 8, obstacle.height + 8)) return;
    ctx.fillStyle = '#ffd85e';
    ctx.fillRect(obstacle.x, obstacle.y + 8, obstacle.width, 8);
    ctx.fillRect(obstacle.x + 4, obstacle.y + 4, obstacle.width - 8, 8);
    ctx.fillStyle = '#70514b';
    ctx.fillRect(obstacle.x - 2, obstacle.y + 13, 5, 4);
    ctx.fillRect(obstacle.x + obstacle.width - 3, obstacle.y + 6, 5, 4);
    return;
  }
  if (obstacle.type === 'barrier') {
    if (drawAtlasProp('barrier', obstacle.x - 8, obstacle.y - 8, obstacle.width + 16, obstacle.height + 16)) return;
    ctx.fillStyle = '#f3ae5b';
    ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    ctx.fillStyle = '#fff4ce';
    ctx.fillRect(obstacle.x + 4, obstacle.y + 8, obstacle.width - 8, 6);
    ctx.fillRect(obstacle.x + 4, obstacle.y + 24, obstacle.width - 8, 6);
    return;
  }
  if (obstacle.type === 'speedPad') {
    const glow = ctx.createLinearGradient(obstacle.x, 0, obstacle.x + obstacle.width, 0);
    glow.addColorStop(0, '#4dd6d0');
    glow.addColorStop(.5, '#f2ffe0');
    glow.addColorStop(1, '#4dd6d0');
    ctx.fillStyle = 'rgba(38, 74, 96, .68)';
    ctx.fillRect(obstacle.x, obstacle.y + 8, obstacle.width, obstacle.height - 8);
    ctx.fillStyle = glow;
    for (let x = obstacle.x + 4; x < obstacle.x + obstacle.width - 8; x += 16) {
      ctx.beginPath();
      ctx.moveTo(x, obstacle.y + 9);
      ctx.lineTo(x + 10, obstacle.y + 9);
      ctx.lineTo(x + 4, obstacle.y + obstacle.height - 3);
      ctx.closePath();
      ctx.fill();
    }
    return;
  }
  const wobble = Math.round(Math.sin(elapsedMs / 140) * 3);
  if (obstacle.type === 'bookbag' && drawAtlasProp('bookbag', obstacle.x - 6, obstacle.y - 6, obstacle.width + 12, obstacle.height + 12)) return;
  ctx.save();
  ctx.translate(obstacle.x + 14, obstacle.y + 18);
  ctx.rotate(wobble * 0.02);
  ctx.fillStyle = '#4d416d';
  ctx.fillRect(-14, -16, 28, 30);
  ctx.fillStyle = '#ffba75';
  ctx.fillRect(-10, -13, 20, 7);
  ctx.fillStyle = '#2c2540';
  ctx.fillRect(-9, 14, 6, 5);
  ctx.fillRect(3, 14, 6, 5);
  ctx.restore();
}

function drawBasketball(ball) {
  const radius = ball.width / 2;
  ctx.save();
  ctx.translate(ball.x + radius, ball.y + radius);
  const ballGradient = ctx.createRadialGradient(-4, -5, 1, 0, 0, radius);
  ballGradient.addColorStop(0, '#ffcf82');
  ballGradient.addColorStop(0.36, '#f29a4c');
  ballGradient.addColorStop(1, '#b84f37');
  ctx.fillStyle = ballGradient;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#6b3b3a';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, -radius); ctx.lineTo(0, radius); ctx.moveTo(-radius, 0); ctx.lineTo(radius, 0); ctx.stroke();
  ctx.restore();
}

function drawEnergy(energy, elapsedMs) {
  if (drawAtlasProp('energy', energy.x - 7, energy.y - 7, energy.width + 14, energy.height + 14)) return;
  const pulse = Math.sin(elapsedMs / 110) * 3;
  ctx.save();
  ctx.translate(energy.x + energy.width / 2, energy.y + energy.height / 2);
  ctx.fillStyle = 'rgba(255, 238, 149, .35)';
  ctx.beginPath(); ctx.arc(0, 0, energy.width / 2 + 5 + pulse, 0, Math.PI * 2); ctx.fill();
  const crystal = ctx.createLinearGradient(0, -energy.height / 2, 0, energy.height / 2);
  crystal.addColorStop(0, '#fff1a0'); crystal.addColorStop(.5, '#ff8e93'); crystal.addColorStop(1, '#cc4f83');
  ctx.fillStyle = crystal;
  ctx.beginPath();
  ctx.moveTo(0, -energy.height / 2); ctx.lineTo(energy.width / 2 - 2, 0); ctx.lineTo(0, energy.height / 2); ctx.lineTo(-energy.width / 2 + 2, 0); ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawCoin(coin, elapsedMs) {
  if (drawAtlasProp('coin', coin.x - 5, coin.y - 5, coin.width + 10, coin.height + 10)) return;
  const radius = coin.width / 2;
  const shine = Math.sin((elapsedMs + coin.x) / 120) * 2;
  ctx.save();
  ctx.translate(coin.x + radius, coin.y + coin.height / 2);
  ctx.scale(1 + shine * .04, 1);
  const metal = ctx.createRadialGradient(-3, -5, 1, 0, 0, radius);
  metal.addColorStop(0, '#fff6ba'); metal.addColorStop(.42, '#ffd75e'); metal.addColorStop(1, '#b96d28');
  ctx.fillStyle = metal;
  ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#fff4ce'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0, 0, radius - 3, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
}

function drawCheckpoint(checkpoint) {
  if (drawAtlasProp('checkpoint', checkpoint.x - 14, 416, 58, 94)) return;
  ctx.fillStyle = '#fff9e9';
  ctx.fillRect(checkpoint.x, 426, 6, 84);
  ctx.fillStyle = '#ff797f';
  ctx.fillRect(checkpoint.x + 6, 430, 32, 22);
}

function drawDistanceBubble() {
  if (state.energyTimerMs <= 0 && state.platformBoostTimerMs <= 0 && state.speedPadTimerMs <= 0) return;
  ctx.fillStyle = '#ff797f';
  ctx.fillRect(350, 55, 210, 28);
  ctx.fillStyle = '#fff9e9';
  ctx.font = '16px monospace';
  const label = state.speedPadTimerMs > 0 ? '加速带！高速前进' : state.platformBoostTimerMs > 0 ? '高路加速！保持节奏' : '贝贝能量！冲刺中';
  ctx.fillText(label, 370, 75);
}

function render() {
  if (!state) return;
  const renderDelta = Math.max(0, state.elapsedMs - lastRenderElapsedMs);
  cameraX = advanceCamera(cameraX, state.player.x, renderDelta, VIEWPORT_WIDTH, LEVELS[currentLevel].worldEnd);
  lastRenderElapsedMs = state.elapsedMs;
  const level = LEVELS[currentLevel];
  const platforms = getRenderPlatforms(currentLevel, state.elapsedMs, state.collapseStarts);
  const closeZoom = Math.max(0, Math.min(.025, (190 - state.distance) / 2800));

  ctx.clearRect(0, 0, VIEWPORT_WIDTH, VIEWPORT_HEIGHT);
  ctx.save();
  if (closeZoom) {
    ctx.translate(VIEWPORT_WIDTH / 2, VIEWPORT_HEIGHT / 2);
    ctx.scale(1 + closeZoom, 1 + closeZoom);
    ctx.translate(-VIEWPORT_WIDTH / 2, -VIEWPORT_HEIGHT / 2);
  }
  drawBackground(cameraX);
  ctx.save();
  ctx.translate(-cameraX, 0);
  platforms.forEach((platform) => drawPlatform(platform, state.elapsedMs));
  level.checkpoints.forEach(drawCheckpoint);
  level.energy.filter((energy) => !state.collectedEnergyIds.includes(energy.id)).forEach((energy) => drawEnergy(energy, state.elapsedMs));
  level.coins.filter((coin) => !state.collectedCoinIds.includes(coin.id)).forEach((coin) => drawCoin(coin, state.elapsedMs));
  level.obstacles.filter((obstacle) => !state.collectedObstacleIds.includes(obstacle.id)).forEach((obstacle) => drawObstacle(obstacle, state.elapsedMs));
  state.hazards?.forEach((hazard) => drawHazard(hazard, state.elapsedMs));

  const beibei = { ...state.player, mode: state.phase === 'lost' ? 'cry' : state.phase === 'caught' && resultPose === 'tap' ? 'tap' : undefined };
  const meng = { ...getPursuerRenderState(state.pursuer), mode: state.phase === 'caught' && resultPose === 'fallen' ? 'downed' : state.pursuer.mode };
  drawCharacter(ctx, beibei, beibeiPortrait);
  drawCharacter(ctx, meng, mengPortrait);
  drawGapLabel(meng);
  drawSpeedLines();
  if (state.basketball?.active) drawBasketball(state.basketball);

  if (state.phase === 'playing' && isTauntActive(taunt, state.elapsedMs)) {
    ctx.fillStyle = '#fff9e9';
    ctx.fillRect(state.pursuer.x - 130, 360, 260, 34);
    ctx.fillStyle = '#2c2540';
    ctx.font = '16px "Microsoft YaHei", sans-serif';
    ctx.fillText(taunt.text, state.pursuer.x - 120, 384);
  }

  if (state.phase === 'caught') {
    ctx.fillStyle = '#fff9e9';
    ctx.fillRect(state.player.x + 34, state.player.y - 55, 190, 30);
    ctx.fillStyle = '#2c2540';
    ctx.font = '16px monospace';
    ctx.fillText('没心眼，不等我', state.player.x + 43, state.player.y - 35);
  }
  ctx.restore();
  ctx.restore();
  drawDistanceBubble();
  drawChaseFeedback();

  const remaining = Math.max(0, Math.round(((state.maxDistance - state.distance) / state.maxDistance) * 100));
  distanceFill.style.width = `${remaining}%`;
  energyFill.style.width = `${Math.round(state.energyMeter ?? 0)}%`;
  const district = currentDistrict();
  const progress = Math.min(100, Math.round((state.player.x / level.finishX) * 100));
  levelName.textContent = `${district?.name ?? level.name} · 路程 ${progress}% · 硬币 ${state.coins}`;
}

function updateLiveText() {
  if (!state) return;
  const messages = {
    hit: '撞到书包了，孟培杰拉开了距离。',
    fell: '掉下去了，回到检查点，距离拉开。',
    energy: '拿到贝贝能量，正在冲刺！',
    coin: '收集到硬币，距离缩短！',
    surprise: '惊喜方块！硬币和冲刺都拿到了。',
    spring: '弹簧台！跳得更高了。',
    collapseWarning: '平台在塌陷，快跳！',
    constructionHit: '施工箱砸中了，孟培杰拉开距离。',
    blockerHit: '移动挡板把贝贝推开了。',
    patrolHit: '巡逻障碍拦住了贝贝。',
    wind: '天桥横风来了，注意节奏！',
    checkpoint: '到达检查点。',
  };
  if (messages[state.event]) gameStatus.textContent = messages[state.event];
}

function stopGame() {
  cancelAnimationFrame(animationFrame);
  animationFrame = 0;
  clearTimeout(endTimer);
}

function showLoseDialog() {
  gameStatus.textContent = '贝贝跟丢了。';
  if (!loseDialog.open) loseDialog.showModal();
}

function showWinDialog() {
  winCopy.textContent = '贝贝追上了 · 通关啦！';
  winDetail.textContent = '没心眼，不等我';
  nextLevelButton.hidden = true;
  replayButton.hidden = false;
  gameStatus.textContent = '长途追赶完成，贝贝追上了。';
  if (!winDialog.open) winDialog.showModal();
}

function handleTerminal() {
  stopGame();
  if (state.phase === 'lost') {
    resultPose = 'crying';
    render();
    endTimer = window.setTimeout(showLoseDialog, 520);
    return;
  }
  resultPose = 'tap';
  render();
  endTimer = window.setTimeout(() => {
    resultPose = 'fallen';
    render();
    endTimer = window.setTimeout(showWinDialog, 540);
  }, 440);
}

function drawGapLabel(pursuer) {
  const gap = Math.max(0, Math.round(state.pursuer.x - state.player.x));
  ctx.save();
  ctx.fillStyle = 'rgba(24, 30, 57, .84)';
  ctx.beginPath();
  ctx.roundRect(pursuer.x - 24, pursuer.y - 39, 66, 22, 9);
  ctx.fill();
  ctx.fillStyle = gap <= 180 ? '#ffe68c' : '#fff9e9';
  ctx.font = '700 13px "Microsoft YaHei", sans-serif';
  ctx.fillText(`${gap}px`, pursuer.x - 15, pursuer.y - 24);
  ctx.restore();
}

function drawSpeedLines() {
  const alpha = Math.max(0, Math.min(1, (190 - state.distance) / 70));
  if (!alpha) return;
  ctx.save();
  ctx.strokeStyle = `rgba(255, 247, 211, ${alpha * .72})`;
  ctx.lineWidth = 2;
  for (let index = 0; index < 7; index += 1) {
    const y = 340 + index * 19;
    const x = state.player.x - 130 + ((state.elapsedMs / 10 + index * 47) % 80);
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 42 + index * 5, y); ctx.stroke();
  }
  ctx.restore();
}

function drawChaseFeedback() {
  const danger = Math.max(0, Math.min(1, (state.distance - state.maxDistance * .7) / (state.maxDistance * .3)));
  if (!danger) return;
  const pulse = .14 + Math.sin(state.elapsedMs / 120) * .07;
  const width = 150 + danger * 200;
  const edge = ctx.createLinearGradient(0, 0, width, 0);
  edge.addColorStop(0, `rgba(222, 45, 76, ${pulse * danger})`);
  edge.addColorStop(1, 'rgba(222, 45, 76, 0)');
  ctx.fillStyle = edge; ctx.fillRect(0, 0, width, VIEWPORT_HEIGHT);
  const right = ctx.createLinearGradient(VIEWPORT_WIDTH, 0, VIEWPORT_WIDTH - width, 0);
  right.addColorStop(0, `rgba(222, 45, 76, ${pulse * danger})`);
  right.addColorStop(1, 'rgba(222, 45, 76, 0)');
  ctx.fillStyle = right; ctx.fillRect(VIEWPORT_WIDTH - width, 0, width, VIEWPORT_HEIGHT);
}

function updateTaunt() {
  const level = LEVELS[currentLevel];
  const district = currentDistrict();
  if (state.phase !== 'playing' || state.player.x <= level.finishX * 0.08 || !district) return;
  if (district.id !== lastTauntDistrictId) {
    taunt = createTaunt(getPursuerTaunt(state.player.x / level.finishX), state.elapsedMs);
    lastTauntDistrictId = district.id;
  }
}

function frame(timestamp) {
  if (!lastFrame) lastFrame = timestamp;
  const elapsedMs = Math.min(50, timestamp - lastFrame);
  lastFrame = timestamp;
  const pacing = advanceSimulationClock(simulationClock, elapsedMs);
  simulationClock = pacing.clock;
  for (let step = 0; step < pacing.steps && state.phase === 'playing'; step += 1) {
    state = updateGame(state, input, pacing.stepMs);
    input.jumpPressed = false;
    updateTaunt();
    updateLiveText();
  }
  render();
  if (state.phase !== 'playing') {
    handleTerminal();
    return;
  }
  animationFrame = requestAnimationFrame(frame);
}

function startLevel(levelId) {
  stopGame();
  closeDialogs();
  currentLevel = levelId;
  state = createGame(levelId);
  resultPose = 'running';
  lastFrame = 0;
  lastRenderElapsedMs = 0;
  cameraX = 0;
  simulationClock = createSimulationClock();
  taunt = null;
  lastTauntDistrictId = null;
  levelName.textContent = '校园入口 · 路程 0%';
  gameStatus.textContent = '连续追逐开始，追上孟培杰！';
  homeScreen.hidden = true;
  gameScreen.hidden = false;
  render();
  animationFrame = requestAnimationFrame(frame);
}

function returnHome() {
  stopGame();
  closeDialogs();
  state = null;
  cameraX = 0;
  lastRenderElapsedMs = 0;
  taunt = null;
  lastTauntDistrictId = null;
  homeScreen.hidden = false;
  gameScreen.hidden = true;
  gameStatus.textContent = '';
}

function queueJump(event) {
  event?.preventDefault();
  if (state?.phase === 'playing') input.jumpPressed = true;
}

window.addEventListener('keydown', (event) => {
  if (['ArrowLeft', 'a', 'A'].includes(event.key)) { input.left = true; event.preventDefault(); }
  if (['ArrowRight', 'd', 'D'].includes(event.key)) { input.right = true; input.sprint = true; event.preventDefault(); }
  if ([' ', 'ArrowUp', 'w', 'W'].includes(event.key)) queueJump(event);
});

window.addEventListener('keyup', (event) => {
  if (['ArrowLeft', 'a', 'A'].includes(event.key)) input.left = false;
  if (['ArrowRight', 'd', 'D'].includes(event.key)) { input.right = false; input.sprint = false; }
});

canvas.addEventListener('pointerdown', queueJump);
startButton.addEventListener('click', () => startLevel(1));
retryButton.addEventListener('click', () => startLevel(currentLevel));
giveUpButton.addEventListener('click', returnHome);
nextLevelButton.addEventListener('click', () => startLevel(1));
replayButton.addEventListener('click', () => startLevel(1));
homeButtons.forEach((button) => button.addEventListener('click', returnHome));
