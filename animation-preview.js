import { drawCharacter, getRunFrameIndex, RUN_CYCLE_DISTANCE_PX, RUN_FRAME_DISTANCE_PX } from './character-renderer.js?v=20260920d';

const DISPLAY_WIDTH = 66;
const DISPLAY_HEIGHT = 88;
const CANVAS_WIDTH = 560;
const CANVAS_HEIGHT = 230;
const BASELINE_Y = 178;
const speedSelect = document.querySelector('#speed');
const facingSelect = document.querySelector('#facing');
const slowCheckbox = document.querySelector('#slow');
const toggleButton = document.querySelector('#toggle');
const status = document.querySelector('#status');
const distanceTravelled = { value: 0 };
let playing = true;
let previousTime = performance.now();

const runners = {
  beibei: {
    old: new Image(),
    next: new Image(),
    oldCanvas: document.querySelector('#beibei-old'),
    newCanvas: document.querySelector('#beibei-new'),
    label: document.querySelector('#beibei-frame'),
  },
  meng: {
    old: new Image(),
    next: new Image(),
    oldCanvas: document.querySelector('#meng-old'),
    newCanvas: document.querySelector('#meng-new'),
    label: document.querySelector('#meng-frame'),
  },
};

runners.beibei.old.src = 'assets/beibei-run-v2.png';
runners.beibei.next.src = 'assets/beibei-run-cycle-v3.png?v=20260920d';
runners.meng.old.src = 'assets/meng-run-v2.png?v=20260920d';
runners.meng.next.src = 'assets/meng-run-cycle-v3.png?v=20260920d';

function prepareCanvas(canvas) {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = CANVAS_WIDTH * ratio;
  canvas.height = CANVAS_HEIGHT * ratio;
  const context = canvas.getContext('2d');
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  return context;
}

Object.values(runners).forEach((runner) => {
  runner.oldContext = prepareCanvas(runner.oldCanvas);
  runner.newContext = prepareCanvas(runner.newCanvas);
  [runner.old, runner.next].forEach((image) => {
    image.addEventListener('error', () => {
      status.textContent = '有角色图集没有加载成功，请检查网络后刷新预览页。';
    });
    image.addEventListener('load', () => {
      status.textContent = '';
    });
  });
});

function drawStage(context) {
  context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  const sky = context.createLinearGradient(0, 0, 0, BASELINE_Y);
  sky.addColorStop(0, '#d9e6ed');
  sky.addColorStop(1, '#f8e8c9');
  context.fillStyle = sky;
  context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  context.fillStyle = '#d4c6ab';
  context.fillRect(0, BASELINE_Y, CANVAS_WIDTH, CANVAS_HEIGHT - BASELINE_Y);
  context.fillStyle = '#fff8df';
  context.fillRect(0, BASELINE_Y - 2, CANVAS_WIDTH, 3);
  context.fillStyle = '#897d70';
  context.fillRect(0, BASELINE_Y + 4, CANVAS_WIDTH, 2);
}

function drawOldFrame(context, image, facing) {
  if (!image.naturalWidth) return;
  const frameWidth = image.naturalWidth / 4;
  const frameIndex = Math.floor(Math.abs(distanceTravelled.value) / 46) % 4;
  context.save();
  context.translate(CANVAS_WIDTH / 2, BASELINE_Y);
  context.scale(facing, 1);
  context.drawImage(
    image,
    frameWidth * frameIndex,
    0,
    frameWidth,
    image.naturalHeight,
    -DISPLAY_WIDTH / 2,
    -DISPLAY_HEIGHT,
    DISPLAY_WIDTH,
    DISPLAY_HEIGHT,
  );
  context.restore();
}

function drawNewFrame(context, runnerId, image, facing) {
  drawCharacter(context, {
    x: CANVAS_WIDTH / 2 - 12,
    y: BASELINE_Y - 32,
    width: 24,
    height: 32,
    grounded: true,
    facing,
    runDistanceTravelled: distanceTravelled.value,
  }, { runnerId, runCycle: image });
}

function updateLabels(speed, frameIndex) {
  for (const [runnerId, runner] of Object.entries(runners)) {
    const name = runnerId === 'beibei' ? '贝贝' : '孟培杰';
    runner.label.textContent = `${name} · 新版第 ${frameIndex + 1}/12 帧 · 每轮 ${RUN_CYCLE_DISTANCE_PX}px / ${(RUN_CYCLE_DISTANCE_PX / speed).toFixed(2)}s`;
  }
}

function renderFrame() {
  const speed = Number(speedSelect.value);
  const facing = Number(facingSelect.value);
  const frameIndex = getRunFrameIndex(distanceTravelled.value);
  for (const [runnerId, runner] of Object.entries(runners)) {
    drawStage(runner.oldContext);
    drawOldFrame(runner.oldContext, runner.old, facing);
    drawStage(runner.newContext);
    drawNewFrame(runner.newContext, runnerId, runner.next, facing);
  }
  updateLabels(speed, frameIndex);
}

function tick(time) {
  const elapsedMs = Math.min(100, Math.max(0, time - previousTime));
  previousTime = time;
  if (playing) {
    const slowFactor = slowCheckbox.checked ? 0.25 : 1;
    distanceTravelled.value += Number(speedSelect.value) * elapsedMs / 1000 * slowFactor;
  }
  renderFrame();
  requestAnimationFrame(tick);
}

function stepFrame(amount) {
  const current = getRunFrameIndex(distanceTravelled.value);
  const next = (current + amount + 12) % 12;
  distanceTravelled.value = next * RUN_FRAME_DISTANCE_PX;
  renderFrame();
}

toggleButton.addEventListener('click', () => {
  playing = !playing;
  toggleButton.textContent = playing ? '暂停' : '播放';
});
document.querySelector('#previous').addEventListener('click', () => stepFrame(-1));
document.querySelector('#next').addEventListener('click', () => stepFrame(1));
speedSelect.addEventListener('change', renderFrame);
facingSelect.addEventListener('change', renderFrame);
slowCheckbox.addEventListener('change', renderFrame);

renderFrame();
requestAnimationFrame(tick);
