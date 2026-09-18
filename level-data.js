const GROUND_Y = 510;

// Hand-authored beats: every region introduces pressure, offers a breather,
// and then ramps up again instead of repeating a procedural gap pattern.
const groundBeats = [
  // Each district: tutorial gap, regular gap, pressure gap, a clear breather,
  // then a real double-jump climax.  The widths are intentionally hand-set.
  { id: 'gate-tutorial', x: 0, width: 1800 }, { id: 'gate-regular', x: 1850, width: 380 }, { id: 'gate-pressure', x: 2340, width: 420 }, { id: 'gate-breather', x: 2920, width: 1240 }, { id: 'gate-climax', x: 4410, width: 390 },
  { id: 'court-tutorial', x: 4800, width: 650 }, { id: 'court-regular', x: 5510, width: 390 }, { id: 'court-pressure', x: 6020, width: 420 }, { id: 'court-breather', x: 6602, width: 1198 }, { id: 'court-climax', x: 8060, width: 1540 },
  { id: 'ginkgo-tutorial', x: 9600, width: 650 }, { id: 'ginkgo-regular', x: 10305, width: 400 }, { id: 'ginkgo-pressure', x: 10825, width: 425 }, { id: 'ginkgo-breather', x: 11435, width: 1205 }, { id: 'ginkgo-climax', x: 12900, width: 1500 },
  { id: 'lake-tutorial', x: 14400, width: 640 }, { id: 'lake-regular', x: 15095, width: 405 }, { id: 'lake-pressure', x: 15620, width: 430 }, { id: 'lake-breather', x: 16230, width: 1210 }, { id: 'lake-climax', x: 17700, width: 1500 },
  { id: 'bridge-tutorial', x: 19200, width: 640 }, { id: 'bridge-regular', x: 19895, width: 410 }, { id: 'bridge-pressure', x: 20425, width: 430 }, { id: 'bridge-breather', x: 21035, width: 1205 }, { id: 'bridge-climax', x: 22500, width: 1500 },
].map((beat) => ({ ...beat, y: GROUND_Y, height: 30 }));

// The route specifications are hand-placed lanes.  Each entry gets two short
// approach ramps and a flat 1,700px express lane, so the reward is sustained
// speed instead of a decorative staircase that cannot actually be traversed.
const highRouteSpecs = [
  ['gate-1', 'gate-route', 520], ['gate-2', 'gate-route-b', 2880],
  ['court-1', 'court-route', 5100], ['court-2', 'court-route-b', 7480],
  ['ginkgo-1', 'ginkgo-route', 9900], ['ginkgo-2', 'ginkgo-route-b', 12120],
  ['lake-1', 'lake-route', 14680], ['lake-2', 'lake-route-b', 16920],
  ['bridge-1', 'bridge-route', 19480], ['bridge-2', 'bridge-route-b', 21620],
];

const highRoutes = highRouteSpecs.flatMap(([route, prefix, x]) => [
  { id: `${prefix}-1`, route, x: x - 220, y: 490, width: 100, height: 18, boost: 190, ramp: true, slope: true },
  { id: `${prefix}-2`, route, x: x - 100, y: 474, width: 100, height: 18, boost: 190, ramp: true, slope: true },
  { id: `${prefix}-3`, route, x, y: 456, width: 420, height: 22, boost: 190 },
  { id: `${prefix}-4`, route, x: x + 440, y: 456, width: 420, height: 22, boost: 190 },
  { id: `${prefix}-5`, route, x: x + 880, y: 456, width: 420, height: 22, boost: 190 },
  { id: `${prefix}-6`, route, x: x + 1320, y: 456, width: 420, height: 22, boost: 190 },
]);

const regions = [
  { id: 'gate', name: '校园入口', start: 0, end: 4800, palette: 'morning', landmark: 'gate', foreground: 'flowerbeds', interaction: 'surprise' },
  { id: 'court', name: '篮球场', start: 4800, end: 9600, palette: 'sports', landmark: 'hoop', foreground: 'bleachers', interaction: 'basketball' },
  { id: 'ginkgo', name: '银杏林路', start: 9600, end: 14400, palette: 'golden', landmark: 'bench', foreground: 'leaves', interaction: 'coins' },
  { id: 'lakeside', name: '湖畔施工区', start: 14400, end: 19200, palette: 'lake', landmark: 'crane', foreground: 'water', interaction: 'spring' },
  { id: 'bridge', name: '黄昏天桥', start: 19200, end: 24000, palette: 'sunset', landmark: 'city', foreground: 'lamps', interaction: 'wind' },
];

const pickups = [
  { id: 'coin-1', type: 'coin', x: 840, y: 430, width: 20, height: 24 },
  { id: 'coin-2', type: 'coin', x: 1200, y: 430, width: 20, height: 24 },
  { id: 'coin-3', type: 'coin', x: 1760, y: 430, width: 20, height: 24 },
  { id: 'coin-4', type: 'coin', x: 3160, y: 430, width: 20, height: 24 },
  { id: 'coin-5', type: 'coin', x: 5600, y: 430, width: 20, height: 24 },
  { id: 'coin-6', type: 'coin', x: 6200, y: 430, width: 20, height: 24 },
  { id: 'coin-7', type: 'coin', x: 10280, y: 430, width: 20, height: 24 },
  { id: 'coin-8', type: 'coin', x: 12600, y: 430, width: 20, height: 24 },
  { id: 'coin-9', type: 'coin', x: 15100, y: 430, width: 20, height: 24 },
  { id: 'coin-10', type: 'coin', x: 19960, y: 430, width: 20, height: 24 },
  { id: 'coin-11', type: 'coin', x: 20500, y: 430, width: 20, height: 24 },
  { id: 'coin-12', type: 'coin', x: 22200, y: 430, width: 20, height: 24 },
  { id: 'energy-0', type: 'energy', x: 1600, y: 430, width: 22, height: 22 },
  { id: 'energy-1', type: 'energy', x: 4100, y: 468, width: 22, height: 22 },
  { id: 'energy-2', type: 'energy', x: 6200, y: 430, width: 22, height: 22 },
  { id: 'energy-3', type: 'energy', x: 12600, y: 430, width: 22, height: 22 },
  { id: 'energy-4', type: 'energy', x: 15100, y: 430, width: 22, height: 22 },
  { id: 'energy-5', type: 'energy', x: 20500, y: 430, width: 22, height: 22 },
  { id: 'energy-6', type: 'energy', x: 22200, y: 430, width: 22, height: 22 },
];

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
  shortcutNodes: [
    { platformId: 'gate-route-1', start: 800, end: 980 }, { platformId: 'gate-route-6', start: 2690, end: 2870 },
    { platformId: 'court-route-1', start: 5240, end: 5420 }, { platformId: 'court-route-6', start: 7370, end: 7550 },
    { platformId: 'ginkgo-route-1', start: 10100, end: 10280 }, { platformId: 'ginkgo-route-6', start: 12890, end: 13070 },
    { platformId: 'lake-route-1', start: 15050, end: 15230 }, { platformId: 'lake-route-6', start: 17320, end: 17500 },
    { platformId: 'bridge-route-1', start: 20000, end: 20180 }, { platformId: 'bridge-route-6', start: 21980, end: 22160 },
  ],
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
    { id: 'basketball-1', type: 'basketball', x: 6500, y: 482, width: 22, height: 22 },
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
  checkpoints: [
    { x: 3600, respawnX: 3500 }, { x: 7200, respawnX: 7100 }, { x: 10800, respawnX: 10700 },
    { x: 14400, respawnX: 14300 }, { x: 18000, respawnX: 17900 }, { x: 21600, respawnX: 21500 },
  ],
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
