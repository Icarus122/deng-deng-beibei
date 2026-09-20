export function findLandingPlatform(character, platforms, previousBottom, ignoredOneWayGroup = null) {
  return platforms.filter((platform) => {
    if (ignoredOneWayGroup && platform.oneWay
      && (platform.oneWayGroup ?? platform.id) === ignoredOneWayGroup) return false;
    const coversCharacter = character.x + character.width > platform.x
      && character.x < platform.x + platform.width;
    const crossedTop = previousBottom <= platform.y
      && character.y + character.height >= platform.y;
    const canStepSlope = platform.slope
      && character.grounded
      && previousBottom >= platform.y
      && previousBottom - platform.y <= 6;
    return coversCharacter && (crossedTop || canStepSlope) && character.velocityY >= 0;
  }).sort((a, b) => a.y - b.y)[0] ?? null;
}
