import { LEVELS, createGame, getPursuerRenderState, getPursuerTaunt, getRenderPlatforms, updateGame } from './game-logic.js';
import { advanceCamera } from './camera.js';
import { drawCharacter } from './character-renderer.js?v=20260915r3';
import { drawScene, getPalette } from './scene-renderer.js';
import { advanceSimulationClock, createSimulationClock } from './simulation-clock.js';
import { createTaunt, isTauntActive } from './taunt.js';

const canvas = document.querySelector('#game-canvas');
const ctx = canvas.getContext('2d');
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
const gameStatus = document.querySelector('#game-status');
const winCopy = document.querySelector('#win-copy');
const winDetail = document.querySelector('#win-detail');

const beibeiPortrait = { runnerId: 'beibei', still: new Image(), runCycle: new Image() };
const mengPortrait = { runnerId: 'meng', still: new Image(), runCycle: new Image() };
beibeiPortrait.still.src = 'assets/beibei-runner.png';
beibeiPortrait.runCycle.src = 'assets/beibei-run-cycle-clean.png';
mengPortrait.still.src = 'assets/meng-runner.png';
mengPortrait.runCycle.src = 'assets/meng-run-cycle.png';

const input = { left: false, right: false, jumpPressed: false };
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

ctx.imageSmoothingEnabled = true;

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
  drawScene(ctx, { region: currentDistrict(), cameraX, elapsedMs: state.elapsedMs });
}

function drawPlatform(platform, elapsedMs) {
  const palette = scenePalette();
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

function drawHazard(hazard, elapsedMs) {
  if (hazard.type === 'collapse') {
    ctx.fillStyle = '#fff4ce';
    ctx.fillRect(hazard.x + hazard.width / 2 - 4, hazard.y - 28, 8, 12);
    ctx.fillStyle = Math.floor(elapsedMs / 110) % 2 ? '#ff797f' : '#ffd85e';
    ctx.fillRect(hazard.x + hazard.width / 2 - 10, hazard.y - 18, 20, 14);
    return;
  }
  if (hazard.type === 'constructionBox') {
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
  if (obstacle.type === 'surprise') {
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
    ctx.fillStyle = '#d95767';
    ctx.fillRect(obstacle.x, obstacle.y + 12, obstacle.width, 12);
    ctx.fillStyle = '#fff0b2';
    ctx.fillRect(obstacle.x + 4, obstacle.y + 5, obstacle.width - 8, 7);
    ctx.fillStyle = '#2c2540';
    for (let x = obstacle.x + 5; x < obstacle.x + obstacle.width - 4; x += 8) ctx.fillRect(x, obstacle.y + 12, 4, 8);
    return;
  }
  if (obstacle.type === 'basketball') {
    ctx.fillStyle = '#ef8c45';
    ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    ctx.fillStyle = '#6b3b3a';
    ctx.fillRect(obstacle.x + 10, obstacle.y, 3, obstacle.height);
    ctx.fillRect(obstacle.x, obstacle.y + 10, obstacle.width, 3);
    return;
  }
  if (obstacle.type === 'banana') {
    ctx.fillStyle = '#ffd85e';
    ctx.fillRect(obstacle.x, obstacle.y + 8, obstacle.width, 8);
    ctx.fillRect(obstacle.x + 4, obstacle.y + 4, obstacle.width - 8, 8);
    ctx.fillStyle = '#70514b';
    ctx.fillRect(obstacle.x - 2, obstacle.y + 13, 5, 4);
    ctx.fillRect(obstacle.x + obstacle.width - 3, obstacle.y + 6, 5, 4);
    return;
  }
  if (obstacle.type === 'barrier') {
    ctx.fillStyle = '#f3ae5b';
    ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    ctx.fillStyle = '#fff4ce';
    ctx.fillRect(obstacle.x + 4, obstacle.y + 8, obstacle.width - 8, 6);
    ctx.fillRect(obstacle.x + 4, obstacle.y + 24, obstacle.width - 8, 6);
    return;
  }
  const wobble = Math.round(Math.sin(elapsedMs / 140) * 3);
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
  ctx.fillStyle = '#ef8c45';
  ctx.fillRect(ball.x, ball.y, ball.width, ball.height);
  ctx.fillStyle = '#6b3b3a';
  ctx.fillRect(ball.x + 10, ball.y, 3, ball.height);
  ctx.fillRect(ball.x, ball.y + 10, ball.width, 3);
}

function drawEnergy(energy, elapsedMs) {
  const pulse = Math.round(Math.sin(elapsedMs / 110) * 3);
  ctx.fillStyle = '#fff9e9';
  ctx.fillRect(energy.x - 3 - pulse, energy.y + 6, energy.width + 6 + pulse * 2, energy.height - 8);
  ctx.fillStyle = '#ff797f';
  ctx.fillRect(energy.x, energy.y + 3, energy.width, energy.height - 6);
  ctx.fillStyle = '#ffd858';
  ctx.fillRect(energy.x + 5, energy.y, energy.width - 10, energy.height);
}

function drawCoin(coin, elapsedMs) {
  const shine = Math.round(Math.sin((elapsedMs + coin.x) / 120) * 2);
  ctx.fillStyle = '#a86a28';
  ctx.fillRect(coin.x + 3, coin.y, coin.width - 6, coin.height);
  ctx.fillStyle = '#ffd85e';
  ctx.fillRect(coin.x + 5 + shine, coin.y + 3, coin.width - 10 - shine * 2, coin.height - 6);
  ctx.fillStyle = '#fff4ce';
  ctx.fillRect(coin.x + 7, coin.y + 6, 4, 8);
}

function drawCheckpoint(checkpoint) {
  ctx.fillStyle = '#fff9e9';
  ctx.fillRect(checkpoint.x, 426, 6, 84);
  ctx.fillStyle = '#ff797f';
  ctx.fillRect(checkpoint.x + 6, 430, 32, 22);
}

function drawDistanceBubble() {
  if (state.energyTimerMs <= 0) return;
  ctx.fillStyle = '#ff797f';
  ctx.fillRect(350, 55, 210, 28);
  ctx.fillStyle = '#fff9e9';
  ctx.font = '16px monospace';
  ctx.fillText('贝贝能量！冲刺中', 370, 75);
}

function render() {
  if (!state) return;
  const renderDelta = Math.max(0, state.elapsedMs - lastRenderElapsedMs);
  cameraX = advanceCamera(cameraX, state.player.x, renderDelta, 1280, LEVELS[currentLevel].worldEnd);
  lastRenderElapsedMs = state.elapsedMs;
  const level = LEVELS[currentLevel];
  const platforms = getRenderPlatforms(currentLevel, state.elapsedMs, state.collapseStarts);

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
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
  drawCharacter(ctx, beibei, beibeiPortrait, state.elapsedMs);
  drawCharacter(ctx, meng, mengPortrait, state.elapsedMs + 36);
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
  drawDistanceBubble();
  ctx.restore();

  const remaining = Math.max(0, Math.round(((state.maxDistance - state.distance) / state.maxDistance) * 100));
  distanceFill.style.width = `${remaining}%`;
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
  if (['ArrowRight', 'd', 'D'].includes(event.key)) { input.right = true; event.preventDefault(); }
  if ([' ', 'ArrowUp', 'w', 'W'].includes(event.key)) queueJump(event);
});

window.addEventListener('keyup', (event) => {
  if (['ArrowLeft', 'a', 'A'].includes(event.key)) input.left = false;
  if (['ArrowRight', 'd', 'D'].includes(event.key)) input.right = false;
});

canvas.addEventListener('pointerdown', queueJump);
startButton.addEventListener('click', () => startLevel(1));
retryButton.addEventListener('click', () => startLevel(currentLevel));
giveUpButton.addEventListener('click', returnHome);
nextLevelButton.addEventListener('click', () => startLevel(1));
replayButton.addEventListener('click', () => startLevel(1));
homeButtons.forEach((button) => button.addEventListener('click', returnHome));
