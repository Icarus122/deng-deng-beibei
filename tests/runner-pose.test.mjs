import test from 'node:test';
import assert from 'node:assert/strict';

import { getRunnerPose } from '../runner-pose.js';

test('runner pose changes smoothly between close timestamps', () => {
  const first = getRunnerPose(100, 1);
  const second = getRunnerPose(108, 1);

  assert.notEqual(first.leftLeg, second.leftLeg);
  assert.ok(Math.abs(first.leftLeg - second.leftLeg) < 0.2);
});

test('runner arms swing opposite their matching legs', () => {
  const pose = getRunnerPose(160, 1);

  assert.ok(pose.leftArm * pose.leftLeg < 0);
  assert.ok(pose.rightArm * pose.rightLeg < 0);
});
