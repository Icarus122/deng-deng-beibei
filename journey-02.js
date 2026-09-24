// The second story stage is authored separately from the five practice slices.
// Its lower promenade is always passable; the upper cargo route carries more
// energy, while the basketball switch opens an optional connecting platform.
const ground = [
  [0, 2600, 'bridgehead'], [2680, 1900, 'cargo'], [4690, 1800, 'terraces'],
  [6580, 2550, 'square'], [9240, 1800, 'clock-entry'],
  [11170, 2060, 'loading'], [13350, 5150, 'finish'],
].map(([x, width, name]) => ({
  id: `river-ground-${name}`, kind: 'ground', material: x < 9000 ? 'riverside' : 'clocktower',
  x, y: 510, width, height: 30,
}));

const upper = [
  [1900, 410, 340, 'intro'], [2260, 410, 340, 'intro-moving'],
  [3470, 420, 320, 'cargo-1'], [3810, 420, 350, 'cargo-2'],
  [4700, 410, 330, 'terrace-1'], [5050, 410, 330, 'terrace-moving'],
  [5400, 410, 330, 'terrace-2'], [5750, 410, 270, 'switch-bridge'],
  [6040, 410, 320, 'terrace-exit'],
  [9560, 405, 350, 'tower-1'], [9930, 405, 330, 'tower-moving'],
  [10280, 405, 330, 'tower-crumble'], [10630, 405, 350, 'tower-exit'],
  [11900, 410, 360, 'loading-1'], [12280, 410, 340, 'loading-moving'],
  [12640, 410, 350, 'loading-2'], [13950, 420, 370, 'approach-1'],
  [14340, 420, 380, 'approach-2'],
].map(([x, y, width, name]) => ({
  id: `river-${name}`, kind: 'oneWay', route: `river-${name === 'switch-bridge' ? 'terrace' : name.split('-')[0]}`,
  oneWay: true, oneWayGroup: `river-${name === 'switch-bridge' ? 'terrace' : name.split('-')[0]}`, material: x < 9000 ? 'riverside' : 'clocktower',
  x, y, width, height: 22, boost: 190,
  ...(name.includes('moving') ? { motion: { axis: 'x', range: 18, period: 2400 } } : {}),
  ...(name === 'tower-crumble' ? { collapse: true } : {}),
  ...(name === 'switch-bridge' ? { requiresSwitch: 'river-switch-1' } : {}),
}));

const regions = [
  { id: 'riverside', name: '沿河旧街', start: 0, end: 9000, palette: 'sunset', landmark: 'bridge', foreground: 'water' },
  { id: 'clocktower', name: '钟楼街区', start: 9000, end: 18500, palette: 'sunset', landmark: 'city', foreground: 'lamps' },
];

const energyPositions = [420, 1650, 3150, 4930, 5540, 7040, 8410, 10080, 11370, 12440, 14390, 15380, 16280, 17080];
const energy = energyPositions.map((x, index) => ({
  id: `river-energy-${index + 1}`, type: 'energy', x,
  y: [4930, 5540, 10080, 12440, 14390].includes(x) ? (x === 10080 ? 373 : x === 14390 ? 388 : 378) : 468,
  width: 22, height: 22,
}));
const coinPositions = [700, 940, 2040, 2310, 2800, 3540, 3840, 4750, 5120, 5460, 5850, 6100,
  7160, 7520, 7870, 8580, 9620, 10010, 10360, 10700, 11620, 12040,
  12410, 12700, 13500, 14020, 14430, 14950, 15540, 16040, 16600, 17200];
const upperCoinXs = new Set([2040, 2310, 3540, 3840, 4750, 5120, 5460, 5850, 6100,
  9620, 10010, 10360, 10700, 12040, 12410, 12700, 14020, 14430]);
const coins = coinPositions.map((x, index) => ({
  id: `river-coin-${index + 1}`, type: 'coin', x,
  y: upperCoinXs.has(x) ? (x >= 9500 && x <= 11000 ? 381 : x >= 13900 ? 396 : x >= 3400 && x < 4200 ? 396 : 386) : 472,
  width: 20, height: 24,
}));
const heartPickups = [
  { id: 'river-heart-1', x: 7670, y: 470 },
  { id: 'river-heart-2', x: 10820, y: 379 },
  { id: 'river-heart-3', x: 14600, y: 394 },
].map((heart) => ({ ...heart, type: 'heart', width: 24, height: 24 }));

export const JOURNEY_02 = {
  id: 'journey-02', name: '沿河旧街 · 钟楼下等我', worldEnd: 18500, finishX: 18000,
  maxDistance: 560, pursuerSpeed: 136, regions, districts: regions,
  platforms: [...ground, ...upper],
  shortcutNodes: [
    { start: 1820, end: 2630, route: 'river-intro' },
    { start: 3400, end: 4200, route: 'river-cargo' },
    { start: 4630, end: 6400, route: 'river-terrace' },
    { start: 9480, end: 11030, route: 'river-tower' },
    { start: 11820, end: 13040, route: 'river-loading' },
    { start: 13880, end: 14800, route: 'river-approach' },
  ],
  switches: [{ id: 'river-switch-1', x: 5500, y: 438, width: 44, height: 62 }],
  hazards: [
    { id: 'river-patrol-1', type: 'patrol', x: 3560, y: 474, width: 30, height: 36, motion: { range: 46, period: 1800 } },
    { id: 'river-blocker-1', type: 'blocker', x: 6100, y: 448, width: 36, height: 62, motion: { range: 65, period: 1950 } },
    { id: 'river-spikes-1', type: 'spikes', x: 7900, y: 482, width: 100, height: 28 },
    { id: 'river-tower-crumble', type: 'collapse', x: 10280, y: 405, width: 330, height: 22 },
    { id: 'river-box-1', type: 'constructionBox', x: 11650, y: 220, startY: 220, groundY: 466, width: 38, height: 44, period: 2800, warningMs: 850 },
    { id: 'river-blocker-2', type: 'blocker', x: 12780, y: 448, width: 36, height: 62, motion: { range: 48, period: 2050 } },
    { id: 'river-patrol-2', type: 'patrol', x: 14520, y: 474, width: 30, height: 36, motion: { range: 50, period: 1750 } },
  ],
  obstacles: [
    { id: 'river-spring-1', type: 'spring', x: 1870, y: 486, width: 34, height: 24 },
    { id: 'river-ball-1', type: 'basketball', x: 5230, y: 482, width: 22, height: 22, switchId: 'river-switch-1' },
    { id: 'river-speed-1', type: 'speedPad', x: 6940, y: 492, width: 96, height: 18 },
    { id: 'river-banana-1', type: 'banana', x: 8350, y: 490, width: 24, height: 16 },
    { id: 'river-bookbag-1', type: 'bookbag', x: 9810, y: 478, width: 28, height: 32 },
    { id: 'river-spring-2', type: 'spring', x: 11610, y: 486, width: 34, height: 24 },
    { id: 'river-ball-2', type: 'basketball', x: 13380, y: 482, width: 22, height: 22 },
    { id: 'river-speed-final', type: 'speedPad', x: 15840, y: 492, width: 96, height: 18 },
    { id: 'river-ball-final', type: 'basketball', x: 16900, y: 482, width: 22, height: 22 },
  ],
  pickups: [...energy, ...coins, ...heartPickups], energy, coins, heartPickups,
  checkpoints: [
    { id: 'river-checkpoint-1', x: 4240, respawnX: 4270 },
    { id: 'river-checkpoint-2', x: 8440, respawnX: 8470 },
    { id: 'river-checkpoint-3', x: 11400, respawnX: 11430 },
    { id: 'river-checkpoint-4', x: 15120, respawnX: 15150 },
  ],
};
