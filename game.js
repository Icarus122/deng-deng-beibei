import { LEVELS, createGame, getPursuerRenderState, getPursuerTaunt, getRenderPlatforms, updateGame } from './game-logic.js?v=20260925b';
import { advanceCamera } from './camera.js';
import { drawCharacter } from './character-renderer.js?v=20260925b';
import { drawScene, getPalette } from './scene-renderer.js?v=20260920c';
import { advanceSimulationClock, createSimulationClock } from './simulation-clock.js';
import { advanceTauntCue, createTaunt, createTauntTracker, isTauntActive } from './taunt.js?v=20260925a';
import { createLazyBackgrounds, preloadBackground } from './assets.js?v=20260924a';
import { createGameAudio } from './audio.js?v=20260921a';
import { loadProgress, markStorySeen, recordLevelResult, saveProgress } from './level-progress.js?v=20260924a';
import { getStoryScene } from './story-scenes.js?v=20260925b';

const canvas = document.querySelector('#game-canvas');
const ctx = canvas.getContext('2d');
const VIEWPORT_WIDTH = 1280;
const VIEWPORT_HEIGHT = 540;
const homeScreen = document.querySelector('#home-screen');
const gameScreen = document.querySelector('#game-screen');
const startButton = document.querySelector('#start-button');
const levelSelectButton = document.querySelector('#level-select-button');
const levelSelectDialog = document.querySelector('#level-select-dialog');
const levelSelectClose = document.querySelector('#level-select-close');
const retryButton = document.querySelector('#retry-button');
const giveUpButton = document.querySelector('#give-up-button');
const nextLevelButton = document.querySelector('#next-level-button');
const replayButton = document.querySelector('#replay-button');
const homeButtons = document.querySelectorAll('.home-button');
const loseDialog = document.querySelector('#lose-dialog');
const winDialog = document.querySelector('#win-dialog');
const pauseDialog = document.querySelector('#pause-dialog');
const storyDialog = document.querySelector('#story-dialog');
const storyChapter = document.querySelector('#story-chapter');
const storyHeading = document.querySelector('#story-heading');
const storyText = document.querySelector('#story-text');
const storyNextButton = document.querySelector('#story-next-button');
const storySkipButton = document.querySelector('#story-skip-button');
const levelName = document.querySelector('#level-name');
const distanceFill = document.querySelector('#distance-fill');
const energyFill = document.querySelector('#energy-fill');
const heartIcons = document.querySelectorAll('#heart-icons span');
const gameStatus = document.querySelector('#game-status');
const hudNotice = document.querySelector('#hud-notice');
const pauseButton = document.querySelector('#pause-button');
const resumeButton = document.querySelector('#resume-button');
const pauseRestartButton = document.querySelector('#pause-restart-button');
const pauseHomeButton = document.querySelector('#pause-home-button');
const upButton = document.querySelector('#up-button');
const leftButton = document.querySelector('#left-button');
const downButton = document.querySelector('#down-button');
const rightButton = document.querySelector('#right-button');
const jumpButton = document.querySelector('#jump-button');
const winCopy = document.querySelector('#win-copy');
const winDetail = document.querySelector('#win-detail');
const loseDetail = document.querySelector('#lose-detail');
const chapterButtons = document.querySelectorAll('[data-level-id]');
const progressSummary = document.querySelector('#progress-summary');

const beibeiPortrait = { runnerId: 'beibei', still: new Image(), runCycle: new Image(), poses: { cry: new Image(), jump: new Image() } };
const mengPortrait = { runnerId: 'meng', still: new Image(), runCycle: new Image(), poses: { jump: new Image() } };
const propsAtlas = new Image();
const platformAtlas = new Image();
const backgroundImages = createLazyBackgrounds();
const gameAudio = createGameAudio();

const input = { left: false, right: false, down: false, sprint: false, jumpPressed: false, jumpReleased: false, jumpHeld: false };
const heldInputs = { left: new Set(), right: new Set(), down: new Set() };
const jumpHoldSources = new Set();
let currentLevel = 1;
let state = null;
let animationFrame = 0;
let isPaused = false;
let lastFrame = 0;
let lastRenderElapsedMs = 0;
let cameraX = 0;
let endTimer = 0;
let resultPose = 'running';
let queuedLevelId = null;
let simulationClock = createSimulationClock();
let taunt = null;
let tauntTracker = createTauntTracker();
let savedProgress = loadProgress();
let runRecorded = false;
let lastRunResult = null;
let sprintAudioActive = false;
let runnerAssetsFailed = false;
let runnerAssetRetry = 0;
let activeStory = null;

const runnerAssets = [
  { image: beibeiPortrait.runCycle, url: 'assets/beibei-run-cycle-v5.png?v=20260920g' },
  { image: mengPortrait.runCycle, url: 'assets/meng-run-cycle-v5.png?v=20260920g' },
  { image: beibeiPortrait.poses.cry, url: 'assets/beibei-cry-v2.png?v=20260920d' },
  { image: beibeiPortrait.poses.jump, url: 'assets/beibei-jump-v1.png?v=20260920d' },
  { image: mengPortrait.poses.jump, url: 'assets/meng-jump-v1.png?v=20260920f' },
  { image: propsAtlas, url: 'assets/props-atlas-v2.png?v=20260920f' },
  { image: platformAtlas, url: 'assets/platforms-atlas-v2.png?v=20260920f' },
];

function runnersReady() {
  return Boolean(
    beibeiPortrait.runCycle.naturalWidth === 1152
    && beibeiPortrait.runCycle.naturalHeight === 1152
    && mengPortrait.runCycle.naturalWidth === 1152
    && mengPortrait.runCycle.naturalHeight === 1152
    && beibeiPortrait.poses.cry.naturalWidth
    && beibeiPortrait.poses.jump.naturalWidth
    && mengPortrait.poses.jump.naturalWidth === 1881
    && mengPortrait.poses.jump.naturalHeight === 836
    && propsAtlas.naturalWidth === 1024
    && platformAtlas.naturalWidth === 1024,
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
  startButton.textContent = '开始第一关';
  startLevel(levelId);
}

beibeiPortrait.runCycle.addEventListener('load', resumeQueuedLevel);
mengPortrait.runCycle.addEventListener('load', resumeQueuedLevel);
beibeiPortrait.poses.cry.addEventListener('load', resumeQueuedLevel);
beibeiPortrait.poses.jump.addEventListener('load', resumeQueuedLevel);
mengPortrait.poses.jump.addEventListener('load', resumeQueuedLevel);
propsAtlas.addEventListener('load', resumeQueuedLevel);
platformAtlas.addEventListener('load', resumeQueuedLevel);
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
  activeStory = null;
  [loseDialog, winDialog, pauseDialog, storyDialog, levelSelectDialog].forEach((dialog) => {
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
    const levelId = button.dataset.levelId === 'journey-02' ? 'journey-02' : Number(button.dataset.levelId);
    const level = LEVELS[levelId];
    const record = savedProgress.records[levelId];
    button.disabled = levelId === 'journey-02' ? !savedProgress.campaignUnlocked : levelId > savedProgress.unlockedThrough;
    const chapterLabel = button.dataset.chapterLabel ?? button.querySelector('.chapter-title')?.textContent ?? level?.name ?? button.textContent;
    button.dataset.chapterLabel = chapterLabel;
    const stats = record ? ` · ${Math.round(record.bestProgress * 100)}% · ${record.bestCoins}枚` : '';
    const title = button.querySelector('.chapter-title');
    const progress = button.querySelector('.chapter-progress');
    if (title && progress) {
      title.textContent = `${button.disabled ? '🔒 ' : ''}${chapterLabel}`;
      progress.textContent = record ? `${Math.round(record.bestProgress * 100)}% · ${record.bestCoins} 枚硬币${record.wins ? ` · 胜利 ${record.wins} 次` : ''}` : button.disabled ? '通关第一关后解锁' : '尚未挑战';
    } else button.textContent = `${button.disabled ? '🔒 ' : ''}${chapterLabel}${stats}`;
  });
  document.querySelector('[data-story-level="journey-02"]').disabled = !savedProgress.campaignUnlocked;
  const unlocked = Math.max(1, savedProgress.unlockedThrough - 1);
  progressSummary.textContent = `校园练习已开放 ${unlocked}/5 段 · ${savedProgress.campaignUnlocked ? '第二关已解锁' : '追上孟培杰，解锁第二关'}`;
}

function showStoryLine() {
  if (!activeStory) return;
  const line = activeStory.lines[activeStory.index];
  storyChapter.textContent = `${LEVELS[activeStory.levelId].name} · ${activeStory.kind === 'intro' ? '关前' : '关后'}`;
  storyHeading.textContent = line.speaker;
  storyText.textContent = line.text;
  storyNextButton.textContent = activeStory.index === activeStory.lines.length - 1 ? '继续' : '下一句';
}

function finishStory() {
  if (!activeStory) return;
  const { sceneKey, remember, onDone } = activeStory;
  activeStory = null;
  if (storyDialog.open) storyDialog.close();
  if (remember) {
    savedProgress = markStorySeen(savedProgress, sceneKey);
    saveProgress(savedProgress);
  }
  onDone?.();
}

function playStory(levelId, kind, onDone = null, { replay = false } = {}) {
  const lines = getStoryScene(levelId, kind);
  const sceneKey = `${levelId}:${kind}`;
  if (!lines.length || (!replay && savedProgress.storySeen.includes(sceneKey))) {
    onDone?.();
    return;
  }
  activeStory = { levelId, kind, lines, index: 0, sceneKey, remember: !replay, onDone };
  showStoryLine();
  storyDialog.showModal();
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
  if (!platformAtlas.naturalWidth) return;
  const districtId = platform.material ?? currentDistrict()?.id;
  const materialRow = { gate: 0, court: 1, ginkgo: 0, lakeside: 2, bridge: 3, riverside: 3, clocktower: 0 }[districtId] ?? 0;
  const tileWidth = 144;
  const tileHeight = 128;
  const imageY = platform.y - 52;
  const clipTop = imageY - 1;
  const clipBottom = platform.y + Math.max(platform.height, 62);
  const drawTile = (column, x, width) => {
    ctx.drawImage(platformAtlas, column * 256, materialRow * 256, 256, 256, x, imageY, width, tileHeight);
  };

  ctx.save();
  ctx.beginPath();
  ctx.rect(platform.x, clipTop, platform.width, clipBottom - clipTop);
  ctx.clip();
  if (platform.width < tileWidth * 2) {
    drawTile(platform.collapse ? 3 : 1, platform.x, platform.width);
  } else {
    drawTile(0, platform.x, tileWidth);
    drawTile(2, platform.x + platform.width - tileWidth, tileWidth);
    const middleColumn = platform.collapse ? 3 : 1;
    for (let x = platform.x + tileWidth - 18; x < platform.x + platform.width - tileWidth + 18; x += tileWidth - 18) {
      drawTile(middleColumn, x, tileWidth);
    }
  }
  ctx.strokeStyle = platform.collapse ? 'rgba(255, 121, 127, .92)' : `${palette.edge}88`;
  ctx.lineWidth = platform.collapse ? 2.5 : 1.4;
  ctx.beginPath();
  ctx.moveTo(platform.x + 3, platform.y + 1);
  ctx.lineTo(platform.x + platform.width - 3, platform.y + 1);
  ctx.stroke();
  if (platform.motion) {
    ctx.strokeStyle = 'rgba(87, 224, 224, .7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(platform.x + 12, platform.y + 9);
    ctx.lineTo(platform.x + platform.width - 12, platform.y + 9);
    ctx.stroke();
  }
  ctx.restore();
}

const PROP_FRAMES = {
  basketball: [0, 0], banana: [1, 0], bookbag: [2, 0], barrier: [3, 0],
  crate: [0, 1], spring: [1, 1], surprise: [2, 1], checkpoint: [3, 1],
  coin: [0, 2], energy: [1, 2], patrol: [2, 2], spikes: [3, 2],
  heart: [0, 3], speedPad: [1, 3], collapse: [2, 3], wind: [3, 3],
};

function drawAtlasProp(id, x, y, width, height) {
  const frame = PROP_FRAMES[id];
  if (!frame || !propsAtlas.naturalWidth) return false;
  const size = Math.max(width, height);
  const drawX = x + (width - size) / 2;
  const drawY = y + (height - size) / 2;
  ctx.drawImage(propsAtlas, frame[0] * 256, frame[1] * 256, 256, 256, drawX, drawY, size, size);
  return true;
}

function drawHazard(hazard, elapsedMs) {
  if (hazard.type === 'collapse') {
    const pulse = .72 + Math.sin(elapsedMs / 140) * .18;
    ctx.save();
    ctx.globalAlpha = pulse;
    ctx.strokeStyle = '#ff797f';
    ctx.fillStyle = 'rgba(255, 247, 224, .9)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(hazard.x + hazard.width / 2, hazard.y - 25);
    ctx.lineTo(hazard.x + hazard.width / 2 + 11, hazard.y - 5);
    ctx.lineTo(hazard.x + hazard.width / 2 - 11, hazard.y - 5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    return;
  }
  if (hazard.type === 'constructionBox') {
    ctx.save();
    if (hazard.warning) {
      ctx.globalAlpha = .18;
      ctx.fillStyle = '#ff797f';
      ctx.beginPath();
      ctx.ellipse(hazard.x + hazard.width / 2, (hazard.groundY ?? 466) + 39, hazard.width * 1.5, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = .6;
      ctx.setLineDash([7, 7]);
      ctx.strokeStyle = '#ffd85e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(hazard.x + hazard.width / 2, hazard.y + hazard.height);
      ctx.lineTo(hazard.x + hazard.width / 2, (hazard.groundY ?? 466) + 31);
      ctx.stroke();
    }
    ctx.restore();
    drawAtlasProp('crate', hazard.x - 10, hazard.y - 10, hazard.width + 20, hazard.height + 20);
    return;
  }
  if (hazard.type === 'blocker') {
    drawAtlasProp('barrier', hazard.x - 10, hazard.y - 8, hazard.width + 20, hazard.height + 16);
    return;
  }
  if (hazard.type === 'patrol') {
    drawAtlasProp('patrol', hazard.x - 7, hazard.y - 4, hazard.width + 14, hazard.height + 8);
    return;
  }
  if (hazard.type === 'spikes') {
    drawAtlasProp('spikes', hazard.x, hazard.y - 36, hazard.width, hazard.height + 72);
  }
}

function drawObstacle(obstacle, elapsedMs) {
  if (obstacle.type === 'wind') {
    const sway = Math.sin(elapsedMs / 140) * 6;
    ctx.save();
    ctx.globalAlpha = 0.58;
    ctx.strokeStyle = '#e7fbff';
    ctx.lineWidth = 2.5;
    for (let y = obstacle.y + 18; y < obstacle.y + obstacle.height; y += 28) {
      ctx.beginPath();
      ctx.moveTo(obstacle.x, y);
      ctx.quadraticCurveTo(obstacle.x + obstacle.width * 0.45, y + sway, obstacle.x + obstacle.width, y - 4);
      ctx.stroke();
    }
    ctx.restore();
    return;
  }
  const boxes = {
    surprise: [-7, -7, 14, 14],
    spring: [-18, -18, 36, 36],
    basketball: [-8, -8, 16, 16],
    banana: [-5, -8, 10, 16],
    barrier: [-10, -9, 20, 18],
    bookbag: [-8, -8, 16, 16],
    speedPad: [0, -22, 0, 44],
  };
  const box = boxes[obstacle.type];
  if (!box) return;
  const [offsetX, offsetY, extraWidth, extraHeight] = box;
  const width = extraWidth ? obstacle.width + extraWidth : obstacle.width;
  const height = extraHeight ? obstacle.height + extraHeight : obstacle.height;
  drawAtlasProp(obstacle.type, obstacle.x + offsetX, obstacle.y + offsetY, width, height);
}

function drawBasketball(ball) {
  const size = Math.max(ball.width, ball.height) + 16;
  ctx.save();
  ctx.translate(ball.x + ball.width / 2, ball.y + ball.height / 2);
  ctx.rotate(ball.rotation ?? 0);
  drawAtlasProp('basketball', -size / 2, -size / 2, size, size);
  ctx.restore();
}

function drawEnergy(energy, elapsedMs) {
  const pulse = Math.sin(elapsedMs / 110) * 3;
  ctx.save();
  ctx.fillStyle = 'rgba(255, 238, 149, .22)';
  ctx.beginPath();
  ctx.arc(energy.x + energy.width / 2, energy.y + energy.height / 2, energy.width / 2 + 4 + pulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  drawAtlasProp('energy', energy.x - 8, energy.y - 8, energy.width + 16, energy.height + 16);
}

function drawHeart(heart, elapsedMs) {
  const pulse = Math.sin((elapsedMs + heart.x) / 170) * 2;
  ctx.save();
  ctx.fillStyle = 'rgba(255, 121, 127, .2)';
  ctx.beginPath();
  ctx.arc(heart.x + heart.width / 2, heart.y + heart.height / 2, heart.width / 2 + 5 + pulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  drawAtlasProp('heart', heart.x - 8, heart.y - 8, heart.width + 16, heart.height + 16);
}

function drawCoin(coin, elapsedMs) {
  const shine = Math.sin((elapsedMs + coin.x) / 120) * 2;
  drawAtlasProp('coin', coin.x - 5 - shine / 2, coin.y - 5, coin.width + 10 + shine, coin.height + 10);
}

function drawCheckpoint(checkpoint) {
  drawAtlasProp('checkpoint', checkpoint.x - 28, 410, 66, 100);
}

function drawSwitch(target) {
  const active = state.activatedSwitchIds?.includes(target.id);
  ctx.save();
  ctx.fillStyle = active ? '#70d3aa' : '#ffca6b';
  ctx.strokeStyle = '#34415d';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(target.x, target.y, target.width, target.height, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#fff9e9';
  ctx.beginPath();
  ctx.arc(target.x + target.width / 2, target.y + target.height / 2, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#34415d';
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(active ? '✓' : '●', target.x + target.width / 2, target.y + target.height / 2 + 6);
  ctx.restore();
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

function updateHeartHud() {
  heartIcons.forEach((heart, index) => {
    const alive = index < state.hearts;
    heart.classList.toggle('empty', !alive);
    heart.setAttribute('aria-hidden', 'true');
  });
  document.querySelector('#heart-icons')?.setAttribute('aria-label', `生命：${state.hearts}颗心`);
}

function render() {
  if (!state) return;
  const renderDelta = Math.max(0, state.elapsedMs - lastRenderElapsedMs);
  cameraX = advanceCamera(cameraX, state.player.x, renderDelta, VIEWPORT_WIDTH, LEVELS[currentLevel].worldEnd, state.player.horizontalSpeed);
  lastRenderElapsedMs = state.elapsedMs;
  const level = LEVELS[currentLevel];
  const platforms = getRenderPlatforms(currentLevel, state.elapsedMs, state.collapseStarts, state.activatedSwitchIds);
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
  const visibleStart = cameraX - 180;
  const visibleEnd = cameraX + VIEWPORT_WIDTH + 180;
  platforms.filter((platform) => platform.x + platform.width >= visibleStart && platform.x <= visibleEnd)
    .forEach((platform) => drawPlatform(platform, state.elapsedMs));
  level.checkpoints.filter((checkpoint) => checkpoint.x >= visibleStart && checkpoint.x <= visibleEnd).forEach(drawCheckpoint);
  level.energy.filter((energy) => !state.collectedEnergyIds.includes(energy.id) && energy.x >= visibleStart && energy.x <= visibleEnd)
    .forEach((energy) => drawEnergy(energy, state.elapsedMs));
  level.coins.filter((coin) => !state.collectedCoinIds.includes(coin.id) && coin.x >= visibleStart && coin.x <= visibleEnd)
    .forEach((coin) => drawCoin(coin, state.elapsedMs));
  level.heartPickups.filter((heart) => !state.collectedHeartIds.includes(heart.id) && heart.x >= visibleStart && heart.x <= visibleEnd)
    .forEach((heart) => drawHeart(heart, state.elapsedMs));
  level.obstacles.filter((obstacle) => !state.collectedObstacleIds.includes(obstacle.id) && obstacle.x + obstacle.width >= visibleStart && obstacle.x <= visibleEnd)
    .forEach((obstacle) => drawObstacle(obstacle, state.elapsedMs));
  level.switches?.filter((target) => target.x + target.width >= visibleStart && target.x <= visibleEnd).forEach(drawSwitch);
  state.hazards?.filter((hazard) => hazard.x + hazard.width >= visibleStart && hazard.x <= visibleEnd)
    .forEach((hazard) => drawHazard(hazard, state.elapsedMs));

  const beibei = {
    ...state.player,
    invulnerabilityMs: state.invulnerabilityMs,
    flashTimeMs: state.elapsedMs,
    mode: state.phase === 'lost' ? 'cry' : state.phase === 'caught' && resultPose === 'tap' ? 'tap' : undefined,
  };
  const meng = { ...getPursuerRenderState(state.pursuer), mode: state.phase === 'caught' && resultPose === 'fallen' ? 'downed' : state.pursuer.mode };
  drawPursuerMotion(meng);
  drawCharacter(ctx, beibei, beibeiPortrait);
  drawCharacter(ctx, meng, mengPortrait);
  drawDust(beibei);
  drawSpeedLines();
  if (state.basketball?.active) drawBasketball(state.basketball);

  if (state.phase === 'playing' && isTauntActive(taunt, state.elapsedMs)
    && meng.x > cameraX + 28 && meng.x < cameraX + VIEWPORT_WIDTH - 28) {
    const visualTop = meng.y - 56;
    const boxY = Math.max(20, visualTop - 50);
    ctx.font = 'bold 16px "Microsoft YaHei", sans-serif';
    const boxWidth = Math.min(300, Math.ceil(ctx.measureText(taunt.text).width + 28));
    const boxX = Math.max(cameraX + 12, Math.min(meng.x + 12 - boxWidth / 2, cameraX + VIEWPORT_WIDTH - boxWidth - 12));
    const pointerX = Math.max(boxX + 16, Math.min(meng.x + 12, boxX + boxWidth - 16));
    ctx.fillStyle = '#fff9e9';
    ctx.strokeStyle = '#39435d';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxWidth, 36, 8);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(pointerX - 7, boxY + 35);
    ctx.lineTo(pointerX, boxY + 44);
    ctx.lineTo(pointerX + 7, boxY + 35);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#2c2540';
    ctx.fillText(taunt.text, boxX + 14, boxY + 24);
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
  updateHeartHud();
  const district = currentDistrict();
  const progress = Math.min(100, Math.round((state.player.x / level.finishX) * 100));
  levelName.textContent = `${district?.name ?? level.name} · 路程 ${progress}% · 硬币 ${state.coins} · 生命 ${state.hearts}/3`;
}

function updateLiveText() {
  if (!state) return;
  const messages = {
    hit: `撞到危险物，失去一颗心（剩余 ${state.hearts} 颗）。`,
    fell: `掉进陷阱，失去一颗心并回到检查点（剩余 ${state.hearts} 颗）。`,
    energy: '能量 +40！按住手机冲刺键继续加速。',
    energyEmpty: '能量耗尽，冲刺结束！',
    coin: '收集到硬币！',
    surprise: '惊喜方块！硬币和 +20 能量到手。',
    spring: '弹簧台！跳得更高了。',
    collapseWarning: '平台在塌陷，快跳！',
    constructionHit: `施工箱砸中贝贝，失去一颗心（剩余 ${state.hearts} 颗）。`,
    blockerHit: `移动挡板撞到贝贝，失去一颗心（剩余 ${state.hearts} 颗）。`,
    patrolHit: `巡逻车撞到贝贝，失去一颗心（剩余 ${state.hearts} 颗）。`,
    spikesHit: `碰到尖刺，失去一颗心（剩余 ${state.hearts} 颗）。`,
    heart: `捡到一颗爱心，恢复到 ${state.hearts} 颗。`,
    dropThrough: '下落中：已穿过这一层平台。',
    wind: '天桥横风来了，注意节奏！',
    checkpoint: '到达检查点。',
    switchActivated: '篮球击中机关！上层近路已打开。',
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

function pauseGame() {
  if (state?.phase !== 'playing' || isPaused) return false;
  isPaused = true;
  stopGame();
  clearInput();
  sprintAudioActive = false;
  simulationClock = { ...simulationClock, accumulatorMs: 0, fastFrames: 0, slowFrames: 0 };
  pauseButton.setAttribute('aria-pressed', 'true');
  gameStatus.textContent = '游戏已暂停。点击继续游戏，或按 P / Esc 恢复。';
  void gameAudio.suspend();
  if (!pauseDialog.open) pauseDialog.showModal();
  return true;
}

function resumeGame() {
  if (!isPaused || state?.phase !== 'playing') return false;
  isPaused = false;
  if (pauseDialog.open) pauseDialog.close();
  pauseButton.setAttribute('aria-pressed', 'false');
  clearInput();
  lastFrame = 0;
  simulationClock = { ...simulationClock, accumulatorMs: 0, fastFrames: 0, slowFrames: 0 };
  gameStatus.textContent = `${LEVELS[currentLevel].name}追逐继续。`;
  void gameAudio.resume();
  animationFrame = requestAnimationFrame(frame);
  return true;
}

function showLoseDialog() {
  const level = LEVELS[currentLevel];
  loseDetail.textContent = state.hearts <= 0
    ? '贝贝坐下来哭了一会儿。三颗心用完了，休息一下再来吧。'
    : state.player.x >= level.worldEnd - state.player.width
      ? '已经跑到路的尽头，还差一点。留好冲刺能量再试一次！'
      : '孟培杰跑远了。试试高路、篮球和冲刺，别让距离条见底。';
  gameStatus.textContent = '贝贝跟丢了。';
  if (!loseDialog.open) loseDialog.showModal();
}

function showWinDialog() {
  const level = LEVELS[currentLevel];
  const badges = lastRunResult?.earnedBadges ?? [];
  const nextLevel = currentLevel === 1 ? 'journey-02' : typeof currentLevel === 'number' && currentLevel >= 2 && currentLevel < 6 ? currentLevel + 1 : null;
  winCopy.textContent = currentLevel === 1 ? '贝贝追上了 · 第一关通关！' : `${level.name} · 追上啦！`;
  const unlockMessage = lastRunResult?.unlockedLevel
    ? currentLevel === 1 ? ' · 已解锁第二关和全部练习' : ` · 已解锁${LEVELS[lastRunResult.unlockedLevel].name}`
    : '';
  winDetail.textContent = `“没心眼，不等我”${badges.length ? ` · 挑战达成：${badges.join('、')}` : ''}${unlockMessage}`;
  nextLevelButton.hidden = nextLevel === null;
  nextLevelButton.dataset.nextLevel = String(nextLevel ?? '');
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
    endTimer = window.setTimeout(() => playStory(currentLevel, 'outro', showWinDialog), 540);
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
  ctx.fillStyle = `rgba(255, 241, 199, ${alpha * .54})`;
  for (let index = 0; index < 3; index += 1) {
    const offset = index * 12;
    const radius = 2.5 + (2 - index) * .7;
    ctx.beginPath();
    ctx.ellipse(player.x - 9 - offset, player.y + player.height - 3 - index % 2 * 4, radius * 1.7, radius, -.2, 0, Math.PI * 2);
    ctx.fill();
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
  const result = advanceTauntCue(tauntTracker, {
    elapsedMs: state.elapsedMs,
    regionId: district.id,
    mode: state.pursuer.mode,
  });
  tauntTracker = result.tracker;
  if (result.cue) taunt = createTaunt(getPursuerTaunt(state.player.x / level.finishX, result.cue.mode, district.id), state.elapsedMs);
}

function playStepSounds(previous, next) {
  if (next.player.jumpJustLaunched) {
    gameAudio.play('jump', { speed: next.player.horizontalSpeed });
  }
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
  if (isPaused || !state || state.phase !== 'playing') return;
  if (!lastFrame) lastFrame = timestamp;
  const elapsedMs = Math.min(50, timestamp - lastFrame);
  lastFrame = timestamp;
  const pacing = advanceSimulationClock(simulationClock, elapsedMs);
  simulationClock = pacing.clock;
  for (let step = 0; step < pacing.steps && state.phase === 'playing'; step += 1) {
    const previousState = state;
    state = updateGame(state, input, pacing.stepMs);
    playStepSounds(previousState, state);
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
  isPaused = false;
  pauseButton.setAttribute('aria-pressed', 'false');
  currentLevel = levelId;
  clearInput();
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
  tauntTracker = createTauntTracker();
  hudNotice.hidden = true;
  levelName.textContent = `${LEVELS[currentLevel].name} · 路程 0%`;
  gameStatus.textContent = `${LEVELS[currentLevel].name}追逐开始，追上孟培杰！`;
  homeScreen.hidden = true;
  gameScreen.hidden = false;
  preloadBackground(backgroundImages, LEVELS[levelId].districts[0]?.id);
  render();
  if (levelId === 1 || levelId === 'journey-02') {
    playStory(levelId, 'intro', () => {
      lastFrame = 0;
      animationFrame = requestAnimationFrame(frame);
    });
  } else animationFrame = requestAnimationFrame(frame);
}

function requestLevelStart(levelId) {
  void gameAudio.resume();
  if (levelSelectDialog.open) levelSelectDialog.close();
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
  isPaused = false;
  pauseButton.setAttribute('aria-pressed', 'false');
  clearInput();
  state = null;
  cameraX = 0;
  lastRenderElapsedMs = 0;
  taunt = null;
  tauntTracker = createTauntTracker();
  hudNotice.hidden = true;
  homeScreen.hidden = false;
  gameScreen.hidden = true;
  gameStatus.textContent = '';
}

function jumpSource(event, source) {
  return event?.pointerId === undefined ? source : `${source}:pointer:${event.pointerId}`;
}

function queueJump(event, source = 'jump') {
  event?.preventDefault();
  if (state?.phase !== 'playing') return;
  const holdSource = jumpSource(event, source);
  if (jumpHoldSources.has(holdSource)) return;
  if (jumpHoldSources.size === 0) input.jumpPressed = true;
  jumpHoldSources.add(holdSource);
  input.jumpHeld = true;
}

function releaseJump(event, source = 'jump') {
  event?.preventDefault();
  const holdSource = jumpSource(event, source);
  if (!jumpHoldSources.delete(holdSource)) return;
  input.jumpHeld = jumpHoldSources.size > 0;
  if (!input.jumpHeld && state?.phase === 'playing') input.jumpReleased = true;
}

function setHeldInput(action, source, held) {
  const sources = heldInputs[action];
  if (held) sources.add(source);
  else sources.delete(source);
  input[action] = sources.size > 0;
  if (action === 'right') input.sprint = input.right;
}

function clearInput() {
  Object.values(heldInputs).forEach((sources) => sources.clear());
  jumpHoldSources.clear();
  input.left = false;
  input.right = false;
  input.down = false;
  input.sprint = false;
  input.jumpPressed = false;
  input.jumpReleased = false;
  input.jumpHeld = false;
}

function bindHoldButton(button, onPress, onRelease) {
  const release = (event) => {
    if (event) event.preventDefault();
    onRelease(event);
  };
  button.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    onPress(event);
    button.setPointerCapture(event.pointerId);
  });
  button.addEventListener('pointerup', release);
  button.addEventListener('pointercancel', release);
  button.addEventListener('lostpointercapture', release);
}

window.addEventListener('keydown', (event) => {
  if (storyDialog.open) return;
  const pauseKey = event.key === 'Escape' || event.key.toLowerCase() === 'p';
  if (pauseKey && !event.repeat) {
    if (isPaused) {
      event.preventDefault();
      resumeGame();
      return;
    }
    if (state?.phase === 'playing') {
      event.preventDefault();
      pauseGame();
      return;
    }
  }
  if (isPaused) return;
  const source = `keyboard:${event.code || event.key}`;
  if (['ArrowLeft', 'a', 'A'].includes(event.key)) { setHeldInput('left', source, true); event.preventDefault(); }
  if (['ArrowRight', 'd', 'D'].includes(event.key)) { setHeldInput('right', source, true); event.preventDefault(); }
  if (['ArrowDown', 's', 'S'].includes(event.key)) { setHeldInput('down', source, true); event.preventDefault(); }
  if ([' ', 'ArrowUp', 'w', 'W'].includes(event.key)) queueJump(event, source);
});

window.addEventListener('keyup', (event) => {
  if (isPaused) return;
  const source = `keyboard:${event.code || event.key}`;
  if (['ArrowLeft', 'a', 'A'].includes(event.key)) setHeldInput('left', source, false);
  if (['ArrowRight', 'd', 'D'].includes(event.key)) setHeldInput('right', source, false);
  if (['ArrowDown', 's', 'S'].includes(event.key)) setHeldInput('down', source, false);
  if ([' ', 'ArrowUp', 'w', 'W'].includes(event.key)) releaseJump(event, source);
});

window.addEventListener('blur', () => {
  clearInput();
  pauseGame();
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    clearInput();
    pauseGame();
  }
});

pauseButton.addEventListener('click', pauseGame);
resumeButton.addEventListener('click', resumeGame);
pauseRestartButton.addEventListener('click', () => requestLevelStart(currentLevel));
pauseHomeButton.addEventListener('click', returnHome);
pauseDialog.addEventListener('cancel', (event) => {
  event.preventDefault();
  resumeGame();
});
storyNextButton.addEventListener('click', () => {
  if (!activeStory) return;
  if (activeStory.index + 1 >= activeStory.lines.length) finishStory();
  else {
    activeStory.index += 1;
    showStoryLine();
  }
});
storySkipButton.addEventListener('click', finishStory);
storyDialog.addEventListener('cancel', (event) => {
  event.preventDefault();
  finishStory();
});

canvas.addEventListener('pointerdown', (event) => {
  if (event.pointerType !== 'touch') queueJump(event, 'canvas');
});
canvas.addEventListener('pointerup', (event) => {
  if (event.pointerType !== 'touch') releaseJump(event, 'canvas');
});
canvas.addEventListener('pointercancel', (event) => {
  if (event.pointerType !== 'touch') releaseJump(event, 'canvas');
});
bindHoldButton(upButton, (event) => queueJump(event, 'touch-up'), (event) => releaseJump(event, 'touch-up'));
bindHoldButton(leftButton,
  (event) => setHeldInput('left', `touch:left:${event.pointerId}`, true),
  (event) => setHeldInput('left', `touch:left:${event.pointerId}`, false));
bindHoldButton(downButton,
  (event) => setHeldInput('down', `touch:down:${event.pointerId}`, true),
  (event) => setHeldInput('down', `touch:down:${event.pointerId}`, false));
bindHoldButton(rightButton,
  (event) => setHeldInput('right', `touch:right:${event.pointerId}`, true),
  (event) => setHeldInput('right', `touch:right:${event.pointerId}`, false));
bindHoldButton(jumpButton, (event) => queueJump(event, 'touch-jump'), (event) => releaseJump(event, 'touch-jump'));
startButton.addEventListener('click', () => requestLevelStart(queuedLevelId ?? 1));
levelSelectButton.addEventListener('click', () => levelSelectDialog.showModal());
levelSelectClose.addEventListener('click', () => levelSelectDialog.close());
chapterButtons.forEach((button) => button.addEventListener('click', () => requestLevelStart(button.dataset.levelId === 'journey-02' ? 'journey-02' : Number(button.dataset.levelId))));
document.querySelectorAll('[data-story-level]').forEach((button) => button.addEventListener('click', () => {
  levelSelectDialog.close();
  playStory(button.dataset.storyLevel === 'journey-02' ? 'journey-02' : Number(button.dataset.storyLevel), 'intro', null, { replay: true });
}));
retryButton.addEventListener('click', () => requestLevelStart(currentLevel));
giveUpButton.addEventListener('click', returnHome);
nextLevelButton.addEventListener('click', () => requestLevelStart(nextLevelButton.dataset.nextLevel === 'journey-02' ? 'journey-02' : Number(nextLevelButton.dataset.nextLevel)));
replayButton.addEventListener('click', () => requestLevelStart(currentLevel));
homeButtons.forEach((button) => button.addEventListener('click', returnHome));
