// Presentation only: simulation and collision always use the unmodified state.
export function interpolateRenderState(previous, current, alpha) {
  if (!previous || previous.levelId !== current.levelId || previous.phase !== current.phase || previous.missionPhase !== current.missionPhase) return current;
  const amount = Math.max(0,Math.min(1,alpha));
  const lerp = (a,b) => a + (b-a)*amount;
  const runner = (before,after) => {
    if (!before || !after || Math.abs(after.x-before.x)>80 || Math.abs(after.y-before.y)>120) return after;
    return {...after,x:lerp(before.x,after.x),y:lerp(before.y,after.y),runDistanceTravelled:lerp(before.runDistanceTravelled??0,after.runDistanceTravelled??0)};
  };
  return {...current,player:runner(previous.player,current.player),pursuer:runner(previous.pursuer,current.pursuer),
    cao:runner(previous.cao,current.cao),elapsedMs:lerp(previous.elapsedMs,current.elapsedMs),
    basketball:previous.basketball?.active && current.basketball?.active && current.basketball.ageMs>=previous.basketball.ageMs
      ? {...current.basketball,x:lerp(previous.basketball.x,current.basketball.x),y:lerp(previous.basketball.y,current.basketball.y)} : current.basketball};
}
