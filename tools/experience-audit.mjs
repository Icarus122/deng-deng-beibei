// Read-only, deterministic design audit. Does not write saves or alter game rules.
import { createGame, LEVELS, updateGame } from '../game-logic.js';
import { createPursuer, updatePursuer } from '../pursuer-ai.js';
import { jumpInput, runBot } from './level-bot.mjs';

const stage = LEVELS['journey-02'];
const ground = stage.platforms.filter(p => p.y === 510).sort((a, b) => a.x - b.x);
const gaps = ground.slice(1).map((p, i) => p.x - ground[i].x - ground[i].width);
const flat = [...ground].sort((a, b) => b.width - a.width)[0];
const routes = [];
for (const stepMs of [1000 / 60, 1000 / 30]) {
  for (const [name, input] of [
    ['ground-observation', s => jumpInput(s, true, false)],
    ['upper-observation', s => jumpInput(s, true, true)],
    ['no-sprint-ground', s => jumpInput(s, false, false)],
    ['fixed-rhythm-700ms', s => ({ right: true, jumpPressed: Math.floor(s.elapsedMs / stepMs) % Math.round(700 / stepMs) === 0 })],
  ]) routes.push({ fps: Math.round(1000 / stepMs), ...runBot(name, input, { levelId: 'journey-02', stepMs }) });
}

const debuffOverrides = ['slowed', 'downed'].map(mode => {
  const p = { ...createPursuer(300), mode, modeTimerMs: 1000 };
  const next = updatePursuer(p, { x: 100 }, 1000 / 60, { finishX: 18000 });
  return { initialMode: mode, gap: 200, nextMode: next.mode, nextSpeed: next.velocity };
});
let behind = createGame('journey-02');
behind = { ...behind, finalWindowOpened: true,
  player: { ...behind.player, x: 16000 },
  pursuer: { ...behind.pursuer, x: 15800 } };
const behindNext = updateGame(behind, {}, 1000 / 60, { random: () => .9 });

const checkpoints = stage.checkpoints.map(point => ({
  id: point.id, respawnX: point.respawnX,
  nearestDanger: stage.hazards.filter(h => h.type !== 'collapse')
    .map(h => ({ id: h.id, dx: h.x - point.respawnX }))
    .filter(h => h.dx >= 0).sort((a, b) => a.dx - b.dx)[0],
}));

console.log(JSON.stringify({
  stage: { id: stage.id, length: stage.worldEnd, gapWidths: gaps,
    longestGround: { x: flat.x, width: flat.width, secondsAt150: flat.width / 150 },
    hazards: stage.hazards.length, energy: stage.energy.length,
    upperYValues: [...new Set(stage.platforms.filter(p => p.y < 510).map(p => p.y))] },
  debuffOverrides,
  behindCatch: { beforeGap: -200, nextGap: behindNext.distance, phase: behindNext.phase },
  checkpoints, routes,
}, null, 2));
