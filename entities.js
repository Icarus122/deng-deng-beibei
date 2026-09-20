export function overlaps(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

function sweptAxisInterval(position, movement, minimum, maximum) {
  if (Math.abs(movement) < 1e-9) {
    return position > minimum && position < maximum ? [-Infinity, Infinity] : null;
  }
  const first = (minimum - position) / movement;
  const second = (maximum - position) / movement;
  return [Math.min(first, second), Math.max(first, second)];
}

export function sweptOverlaps(previousA, currentA, previousB, currentB = previousB) {
  if (overlaps(currentA, currentB) || overlaps(previousA, previousB)) return true;

  const relativeX = previousA.x - previousB.x;
  const relativeY = previousA.y - previousB.y;
  const movementX = (currentA.x - previousA.x) - (currentB.x - previousB.x);
  const movementY = (currentA.y - previousA.y) - (currentB.y - previousB.y);
  const xInterval = sweptAxisInterval(relativeX, movementX, -previousA.width, previousB.width);
  const yInterval = sweptAxisInterval(relativeY, movementY, -previousA.height, previousB.height);
  if (!xInterval || !yInterval) return false;

  const entry = Math.max(xInterval[0], yInterval[0]);
  const exit = Math.min(xInterval[1], yInterval[1]);
  return entry <= exit && exit >= 0 && entry <= 1;
}
