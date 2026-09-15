# 等等贝贝吧第二版 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a five-region, visually varied chase-platformer with independent Meng Peijie AI, automatic basketball interactions, banana-peel hazards, and a probabilistic catch window after 70% progress.

**Architecture:** Keep the static GitHub Pages/Canvas application, but replace repeated segment generation with declarative region data. `game-logic.js` remains deterministic and testable; it coordinates physics and interactions while `pursuer-ai.js` owns Meng Peijie's state. Separate scene and character renderers consume the state without changing it.

**Tech Stack:** HTML5 Canvas, vanilla ES modules, CSS, Node.js built-in `node:test`, existing project-local PNG character assets.

**Spec:** `docs/superpowers/specs/2026-09-15-deng-deng-beibei-v2-design.md`

## Global Constraints

- Use original maps, visuals, wording and effects; do not reproduce Mario assets, characters, levels, sounds or distinctive elements.
- Preserve the current GitHub Pages static deployment: no server, account, external script, API request or build tool.
- Keep the exact results copy “贝贝跟丢了”, “贝贝追上了”, and “没心眼，不等我”.
- Continue to use only generated local character assets; never commit the source photos.
- Desktop supports keyboard and mobile supports tap-to-jump; basketball activation is automatic on pickup.
- Use test-injectable random values for catch and basketball outcomes; normal play uses `Math.random()`.
- Only stage files named in the individual commit steps; do not add existing untracked legacy plan/spec files.

---

### Task 1: Replace repeated terrain with five explicit region configurations

**Files:**
- Create: `level-data.js`
- Create: `entities.js`
- Modify: `game-logic.js`
- Modify: `tests/game-logic.test.mjs`

**Interfaces:**
- Produces `JOURNEY` from `level-data.js`, with `{ worldEnd, finishX, regions, platforms, obstacles, pickups, checkpoints }`.
- Each `region` is `{ id, name, start, end, palette, landmark, foreground, interaction }`.
- `entities.js` exports `overlaps(a, b)` for `{ x, y, width, height }` hitboxes.
- `game-logic.js` exports `LEVELS`, `createGame(levelId)` and `updateGame(state, input, elapsedMs, options)` as before.

- [ ] **Step 1: Add a failing region-data test**

```js
import { JOURNEY } from '../level-data.js';
import { overlaps } from '../entities.js';

test('journey has five visually and mechanically distinct regions', () => {
  assert.equal(JOURNEY.regions.length, 5);
  assert.deepEqual(JOURNEY.regions.map(({ id }) => id), ['gate', 'court', 'ginkgo', 'lakeside', 'bridge']);
  assert.equal(new Set(JOURNEY.regions.map(({ palette }) => palette)).size, 5);
  assert.equal(new Set(JOURNEY.regions.map(({ interaction }) => interaction)).size, 5);
});

test('shared hitboxes overlap only when their rectangles intersect', () => {
  assert.equal(overlaps({ x: 0, y: 0, width: 10, height: 10 }, { x: 8, y: 8, width: 10, height: 10 }), true);
  assert.equal(overlaps({ x: 0, y: 0, width: 10, height: 10 }, { x: 10, y: 0, width: 10, height: 10 }), false);
});
```

- [ ] **Step 2: Run the suite and observe the missing-module failure**

Run: `npm test`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `level-data.js`.

- [ ] **Step 3: Create original fixed region data**

```js
function makePlatforms(start, end, widths, gaps, heights) {
  let x = start;
  const platforms = Array.from({ length: 16 }, (_, index) => {
    const width = widths[index % widths.length];
    const platform = { x, y: heights[index % heights.length], width, height: 30 };
    x += width + gaps[index % gaps.length];
    return platform;
  });
  if (x < end) platforms.push({ x, y: 510, width: end - x, height: 30 });
  return platforms;
}

export const JOURNEY = {
  worldEnd: 48000,
  finishX: 47200,
  regions: [
    { id: 'gate', name: '校园入口', start: 0, end: 9600, palette: 'morning', landmark: 'gate', foreground: 'flowerbeds', interaction: 'bookbag' },
    { id: 'court', name: '篮球场', start: 9600, end: 19200, palette: 'sports', landmark: 'hoop', foreground: 'bleachers', interaction: 'basketball' },
    { id: 'ginkgo', name: '银杏林路', start: 19200, end: 28800, palette: 'golden', landmark: 'bench', foreground: 'leaves', interaction: 'banana' },
    { id: 'lakeside', name: '湖畔施工区', start: 28800, end: 38400, palette: 'lake', landmark: 'crane', foreground: 'water', interaction: 'swingBridge' },
    { id: 'bridge', name: '黄昏天桥', start: 38400, end: 48000, palette: 'sunset', landmark: 'city', foreground: 'lamps', interaction: 'wind' },
  ],
  platforms: [
    ...makePlatforms(0, 9600, [500, 420, 540, 450], [70, 85, 55, 90], [510, 470, 510, 430]),
    ...makePlatforms(9600, 19200, [520, 430, 390, 500], [65, 95, 115, 70], [510, 460, 400, 510]),
    ...makePlatforms(19200, 28800, [460, 410, 530, 400], [110, 70, 95, 120], [510, 435, 510, 470]),
    ...makePlatforms(28800, 38400, [400, 330, 480, 370], [135, 115, 90, 140], [510, 385, 510, 355]),
    ...makePlatforms(38400, 48000, [500, 370, 480, 340], [80, 120, 75, 110], [510, 430, 510, 370]),
  ],
  obstacles: [
    { id: 'bookbag-1', type: 'bookbag', x: 2250, y: 478, width: 28, height: 32 },
    { id: 'basketball-1', type: 'basketball', x: 10000, y: 482, width: 22, height: 22 },
    { id: 'basketball-2', type: 'basketball', x: 15300, y: 482, width: 22, height: 22 },
    { id: 'banana-1', type: 'banana', x: 19400, y: 490, width: 24, height: 16 },
    { id: 'banana-2', type: 'banana', x: 24400, y: 490, width: 24, height: 16 },
    { id: 'barrier-1', type: 'barrier', x: 31000, y: 470, width: 36, height: 40 },
    { id: 'wind-1', type: 'wind', x: 41500, y: 360, width: 280, height: 150 },
  ],
  pickups: [
    { id: 'energy-1', type: 'energy', x: 5400, y: 468, width: 22, height: 22 },
    { id: 'energy-2', type: 'energy', x: 17700, y: 468, width: 22, height: 22 },
    { id: 'energy-3', type: 'energy', x: 26500, y: 468, width: 22, height: 22 },
    { id: 'energy-4', type: 'energy', x: 36500, y: 468, width: 22, height: 22 },
  ],
  checkpoints: [
    { x: 7200, respawnX: 7100 }, { x: 15800, respawnX: 15700 }, { x: 18600, respawnX: 18500 },
    { x: 25200, respawnX: 25100 }, { x: 28000, respawnX: 27900 }, { x: 34600, respawnX: 34500 },
    { x: 37500, respawnX: 37400 }, { x: 43800, respawnX: 43700 },
  ],
};
```

Create `entities.js` with this exact shared collision rule:

```js
export function overlaps(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}
```

Import `JOURNEY` and `overlaps` into `game-logic.js`, expose `JOURNEY` as `LEVELS[1]`, and remove the old repeating 42-segment generator. Preserve eight or more platforms per region and the explicit checkpoint and interaction coordinates shown above.

- [ ] **Step 4: Run the suite and verify green**

Run: `npm test`

Expected: PASS, including the five-region test.

- [ ] **Step 5: Commit the data layer**

```powershell
git add -- level-data.js entities.js game-logic.js tests/game-logic.test.mjs
git commit -m "feat: add diverse chase journey regions"
```

### Task 2: Add independent Meng Peijie pursuit AI

**Files:**
- Create: `pursuer-ai.js`
- Create: `tests/pursuer-ai.test.mjs`
- Modify: `game-logic.js`

**Interfaces:**
- `createPursuer(startX)` returns `{ x, velocity, facing: 1, mode: 'cruise', modeTimerMs: 0, evadeCooldownMs: 0 }`.
- `updatePursuer(pursuer, player, elapsedMs)` returns a new pursuer state with `mode` in `'cruise' | 'evade' | 'slowed' | 'downed'`.
- `game-logic.js` stores `state.pursuer` and retains `state.pursuerX` as a compatibility mirror.

- [ ] **Step 1: Write failing state-transition tests**

```js
import { createPursuer, updatePursuer } from '../pursuer-ai.js';

test('pursuer enters a brief evade state when Beibei gets close', () => {
  const pursuer = createPursuer(500);
  const next = updatePursuer(pursuer, { x: 360, facing: 1 }, 50);
  assert.equal(next.mode, 'evade');
  assert.ok(next.velocity > pursuer.velocity);
});

test('a downed pursuer does not copy Beibei running movement', () => {
  const pursuer = { ...createPursuer(500), mode: 'downed', modeTimerMs: 800 };
  const next = updatePursuer(pursuer, { x: 430, facing: 1 }, 50);
  assert.equal(next.x, 500);
  assert.equal(next.mode, 'downed');
});
```

- [ ] **Step 2: Run the targeted test and observe the missing-module failure**

Run: `node --test tests/pursuer-ai.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `pursuer-ai.js`.

- [ ] **Step 3: Implement the small AI state machine**

```js
const CRUISE_SPEED = 136;
const EVADE_SPEED = 205;

export function createPursuer(startX) {
  return { x: startX, velocity: CRUISE_SPEED, facing: 1, mode: 'cruise', modeTimerMs: 0, evadeCooldownMs: 0 };
}

export function updatePursuer(pursuer, player, elapsedMs) {
  const seconds = Math.min(elapsedMs, 50) / 1000;
  const gap = pursuer.x - player.x;
  const cooldown = Math.max(0, pursuer.evadeCooldownMs - elapsedMs);
  const timer = Math.max(0, pursuer.modeTimerMs - elapsedMs);
  const mode = timer > 0 ? pursuer.mode : gap >= 80 && gap <= 190 && cooldown === 0 ? 'evade' : 'cruise';
  const modeTimerMs = mode === 'evade' && pursuer.mode !== 'evade' ? 900 : timer;
  const velocity = mode === 'evade' ? EVADE_SPEED : mode === 'downed' ? 0 : mode === 'slowed' ? 92 : CRUISE_SPEED;
  return { ...pursuer, x: pursuer.x + velocity * seconds, velocity, mode, modeTimerMs, evadeCooldownMs: mode === 'evade' ? 2000 : cooldown };
}
```

Use a 900 ms evade, 2,000 ms slowed state and 900 ms downed state. In `game-logic.js`, construct `state.pursuer` in `createGame`, call `updatePursuer` once per update, and calculate the visual distance from the two positions.

- [ ] **Step 4: Verify the full logic suite**

Run: `npm test`

Expected: PASS with the new AI tests and the existing physics tests.

- [ ] **Step 5: Commit the AI layer**

```powershell
git add -- pursuer-ai.js tests/pursuer-ai.test.mjs game-logic.js
git commit -m "feat: add independent pursuer behavior"
```

### Task 3: Implement basketball, banana peel and 70% catch-window logic

**Files:**
- Modify: `game-logic.js`
- Modify: `tests/game-logic.test.mjs`

**Interfaces:**
- `updateGame(state, input, elapsedMs, { random = Math.random } = {})` accepts deterministic random input.
- State gains `{ mistakes, basketball, catchRollCooldownMs }`.
- `basketball` is `null` or `{ x, y, velocityX, active: true }`.
- Events include `'slip'`, `'basketball'`, `'pursuerSlowed'`, `'pursuerDowned'` and `'catchRoll'`.

- [ ] **Step 1: Write failing interaction tests**

```js
test('touching a basketball launches it forward automatically', () => {
  let state = createGame(1);
  state = { ...state, player: { ...state.player, x: 10000 } };
  state = updateGame(state, { left: false, right: false, jumpPressed: false }, 16, { random: () => 0.9 });
  assert.equal(state.basketball.active, true);
  assert.ok(state.basketball.velocityX > 0);
});

test('banana peel records a mistake and temporarily slips Beibei', () => {
  let state = createGame(1);
  state = { ...state, player: { ...state.player, x: 19400 } };
  state = updateGame(state, { left: false, right: false, jumpPressed: false }, 16);
  assert.equal(state.event, 'slip');
  assert.equal(state.mistakes, 1);
  assert.ok(state.player.slipTimerMs > 0);
});

test('catch rolls only begin after 70 percent and can win when injected random succeeds', () => {
  let state = createGame(1);
  state = { ...state, player: { ...state.player, x: 34000 }, pursuer: { ...state.pursuer, x: 34100 } };
  state = updateGame(state, { left: false, right: false, jumpPressed: false }, 1200, { random: () => 0 });
  assert.equal(state.phase, 'caught');
});
```

- [ ] **Step 2: Run the suite and confirm these behavior tests fail**

Run: `npm test`

Expected: FAIL because basketball, slip timers and catch rolls are not in the state.

- [ ] **Step 3: Add the interaction transitions**

```js
const CATCH_START_RATIO = 0.7;
const CATCH_RANGE = 120;

function catchChance(state) {
  return 0.18
    + (state.mistakes === 0 ? 0.16 : 0)
    + (state.pursuer.mode === 'slowed' ? 0.18 : 0)
    + (state.pursuer.mode === 'downed' ? 0.45 : 0);
}
```

At the basketball pickup, create an active ball with positive `velocityX`. Move it every update and on overlap with the pursuer use `random() < 0.25` for `downed`; otherwise set `slowed`. At a banana obstacle, set `player.slipTimerMs` to 700 ms, increment `mistakes` only on the transition into slipping, and reduce forward movement while slipping. After player progress reaches 70%, roll only when the gap is at most `CATCH_RANGE` and `catchRollCooldownMs` is zero; reset the cooldown to 1,100 ms after a failed roll.

- [ ] **Step 4: Re-run all logic tests**

Run: `npm test`

Expected: PASS, including all injected-random outcome tests.

- [ ] **Step 5: Commit interactive chase mechanics**

```powershell
git add -- game-logic.js tests/game-logic.test.mjs
git commit -m "feat: add chase interactions and catch window"
```

### Task 4: Render unique scenery with three-layer parallax

**Files:**
- Create: `scene-renderer.js`
- Modify: `game.js`
- Modify: `tests/game-logic.test.mjs`

**Interfaces:**
- `drawScene(ctx, { region, cameraX, elapsedMs, level })` renders a screen-space background and world-space scenery.
- `getRegionAt(regions, x)` is exported from `level-data.js` and returns the active region.
- `game.js` calls `drawScene` before translating into the world layer, then draws platforms/entities inside `ctx.translate(-cameraX, 0)`.

- [ ] **Step 1: Add a failing region lookup test**

```js
import { JOURNEY, getRegionAt } from '../level-data.js';

test('region lookup switches from court to ginkgo at the authored boundary', () => {
  assert.equal(getRegionAt(JOURNEY.regions, 10000).id, 'court');
  assert.equal(getRegionAt(JOURNEY.regions, 20000).id, 'ginkgo');
});
```

- [ ] **Step 2: Run the suite and verify `getRegionAt` is missing**

Run: `npm test`

Expected: FAIL with an import or export error for `getRegionAt`.

- [ ] **Step 3: Implement lookup and scene renderer**

```js
export function getRegionAt(regions, x) {
  return regions.find((region) => x >= region.start && x < region.end) ?? regions.at(-1);
}

const PALETTES = {
  morning: { sky: '#7fbfdc', far: '#87b9b3', mid: '#b9d88c', near: '#6bae75' },
  sports: { sky: '#90c8df', far: '#759cb7', mid: '#d9bd7d', near: '#5e9b6d' },
  golden: { sky: '#c9d7c2', far: '#a3b382', mid: '#d7b75c', near: '#7a9c5f' },
  lake: { sky: '#85b9c8', far: '#7894a4', mid: '#75b7bc', near: '#496b72' },
  sunset: { sky: '#865a97', far: '#7d688a', mid: '#a17c8d', near: '#4b4763' },
};

export function drawScene(ctx, { region, cameraX, elapsedMs }) {
  const palette = PALETTES[region.palette];
  const farX = -((cameraX * 0.16) % 360);
  const midX = -((cameraX * 0.48) % 240);
  const nearX = -((cameraX * 0.78) % 160);
  ctx.fillStyle = palette.sky; ctx.fillRect(0, 0, 1300, 540);
  ctx.fillStyle = palette.far; ctx.fillRect(farX, 280, 1660, 120);
  ctx.fillStyle = palette.mid; ctx.fillRect(midX, 350, 1540, 100);
  ctx.fillStyle = palette.near;
  for (let x = nearX; x < 1300; x += 160) ctx.fillRect(x, 330 + Math.round(Math.sin((x + elapsedMs) / 80) * 12), 70, 180);
  const landmark = { gate: [740, 240, 170, 170], hoop: [820, 250, 16, 160], bench: [720, 410, 180, 30], crane: [690, 170, 24, 250], city: [760, 270, 220, 180] }[region.landmark];
  ctx.fillStyle = region.landmark === 'hoop' ? '#e16f56' : '#554c63';
  ctx.fillRect(landmark[0] + farX, landmark[1], landmark[2], landmark[3]);
}
```

Use original Canvas pixel primitives for each landmark: gate/flowerbeds, hoop/bleachers, bench/ginkgo leaves, crane/water, city/bridge lamps. Keep the existing platform render but switch palettes according to `region.palette`.

- [ ] **Step 4: Run unit tests and a browser screenshot smoke check**

Run: `npm test`

Run: `node C:\Users\cjt bl\.codex\skills\playwright-browser\scripts\inspect-page.mjs http://127.0.0.1:4173 artifacts/v2-scene`

Expected: tests PASS; browser report has HTTP 200, zero console errors, zero page errors and zero failed requests.

- [ ] **Step 5: Commit the scenery renderer**

```powershell
git add -- level-data.js scene-renderer.js game.js tests/game-logic.test.mjs
git commit -m "feat: render diverse chase landscapes"
```

### Task 5: Render independent character action layers

**Files:**
- Create: `character-renderer.js`
- Modify: `game.js`
- Modify: `index.html`

**Interfaces:**
- `drawCharacter(ctx, character, portrait, elapsedMs)` consumes `{ x, y, facing, grounded, slipTimerMs, mode, pose }`.
- `drawCharacter` supports `run`, `jump`, `slip`, `cry`, `tap` and `downed` poses.
- `game.js` calls the renderer separately for `state.player` and `state.pursuer`.

- [ ] **Step 1: Add a DOM-level action legend before renderer changes**

```html
<p class="touch-tip">自动前进 · 点击画面跳跃 · 碰篮球自动踢向前方</p>
```

Run: `rg -n "碰篮球自动踢向前方" index.html`

Expected: one matching line after the edit.

- [ ] **Step 2: Implement separate character rendering**

```js
export function drawCharacter(ctx, character, portrait, elapsedMs) {
  const stride = Math.sin(elapsedMs / 78) * 7;
  const pose = character.pose ?? (character.mode === 'downed' ? 'downed' : character.slipTimerMs > 0 ? 'slip' : character.grounded ? 'run' : 'jump');
  ctx.save();
  ctx.translate(character.x, character.y);
  ctx.scale(character.facing, 1);
  if (pose === 'downed') ctx.rotate(Math.PI / 2);
  ctx.drawImage(portrait, -38, -82, 76, 60);
  const armSwing = pose === 'run' ? stride : pose === 'jump' ? 8 : pose === 'slip' ? -10 : 0;
  const legSwing = pose === 'run' ? -stride : pose === 'jump' ? -8 : pose === 'slip' ? 12 : 0;
  ctx.fillStyle = '#283d72';
  ctx.fillRect(-18 + armSwing, -38, 8, 25); ctx.fillRect(10 - armSwing, -38, 8, 25);
  ctx.fillRect(-10 + legSwing, -22, 10, 26); ctx.fillRect(2 - legSwing, -22, 10, 26);
  ctx.fillStyle = '#3b3154';
  ctx.fillRect(-13 + legSwing, 3, 16, 5); ctx.fillRect(-1 - legSwing, 3, 16, 5);
  ctx.restore();
}
```

Use `state.pursuer.mode` rather than `state.player.grounded` to select Meng Peijie's pose. Do not place any Meng position or animation calculation inside the Beibei draw call.

- [ ] **Step 3: Verify module usage and existing tests**

Run: `rg -n "drawCharacter|pursuer\.mode|碰篮球自动踢向前方" character-renderer.js game.js index.html`

Run: `npm test`

Expected: all three code patterns found; tests PASS.

- [ ] **Step 4: Commit action rendering**

```powershell
git add -- character-renderer.js game.js index.html
git commit -m "feat: animate independent chase characters"
```

### Task 6: Validate desktop/mobile playability and publish

**Files:**
- Modify only if verification finds a defect: `game-logic.js`, `pursuer-ai.js`, `level-data.js`, `scene-renderer.js`, `character-renderer.js`, `game.js`, `index.html`, `style.css`, or matching tests.
- Modify: `README.md`

**Interfaces:**
- Browser page remains `index.html`; `npm test` executes all `tests/*.test.mjs`.
- README describes automatic running, touch jumping, basketball pickups and the GitHub Pages URL.

- [ ] **Step 1: Update the user-facing controls and feature summary**

```md
- 自动前进；A / ← 可减速回头；空格 / W / ↑ 或点游戏画面跳跃。
- 碰到篮球会自动踢向孟培杰；香蕉皮会让贝贝暂时滑倒。
- 路程达到 70% 后，靠近孟培杰将出现概率追上机会。
```

Run: `rg -n "自动前进|篮球|香蕉皮|70%" README.md`

Expected: four feature descriptions found.

- [ ] **Step 2: Start a local static server and run desktop smoke checks**

Run: `python -m http.server 4173`

In another terminal run:

```powershell
& 'C:\Users\cjt bl\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' `
  'C:\Users\cjt bl\.codex\skills\playwright-browser\scripts\inspect-page.mjs' `
  'http://127.0.0.1:4173' 'artifacts/v2-desktop'
```

Expected: HTTP 200, title “等等贝贝吧”, no console/page errors and no failed requests.

- [ ] **Step 3: Verify the 390px mobile layout with Playwright**

Run:

```powershell
$env:PLAYWRIGHT_BROWSERS_PATH = '0'
& 'C:\Users\cjt bl\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --input-type=module -e "import { chromium } from 'file:///C:/Users/cjt%20bl/.codex/skills/playwright-browser/node_modules/playwright/index.mjs'; const browser=await chromium.launch({headless:true}); const page=await browser.newPage({viewport:{width:390,height:844}}); const errors=[]; page.on('pageerror',error=>errors.push(error.message)); await page.goto('http://127.0.0.1:4173'); await page.click('#start-button'); await page.locator('#game-canvas').tap(); const box=await page.locator('#game-canvas').boundingBox(); const scrollY=await page.evaluate(()=>window.scrollY); console.log(JSON.stringify({width:box.width,scrollY,errors})); await browser.close();"
```

Expected: no horizontal overflow; touch starts a jump; no browser errors.

- [ ] **Step 4: Run final checks**

Run: `npm test`

Run: `git diff --check`

Expected: all tests PASS and no whitespace errors.

- [ ] **Step 5: Commit, synchronize and push**

```powershell
git add -- README.md game-logic.js pursuer-ai.js level-data.js scene-renderer.js character-renderer.js game.js index.html style.css tests
git commit -m "feat: expand the chase journey"
git pull --rebase origin main
git push origin main
git rev-parse HEAD
```

Expected: push succeeds without force; record the exact commit SHA and verify the Pages build before reporting the live update.
