# 流畅跑步与实体障碍 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让角色拥有连续自然的跑步摆动，并在连续追逐关卡中加入可见、可交互的塌陷台、施工箱、移动挡板和巡逻障碍。

**Architecture:** `runner-pose.js` 只计算基于时间的平滑跑步姿势；`character-renderer.js` 用姿势绘制连续摆动的身体层。`hazard-logic.js` 只管理可测试的实体位置、塌陷状态与碰撞后果，`game-logic.js` 调用它并保存状态，`game.js` 负责每种实体的可见绘制。

**Tech Stack:** HTML5 Canvas、原生 ES modules、Node.js `node:test`。

**Spec:** `docs/superpowers/specs/2026-09-15-fluid-runner-hazards-design.md`

## Global Constraints

- 默认固定 60 FPS，持续低性能时稳定降到 30 FPS。
- 保留角色头像、哭泣、摔倒、打到孟培杰和反向转身。
- 角色跑步使用连续时间相位，不能再按整数帧跳变。
- 新实体必须有独立视觉、碰撞和明确后果，且前两分钟内全部出现。
- 不添加外部依赖、网络请求、素材或马里奥资产。

---

### Task 1: 连续跑步姿势

**Files:**
- Create: `runner-pose.js`
- Modify: `character-renderer.js`
- Create: `tests/runner-pose.test.mjs`

**Interfaces:**
- Produces: `getRunnerPose(elapsedMs, facing)` returning `{ bob, torsoTilt, leftLeg, rightLeg, leftArm, rightArm }`.
- Consumes: `getRunnerPose` in `drawCharacter` only when pose is `run`.

- [ ] **Step 1: 写失败测试，验证连续相位和反向四肢摆动**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { getRunnerPose } from '../runner-pose.js';

test('runner pose changes smoothly between close timestamps', () => {
  const first = getRunnerPose(100, 1);
  const second = getRunnerPose(108, 1);
  assert.notEqual(first.leftLeg, second.leftLeg);
  assert.ok(Math.abs(first.leftLeg - second.leftLeg) < 0.2);
});

test('runner arms swing opposite their matching legs', () => {
  const pose = getRunnerPose(160, 1);
  assert.ok(pose.leftArm * pose.leftLeg < 0);
  assert.ok(pose.rightArm * pose.rightLeg < 0);
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `node --test tests/runner-pose.test.mjs`

Expected: `ERR_MODULE_NOT_FOUND` for `runner-pose.js`.

- [ ] **Step 3: 实现最小平滑姿势函数，并用它绘制腿和手臂层**

```js
export function getRunnerPose(elapsedMs, facing = 1) {
  const phase = elapsedMs / 115;
  const stride = Math.sin(phase * Math.PI * 2);
  return {
    bob: Math.abs(stride) * 2.6,
    torsoTilt: stride * 0.045 * facing,
    leftLeg: stride * 0.62,
    rightLeg: -stride * 0.62,
    leftArm: -stride * 0.48,
    rightArm: stride * 0.48,
  };
}
```

Draw each limb from the torso with `ctx.rotate`, then draw the existing character image above it so face and costume remain recognizable.

- [ ] **Step 4: 验证绿色测试**

Run: `node --test tests/runner-pose.test.mjs`

Expected: both tests PASS.

- [ ] **Step 5: 提交**

```bash
git add runner-pose.js character-renderer.js tests/runner-pose.test.mjs
git commit -m "feat: animate fluid runner pose"
```

### Task 2: 可测试的新实体状态

**Files:**
- Create: `hazard-logic.js`
- Create: `tests/hazard-logic.test.mjs`
- Modify: `game-logic.js`

**Interfaces:**
- Produces: `getDynamicHazards(level, elapsedMs, collapsedIds)` and `applyHazardContact(state, hazards)`.
- `getDynamicHazards` returns moving blocker/patrol positions, falling-box y position, and removes collapsed platforms.
- `applyHazardContact` returns `{ player, distanceDelta, event, collapsedIds }`.

- [ ] **Step 1: 写失败测试，覆盖塌陷台、施工箱和移动实体**

```js
test('collapse platform disappears after its warning duration', () => {
  const hazards = getDynamicHazards({ hazards: [{ id: 'collapse-a', type: 'collapse', x: 400, y: 430, width: 90, height: 18 }] }, 900, ['collapse-a']);
  assert.equal(hazards.some((hazard) => hazard.id === 'collapse-a'), false);
});

test('moving blocker changes its horizontal position', () => {
  const level = { hazards: [{ id: 'blocker-a', type: 'blocker', x: 400, y: 450, width: 34, height: 60, motion: { range: 80, period: 1000 } }] };
  assert.notEqual(getDynamicHazards(level, 0, []).at(0).x, getDynamicHazards(level, 250, []).at(0).x);
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `node --test tests/hazard-logic.test.mjs`

Expected: `ERR_MODULE_NOT_FOUND` for `hazard-logic.js`.

- [ ] **Step 3: 实现动态实体与碰撞规则**

```js
export function getDynamicHazards(level, elapsedMs, collapsedIds = []) {
  return level.hazards.filter((hazard) => !collapsedIds.includes(hazard.id)).map((hazard) => ({ ...hazard, x: hazard.motion ? hazard.x + Math.sin(elapsedMs / hazard.motion.period * Math.PI * 2) * hazard.motion.range : hazard.x }));
}
```

Use `collapse` contact to add its id, `constructionBox` contact to add 42 pursuit distance, and `blocker` / `patrol` contacts to apply a 700ms slowdown plus 20 pursuit distance.  Keep the state immutable.

- [ ] **Step 4: 接入游戏状态与平台落脚判定**

Add `collapsedPlatformIds`, `hazardSlowTimerMs`, and `hazards` state to `createGame`; call `getDynamicHazards` before collision checks. Exclude collapsed platforms from `getRenderPlatforms` and `placeOnSurface`.

- [ ] **Step 5: 运行所有测试并提交**

Run: `npm test`

Expected: PASS.

```bash
git add hazard-logic.js game-logic.js tests/hazard-logic.test.mjs
git commit -m "feat: add interactive chase hazards"
```

### Task 3: 关卡投放与画面渲染

**Files:**
- Modify: `level-data.js`
- Modify: `game.js`
- Modify: `tests/game-logic.test.mjs`

**Interfaces:**
- Consumes: `JOURNEY.hazards`, `state.hazards`, `state.collapsedPlatformIds`.
- Produces: five districts that each place at least one new hazard; canvas sprites for all six entity types.

- [ ] **Step 1: 写失败测试，要求每类实体和多区域投放**

```js
test('journey includes every announced interactive hazard type', () => {
  const types = new Set(JOURNEY.hazards.map((hazard) => hazard.type));
  for (const type of ['collapse', 'constructionBox', 'blocker', 'patrol']) assert.ok(types.has(type));
  assert.ok(new Set(JOURNEY.hazards.map((hazard) => hazard.district)).size >= 5);
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `node --test tests/game-logic.test.mjs`

Expected: assertion failure because `JOURNEY.hazards` is missing.

- [ ] **Step 3: 添加完整关卡数据与渲染**

Add 10+ hazards across five districts: two collapse platforms, two construction boxes, three blockers, and three patrol obstacles. Draw collapse warning flashes, striped construction boxes, moving red-white blockers, and patrol cones. Draw the existing high/low, moving, and spring platforms with labels or distinct visual accents.

- [ ] **Step 4: 运行全部测试并提交**

Run: `npm test`

Expected: PASS.

```bash
git add level-data.js game.js tests/game-logic.test.mjs
git commit -m "feat: render varied pursuit hazards"
```

### Task 4: 浏览器验收与发布

**Files:**
- Modify only if browser verification finds a defect: `game.js`, `game-logic.js`, `hazard-logic.js`, `character-renderer.js`, `level-data.js`

**Interfaces:**
- Consumes: running local static site at `http://localhost:4173`.
- Produces: visual evidence of smooth runner and all entity classes, console/network error report, current GitHub Pages deployment.

- [ ] **Step 1: 启动本地服务与运行单元测试**

Run: `python -m http.server 4173` and `npm test`

Expected: local page serves; every test passes.

- [ ] **Step 2: 用浏览器检查实际画面**

Start the game, wait for the runner to animate, confirm moving platform, spring, collapse platform, falling construction box, blocker, and patrol obstacle are visible. Verify no console errors and a 390px viewport has no horizontal overflow.

- [ ] **Step 3: 发布已验证改动**

```bash
git fetch origin
git status -sb
git push origin main
```

Then request `https://icarus122.github.io/deng-deng-beibei/game.js` and verify it returns HTTP 200 with the newly imported modules.
