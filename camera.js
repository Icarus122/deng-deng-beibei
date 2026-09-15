function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}

export function advanceCamera(currentX, playerX, elapsedMs, viewportWidth, worldEnd) {
  const targetX = clamp(playerX - viewportWidth * 0.36, 0, Math.max(0, worldEnd - viewportWidth));
  const easing = Math.min(1, elapsedMs / 210);
  return clamp(currentX + (targetX - currentX) * easing, 0, Math.max(0, worldEnd - viewportWidth));
}
