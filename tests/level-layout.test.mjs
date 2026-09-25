import test from 'node:test';
import assert from 'node:assert/strict';

import { JOURNEY } from '../level-data.js';

function overlap(a, b) {
  return a.x < b.x + b.width && a.x + a.width > b.x
    && a.y < b.y + b.height && a.y + a.height > b.y;
}

test('first-stage ground spikes sit entirely on visible ground', () => {
  const ground = JOURNEY.platforms.filter((platform) => platform.kind === 'ground');
  for (const spikes of JOURNEY.hazards.filter((hazard) => hazard.type === 'spikes' && hazard.y >= 480)) {
    assert.ok(ground.some((platform) => platform.x <= spikes.x
      && platform.x + platform.width >= spikes.x + spikes.width), spikes.id);
  }
});

test('first-stage energy and hearts never overlap a damaging hazard', () => {
  const damaging = JOURNEY.hazards.filter((hazard) => !['collapse', 'wind'].includes(hazard.type));
  for (const pickup of [...JOURNEY.energy, ...JOURNEY.heartPickups]) {
    const hits = damaging.filter((hazard) => overlap(pickup, {
      ...hazard,
      y: hazard.type === 'constructionBox' ? hazard.groundY : hazard.y,
    }));
    assert.deepEqual(hits.map((hazard) => hazard.id), [], pickup.id);
  }
});
