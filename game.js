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
beibeiPortrait.src = 'assets/beibei-runner.png';
mengPortrait.src = 'assets/meng-runner.png';

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

function currentDistrict() {
  const districts = LEVELS[currentLevel].districts;
  return districts?.find((district) => state.player.x >= district.start && state.player.x < district.end) ?? districts?.at(-1);
}

function scenePalette() {
  const palette = currentDistrict()?.palette;
  if (palette === 'afternoon') return { skyTop: '#8ec7d1', skyBottom: '#e9e5a9', ridge: '#7bb19a', far: '#b4d38c', tree: '#5e9b6d', trunk: '#86614d', ground: '#5eac78', edge: '#285f55', platform: '#dcb775', accent: '#fff09e' };
  if (palette === 'sunset') return { skyTop: '#865a97', skyBottom: '#f4a675', ridge: '#7d688a', far: '#a17c8d', tree: '#5e586f', trunk: '#59465f', ground: '#49767a', edge: '#284d5e', platform: '#b27c6f', accent: '#ffd579' };
  return { skyTop: '#7fbfdc', skyBottom: '#e9eeb5', ridge: '#87b9b3', far: '#b9d88c', tree: '#6bae75', trunk: '#8f654a', ground: '#5fae78', edge: '#286558', platform: '#d6b271', accent: '#ffe68c' };
}

function drawPixelCloud(x, y, color) {
  ctx.fillStyle = color;
  ctx.fillRect(x, y + 18, 86, 20);
  ctx.fillRect(x + 18, y + 8, 36, 26);
  ctx.fillRect(x + 48, y, 28, 32);
}

function drawBackground(cameraX) {
  const palette = scenePalette();
  const gradient = ctx.createLinearGradient(0, 0, 0, 540);
  gradient.addColorStop(0, palette.skyTop);
  gradient.addColorStop(1, palette.skyBottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(cameraX, 0, 1300, 540);

  ctx.fillStyle = palette.accent;
  ctx.fillRect(cameraX + 990, 70, 48, 48);
  ctx.fillStyle = `${palette.accent}88`;
  ctx.fillRect(cameraX + 976, 58, 76, 76);

  for (let x = Math.floor(cameraX / 320) * 320 - 320; x < cameraX + 1320; x += 320) {
    drawPixelCloud(x + 45, 68 + ((Math.floor(x / 320) & 1) * 35), '#fff9e9aa');
    ctx.fillStyle = palette.ridge;
    ctx.fillRect(x, 296, 320, 72);
    ctx.fillRect(x + 56, 258, 132, 72);
    ctx.fillStyle = palette.far;
    ctx.fillRect(x + 170, 326, 170, 58);
  }

  const district = currentDistrict();
  for (let x = Math.floor(cameraX / 170) * 170 - 170; x < cameraX + 1320; x += 170) {
    ctx.fillStyle = palette.trunk;
    ctx.fillRect(x + 76, 350, 22, 160);
    ctx.fillStyle = palette.tree;
    ctx.fillRect(x + 42, 286, 94, 78);
    ctx.fillRect(x + 60, 252, 58, 60);
  }
  if (district?.palette === 'afternoon') {
    ctx.fillStyle = '#d6e5d5';
    ctx.fillRect(cameraX + 710, 300, 160, 116);
    ctx.fillStyle = '#6d88a0';
    for (let x = cameraX + 728; x < cameraX + 860; x += 34) ctx.fillRect(x, 326, 18, 22);
  }
  if (district?.palette === 'sunset') {
    ctx.fillStyle = '#4b4763';
    ctx.fillRect(cameraX, 306, 1300, 20);
    ctx.fillStyle = '#ffce77';
    for (let x = cameraX + 40; x < cameraX + 1300; x += 155) {
      ctx.fillRect(x, 283, 16, 23);
      ctx.fillStyle = '#4b4763';
      ctx.fillRect(x + 6, 245, 5, 38);
      ctx.fillStyle = '#ffce77';
    }
  }
}

function drawPlatform(platform) {
  const palette = scenePalette();
  ctx.fillStyle = palette.edge;
  ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
  ctx.fillStyle = palette.platform;
  ctx.fillRect(platform.x + 4, platform.y + 4, platform.width - 8, 13);
  ctx.fillStyle = '#fff0b2';
  for (let x = platform.x + 12; x < platform.x + platform.width - 6; x += 36) ctx.fillRect(x, platform.y + 9, 14, 3);
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

function drawRunner(x, y, portrait, { crying = false, fallen = false, tapping = false, jumping = false } = {}) {
  const stride = Math.sin(state.elapsedMs / 78) * 4;
  const bob = jumping ? -4 : Math.abs(stride) * 0.55;
  ctx.save();
  if (fallen) {
    ctx.translate(x + 34, y + 20);
    ctx.rotate(Math.PI / 2);
    ctx.drawImage(portrait, -42, -35, 84, 70);
  } else if (crying) {
    ctx.translate(x + 20, y + 32);
    ctx.scale(0.82, 0.72);
    ctx.drawImage(portrait, -42, -74, 84, 84);
    ctx.fillStyle = '#74d7ee';
    ctx.fillRect(5, -35, 5, 17);
    ctx.fillRect(20, -31, 5, 13);
  } else {
    ctx.translate(x + 28, y + 30 + bob);
    if (jumping) ctx.rotate(-0.1);
    ctx.drawImage(portrait, -38, -82, 76, 88);
    if (tapping) {
      ctx.fillStyle = '#fff3a5';
      ctx.fillRect(35, -28, 18, 6);
      ctx.fillRect(41, -34, 6, 18);
    }
  }
  ctx.restore();
  if (!crying && !fallen && !jumping && Math.abs(stride) > 3) {
    ctx.fillStyle = '#fff0c7';
    ctx.fillRect(x - 8, y + 28, 10, 4);
    ctx.fillRect(x - 20, y + 33, 7, 3);
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
  const cameraX = Math.max(0, state.player.x - 360);
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

  const beibeiOptions = { crying: state.phase === 'lost', tapping: state.phase === 'caught' && resultPose === 'tap', jumping: !state.player.grounded };
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
  const district = currentDistrict();
  const progress = Math.min(100, Math.round((state.player.x / level.finishX) * 100));
  levelName.textContent = `${district?.name ?? level.name} · 路程 ${progress}%`;
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
