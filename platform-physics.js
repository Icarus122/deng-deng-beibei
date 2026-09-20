export function findLandingPlatform(
  character,
  platforms,
  previousBottom,
  ignoredOneWayGroup = null,
  previousCharacter = null,
  previousPlatforms = platforms,
) {
  if (character.velocityY < 0) return null;

  const previous = previousCharacter ?? {
    x: character.x,
    y: previousBottom - character.height,
  };
  const candidates = [];

  for (const platform of platforms) {
    if (ignoredOneWayGroup && platform.oneWay
      && (platform.oneWayGroup ?? platform.id) === ignoredOneWayGroup) continue;

    const oldPlatform = previousPlatforms.find((item) => item.id === platform.id) ?? platform;
    const previousFoot = previous.y + character.height;
    const startRelativeFoot = previousFoot - oldPlatform.y;
    const endRelativeFoot = character.y + character.height - platform.y;
    const relativeMovement = endRelativeFoot - startRelativeFoot;
    const crossedTop = startRelativeFoot <= 3 && endRelativeFoot >= 0 && relativeMovement > 0;
    const canStepSlope = platform.slope
      && character.grounded
      && previousBottom >= platform.y
      && previousBottom - platform.y <= 6;
    if (!crossedTop && !canStepSlope) continue;

    const time = crossedTop ? Math.max(0, Math.min(1, -startRelativeFoot / relativeMovement)) : 1;
    const characterX = previous.x + (character.x - previous.x) * time;
    const platformX = oldPlatform.x + (platform.x - oldPlatform.x) * time;
    const horizontalOverlap = characterX + character.width > platformX
      && characterX < platformX + platform.width;
    if (horizontalOverlap) candidates.push({ platform, time });
  }

  return candidates.sort((a, b) => a.time - b.time || a.platform.y - b.platform.y)[0]?.platform ?? null;
}
