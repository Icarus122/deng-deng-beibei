import test from 'node:test';
import assert from 'node:assert/strict';

import { advanceCamera } from '../camera.js';
import { overlaps } from '../entities.js';
import { LEVELS, createGame, getPursuerRenderState, getPursuerTaunt, updateGame } from '../game-logic.js';
import { getHighRouteViolations, JOURNEY } from '../level-data.js';

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

test('Beibei animation distance advances on the ground and pauses in the air', () => {
  const grounded = updateGame(createGame(1), { left: false, right: false, jumpPressed: false }, 50);
  const airborne = updateGame({
    ...grounded,
    player: { ...grounded.player, grounded: false, y: 360, velocityY: -250 },
  }, { left: false, right: false, jumpPressed: false }, 50);

  assert.equal(grounded.player.runDistanceTravelled, 7.5);
  assert.equal(airborne.player.runDistanceTravelled, grounded.player.runDistanceTravelled);
  assert.ok(airborne.player.distanceTravelled > grounded.player.distanceTravelled);
});

test('the continuous journey keeps five regions but fits a compact play session', () => {
  const journey = LEVELS[1];

  assert.ok(journey.worldEnd >= 20000);
  assert.ok(journey.worldEnd <= 26000);
  assert.equal(journey.districts.length, 5);
  assert.deepEqual(journey.districts.map((district) => district.name), ['校园入口', '篮球场', '银杏林路', '湖畔施工区', '黄昏天桥']);
  assert.ok(journey.checkpoints.length >= 6);
});

test('journey supplies dense elevated routes and varied hazards without stale pursuer shortcuts', () => {
  const elevatedPlatforms = JOURNEY.platforms.filter((platform) => platform.y < 470);

  assert.ok(elevatedPlatforms.length >= 24);
  assert.ok(JOURNEY.shortcutNodes.every((node) => JOURNEY.platforms.some((platform) => platform.route === node.route)));
  assert.ok(JOURNEY.obstacles.length >= 18);
});

test('five hand-authored high routes stay within the jump reach budget', () => {
  assert.deepEqual(getHighRouteViolations(JOURNEY.platforms), []);
  const routes = [...new Set(JOURNEY.platforms.filter((platform) => platform.route && platform.route !== 'bridge-upper-route').map((platform) => platform.route))];
  assert.equal(routes.length, 5);
  assert.equal(JOURNEY.platforms.filter((platform) => platform.boost).length, 48);
  assert.ok(JOURNEY.platforms.filter((platform) => platform.route).every((platform) => !platform.slope));
  assert.ok(JOURNEY.platforms.filter((platform) => platform.route).some((platform) => platform.y === 410));
  const routeShapes = routes.map((route) => {
    const platforms = JOURNEY.platforms.filter((platform) => platform.route === route).sort((a, b) => a.x - b.x);
    return JSON.stringify(platforms.map((platform) => [platform.x - platforms[0].x, platform.y, platform.width]));
  });
  assert.equal(new Set(routeShapes).size, 5, 'each district should use its own platform rhythm');
  assert.equal(JOURNEY.platforms.filter((platform) => platform.route === 'bridge-upper-route').length, 8);
});

test('high routes hold coins while sprint energy stays reachable on the ground', () => {
  for (const coin of JOURNEY.coins) {
    assert.ok(JOURNEY.platforms.some((platform) => platform.route
      && coin.x + coin.width > platform.x
      && coin.x < platform.x + platform.width
      && coin.y + coin.height === platform.y));
  }
  assert.equal(JOURNEY.energy.filter((energy) => energy.y === 468).length, 11);
  const routeEnergy = JOURNEY.energy.filter((energy) => energy.id.startsWith('energy-route-'));
  assert.equal(routeEnergy.length, 5);
  for (const energy of routeEnergy) {
    assert.ok(JOURNEY.platforms.some((platform) => platform.route === energy.route
      && energy.x + energy.width > platform.x
      && energy.x < platform.x + platform.width
      && energy.y < platform.y
      && energy.y + energy.height >= platform.y - 20));
  }
  assert.ok(JOURNEY.energy.some((energy) => energy.y + energy.height === 400));
  assert.equal(new Set(JOURNEY.energy.map((energy) => energy.id)).size, JOURNEY.energy.length);
});

test('data-derived checkpoints respawn on solid ground twice per district', () => {
  assert.equal(JOURNEY.checkpoints.length, 10);
  for (const checkpoint of JOURNEY.checkpoints) {
    assert.ok(JOURNEY.platforms.some((platform) => platform.y === 510
      && checkpoint.respawnX >= platform.x
      && checkpoint.respawnX < platform.x + platform.width));
  }
});

test('journey includes every announced interactive hazard type across all districts', () => {
  const types = new Set(JOURNEY.hazards.map((hazard) => hazard.type));

  for (const type of ['collapse', 'constructionBox', 'blocker', 'patrol']) assert.ok(types.has(type));
  assert.ok(new Set(JOURNEY.hazards.map((hazard) => hazard.district)).size >= 5);
});

test('intro route stays walkable until the first new hazard appears', () => {
  const firstHazardX = Math.min(...JOURNEY.hazards.map((hazard) => hazard.x));
  const openingGround = JOURNEY.platforms.find((platform) => platform.y === 510 && platform.x === 0);

  assert.ok(openingGround.x + openingGround.width >= firstHazardX);
});

test('auto-run reaches the first elevated hazard without falling', () => {
  let state = createGame(1);
  for (let step = 0; step < 180; step += 1) {
    state = updateGame(state, { left: false, right: false, jumpPressed: false }, 50);
  }

  assert.ok(state.player.x >= 1400);
  assert.notEqual(state.event, 'fell');
});

test('a high route requires a jump instead of automatically lifting Beibei', () => {
  let state = createGame(1);
  state = { ...state, player: { ...state.player, x: 2928, y: 478, grounded: true } };
  state = updateGame(state, { left: false, right: false, jumpPressed: false }, 50);

  assert.equal(state.player.y, 478);
  assert.equal(state.platformBoostTimerMs, 0);

  state = {
    ...state,
    player: { ...state.player, x: 2920, y: 376, velocityY: 80, grounded: false, jumpsUsed: 1 },
  };
  state = updateGame(state, { left: false, right: false, jumpPressed: false }, 50);
  assert.equal(state.player.y, 378);
  assert.ok(state.platformBoostTimerMs > 0);
});

test('down plus jump drops through only the current one-way platform and lands below', () => {
  const platform = JOURNEY.platforms.find((item) => item.id === 'gate-route-lower-1');
  let state = createGame(1);
  state = {
    ...state,
    player: { ...state.player, x: platform.x + 24, y: platform.y - 32, grounded: true, groundedPlatformId: platform.id },
    pursuer: { ...state.pursuer, x: platform.x + 300 },
  };
  state = updateGame(state, { left: false, right: false, down: true, jumpPressed: true }, 16);

  assert.equal(state.event, 'dropThrough');
  assert.equal(state.player.grounded, false);
  assert.equal(state.player.jumpsUsed, 2);
  assert.equal(state.player.dropThroughGroup, platform.oneWayGroup);
  assert.ok(state.player.y > platform.y - 32);

  for (let frame = 0; frame < 30 && !state.player.grounded; frame += 1) {
    state = updateGame(state, { left: false, right: false, down: true, jumpPressed: false }, 16);
  }
  assert.equal(state.player.grounded, true);
  assert.equal(JOURNEY.platforms.find((item) => item.id === state.player.groundedPlatformId)?.y, 510);
});

test('down plus jump on solid ground remains a normal jump', () => {
  const state = updateGame(createGame(1), { left: false, right: false, down: true, jumpPressed: true }, 16);

  assert.equal(state.event, 'none');
  assert.equal(state.player.jumpsUsed, 1);
  assert.ok(state.player.velocityY < 0);
});

test('allows exactly one air jump after a grounded jump', () => {
  let state = createGame(1);
  state = updateGame(state, { left: false, right: true, jumpPressed: true }, 16);
  assert.equal(state.player.jumpsUsed, 1);

  state = updateGame(state, { left: false, right: true, jumpPressed: true }, 16);
  assert.equal(state.player.jumpsUsed, 2);

  state = updateGame(state, { left: false, right: true, jumpPressed: true }, 16);
  assert.equal(state.player.jumpsUsed, 2);
});

test('coyote time accepts a jump shortly after leaving a platform', () => {
  let state = createGame(1);
  state = {
    ...state,
    player: { ...state.player, x: 1840, y: 478, grounded: false, jumpsUsed: 0, coyoteTimerMs: 80 },
  };

  state = updateGame(state, { left: false, right: false, jumpPressed: true }, 16);

  assert.equal(state.player.jumpsUsed, 1);
  assert.ok(state.player.velocityY < -400);
});

test('a jump pressed just before landing is buffered and launches on contact', () => {
  let state = createGame(1);
  state = {
    ...state,
    player: {
      ...state.player,
      x: 100,
      y: 470,
      velocityY: 100,
      grounded: false,
      jumpsUsed: 2,
      coyoteTimerMs: 0,
    },
  };

  state = updateGame(state, { left: false, right: false, jumpPressed: true }, 50);

  assert.equal(state.player.grounded, false);
  assert.equal(state.player.jumpsUsed, 1);
  assert.equal(state.player.velocityY, -580);
  assert.equal(state.player.landTimerMs, 120);
  assert.equal(state.player.dustTimerMs, 180);
});

test('releasing jump early creates a short hop and falling uses stronger gravity', () => {
  const shortHop = updateGame({
    ...createGame(1),
    player: { ...createGame(1).player, x: 100, y: 300, grounded: false, jumpsUsed: 1, coyoteTimerMs: 0, velocityY: -400 },
  }, { left: false, right: false, jumpPressed: false, jumpReleased: true }, 16);
  const falling = updateGame({
    ...createGame(1),
    player: { ...createGame(1).player, x: 100, y: 300, grounded: false, jumpsUsed: 1, coyoteTimerMs: 0, velocityY: 100 },
  }, { left: false, right: false, jumpPressed: false }, 50);

  assert.ok(shortHop.player.velocityY > -220);
  assert.equal(falling.player.velocityY, 187.5);
});

test('a press and release in the same physics step produces a short hop', () => {
  const tapped = updateGame(createGame(1), { jumpPressed: true, jumpReleased: true }, 16);
  const held = updateGame(createGame(1), { jumpPressed: true, jumpHeld: true }, 16);
  assert.equal(tapped.player.jumpsUsed, 1);
  assert.ok(tapped.player.velocityY > held.player.velocityY + 250);
});

test('a buffered tap remains short when the character lands later', () => {
  const start = createGame(1);
  const airborne = {
    ...start,
    player: { ...start.player, x: 100, y: 465, grounded: false, velocityY: 100, jumpsUsed: 2, coyoteTimerMs: 0 },
  };
  const buffered = updateGame(airborne, { jumpPressed: true, jumpReleased: true }, 16);
  assert.equal(buffered.player.jumpBufferReleased, true);
  const landed = updateGame(updateGame(buffered, {}, 50), {}, 16);
  assert.equal(landed.player.jumpsUsed, 1);
  assert.ok(landed.player.velocityY > -300);
});

test('a hard obstacle collision briefly freezes the simulation without shaking the camera', () => {
  let state = createGame(1);
  state = { ...state, player: { ...state.player, x: 8200 } };
  state = updateGame(state, { left: false, right: false, jumpPressed: false }, 16);

  assert.equal(state.event, 'hit');
  assert.equal(state.hitStopMs, 50);
  assert.equal(Object.hasOwn(state, 'shakeTimerMs'), false);
  const frozenX = state.player.x;
  state = updateGame(state, { left: false, right: false, jumpPressed: false }, 16);
  assert.equal(state.player.x, frozenX);
  assert.equal(state.hitStopMs, 34);
});

test('a fresh run starts with three hearts and a hazard collision costs one heart', () => {
  let state = createGame(1);
  assert.equal(state.hearts, 3);
  state = { ...state, player: { ...state.player, x: 8200 }, pursuer: { ...state.pursuer, x: 8450 } };
  state = updateGame(state, { left: false, right: false, jumpPressed: false }, 16);

  assert.equal(state.hearts, 2);
  assert.equal(state.event, 'hit');
  assert.ok(state.invulnerabilityMs > 0);
  assert.equal(state.damageCount, 1);
});

test('zero hearts ends the run and repeated overlap does not drain more hearts', () => {
  let state = createGame(1);
  state = { ...state, hearts: 1, player: { ...state.player, x: 8200 }, pursuer: { ...state.pursuer, x: 8450 } };
  state = updateGame(state, { left: false, right: false, jumpPressed: false }, 16);

  assert.equal(state.hearts, 0);
  assert.equal(state.phase, 'lost');
  assert.equal(state.event, 'lost');

  let protectedState = createGame(1);
  protectedState = { ...protectedState, player: { ...protectedState.player, x: 8200 }, pursuer: { ...protectedState.pursuer, x: 8450 } };
  protectedState = updateGame(protectedState, { left: false, right: false, jumpPressed: false }, 16);
  for (let frame = 0; frame < 20; frame += 1) {
    protectedState = updateGame(protectedState, { left: false, right: false, jumpPressed: false }, 50);
  }
  assert.equal(protectedState.hearts, 2);
});

test('an upper-route heart pickup restores one missing heart only once', () => {
  let state = createGame(1);
  const platform = JOURNEY.platforms.find((item) => item.id === 'gate-route-upper-exit');
  const heart = JOURNEY.heartPickups.find((item) => item.id === 'heart-gate');
  state = {
    ...state,
    hearts: 2,
    player: { ...state.player, x: heart.x, y: platform.y - 32, grounded: true, groundedPlatformId: platform.id },
    pursuer: { ...state.pursuer, x: heart.x + 260 },
  };
  state = updateGame(state, { left: false, right: false, jumpPressed: false }, 16);

  assert.equal(state.hearts, 3);
  assert.equal(state.event, 'heart');
  assert.deepEqual(state.collectedHeartIds, ['heart-gate']);
});

test('the long journey keeps Beibei moving forward without a held keyboard key', () => {
  const before = createGame(1);
  const after = updateGame(before, { left: false, right: false, jumpPressed: false }, 50);

  assert.ok(after.player.x > before.player.x);
});

test('holding left turns Beibei left and moves her back for precise positioning', () => {
  const before = createGame(1);
  const after = updateGame(before, { left: true, right: false, jumpPressed: false }, 50);

  assert.ok(after.player.x < before.player.x);
  assert.equal(after.player.facing, -1);
});

test('camera eases toward a runner who has passed the initial viewport', () => {
  const cameraX = advanceCamera(0, 2000, 50, 1280, 42000);

  assert.ok(cameraX > 0);
  assert.ok(cameraX < 1540);
});

test('camera looks farther ahead when Beibei sprints', () => {
  const normal = advanceCamera(0, 2000, 210, 1280, 42000, 150);
  const sprinting = advanceCamera(0, 2000, 210, 1280, 42000, 240);

  assert.equal(Math.round(sprinting - normal), 36);
});

test('sprint exhaustion produces a gameplay cue', () => {
  let state = createGame(1);
  state = { ...state, energyMeter: 1 };
  state = updateGame(state, { left: false, right: true, sprint: true, jumpPressed: false }, 50);

  assert.equal(state.energyMeter, 0);
  assert.equal(state.event, 'energyEmpty');
});

test('touching a basketball launches it forward automatically', () => {
  let state = createGame(1);
  state = {
    ...state,
    player: { ...state.player, x: 6800 },
    pursuer: { ...state.pursuer, x: 7060 },
  };
  state = updateGame(state, { left: false, right: false, jumpPressed: false }, 16, { random: () => 0.9 });

  assert.equal(state.basketball.active, true);
  assert.ok(state.basketball.velocityX > 0);
});

test('banana peel records a mistake and temporarily slips Beibei', () => {
  let state = createGame(1);
  state = { ...state, player: { ...state.player, x: 11100 } };
  state = updateGame(state, { left: false, right: false, jumpPressed: false }, 16);

  assert.equal(state.event, 'slip');
  assert.equal(state.mistakes, 1);
  assert.ok(state.player.slipTimerMs > 0);
});

test('before the final fifteen percent, Meng visibly accelerates instead of teleporting', () => {
  let state = createGame(1);
  state = { ...state, player: { ...state.player, x: 18000 }, pursuer: { ...state.pursuer, x: 18040 } };
  state = updateGame(state, { left: false, right: false, jumpPressed: false }, 50, { random: () => 0 });

  assert.equal(state.phase, 'playing');
  assert.equal(state.pursuer.mode, 'evade');
  assert.ok(state.pursuer.velocity > 240);
  assert.ok(state.pursuer.x - state.player.x < 100);
});

test('collecting a coin records progress without teleporting Meng', () => {
  let state = createGame(1);
  const coin = JOURNEY.coins[0];
  state = { ...state, player: { ...state.player, x: coin.x, y: coin.y } };
  state = updateGame(state, { left: false, right: false, jumpPressed: false }, 16);

  assert.equal(state.event, 'coin');
  assert.equal(state.coins, 1);
  assert.ok(state.pursuer.x >= 70 + state.initialDistance);
  assert.ok(state.pursuer.x - (70 + state.initialDistance) <= 265 * .016 + 0.01);
});

test('jumping into a surprise block grants a coin and a short sprint', () => {
  let state = createGame(1);
  state = { ...state, player: { ...state.player, x: 2700, y: 378, velocityY: -260, grounded: false } };
  state = updateGame(state, { left: false, right: false, jumpPressed: false }, 16);

  assert.equal(state.event, 'surprise');
  assert.equal(state.coins, 1);
  assert.ok(state.energyTimerMs > 0);
});

test('landing on a spring launches Beibei into a high jump', () => {
  let state = createGame(1);
  state = { ...state, player: { ...state.player, x: 4600 } };
  state = updateGame(state, { left: false, right: false, jumpPressed: false }, 16);

  assert.equal(state.event, 'spring');
  assert.ok(state.player.velocityY < -500);
});

test('Meng render state stays on the ground when Beibei is in the air', () => {
  const renderPursuer = getPursuerRenderState({ x: 400, facing: 1, mode: 'cruise' });

  assert.equal(renderPursuer.y, 478);
  assert.equal(renderPursuer.grounded, true);
});

test('Meng has playful taunts that change across the chase', () => {
  assert.equal(getPursuerTaunt(0.12), '孟培杰：等等？你也太慢啦！');
  assert.equal(getPursuerTaunt(0.55), '孟培杰：前面有惊喜方块，敢不敢顶？');
  assert.equal(getPursuerTaunt(0.9), '孟培杰：快追上了？那就来呀！');
  assert.equal(getPursuerTaunt(0.5, 'evade'), '孟培杰：三秒爆发，跟得上吗？');
  assert.equal(getPursuerTaunt(0.99, 'finalChase'), '孟培杰：天桥尽头见！');
  assert.match(getPursuerTaunt(0.5, 'cruise', 'court'), /篮球场/);
  assert.match(getPursuerTaunt(0.5, 'cruise', 'bridge'), /弹簧/);
});

test('five standalone chapter levels contain localized playable data', () => {
  for (const levelId of [2, 3, 4, 5, 6]) {
    const level = LEVELS[levelId];
    assert.ok(level.name);
    assert.equal(level.worldEnd, 4800);
    assert.equal(level.finishX, 4600);
    assert.equal(level.districts.length, 1);
    for (const field of ['platforms', 'coins', 'energy', 'obstacles', 'hazards', 'checkpoints']) assert.ok(Array.isArray(level[field]), `${level.name}: ${field}`);
    assert.ok(level.platforms.every((platform) => platform.x >= 0 && platform.x + platform.width <= level.worldEnd));
    assert.equal(createGame(levelId).phase, 'playing');
  }
  assert.ok(LEVELS[6].shortcutNodes.some((node) => node.route === 'bridge-upper-route'));
});

test('bridge spring launches Beibei while Meng independently hops along the upper route', () => {
  let state = createGame(6);
  state = { ...state, player: { ...state.player, x: 290 } };
  for (let frame = 0; frame < 15; frame += 1) {
    state = updateGame(state, { left: false, right: false, sprint: false, jumpPressed: false }, 50);
  }

  assert.equal(state.player.y, 378);
  assert.equal(state.player.grounded, true);
  assert.ok(state.platformBoostTimerMs > 0);
  assert.ok(state.pursuer.y < 378);
  assert.ok(state.pursuer.targetPlatformId.startsWith('bridge-upper-'));
  assert.equal(state.pursuer.targetRoute, 'bridge-upper-route');
});

test('wind slowdown notifies once per entry instead of spamming every simulation step', () => {
  let state = createGame(6);
  state = { ...state, player: { ...state.player, x: 2000 }, pursuer: { ...state.pursuer, x: 2220 } };
  let windEvents = 0;
  for (let frame = 0; frame < 12; frame += 1) {
    state = updateGame(state, { left: false, right: false, sprint: false, jumpPressed: false }, 50);
    if (state.event === 'wind') windEvents += 1;
  }

  assert.equal(windEvents, 1);
  assert.ok(state.windTimerMs > 0);
});

test('a close approach after the 85 percent window opens catches Meng', () => {
  let state = createGame(1);
  state = { ...state, player: { ...state.player, x: 20000 }, pursuer: { ...state.pursuer, x: 20050 } };
  state = updateGame(state, { left: false, right: false, jumpPressed: false }, 50, { random: () => 0 });

  assert.equal(state.phase, 'caught');
});

test('a close approach on a different vertical layer is not a catch', () => {
  let state = createGame(1);
  state = {
    ...state,
    player: { ...state.player, x: 20000, y: 278, grounded: false, velocityY: 0, jumpsUsed: 1 },
    pursuer: { ...state.pursuer, x: 20030, y: 478, grounded: true },
  };
  state = updateGame(state, { left: false, right: false, jumpPressed: false }, 16);

  assert.ok(state.distance <= 56);
  assert.equal(state.phase, 'playing');
});

test('the catch window does not use injected randomness', () => {
  let state = createGame(1);
  state = { ...state, player: { ...state.player, x: 20000 }, pursuer: { ...state.pursuer, x: 20050 } };
  state = updateGame(state, { left: false, right: false, jumpPressed: false }, 50, { random: () => 0.34 });

  assert.equal(state.phase, 'caught');
});

test('a close approach after 85 percent catches Meng without a dice roll', () => {
  let state = createGame(1);
  state = { ...state, player: { ...state.player, x: 20000 }, pursuer: { ...state.pursuer, x: 20050 } };
  state = updateGame(state, { left: false, right: false, jumpPressed: false }, 50, { random: () => 0.99 });
  assert.equal(state.phase, 'caught');
  assert.equal(state.event, 'caught');
});

test('inside the 85 percent catch window, Meng switches pace without granting an automatic win', () => {
  let state = createGame(1);
  state = { ...state, player: { ...state.player, x: 19975 }, pursuer: { ...state.pursuer, x: 20250 } };
  state = updateGame(state, { left: false, right: false, jumpPressed: false }, 50, { random: () => 0.99 });

  assert.equal(state.phase, 'playing');
  assert.equal(state.pursuer.mode, 'finalChase');
  assert.equal(state.finalWindowOpened, true);
  assert.equal(state.event, 'catchWindowOpened');
  assert.ok(state.distance > 56);
});

test('opening the 85 percent window preserves the actual gap instead of snapping Meng', () => {
  let state = createGame(1);
  state = { ...state, player: { ...state.player, x: 19975 }, pursuer: { ...state.pursuer, x: 20250 } };
  state = updateGame(state, { left: false, right: false, jumpPressed: false }, 50);

  assert.equal(state.phase, 'playing');
  assert.equal(state.finalWindowOpened, true);
  assert.equal(state.event, 'catchWindowOpened');
  assert.ok(state.distance > 56);
  assert.ok(state.distance > 250);
});

test('the bridge does not force a catch before the 85 percent window opens', () => {
  let state = createGame(1);
  state = { ...state, player: { ...state.player, x: 19800 }, pursuer: { ...state.pursuer, x: 19960 } };
  state = updateGame(state, { left: false, right: false, jumpPressed: false }, 16);

  assert.equal(state.phase, 'playing');
  assert.ok(state.distance > 120);
});

test('collecting Beibei energy starts a sprint and closes the gap', () => {
  let state = createGame(1);
  state = { ...state, player: { ...state.player, x: 1880 } };
  state = updateGame(state, { left: false, right: true, jumpPressed: false }, 16);

  assert.equal(state.event, 'energy');
  assert.equal(state.energyMeter, 40);
  assert.ok(state.energyTimerMs > 0);
  assert.ok(state.distance < state.initialDistance);
});

test('jumping alone does not create energy and an airborne pickup grants only its listed amount', () => {
  let state = createGame(1);
  state = updateGame(state, { left: false, right: false, jumpPressed: true }, 16);
  assert.equal(state.energyMeter, 0);

  state = {
    ...createGame(1),
    energyMeter: 20,
    player: { ...createGame(1).player, x: 1880, y: 450, grounded: false, velocityY: 80, jumpsUsed: 1 },
  };
  state = updateGame(state, { left: false, right: false, jumpPressed: false }, 16);
  assert.equal(state.event, 'energy');
  assert.equal(state.energyMeter, 60);
});

test('a collected Beibei energy stays collected on later frames', () => {
  let state = createGame(1);
  state = { ...state, player: { ...state.player, x: 1880 } };
  state = updateGame(state, { left: false, right: true, jumpPressed: false }, 16);
  state = updateGame(state, { left: false, right: true, jumpPressed: false }, 16);

  assert.deepEqual(state.collectedEnergyIds, ['energy-0']);
});

test('falling returns Beibei to her checkpoint and widens the gap', () => {
  let state = createGame(1);
  state = {
    ...state,
    checkpointX: 420,
    player: { ...state.player, y: 700 },
    pursuer: { ...state.pursuer, x: 1200 },
  };
  state = updateGame(state, { left: false, right: false, jumpPressed: false }, 16);

  assert.equal(state.event, 'fell');
  assert.equal(state.player.x, 420);
  assert.ok(state.distance > state.initialDistance);
  assert.equal(state.phase, 'playing');
});

test('falling behind loses immediately and the finish line does not auto-win', () => {
  let lost = createGame(1);
  lost = { ...lost, distance: lost.maxDistance - 1, pursuer: { ...lost.pursuer, x: lost.player.x + lost.maxDistance - 1 } };
  lost = updateGame(lost, { left: true, right: false, jumpPressed: false }, 50);
  assert.equal(lost.phase, 'lost');

  let early = createGame(1);
  early = { ...early, distance: 1, player: { ...early.player, x: 1000 } };
  early = updateGame(early, { left: false, right: true, jumpPressed: false }, 50);
  assert.equal(early.phase, 'playing');

  let finish = createGame(1);
  finish = { ...finish, player: { ...finish.player, x: LEVELS[1].finishX }, pursuer: { ...finish.pursuer, x: LEVELS[1].finishX + 300 } };
  finish = updateGame(finish, { left: false, right: true, jumpPressed: false }, 50);
  assert.equal(finish.phase, 'playing');
});
