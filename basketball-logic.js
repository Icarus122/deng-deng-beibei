import { sweptOverlaps } from './entities.js';

const BALL_SIZE = 22;
const BALL_SPEED = 640;
const GRAVITY = 900;
const MAX_AGE_MS = 2500;

function pursuerTarget(pursuer) {
  const bodyWidth = pursuer.width ?? 24;
  const bodyHeight = pursuer.height ?? 32;
  return {
    x: pursuer.x - 21,
    y: (pursuer.y ?? 478) - 56,
    width: Math.max(66, bodyWidth + 42),
    height: Math.max(88, bodyHeight + 56),
  };
}

export function createBasketball(player, pursuer, switchTarget = null) {
  const x = player.x + player.width + 5;
  const y = player.y + player.height - BALL_SIZE - 3;
  const aim = switchTarget ?? pursuerTarget(pursuer);
  const targetX = aim.x + aim.width / 2 + (switchTarget ? 0 : Math.max(0, pursuer.velocity ?? 0) * 0.28);
  const flightSeconds = Math.max(0.12, (targetX - (x + BALL_SIZE / 2)) / BALL_SPEED);
  const targetY = aim.y + aim.height / 2;
  const startCenterY = y + BALL_SIZE / 2;
  const velocityY = Math.max(-420, Math.min(420,
    (targetY - startCenterY - 0.5 * GRAVITY * flightSeconds ** 2) / flightSeconds));

  return {
    x,
    y,
    previousX: x,
    previousY: y,
    width: BALL_SIZE,
    height: BALL_SIZE,
    velocityX: BALL_SPEED,
    velocityY,
    rotation: 0,
    ageMs: 0,
    targetSwitchId: switchTarget?.id ?? null,
    active: true,
  };
}

export function updateBasketball(ball, previousPursuer, pursuer, elapsedMs, worldEnd, random = Math.random, switches = []) {
  if (!ball?.active) return { ball: null, pursuer, event: 'none' };

  const stepMs = Math.max(0, Math.min(50, elapsedMs));
  const seconds = stepMs / 1000;
  const previousBall = { x: ball.x, y: ball.y, width: ball.width, height: ball.height };
  const nextBall = {
    ...ball,
    previousX: ball.x,
    previousY: ball.y,
    x: ball.x + ball.velocityX * seconds,
    y: ball.y + ball.velocityY * seconds,
    velocityY: ball.velocityY + GRAVITY * seconds,
    rotation: (ball.rotation ?? 0) + ball.velocityX * seconds / (BALL_SIZE / 2),
    ageMs: (ball.ageMs ?? 0) + stepMs,
  };
  const switchTarget = switches.find((item) => item.id === ball.targetSwitchId);
  if (switchTarget && sweptOverlaps(previousBall, nextBall, switchTarget)) {
    return { ball: null, pursuer, event: 'switchActivated', activatedSwitchId: switchTarget.id };
  }
  const previousTarget = pursuerTarget(previousPursuer);
  const currentTarget = pursuerTarget(pursuer);
  if (!switchTarget && sweptOverlaps(previousBall, nextBall, previousTarget, currentTarget)) {
    const downed = random() < 0.25;
    return {
      ball: null,
      pursuer: { ...pursuer, mode: downed ? 'downed' : 'slowed', modeTimerMs: downed ? 900 : 2000 },
      event: downed ? 'pursuerDowned' : 'pursuerSlowed',
    };
  }

  if (nextBall.ageMs >= MAX_AGE_MS || nextBall.x > worldEnd + BALL_SIZE || nextBall.x > pursuer.x + 560) {
    return { ball: null, pursuer, event: 'none' };
  }
  return { ball: nextBall, pursuer, event: 'none' };
}
