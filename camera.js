function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}

export function advanceCamera(currentX, playerX, elapsedMs, viewportWidth, worldEnd, playerSpeed = 150) {
  const lookAhead = clamp((playerSpeed - 150) * 0.4, 0, 40);
  const targetX = clamp(playerX - viewportWidth * 0.29 + lookAhead, 0, Math.max(0, worldEnd - viewportWidth));
  const easing = Math.min(1, elapsedMs / 210);
  return clamp(currentX + (targetX - currentX) * easing, 0, Math.max(0, worldEnd - viewportWidth));
}
