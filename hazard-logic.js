import { overlaps } from './entities.js';

const COLLAPSE_WARNING_MS = 500;

export function isCollapseGone(id, elapsedMs, collapseStarts = {}) {
  return collapseStarts[id] !== undefined && elapsedMs - collapseStarts[id] >= COLLAPSE_WARNING_MS;
}

function moveHazard(hazard, elapsedMs) {
  if (!hazard.motion) return { ...hazard };
  const offset = Math.sin((elapsedMs / hazard.motion.period) * Math.PI * 2) * hazard.motion.range;
  return { ...hazard, x: hazard.x + offset };
}

function fallConstructionBox(hazard, elapsedMs) {
  const period = hazard.period ?? 2600;
  const warningMs = hazard.warningMs ?? 700;
  const cycle = elapsedMs % period;
  const startY = hazard.startY ?? hazard.y;
  const groundY = hazard.groundY ?? hazard.y + 260;
  const fallingY = cycle <= warningMs ? startY : Math.min(groundY, startY + (cycle - warningMs) * 0.62);
  return { ...hazard, y: fallingY, warning: cycle <= warningMs };
}

export function getDynamicHazards(level, elapsedMs, collapseStarts = {}) {
  return (level.hazards ?? []).flatMap((hazard) => {
    if (hazard.type === 'collapse' && isCollapseGone(hazard.id, elapsedMs, collapseStarts)) return [];
    if (hazard.type === 'constructionBox') return [fallConstructionBox(hazard, elapsedMs)];
    return [moveHazard(hazard, elapsedMs)];
  });
}

export function resolveHazardContact(state, hazards, elapsedMs) {
  const collapseStarts = { ...(state.collapseStarts ?? {}) };
  for (const hazard of hazards) {
    const isStandingOnCollapse = hazard.type === 'collapse'
      && state.player.x < hazard.x + hazard.width
      && state.player.x + state.player.width > hazard.x
      && state.player.y + state.player.height >= hazard.y - 4
      && state.player.y + state.player.height <= hazard.y + 10;
    if (!overlaps(state.player, hazard) && !isStandingOnCollapse) continue;
    if (hazard.type === 'collapse') {
      if (collapseStarts[hazard.id] === undefined) collapseStarts[hazard.id] = elapsedMs;
      return { collapseStarts, event: 'collapseWarning', hazardSlowTimerMs: state.hazardSlowTimerMs ?? 0 };
    }
    if (hazard.type === 'constructionBox' && !hazard.warning) {
      return { collapseStarts, event: 'constructionHit', hazardSlowTimerMs: state.hazardSlowTimerMs ?? 0 };
    }
    if (hazard.type === 'blocker' || hazard.type === 'patrol' || hazard.type === 'spikes') {
      return {
        collapseStarts,
        event: hazard.type === 'blocker' ? 'blockerHit' : hazard.type === 'patrol' ? 'patrolHit' : 'spikesHit',
        hazardSlowTimerMs: hazard.type === 'spikes' ? state.hazardSlowTimerMs ?? 0 : 700,
      };
    }
  }
  return { collapseStarts, event: 'none', hazardSlowTimerMs: state.hazardSlowTimerMs ?? 0 };
}
