import { LEVELS, createGame, getRenderPlatforms, updateGame } from './game-logic.js';

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

const beibeiPortrait = new Image();
const mengPortrait = new Image();
beibeiPortrait.src = 'assets/beibei-pixel.png';
mengPortrait.src = 'assets/meng-peijie-pixel.png';

const input = { left: false, right: false, jumpPressed: false };
let currentLevel = 1;
let state = null;
let animationFrame = 0;
let lastFrame = 0;
let endTimer = 0;
let resultPose = 'running';

ctx.imageSmoothingEnabled = false;

function closeDialogs() {
  [loseDialog, winDialog].forEach((dialog) => {
    if (dialog.open) dialog.close();
  });
}

function scenePalette() {
  return currentLevel === 1
    ? { sky: '#a7d9ee', haze: '#eff7c5', ground: '#6ebf74', edge: '#2c6d55', platform: '#d7ab70', accent: '#ffdd78' }
    : { sky: '#6b5d9d', haze: '#f4a679', ground: '#3d6572', edge: '#203f58', platform: '#9a6d67', accent: '#ffd584' };
}

function drawBackground(cameraX) {
  const palette = scenePalette();
  ctx.fillStyle = palette.sky;
  ctx.fillRect(cameraX, 0, 980, 540);
  ctx.fillStyle = palette.haze;
  ctx.fillRect(cameraX, 240, 980, 110);
  ctx.fillStyle = currentLevel === 1 ? '#f4d278' : '#f8c473';
  ctx.fillRect(cameraX + 700, 68, 34, 34);
  ctx.fillStyle = currentLevel === 1 ? '#84c98a' : '#6f4f78';
  for (let index = -1; index < 8; index += 1) {
    const x = cameraX + index * 170 + 25;
    ctx.fillRect(x, 340, 52, 155);
    ctx.fillRect(x - 28, 292, 110, 72);
  }
  if (currentLevel === 2) {
    ctx.fillStyle = '#4a405f';
    ctx.fillRect(cameraX, 304, 980, 20);
    ctx.fillStyle = '#ffc45e';
    for (let x = cameraX + 60; x < cameraX + 980; x += 160) ctx.fillRect(x, 288, 14, 16);
  }
}

function drawPlatform(platform) {
  const palette = scenePalette();
  ctx.fillStyle = palette.edge;
  ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
  ctx.fillStyle = palette.platform;
  ctx.fillRect(platform.x + 4, platform.y + 4, platform.width - 8, 12);
}

function drawObstacle(obstacle, elapsedMs) {
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

function drawEnergy(energy, elapsedMs) {
  const pulse = Math.round(Math.sin(elapsedMs / 110) * 3);
  ctx.fillStyle = '#fff9e9';
  ctx.fillRect(energy.x - 3 - pulse, energy.y + 6, energy.width + 6 + pulse * 2, energy.height - 8);
  ctx.fillStyle = '#ff797f';
  ctx.fillRect(energy.x, energy.y + 3, energy.width, energy.height - 6);
  ctx.fillStyle = '#ffd858';
  ctx.fillRect(energy.x + 5, energy.y, energy.width - 10, energy.height);
}

function drawCheckpoint(checkpoint) {
  ctx.fillStyle = '#fff9e9';
  ctx.fillRect(checkpoint.x, 426, 6, 84);
  ctx.fillStyle = '#ff797f';
  ctx.fillRect(checkpoint.x + 6, 430, 32, 22);
}

function drawRunner(x, y, portrait, { crying = false, fallen = false, tapping = false } = {}) {
  const headY = crying ? y + 3 : y - 12;
  ctx.fillStyle = '#2c2540';
  if (fallen) {
    ctx.fillRect(x - 9, y + 18, 54, 12);
    ctx.fillRect(x + 19, y + 30, 35, 8);
  } else if (crying) {
    ctx.fillRect(x, y + 24, 34, 15);
    ctx.fillRect(x + 20, y + 36, 32, 8);
    ctx.fillStyle = '#ffb0a4';
    ctx.fillRect(x + 7, y + 20, 23, 17);
  } else {
    ctx.fillRect(x + 4, y + 17, 20, 25);
    ctx.fillRect(x - 3, y + 40, 12, 12);
    ctx.fillRect(x + 19, y + 40, 12, 12);
    ctx.fillStyle = '#ffb0a4';
    ctx.fillRect(x + (tapping ? 25 : -7), y + 21, tapping ? 25 : 10, 8);
  }
  ctx.drawImage(portrait, x - 3, headY, 34, 34);
  if (crying) {
    ctx.fillStyle = '#7cd8f2';
    ctx.fillRect(x + 8, headY + 24, 4, 13);
    ctx.fillRect(x + 20, headY + 25, 4, 10);
  }
}

function drawDistanceBubble(cameraX) {
  if (state.energyTimerMs <= 0) return;
  ctx.fillStyle = '#ff797f';
  ctx.fillRect(cameraX + 350, 55, 210, 28);
  ctx.fillStyle = '#fff9e9';
  ctx.font = '16px monospace';
  ctx.fillText('贝贝能量！冲刺中', cameraX + 370, 75);
}

function render() {
  if (!state) return;
  const cameraX = Math.max(0, state.player.x - 250);
  const level = LEVELS[currentLevel];
  const platforms = getRenderPlatforms(currentLevel, state.elapsedMs);

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.scale(0.5, 0.5);
  drawBackground(cameraX);
  platforms.forEach(drawPlatform);
  level.checkpoints.forEach(drawCheckpoint);
  level.energy.filter((energy) => !state.collectedEnergyIds.includes(energy.id)).forEach((energy) => drawEnergy(energy, state.elapsedMs));
  level.obstacles.forEach((obstacle) => drawObstacle(obstacle, state.elapsedMs));

  const beibeiOptions = { crying: state.phase === 'lost', tapping: state.phase === 'caught' && resultPose === 'tap' };
  const mengOptions = { fallen: state.phase === 'caught' && resultPose === 'fallen' };
  drawRunner(state.player.x, state.player.y, beibeiPortrait, beibeiOptions);
  drawRunner(state.pursuerX, state.player.y, mengPortrait, mengOptions);

  if (state.phase === 'caught') {
    ctx.fillStyle = '#fff9e9';
    ctx.fillRect(state.player.x + 34, state.player.y - 55, 190, 30);
    ctx.fillStyle = '#2c2540';
    ctx.font = '16px monospace';
    ctx.fillText('没心眼，不等我', state.player.x + 43, state.player.y - 35);
  }
  drawDistanceBubble(cameraX);
  ctx.restore();

  const remaining = Math.max(0, Math.round(((state.maxDistance - state.distance) / state.maxDistance) * 100));
  distanceFill.style.width = `${remaining}%`;
}

function updateLiveText() {
  if (!state) return;
  const messages = {
    hit: '撞到书包了，孟培杰拉开了距离。',
    fell: '掉下去了，回到检查点，距离拉开。',
    energy: '拿到贝贝能量，正在冲刺！',
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
  const isFinal = currentLevel === 2;
  winCopy.textContent = isFinal ? '贝贝追上了 · 通关啦！' : '贝贝追上了';
  winDetail.textContent = '没心眼，不等我';
  nextLevelButton.hidden = isFinal;
  replayButton.hidden = !isFinal;
  gameStatus.textContent = isFinal ? '第二关完成，贝贝追上了。' : '第一关完成，可以进入下一关。';
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

function frame(timestamp) {
  if (!lastFrame) lastFrame = timestamp;
  const elapsedMs = Math.min(50, timestamp - lastFrame);
  lastFrame = timestamp;
  state = updateGame(state, input, elapsedMs);
  input.jumpPressed = false;
  updateLiveText();
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
  levelName.textContent = `${levelId === 1 ? '第一关' : '第二关'} · ${LEVELS[levelId].name}`;
  gameStatus.textContent = `${LEVELS[levelId].name}开始，追上孟培杰！`;
  homeScreen.hidden = true;
  gameScreen.hidden = false;
  render();
  animationFrame = requestAnimationFrame(frame);
}

function returnHome() {
  stopGame();
  closeDialogs();
  state = null;
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
nextLevelButton.addEventListener('click', () => startLevel(2));
replayButton.addEventListener('click', () => startLevel(1));
homeButtons.forEach((button) => button.addEventListener('click', returnHome));
