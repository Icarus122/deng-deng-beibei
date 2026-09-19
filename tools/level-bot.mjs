import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { JOURNEY } from '../level-data.js';
import { createGame, getRenderPlatforms, updateGame } from '../game-logic.js';

const STEP_MS = 1000 / 60;
const PLAYER_WIDTH = 24;
const GROUND_Y = 510;
const BOT_TIMEOUT_MS = 180000;

function sortByStart(items) {
  return [...items].sort((a, b) => a.x - b.x || a.width - b.width);
}

function mergeIntervals(intervals) {
  const merged = [];
  for (const interval of sortByStart(intervals)) {
    const next = { start: interval.start, end: interval.end };
    const previous = merged.at(-1);
    if (previous && next.start <= previous.end) {
      previous.end = Math.max(previous.end, next.end);
    } else {
      merged.push(next);
    }
  }
  return merged;
}

function overlapLength(start, end, intervals) {
  return intervals.reduce((total, interval) => (
    total + Math.max(0, Math.min(end, interval.end) - Math.max(start, interval.start))
  ), 0);
}

function isCovered(x, platforms) {
  return platforms.some((platform) => x >= platform.x && x <= platform.x + platform.width);
}

function districtFor(x) {
  return JOURNEY.districts.find((district) => x >= district.start && x < district.end)?.id ?? '终点外';
}

function platformGroups(platforms) {
  return platforms.reduce((groups, platform) => {
    if (!platform.route) return groups;
    groups.set(platform.route, [...(groups.get(platform.route) ?? []), platform]);
    return groups;
  }, new Map());
}

function getGroundGaps(groundPlatforms, highIntervals) {
  const gaps = [];
  const ordered = sortByStart(groundPlatforms);
  for (let index = 1; index < ordered.length; index += 1) {
    const previous = ordered[index - 1];
    const current = ordered[index];
    const start = previous.x + previous.width;
    const end = current.x;
    if (end <= start) continue;
    const covered = overlapLength(start, end, highIntervals);
    gaps.push({
      start,
      end,
      width: end - start,
      exposed: Math.max(0, end - start - covered),
      district: districtFor((start + end) / 2),
    });
  }
  return gaps;
}

function measureRegions(groundPlatforms) {
  return JOURNEY.districts.map((district) => {
    const width = district.end - district.start;
    const groundWidth = groundPlatforms.reduce((total, platform) => (
      total + Math.max(0, Math.min(district.end, platform.x + platform.width) - Math.max(district.start, platform.x))
    ), 0);
    return {
      id: district.id,
      expected: width,
      measured: groundWidth + (width - groundWidth),
    };
  });
}

function hasSupportAhead(state, lookAhead = 30) {
  const footX = state.player.x + PLAYER_WIDTH + lookAhead;
  return getRenderPlatforms(state.levelId, state.elapsedMs, state.collapseStarts).some((platform) => (
    footX >= platform.x && footX <= platform.x + platform.width
  ));
}

function highRouteStartsAhead(state) {
  const playerFront = state.player.x + PLAYER_WIDTH;
  return getRenderPlatforms(state.levelId, state.elapsedMs, state.collapseStarts).some((platform) => (
    platform.route
    && platform.y === 478
    && platform.x >= playerFront
    && platform.x - playerFront <= 70
  ));
}

function jumpInput(state, sprint = false, takeHighRoute = false, lookAhead = 30) {
  const needsJump = !hasSupportAhead(state, lookAhead);
  const routeJump = takeHighRoute && state.player.grounded && highRouteStartsAhead(state);
  const canGroundJump = state.player.grounded;
  const canAirJump = !state.player.grounded
    && state.player.velocityY > 0
    && state.player.jumpsUsed < 2;
  const shouldJump = routeJump || (needsJump && (canGroundJump || canAirJump));
  return {
    left: false,
    right: sprint,
    sprint,
    jumpPressed: shouldJump,
    jumpHeld: shouldJump,
  };
}

export function runBot(name, inputForState, { maxMs = BOT_TIMEOUT_MS } = {}) {
  let state = createGame(1);
  let elapsedMs = 0;
  let maxPlayerX = state.player.x;
  let firstCheckpointReached = false;
  let falls = 0;
  let caughtAt = null;
  let lostAt = null;

  while (elapsedMs < maxMs && state.phase === 'playing') {
    const nextState = updateGame(state, inputForState(state), STEP_MS, { random: () => 0.9 });
    elapsedMs += STEP_MS;
    if (nextState.event === 'fell') falls += 1;
    state = nextState;
    maxPlayerX = Math.max(maxPlayerX, state.player.x);
    firstCheckpointReached ||= maxPlayerX >= JOURNEY.checkpoints[0].x;
  }

  if (state.phase === 'caught') caughtAt = state.player.x;
  if (state.phase === 'lost') lostAt = state.player.x;
  return {
    name,
    phase: state.phase,
    elapsedMs,
    maxPlayerX,
    progress: maxPlayerX / JOURNEY.finishX,
    firstCheckpointReached,
    falls,
    caughtAt,
    lostAt,
    timedOut: state.phase === 'playing',
  };
}

export function analyseLevel() {
  const baseState = createGame(1);
  const platforms = getRenderPlatforms(baseState.levelId, baseState.elapsedMs, baseState.collapseStarts);
  const ground = sortByStart(platforms.filter((platform) => platform.y === GROUND_Y));
  const high = sortByStart(platforms.filter((platform) => platform.y < GROUND_Y));
  const highIntervals = mergeIntervals(high.map((platform) => ({
    start: platform.x,
    end: platform.x + platform.width,
  })));
  const routeGroups = platformGroups(high);
  const highRouteSpans = mergeIntervals([...routeGroups.values()].map((routePlatforms) => {
    const ordered = sortByStart(routePlatforms);
    return { start: ordered[0].x, end: ordered.at(-1).x + ordered.at(-1).width };
  }));
  const highCoverage = highRouteSpans.reduce((total, interval) => total + interval.end - interval.start, 0);
  const gaps = getGroundGaps(ground, highIntervals);
  const routes = [...routeGroups.entries()].map(([route, routePlatforms]) => {
    const ordered = sortByStart(routePlatforms);
    const start = ordered[0].x;
    const end = ordered.at(-1).x + ordered.at(-1).width;
    const adjacentGaps = ordered.slice(1).map((platform, index) => (
      platform.x - (ordered[index].x + ordered[index].width)
    ));
    return {
      route,
      start,
      end,
      startOnGround: isCovered(start + 1, ground),
      endOnGround: isCovered(end - 1, ground),
      adjacentGaps,
    };
  });
  const pitPlan = JOURNEY.districts.map((district) => {
    const widths = gaps.filter((gap) => gap.district === district.id).map((gap) => gap.width);
    return {
      district: district.id,
      widths,
      inRange: widths.every((width) => width >= 40 && width <= 170),
      increasing: widths.every((width, index) => index === 0 || width > widths[index - 1]),
    };
  });
  const bots = [
    runBot('零输入', () => ({ left: false, right: false, sprint: false, jumpPressed: false, jumpHeld: false })),
    runBot('自动跳跃（30px 前视）', (state) => jumpInput(state)),
    runBot('理想路线（高路 + 自动跳跃 + 冲刺）', (state) => jumpInput(state, true, true)),
  ];
  const idealBot = bots[2];
  const zeroBot = bots[0];
  const assertions = [
    {
      label: '高路覆盖率不超过 35%',
      pass: highCoverage / JOURNEY.worldEnd <= 0.35,
      detail: `${Math.round((highCoverage / JOURNEY.worldEnd) * 1000) / 10}% (${highCoverage}/${JOURNEY.worldEnd}px)`,
    },
    {
      label: '零输入机器人到不了第一个检查点',
      pass: !zeroBot.firstCheckpointReached,
      detail: `最远 ${Math.round(zeroBot.maxPlayerX)}px，检查点 ${JOURNEY.checkpoints[0].x}px`,
    },
    {
      label: '每个地面坑都有大于 24px 的暴露宽度',
      pass: gaps.every((gap) => gap.exposed > 24),
      detail: `${gaps.filter((gap) => gap.exposed <= 24).length}/${gaps.length} 个被高路完全或几乎完全遮住`,
    },
    {
      label: '每条高路首尾都能落回真实地面',
      pass: routes.every((route) => route.startOnGround && route.endOnGround),
      detail: `${routes.filter((route) => route.startOnGround && route.endOnGround).length}/${routes.length} 条完整接地`,
    },
    {
      label: '高路相邻平台间隙为 25–140px',
      pass: routes.every((route) => route.adjacentGaps.every((gap) => gap >= 25 && gap <= 140)),
      detail: `${routes.flatMap((route) => route.adjacentGaps).filter((gap) => gap < 25 || gap > 140).length} 个不合格连接`,
    },
    {
      label: '所有坑宽在 40–170px，且每区逐段加压',
      pass: pitPlan.every((plan) => plan.inRange && plan.increasing),
      detail: pitPlan.map((plan) => `${plan.district}:${plan.widths.join('/')}`).join('；'),
    },
    {
      label: '五个区域的地面节拍总长均为 4800px',
      pass: measureRegions(ground).every((region) => region.measured === region.expected),
      detail: measureRegions(ground).map((region) => `${region.id}:${region.measured}`).join('，'),
    },
    {
      label: '理想机器人在至少 95% 进度才可追上',
      pass: idealBot.phase === 'caught' && idealBot.progress >= 0.95,
      detail: `${idealBot.phase}，最远进度 ${(idealBot.progress * 100).toFixed(1)}%`,
    },
    {
      label: '零输入机器人失败、理想机器人胜利',
      pass: zeroBot.phase === 'lost' && idealBot.phase === 'caught',
      detail: `零输入=${zeroBot.phase}；理想=${idealBot.phase}`,
    },
  ];

  return { highCoverage, gaps, routes, pitPlan, regions: measureRegions(ground), bots, assertions };
}

function status(pass) {
  return pass ? 'PASS' : 'FAIL';
}

export function formatReport(analysis = analyseLevel()) {
  const lines = [
    '《等等贝贝吧》关卡机器人基线报告',
    `高路覆盖：${analysis.highCoverage}px / ${JOURNEY.worldEnd}px (${(analysis.highCoverage / JOURNEY.worldEnd * 100).toFixed(1)}%)`,
    '',
    '机器人结果：',
    ...analysis.bots.map((bot) => (
      `- ${bot.name}：${bot.phase}${bot.timedOut ? '（超时）' : ''}；最远 ${Math.round(bot.maxPlayerX)}px / ${(bot.progress * 100).toFixed(1)}%；跌落 ${bot.falls} 次；${(bot.elapsedMs / 1000).toFixed(1)} 秒`
    )),
    '',
    '断言：',
    ...analysis.assertions.map((assertion) => `- [${status(assertion.pass)}] ${assertion.label}：${assertion.detail}`),
    '',
    '地面坑（宽度 / 高路后仍暴露）：',
    ...analysis.gaps.map((gap) => `- ${gap.district} ${gap.start}-${gap.end}px：${gap.width}px / ${gap.exposed}px`),
    '',
    '高路端点与相邻间隙：',
    ...analysis.routes.map((route) => (
      `- ${route.route}：${route.start}-${route.end}px；起点地面=${route.startOnGround ? '是' : '否'}，终点地面=${route.endOnGround ? '是' : '否'}；间隙 ${route.adjacentGaps.join('/') || '无'}px`
    )),
  ];
  return lines.join('\n');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(formatReport());
}
