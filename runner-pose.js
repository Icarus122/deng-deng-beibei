export function getRunnerPose(elapsedMs, facing = 1) {
  const phase = (elapsedMs / 180) * Math.PI * 2;
  const stride = Math.sin(phase);

  return {
    // Full-body sprite frames carry their own vertical motion.  Adding a
    // second procedural bob created a mismatched 11 Hz shake.
    bob: 0,
    torsoTilt: stride * 0.045 * facing,
    leftLeg: stride * 0.62,
    rightLeg: -stride * 0.62,
    leftArm: -stride * 0.48,
    rightArm: stride * 0.48,
  };
}
