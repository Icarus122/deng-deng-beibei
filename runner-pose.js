export function getRunnerPose(elapsedMs, facing = 1) {
  const phase = (elapsedMs / 180) * Math.PI * 2;
  const stride = Math.sin(phase);

  return {
    bob: Math.abs(stride) * 2.6,
    torsoTilt: stride * 0.045 * facing,
    leftLeg: stride * 0.62,
    rightLeg: -stride * 0.62,
    leftArm: -stride * 0.48,
    rightArm: stride * 0.48,
  };
}
