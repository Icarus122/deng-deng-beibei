import { LEVELS, createGame, getPursuerRenderState, getPursuerTaunt, getRenderPlatforms, updateGame } from './game-logic.js?v=20260920d';
import { advanceCamera } from './camera.js';
import { drawCharacter } from './character-renderer.js?v=20260920d';
import { drawScene, getPalette } from './scene-renderer.js?v=20260920c';
import { advanceSimulationClock, createSimulationClock } from './simulation-clock.js';
import { createTaunt, isTauntActive } from './taunt.js';
import { createLazyBackgrounds, preloadBackground } from './assets.js';
import { createGameAudio } from './audio.js';
import { loadProgress, recordLevelResult, saveProgress } from './level-progress.js';

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
const hudNotice = document.querySelector('#hud-notice');
const winCopy = document.querySelector('#win-copy');
const winDetail = document.querySelector('#win-detail');
const chapterButtons = document.querySelectorAll('[data-level-id]');
const progressSummary = document.querySelector('#progress-summary');

const beibeiPortrait = { runnerId: 'beibei', still: new Image(), runCycle: new Image(), poses: { cry: new Image(), jump: new Image() } };
const mengPortrait = { runnerId: 'meng', still: new Image(), runCycle: new Image() };
const propsAtlas = new Image();
const backgroundImages = createLazyBackgrounds();
const gameAudio = createGameAudio();

const input = { left: false, right: false, sprint: false, jumpPressed: false, jumpReleased: false, jumpHeld: false };
let currentLevel = 1;
let state = null;
let animationFrame = 0;
let lastFrame = 0;
let lastRenderElapsedMs = 0;
let cameraX = 0;
let endTimer = 0;
let resultPose = 'running';
let queuedLevelId = null;
let simulationClock = createSimulationClock();
let taunt = null;
let lastTauntDistrictId = null;
let lastTauntMode = null;
let savedProgress = loadProgress();
let runRecorded = false;
let lastRunResult = null;
let sprintAudioActive = false;
let runnerAssetsFailed = false;
let runnerAssetRetry = 0;

const runnerAssets = [
  { image: beibeiPortrait.runCycle, url: 'assets/beibei-run-cycle-v3.png?v=20260920d' },
  { image: mengPortrait.runCycle, url: 'assets/meng-run-cycle-v3.png?v=20260920d' },
  { image: beibeiPortrait.poses.cry, url: 'assets/beibei-cry-v2.png?v=20260920d' },
  { image: beibeiPortrait.poses.jump, url: 'assets/beibei-jump-v1.png?v=20260920d' },
  { image: propsAtlas, url: 'assets/props-atlas-v1.png?v=20260920d' },
];

function runnersReady() {
  return Boolean(
    beibeiPortrait.runCycle.naturalWidth === 960
    && beibeiPortrait.runCycle.naturalHeight === 960
    && mengPortrait.runCycle.naturalWidth === 960
    && mengPortrait.runCycle.naturalHeight === 960
    && beibeiPortrait.poses.cry.naturalWidth
    && beibeiPortrait.poses.jump.naturalWidth
    && propsAtlas.naturalWidth,
  );
}

function showAssetRetry() {
  if (queuedLevelId === null) return;
  startButton.disabled = false;
  startButton.textContent = '素材加载失败，点击重试';
  gameStatus.textContent = '角色素材没有加载成功。点击开始按钮重试，或检查网络后再试。';
}

function handleRunnerAssetError() {
  runnerAssetsFailed = true;
  showAssetRetry();
}

function retryRunnerAssets() {
  runnerAssetRetry += 1;
  runnerAssetsFailed = false;
  startButton.disabled = true;
  startButton.textContent = '正在重试素材…';
  gameStatus.textContent = '正在重新加载角色和道具素材。';
  for (const { image, url } of runnerAssets) {
    if (image.naturalWidth) continue;
    const separator = url.includes('?') ? '&' : '?';
    image.src = `${url}${separator}retry=${runnerAssetRetry}`;
  }
}

function resumeQueuedLevel() {
  if (runnersReady()) runnerAssetsFailed = false;
  if (queuedLevelId === null || !runnersReady()) return;
  const levelId = queuedLevelId;
  queuedLevelId = null;
  startButton.disabled = false;
  startButton.textContent = '开始完整旅程';
  startLevel(levelId);
}

beibeiPortrait.runCycle.addEventListener('load', resumeQueuedLevel);
mengPortrait.runCycle.addEventListener('load', resumeQueuedLevel);
beibeiPortrait.poses.cry.addEventListener('load', resumeQueuedLevel);
beibeiPortrait.poses.jump.addEventListener('load', resumeQueuedLevel);
propsAtlas.addEventListener('load', resumeQueuedLevel);
runnerAssets.forEach(({ image, url }) => {
  image.addEventListener('error', handleRunnerAssetError);
  image.src = url;
});

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

function refreshChapterButtons() {
  chapterButtons.forEach((button) => {
    const levelId = Number(button.dataset.levelId);
    const level = LEVELS[levelId];
    const record = savedProgress.records[levelId];
    button.disabled = levelId > savedProgress.unlockedThrough;
    const chapterLabel = button.dataset.chapterLabel ?? level?.name ?? button.textContent;
    button.dataset.chapterLabel = chapterLabel;
    const stats = record ? ` · ${Math.round(record.bestProgress * 100)}% · ${record.bestCoins}枚` : '';
    button.textContent = `${button.disabled ? '🔒 ' : ''}${chapterLabel}${stats}`;
  });
  const unlocked = Math.max(1, savedProgress.unlockedThrough - 1);
  progressSummary.textContent = `已开放 ${unlocked}/5 个章节 · 完整旅程随时可玩`;
}

function persistRunResult() {
  if (runRecorded || !state) return lastRunResult;
  runRecorded = true;
  lastRunResult = recordLevelResult(savedProgress, currentLevel, state, LEVELS[currentLevel]);
  savedProgress = lastRunResult.progress;
  saveProgress(savedProgress);
  refreshChapterButtons();
  return lastRunResult;
}

refreshChapterButtons();

function drawPlatform(platform, elapsedMs) {
  const palette = scenePalette();
  if (platform.y === 510) {
    // Enlarge the readable road edge while preserving its y=510 contact line
    // and leaving the painting's bottom foreground visible.
    const curb = ctx.createLinearGradient(0, 492, 0, 510);
    curb.addColorStop(0, 'rgba(255, 245, 208, .82)');
    curb.addColorStop(.45, palette.platform);
    curb.addColorStop(1, palette.edge);
    ctx.fillStyle = 'rgba(20, 31, 50, .24)';
    ctx.fillRect(platform.x, 504, platform.width, 6);
    ctx.fillStyle = curb;
    ctx.fillRect(platform.x, 493, platform.width, 17);
    ctx.fillStyle = 'rgba(255,255,255,.42)';
    ctx.fillRect(platform.x, 493, platform.width, 1);
    if (propsAtlas.naturalWidth) {
      for (let x = platform.x; x < platform.x + platform.width; x += 96) {
        drawAtlasProp('curb', x, 489, Math.min(96, platform.x + platform.width - x), 21);
      }
    }
    return;
  }
  if (!platform.collapse && !platform.motion && drawAtlasProp('platform', platform.x, platform.y, platform.width, Math.max(30, platform.height + 12))) return;
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
  cameraX = advanceCamera(cameraX, state.player.x, renderDelta, VIEWPORT_WIDTH, LEVELS[currentLevel].worldEnd, state.player.horizontalSpeed);
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
  drawPursuerMotion(meng);
  drawCharacter(ctx, beibei, beibeiPortrait);
  drawCharacter(ctx, meng, mengPortrait);
  drawDust(beibei);
  drawSpeedLines();
  if (state.basketball?.active) drawBasketball(state.basketball);

  if (state.phase === 'playing' && isTauntActive(taunt, state.elapsedMs)) {
    const tauntY = Math.max(110, state.pursuer.y - 160);
    ctx.font = '16px "Microsoft YaHei", sans-serif';
    const boxWidth = Math.min(440, Math.ceil(ctx.measureText(taunt.text).width + 24));
    const boxX = Math.max(cameraX + 12, Math.min(state.pursuer.x - boxWidth / 2, cameraX + VIEWPORT_WIDTH - boxWidth - 12));
    ctx.fillStyle = '#fff9e9';
    ctx.fillRect(boxX, tauntY, boxWidth, 34);
    ctx.fillStyle = '#2c2540';
    ctx.fillText(taunt.text, boxX + 12, tauntY + 24);
  }

  if (state.phase === 'caught') {
    ctx.fillStyle = '#fff9e9';
    ctx.fillRect(state.player.x + 34, state.player.y - 68, 190, 30);
    ctx.fillStyle = '#2c2540';
    ctx.font = '16px monospace';
    ctx.fillText('没心眼，不等我', state.player.x + 43, state.player.y - 48);
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
    energyEmpty: '能量耗尽，冲刺结束！',
    coin: '收集到硬币，距离缩短！',
    surprise: '惊喜方块！硬币和冲刺都拿到了。',
    spring: '弹簧台！跳得更高了。',
    collapseWarning: '平台在塌陷，快跳！',
    constructionHit: '施工箱砸中了，孟培杰拉开距离。',
    blockerHit: '移动挡板把贝贝推开了。',
    patrolHit: '巡逻障碍拦住了贝贝。',
    wind: '天桥横风来了，注意节奏！',
    checkpoint: '到达检查点。',
    catchWindowOpened: '追上窗口开启！冲刺追上孟培杰！',
  };
  if (messages[state.event]) {
    gameStatus.textContent = messages[state.event];
    hudNotice.textContent = messages[state.event];
    hudNotice.hidden = false;
    hudNotice.dataset.expiresAt = String(state.elapsedMs + 1400);
  } else if (!hudNotice.hidden && state.elapsedMs >= Number(hudNotice.dataset.expiresAt)) {
    hudNotice.hidden = true;
  }
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
  const level = LEVELS[currentLevel];
  const badges = lastRunResult?.earnedBadges ?? [];
  const nextLevel = currentLevel >= 2 && currentLevel < 6 ? currentLevel + 1 : null;
  winCopy.textContent = currentLevel === 1 ? '贝贝追上了 · 完整旅程通关！' : `${level.name} · 追上啦！`;
  const unlockMessage = lastRunResult?.unlockedLevel
    ? currentLevel === 1 ? ' · 已开放全部章节' : ` · 已解锁${LEVELS[lastRunResult.unlockedLevel].name}`
    : '';
  winDetail.textContent = `“没心眼，不等我”${badges.length ? ` · 挑战达成：${badges.join('、')}` : ''}${unlockMessage}`;
  nextLevelButton.hidden = nextLevel === null;
  replayButton.hidden = false;
  gameStatus.textContent = `${level.name}完成，贝贝追上了。`;
  if (!winDialog.open) winDialog.showModal();
}

function handleTerminal() {
  persistRunResult();
  stopGame();
  if (state.phase === 'lost') {
    gameAudio.play('lost', { speed: state.player.horizontalSpeed });
    resultPose = 'crying';
    render();
    endTimer = window.setTimeout(showLoseDialog, 520);
    return;
  }
  gameAudio.play('caught', { speed: state.player.horizontalSpeed });
  resultPose = 'tap';
  render();
  endTimer = window.setTimeout(() => {
    resultPose = 'fallen';
    render();
    endTimer = window.setTimeout(showWinDialog, 540);
  }, 440);
}

function drawPursuerMotion(pursuer) {
  if (pursuer.mode === 'downed') return;
  const baseline = pursuer.y + (pursuer.height ?? 32);
  if (['evade', 'finalChase', 'cruise'].includes(pursuer.mode)) {
    const count = pursuer.mode === 'finalChase' ? 5 : pursuer.mode === 'evade' ? 4 : 2;
    const color = pursuer.mode === 'finalChase' ? '255, 214, 110' : pursuer.mode === 'evade' ? '255, 121, 127' : '225, 240, 247';
    ctx.save();
    ctx.strokeStyle = `rgba(${color}, ${pursuer.mode === 'cruise' ? .42 : .78})`;
    ctx.lineWidth = pursuer.mode === 'cruise' ? 1.5 : 2;
    for (let index = 0; index < count; index += 1) {
      const x = pursuer.x - 22 - index * 14 - ((state.elapsedMs / 18) % 10);
      const y = baseline - 12 - index % 3 * 15;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - (pursuer.mode === 'finalChase' ? 26 : 18), y);
      ctx.stroke();
    }
    ctx.restore();
    return;
  }
  if (pursuer.mode === 'slowed') {
    ctx.save();
    ctx.fillStyle = '#ffe68c';
    const pulse = Math.sin(state.elapsedMs / 90) * 2;
    for (let index = 0; index < 3; index += 1) {
      const x = pursuer.x + 7 + index * 13;
      const y = baseline - 84 - pulse - index % 2 * 5;
      ctx.beginPath();
      ctx.moveTo(x, y - 4); ctx.lineTo(x + 3, y); ctx.lineTo(x, y + 4); ctx.lineTo(x - 3, y); ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }
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

function drawDust(player) {
  if (!player.dustTimerMs) return;
  const alpha = Math.min(1, player.dustTimerMs / 180);
  ctx.save();
  ctx.fillStyle = `rgba(255, 241, 199, ${alpha * .72})`;
  for (let index = 0; index < 4; index += 1) {
    const offset = index * 8;
    ctx.fillRect(player.x - 10 - offset, player.y + player.height - 5 - index % 2 * 3, 5 - index % 2, 3);
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
  if (district.id !== lastTauntDistrictId || state.pursuer.mode !== lastTauntMode) {
    taunt = createTaunt(getPursuerTaunt(state.player.x / level.finishX, state.pursuer.mode, district.id), state.elapsedMs);
    lastTauntDistrictId = district.id;
    lastTauntMode = state.pursuer.mode;
  }
}

function playStepSounds(previous, next, jumpPressed) {
  if (jumpPressed) gameAudio.play('jump', { speed: next.player.horizontalSpeed });
  if (!previous.player.grounded && next.player.grounded) gameAudio.play('land', { speed: next.player.horizontalSpeed });
  const soundByEvent = {
    coin: 'pickup', energy: 'pickup', surprise: 'pickup', basketball: 'pickup', spring: 'pickup',
    checkpoint: 'checkpoint', hit: 'hit', constructionHit: 'hit', blockerHit: 'hit',
    patrolHit: 'hit', slip: 'hit', fell: 'hit', pursuerDowned: 'hit', pursuerSlowed: 'hit',
  };
  if (soundByEvent[next.event]) gameAudio.play(soundByEvent[next.event], { speed: next.player.horizontalSpeed });
  const sprinting = next.player.horizontalSpeed >= 220;
  if (sprinting && !sprintAudioActive) gameAudio.play('sprint', { speed: next.player.horizontalSpeed });
  sprintAudioActive = sprinting;
}

function frame(timestamp) {
  if (!lastFrame) lastFrame = timestamp;
  const elapsedMs = Math.min(50, timestamp - lastFrame);
  lastFrame = timestamp;
  const pacing = advanceSimulationClock(simulationClock, elapsedMs);
  simulationClock = pacing.clock;
  for (let step = 0; step < pacing.steps && state.phase === 'playing'; step += 1) {
    const previousState = state;
    const jumpPressed = input.jumpPressed;
    state = updateGame(state, input, pacing.stepMs);
    playStepSounds(previousState, state, jumpPressed);
    input.jumpPressed = false;
    input.jumpReleased = false;
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
  sprintAudioActive = false;
  runRecorded = false;
  lastRunResult = null;
  resultPose = 'running';
  lastFrame = 0;
  lastRenderElapsedMs = 0;
  cameraX = 0;
  simulationClock = createSimulationClock();
  taunt = null;
  lastTauntDistrictId = null;
  lastTauntMode = null;
  hudNotice.hidden = true;
  levelName.textContent = `${LEVELS[currentLevel].name} · 路程 0%`;
  gameStatus.textContent = `${LEVELS[currentLevel].name}追逐开始，追上孟培杰！`;
  homeScreen.hidden = true;
  gameScreen.hidden = false;
  render();
  animationFrame = requestAnimationFrame(frame);
}

function requestLevelStart(levelId) {
  void gameAudio.resume();
  if (runnersReady()) {
    startLevel(levelId);
    return;
  }
  queuedLevelId = levelId;
  if (runnerAssetsFailed) {
    retryRunnerAssets();
    return;
  }
  startButton.disabled = true;
  startButton.textContent = '角色加载中…';
  gameStatus.textContent = '正在加载高清角色素材。';
}

function returnHome() {
  stopGame();
  closeDialogs();
  state = null;
  cameraX = 0;
  lastRenderElapsedMs = 0;
  taunt = null;
  lastTauntDistrictId = null;
  lastTauntMode = null;
  hudNotice.hidden = true;
  homeScreen.hidden = false;
  gameScreen.hidden = true;
  gameStatus.textContent = '';
}

function queueJump(event) {
  event?.preventDefault();
  if (state?.phase !== 'playing') return;
  if (!input.jumpHeld) input.jumpPressed = true;
  input.jumpHeld = true;
}

function releaseJump(event) {
  event?.preventDefault();
  if (input.jumpHeld && state?.phase === 'playing') input.jumpReleased = true;
  input.jumpHeld = false;
}

window.addEventListener('keydown', (event) => {
  if (['ArrowLeft', 'a', 'A'].includes(event.key)) { input.left = true; event.preventDefault(); }
  if (['ArrowRight', 'd', 'D'].includes(event.key)) { input.right = true; input.sprint = true; event.preventDefault(); }
  if ([' ', 'ArrowUp', 'w', 'W'].includes(event.key)) queueJump(event);
});

window.addEventListener('keyup', (event) => {
  if (['ArrowLeft', 'a', 'A'].includes(event.key)) input.left = false;
  if (['ArrowRight', 'd', 'D'].includes(event.key)) { input.right = false; input.sprint = false; }
  if ([' ', 'ArrowUp', 'w', 'W'].includes(event.key)) releaseJump(event);
});

canvas.addEventListener('pointerdown', queueJump);
canvas.addEventListener('pointerup', releaseJump);
canvas.addEventListener('pointercancel', releaseJump);
startButton.addEventListener('click', () => requestLevelStart(1));
chapterButtons.forEach((button) => button.addEventListener('click', () => requestLevelStart(Number(button.dataset.levelId))));
retryButton.addEventListener('click', () => requestLevelStart(currentLevel));
giveUpButton.addEventListener('click', returnHome);
nextLevelButton.addEventListener('click', () => requestLevelStart(currentLevel + 1));
replayButton.addEventListener('click', () => requestLevelStart(currentLevel));
homeButtons.forEach((button) => button.addEventListener('click', returnHome));
