import { LEVELS, createGame, getPursuerRenderState, getRenderPlatforms, updateGame } from './game-logic.js';
import { advanceCamera } from './camera.js';
import { drawCharacter } from './character-renderer.js';
import { drawScene, getPalette } from './scene-renderer.js';

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

const beibeiPortrait = { still: new Image(), runCycle: new Image() };
const mengPortrait = { still: new Image(), runCycle: new Image() };
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
  return getPalette(currentDistrict());
}

function drawBackground(cameraX) {
  drawScene(ctx, { region: currentDistrict(), cameraX, elapsedMs: state.elapsedMs });
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

function drawCheckpoint(checkpoint) {
  ctx.fillStyle = '#fff9e9';
  ctx.fillRect(checkpoint.x, 426, 6, 84);
  ctx.fillStyle = '#ff797f';
  ctx.fillRect(checkpoint.x + 6, 430, 32, 22);
}

function drawRunnerLegs(style, stride, jumping) {
  const swing = jumping ? 0 : Math.round(stride * 1.8);
  const legColor = style === 'beibei' ? '#283d72' : '#3d4a5e';
  const shoeColor = style === 'beibei' ? '#3b3154' : '#29303f';
  const drawLeg = (hipX, shinX) => {
    ctx.fillStyle = legColor;
    ctx.fillRect(hipX, -23, 10, 14);
    ctx.fillRect(shinX, -10, 10, 14);
    ctx.fillStyle = shoeColor;
    ctx.fillRect(shinX - 3, 3, 15, 5);
  };

  if (jumping) {
    drawLeg(-8, 1);
    drawLeg(4, -9);
    return;
  }
  drawLeg(-8 + swing, -8 + swing * 2);
  drawLeg(4 - swing, 4 - swing * 2);
}

function drawRunner(x, y, portrait, { crying = false, fallen = false, tapping = false, jumping = false, facing = 1, style = 'beibei' } = {}) {
  const stride = Math.sin(state.elapsedMs / 78) * 4;
  const bob = jumping ? -4 : Math.abs(stride) * 0.55;
  ctx.save();
  if (fallen) {
    ctx.translate(x + 34, y + 20);
    ctx.scale(facing, 1);
    ctx.rotate(Math.PI / 2);
    ctx.drawImage(portrait, -42, -35, 84, 70);
  } else if (crying) {
    ctx.translate(x + 20, y + 32);
    ctx.scale(facing * 0.82, 0.72);
    ctx.drawImage(portrait, -42, -74, 84, 84);
    ctx.fillStyle = '#74d7ee';
    ctx.fillRect(5, -35, 5, 17);
    ctx.fillRect(20, -31, 5, 13);
  } else {
    ctx.translate(x + 28, y + 30 + bob);
    ctx.scale(facing, 1);
    if (jumping) ctx.rotate(-0.1);
    if (portrait.naturalWidth) {
      ctx.drawImage(portrait, 0, 0, portrait.naturalWidth, portrait.naturalHeight * 0.64, -38, -82, 76, 60);
      drawRunnerLegs(style, stride, jumping);
    } else {
      ctx.drawImage(portrait, -38, -82, 76, 88);
    }
    if (tapping) {
      ctx.fillStyle = '#fff3a5';
      ctx.fillRect(35, -28, 18, 6);
      ctx.fillRect(41, -34, 6, 18);
    }
  }
  ctx.restore();
  if (!crying && !fallen && !jumping && Math.abs(stride) > 3) {
    const trailDirection = facing > 0 ? -1 : 1;
    ctx.fillStyle = '#fff0c7';
    ctx.fillRect(x + trailDirection * 8, y + 28, 10, 4);
    ctx.fillRect(x + trailDirection * 20, y + 33, 7, 3);
  }
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
  const platforms = getRenderPlatforms(currentLevel, state.elapsedMs);

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.scale(0.5, 0.5);
  drawBackground(cameraX);
  ctx.save();
  ctx.translate(-cameraX, 0);
  platforms.forEach(drawPlatform);
  level.checkpoints.forEach(drawCheckpoint);
  level.energy.filter((energy) => !state.collectedEnergyIds.includes(energy.id)).forEach((energy) => drawEnergy(energy, state.elapsedMs));
  level.obstacles.forEach((obstacle) => drawObstacle(obstacle, state.elapsedMs));

  const beibei = { ...state.player, mode: state.phase === 'lost' ? 'cry' : state.phase === 'caught' && resultPose === 'tap' ? 'tap' : undefined };
  const meng = { ...getPursuerRenderState(state.pursuer), mode: state.phase === 'caught' && resultPose === 'fallen' ? 'downed' : state.pursuer.mode };
  drawCharacter(ctx, beibei, beibeiPortrait, state.elapsedMs);
  drawCharacter(ctx, meng, mengPortrait, state.elapsedMs + 36);
  if (state.basketball?.active) drawBasketball(state.basketball);

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
  lastRenderElapsedMs = 0;
  cameraX = 0;
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
