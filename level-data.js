const GROUND_Y = 510;

// Every district follows a hand-authored Mario-style phrase: teach, ask for a
// small jump, add pressure, offer a safe high-road choice, then close harder.
// These are data, not a random generator: changing a row changes one whole
// district while keeping its 4,800px visual background aligned.
const beatPlans = [
  { id: 'gate', start: 0, gaps: [55, 90, 130, 150], lengths: [1700, 420, 440, 1390, 425] },
  { id: 'court', start: 4800, gaps: [60, 95, 135, 153], lengths: [1700, 420, 440, 1390, 407] },
  { id: 'ginkgo', start: 9600, gaps: [60, 95, 135, 155], lengths: [1700, 420, 440, 1390, 405] },
  { id: 'lake', start: 14400, gaps: [65, 100, 140, 158], lengths: [1700, 420, 440, 1390, 387] },
  { id: 'bridge', start: 19200, gaps: [65, 100, 140, 160], lengths: [1700, 420, 440, 1390, 385] },
];
const beatKinds = ['tutorial', 'regular', 'pressure', 'breather', 'climax'];

const groundBeats = beatPlans.flatMap((plan) => {
  let x = plan.start;
  return plan.lengths.map((width, index) => {
    const beat = { id: `${plan.id}-${beatKinds[index]}`, x, width, y: GROUND_Y, height: 30 };
    x += width + (plan.gaps[index] ?? 0);
    return beat;
  });
});

function getBreatherStart(plan) {
  return plan.start + plan.lengths[0] + plan.gaps[0] + plan.lengths[1] + plan.gaps[1] + plan.lengths[2] + plan.gaps[2];
}

// Five optional technical routes live entirely above each district's safe
// breather.  They are deliberately not slopes: Beibei must jump onto them,
// then earns the 190px/s boost and high-route coin line.
const highRoutes = beatPlans.flatMap((plan) => {
  const route = `${plan.id}-route`;
  const prefix = route;
  const x = getBreatherStart(plan) + 100;
  return [
    { id: `${prefix}-s1`, route, x, y: 478, width: 90, height: 18, boost: 190 },
    { id: `${prefix}-s2`, route, x: x + 140, y: 446, width: 90, height: 18, boost: 190 },
    { id: `${prefix}-s3`, route, x: x + 280, y: 414, width: 90, height: 22, boost: 190 },
    { id: `${prefix}-d1`, route, x: x + 420, y: 414, width: 170, height: 22, boost: 190 },
    { id: `${prefix}-d2`, route, x: x + 670, y: 414, width: 170, height: 22, boost: 190 },
    { id: `${prefix}-d3`, route, x: x + 960, y: 414, width: 170, height: 22, boost: 190 },
  ];
});

const regions = [
  { id: 'gate', name: '校园入口', start: 0, end: 4800, palette: 'morning', landmark: 'gate', foreground: 'flowerbeds', interaction: 'surprise' },
  { id: 'court', name: '篮球场', start: 4800, end: 9600, palette: 'sports', landmark: 'hoop', foreground: 'bleachers', interaction: 'basketball' },
  { id: 'ginkgo', name: '银杏林路', start: 9600, end: 14400, palette: 'golden', landmark: 'bench', foreground: 'leaves', interaction: 'coins' },
  { id: 'lakeside', name: '湖畔施工区', start: 14400, end: 19200, palette: 'lake', landmark: 'crane', foreground: 'water', interaction: 'spring' },
  { id: 'bridge', name: '黄昏天桥', start: 19200, end: 24000, palette: 'sunset', landmark: 'city', foreground: 'lamps', interaction: 'wind' },
];

const routeCoins = beatPlans.flatMap((plan, routeIndex) => {
  const x = getBreatherStart(plan) + 100;
  return [
    { id: `coin-${routeIndex * 3 + 1}`, type: 'coin', x: x + 485, y: 390, width: 20, height: 24 },
    { id: `coin-${routeIndex * 3 + 2}`, type: 'coin', x: x + 735, y: 390, width: 20, height: 24 },
    { id: `coin-${routeIndex * 3 + 3}`, type: 'coin', x: x + 1035, y: 390, width: 20, height: 24 },
  ];
});

// Energy remains on the ground: it is the resource that lets a player choose
// to sprint across a pressure beat, while high-road coins reward the harder
// route without making ordinary progress impossible.
const groundEnergy = [
  { id: 'energy-0', x: 1880 }, { id: 'energy-1', x: 4010 },
  { id: 'energy-2', x: 6750 }, { id: 'energy-3', x: 8800 },
  { id: 'energy-4', x: 12200 }, { id: 'energy-5', x: 13600 },
  { id: 'energy-6', x: 18400 }, { id: 'energy-7', x: 19900 }, { id: 'energy-8', x: 21800 }, { id: 'energy-9', x: 22900 },
  { id: 'energy-10', x: 21060 },
].map((energy) => ({ ...energy, type: 'energy', y: 468, width: 22, height: 22 }));

const pickups = [...routeCoins, ...groundEnergy];

const checkpoints = beatPlans.flatMap((plan) => {
  const regularStart = plan.start + plan.lengths[0] + plan.gaps[0];
  const breatherStart = getBreatherStart(plan);
  return [regularStart, breatherStart].map((x, index) => ({
    id: `${plan.id}-${index === 0 ? 'regular' : 'breather'}-checkpoint`,
    x: x + 20,
    respawnX: x + 8,
  }));
});

export const JOURNEY = {
  name: '等到天桥尽头',
  worldEnd: 24000,
  finishX: 23500,
  maxDistance: 560,
  pursuerSpeed: 136,
  regions,
  districts: regions,
  platforms: [
    ...groundBeats,
    ...highRoutes,
    { id: 'collapse-gate', x: 1560, y: 448, width: 96, height: 18, collapse: true },
    { id: 'collapse-ginkgo', x: 11620, y: 448, width: 100, height: 18, collapse: true },
  ],
  // Meng keeps to his own ground route. The retired node list used platform IDs
  // from an older level layout and could never resolve against today's routes.
  shortcutNodes: [],
  hazards: [
    { id: 'collapse-gate', type: 'collapse', district: 'gate', x: 1560, y: 448, width: 96, height: 18 },
    { id: 'box-gate', type: 'constructionBox', district: 'gate', x: 3180, y: 220, startY: 220, groundY: 466, width: 38, height: 44, period: 2800, warningMs: 760 },
    { id: 'patrol-gate', type: 'patrol', district: 'gate', x: 4060, y: 474, width: 30, height: 36, motion: { range: 54, period: 1600 } },
    { id: 'blocker-court', type: 'blocker', district: 'court', x: 5600, y: 448, width: 36, height: 62, motion: { range: 92, period: 1800 } },
    { id: 'patrol-court', type: 'patrol', district: 'court', x: 7900, y: 474, width: 30, height: 36, motion: { range: 74, period: 1300 } },
    { id: 'collapse-court', type: 'collapse', district: 'court', x: 8780, y: 448, width: 96, height: 18 },
    { id: 'collapse-ginkgo', type: 'collapse', district: 'ginkgo', x: 11620, y: 448, width: 100, height: 18 },
    { id: 'box-ginkgo', type: 'constructionBox', district: 'ginkgo', x: 13620, y: 235, startY: 235, groundY: 466, width: 38, height: 44, period: 3000, warningMs: 820 },
    { id: 'blocker-ginkgo', type: 'blocker', district: 'ginkgo', x: 13040, y: 448, width: 36, height: 62, motion: { range: 82, period: 1500 } },
    { id: 'blocker-lake', type: 'blocker', district: 'lakeside', x: 15420, y: 448, width: 36, height: 62, motion: { range: 106, period: 1900 } },
    { id: 'patrol-lake', type: 'patrol', district: 'lakeside', x: 17620, y: 474, width: 30, height: 36, motion: { range: 88, period: 1500 } },
    { id: 'box-lake', type: 'constructionBox', district: 'lakeside', x: 18440, y: 210, startY: 210, groundY: 466, width: 38, height: 44, period: 2400, warningMs: 650 },
    { id: 'blocker-bridge', type: 'blocker', district: 'bridge', x: 19920, y: 448, width: 36, height: 62, motion: { range: 96, period: 1700 } },
    { id: 'patrol-bridge', type: 'patrol', district: 'bridge', x: 22320, y: 474, width: 30, height: 36, motion: { range: 72, period: 1200 } },
    { id: 'collapse-bridge', type: 'collapse', district: 'bridge', x: 22980, y: 448, width: 100, height: 18 },
    { id: 'box-bridge', type: 'constructionBox', district: 'bridge', x: 23360, y: 210, startY: 210, groundY: 466, width: 38, height: 44, period: 2200, warningMs: 580 },
  ],
  obstacles: [
    { id: 'surprise-1', type: 'surprise', x: 2700, y: 400, width: 30, height: 30 },
    { id: 'spring-1', type: 'spring', x: 4600, y: 486, width: 34, height: 24 },
    { id: 'basketball-1', type: 'basketball', x: 6800, y: 482, width: 22, height: 22 },
    { id: 'bookbag-1', type: 'bookbag', x: 8200, y: 478, width: 28, height: 32 },
    { id: 'banana-1', type: 'banana', x: 11100, y: 490, width: 24, height: 16 },
    { id: 'surprise-2', type: 'surprise', x: 13100, y: 400, width: 30, height: 30 },
    { id: 'barrier-1', type: 'barrier', x: 16100, y: 470, width: 36, height: 40 },
    { id: 'spring-2', type: 'spring', x: 17800, y: 486, width: 34, height: 24 },
    { id: 'basketball-2', type: 'basketball', x: 20300, y: 482, width: 22, height: 22 },
    { id: 'wind-1', type: 'wind', x: 21150, y: 360, width: 280, height: 150 },
    { id: 'wind-2', type: 'wind', x: 21800, y: 360, width: 320, height: 150 },
    { id: 'wind-3', type: 'wind', x: 22600, y: 360, width: 360, height: 150 },
    { id: 'banana-2', type: 'banana', x: 3900, y: 490, width: 24, height: 16 },
    { id: 'barrier-2', type: 'barrier', x: 5750, y: 470, width: 36, height: 40 },
    { id: 'surprise-3', type: 'surprise', x: 7100, y: 400, width: 30, height: 30 },
    { id: 'banana-3', type: 'banana', x: 9600, y: 490, width: 24, height: 16 },
    { id: 'bookbag-2', type: 'bookbag', x: 11800, y: 478, width: 28, height: 32 },
    { id: 'spring-3', type: 'spring', x: 14650, y: 486, width: 34, height: 24 },
    { id: 'barrier-3', type: 'barrier', x: 19000, y: 470, width: 36, height: 40 },
    { id: 'banana-4', type: 'banana', x: 22600, y: 490, width: 24, height: 16 },
    { id: 'speed-pad-1', type: 'speedPad', x: 3440, y: 492, width: 96, height: 18 },
    { id: 'speed-pad-2', type: 'speedPad', x: 7240, y: 492, width: 96, height: 18 },
    { id: 'speed-pad-3', type: 'speedPad', x: 11900, y: 492, width: 96, height: 18 },
    { id: 'speed-pad-4', type: 'speedPad', x: 16640, y: 492, width: 96, height: 18 },
    { id: 'speed-pad-5', type: 'speedPad', x: 23140, y: 492, width: 96, height: 18 },
  ],
  pickups,
  energy: pickups.filter((pickup) => pickup.type === 'energy'),
  coins: pickups.filter((pickup) => pickup.type === 'coin'),
  checkpoints,
};

export function getRegionAt(regionList, x) {
  return regionList.find((region) => x >= region.start && x < region.end) ?? regionList.at(-1);
}

export function getHighRouteViolations(platforms) {
  const routes = new Map();
  for (const platform of platforms.filter((platform) => platform.route)) {
    const route = routes.get(platform.route) ?? [];
    route.push(platform);
    routes.set(platform.route, route);
  }
  return [...routes.values()].flatMap((route) => route.sort((a, b) => a.x - b.x).flatMap((platform, index) => {
    if (index === 0) return [];
    const previous = route[index - 1];
    const gap = platform.x - (previous.x + previous.width);
    const rise = Math.abs(platform.y - previous.y);
    return gap > 150 || rise > 60 ? [{ route: platform.route, from: previous.id, to: platform.id, gap, rise }] : [];
  }));
}
