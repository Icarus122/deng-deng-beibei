const GROUND_Y = 510;

// Hand-authored beats: every region introduces pressure, offers a breather,
// and then ramps up again instead of repeating a procedural gap pattern.
const groundBeats = [
  { id: 'gate-teach', x: 0, width: 1760 }, { id: 'gate-gap', x: 1830, width: 620 }, { id: 'gate-pressure', x: 2520, width: 700 }, { id: 'gate-breather', x: 3290, width: 540 }, { id: 'gate-finale', x: 3900, width: 900 },
  { id: 'court-arrival', x: 4800, width: 570 }, { id: 'court-bounce', x: 5440, width: 480 }, { id: 'court-dribble', x: 6000, width: 650 }, { id: 'court-pressure', x: 6730, width: 520 }, { id: 'court-breather', x: 7330, width: 620 }, { id: 'court-finale', x: 8030, width: 1570 },
  { id: 'ginkgo-arrival', x: 9600, width: 540 }, { id: 'ginkgo-leaves', x: 10210, width: 500 }, { id: 'ginkgo-steps', x: 10790, width: 610 }, { id: 'ginkgo-pressure', x: 11480, width: 460 }, { id: 'ginkgo-breather', x: 12010, width: 710 }, { id: 'ginkgo-finale', x: 12800, width: 1600 },
  { id: 'lake-arrival', x: 14400, width: 500 }, { id: 'lake-crane', x: 14980, width: 470 }, { id: 'lake-pressure', x: 15530, width: 520 }, { id: 'lake-breather', x: 16130, width: 680 }, { id: 'lake-spring', x: 16890, width: 470 }, { id: 'lake-finale', x: 17440, width: 1760 },
  { id: 'bridge-arrival', x: 19200, width: 560 }, { id: 'bridge-windup', x: 19840, width: 470 }, { id: 'bridge-pressure', x: 20390, width: 540 }, { id: 'bridge-breather', x: 21010, width: 660 }, { id: 'bridge-sprint', x: 21750, width: 520 }, { id: 'bridge-catch', x: 22350, width: 1650 },
].map((beat) => ({ ...beat, y: GROUND_Y, height: 30 }));

const highRoutes = [
  { id: 'gate-route-1', route: 'gate-1', x: 820, y: 456, width: 170, boost: 190 }, { id: 'gate-route-2', route: 'gate-1', x: 940, y: 430, width: 155, boost: 190 }, { id: 'gate-route-3', route: 'gate-1', x: 1050, y: 404, width: 155, boost: 190 }, { id: 'gate-route-4', route: 'gate-1', x: 1160, y: 430, width: 155, boost: 190 }, { id: 'gate-route-5', route: 'gate-1', x: 1270, y: 456, width: 175, boost: 190 },
  { id: 'gate-route-6', route: 'gate-2', x: 2710, y: 456, width: 165, boost: 190 }, { id: 'gate-route-7', route: 'gate-2', x: 2825, y: 430, width: 150, boost: 190 }, { id: 'gate-route-8', route: 'gate-2', x: 2930, y: 404, width: 150, boost: 190 }, { id: 'gate-route-9', route: 'gate-2', x: 3035, y: 430, width: 150, boost: 190 }, { id: 'gate-route-10', route: 'gate-2', x: 3140, y: 456, width: 170, boost: 190 },
  { id: 'court-route-1', route: 'court-1', x: 5260, y: 456, width: 165, boost: 190 }, { id: 'court-route-2', route: 'court-1', x: 5375, y: 430, width: 150, boost: 190 }, { id: 'court-route-3', route: 'court-1', x: 5480, y: 404, width: 150, boost: 190 }, { id: 'court-route-4', route: 'court-1', x: 5585, y: 430, width: 150, boost: 190 }, { id: 'court-route-5', route: 'court-1', x: 5690, y: 456, width: 170, boost: 190 },
  { id: 'court-route-6', route: 'court-2', x: 7390, y: 456, width: 165, boost: 190 }, { id: 'court-route-7', route: 'court-2', x: 7505, y: 430, width: 150, boost: 190 }, { id: 'court-route-8', route: 'court-2', x: 7610, y: 404, width: 150, boost: 190 }, { id: 'court-route-9', route: 'court-2', x: 7715, y: 430, width: 150, boost: 190 }, { id: 'court-route-10', route: 'court-2', x: 7820, y: 456, width: 170, boost: 190 },
  { id: 'ginkgo-route-1', route: 'ginkgo-1', x: 10120, y: 456, width: 165, boost: 190 }, { id: 'ginkgo-route-2', route: 'ginkgo-1', x: 10235, y: 430, width: 150, boost: 190 }, { id: 'ginkgo-route-3', route: 'ginkgo-1', x: 10340, y: 404, width: 150, boost: 190 }, { id: 'ginkgo-route-4', route: 'ginkgo-1', x: 10445, y: 430, width: 150, boost: 190 }, { id: 'ginkgo-route-5', route: 'ginkgo-1', x: 10550, y: 456, width: 170, boost: 190 },
  { id: 'ginkgo-route-6', route: 'ginkgo-2', x: 12910, y: 456, width: 165, boost: 190 }, { id: 'ginkgo-route-7', route: 'ginkgo-2', x: 13025, y: 430, width: 150, boost: 190 }, { id: 'ginkgo-route-8', route: 'ginkgo-2', x: 13130, y: 404, width: 150, boost: 190 }, { id: 'ginkgo-route-9', route: 'ginkgo-2', x: 13235, y: 430, width: 150, boost: 190 }, { id: 'ginkgo-route-10', route: 'ginkgo-2', x: 13340, y: 456, width: 170, boost: 190 },
  { id: 'lake-route-1', route: 'lake-1', x: 15070, y: 456, width: 165, boost: 190 }, { id: 'lake-route-2', route: 'lake-1', x: 15185, y: 430, width: 150, boost: 190 }, { id: 'lake-route-3', route: 'lake-1', x: 15290, y: 404, width: 150, boost: 190 }, { id: 'lake-route-4', route: 'lake-1', x: 15395, y: 430, width: 150, boost: 190 }, { id: 'lake-route-5', route: 'lake-1', x: 15500, y: 456, width: 170, boost: 190 },
  { id: 'lake-route-6', route: 'lake-2', x: 17340, y: 456, width: 165, boost: 190 }, { id: 'lake-route-7', route: 'lake-2', x: 17455, y: 430, width: 150, boost: 190 }, { id: 'lake-route-8', route: 'lake-2', x: 17560, y: 404, width: 150, boost: 190 }, { id: 'lake-route-9', route: 'lake-2', x: 17665, y: 430, width: 150, boost: 190 }, { id: 'lake-route-10', route: 'lake-2', x: 17770, y: 456, width: 170, boost: 190 },
  { id: 'bridge-route-1', route: 'bridge-1', x: 20020, y: 456, width: 165, boost: 190 }, { id: 'bridge-route-2', route: 'bridge-1', x: 20135, y: 430, width: 150, boost: 190 }, { id: 'bridge-route-3', route: 'bridge-1', x: 20240, y: 404, width: 150, boost: 190 }, { id: 'bridge-route-4', route: 'bridge-1', x: 20345, y: 430, width: 150, boost: 190 }, { id: 'bridge-route-5', route: 'bridge-1', x: 20450, y: 456, width: 170, boost: 190 },
  { id: 'bridge-route-6', route: 'bridge-2', x: 22000, y: 456, width: 165, boost: 190 }, { id: 'bridge-route-7', route: 'bridge-2', x: 22115, y: 430, width: 150, boost: 190 }, { id: 'bridge-route-8', route: 'bridge-2', x: 22220, y: 404, width: 150, boost: 190 }, { id: 'bridge-route-9', route: 'bridge-2', x: 22325, y: 430, width: 150, boost: 190 }, { id: 'bridge-route-10', route: 'bridge-2', x: 22430, y: 456, width: 170, boost: 190 },
];

const regions = [
  { id: 'gate', name: '校园入口', start: 0, end: 4800, palette: 'morning', landmark: 'gate', foreground: 'flowerbeds', interaction: 'surprise' },
  { id: 'court', name: '篮球场', start: 4800, end: 9600, palette: 'sports', landmark: 'hoop', foreground: 'bleachers', interaction: 'basketball' },
  { id: 'ginkgo', name: '银杏林路', start: 9600, end: 14400, palette: 'golden', landmark: 'bench', foreground: 'leaves', interaction: 'coins' },
  { id: 'lakeside', name: '湖畔施工区', start: 14400, end: 19200, palette: 'lake', landmark: 'crane', foreground: 'water', interaction: 'spring' },
  { id: 'bridge', name: '黄昏天桥', start: 19200, end: 24000, palette: 'sunset', landmark: 'city', foreground: 'lamps', interaction: 'wind' },
];

const pickups = [
  { id: 'coin-1', type: 'coin', x: 1200, y: 468, width: 20, height: 24 },
  { id: 'coin-2', type: 'coin', x: 2100, y: 430, width: 20, height: 24 },
  { id: 'coin-3', type: 'coin', x: 5200, y: 468, width: 20, height: 24 },
  { id: 'coin-4', type: 'coin', x: 7500, y: 430, width: 20, height: 24 },
  { id: 'coin-5', type: 'coin', x: 10100, y: 468, width: 20, height: 24 },
  { id: 'coin-6', type: 'coin', x: 12500, y: 430, width: 20, height: 24 },
  { id: 'coin-7', type: 'coin', x: 15100, y: 468, width: 20, height: 24 },
  { id: 'coin-8', type: 'coin', x: 17600, y: 430, width: 20, height: 24 },
  { id: 'coin-9', type: 'coin', x: 20200, y: 468, width: 20, height: 24 },
  { id: 'coin-10', type: 'coin', x: 22100, y: 430, width: 20, height: 24 },
  { id: 'energy-1', type: 'energy', x: 4100, y: 468, width: 22, height: 22 },
  { id: 'energy-2', type: 'energy', x: 8900, y: 468, width: 22, height: 22 },
  { id: 'energy-3', type: 'energy', x: 13700, y: 468, width: 22, height: 22 },
  { id: 'energy-4', type: 'energy', x: 18500, y: 468, width: 22, height: 22 },
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
    { id: 'blocker-court', type: 'blocker', district: 'court', x: 5600, y: 448, width: 36, height: 62, motion: { range: 92, period: 1800 } },
    { id: 'patrol-court', type: 'patrol', district: 'court', x: 7900, y: 474, width: 30, height: 36, motion: { range: 74, period: 1300 } },
    { id: 'collapse-ginkgo', type: 'collapse', district: 'ginkgo', x: 11620, y: 448, width: 100, height: 18 },
    { id: 'box-ginkgo', type: 'constructionBox', district: 'ginkgo', x: 13620, y: 235, startY: 235, groundY: 466, width: 38, height: 44, period: 3000, warningMs: 820 },
    { id: 'blocker-lake', type: 'blocker', district: 'lakeside', x: 15420, y: 448, width: 36, height: 62, motion: { range: 106, period: 1900 } },
    { id: 'patrol-lake', type: 'patrol', district: 'lakeside', x: 17620, y: 474, width: 30, height: 36, motion: { range: 88, period: 1500 } },
    { id: 'blocker-bridge', type: 'blocker', district: 'bridge', x: 19920, y: 448, width: 36, height: 62, motion: { range: 96, period: 1700 } },
    { id: 'patrol-bridge', type: 'patrol', district: 'bridge', x: 22320, y: 474, width: 30, height: 36, motion: { range: 72, period: 1200 } },
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
    { id: 'wind-1', type: 'wind', x: 21600, y: 360, width: 280, height: 150 },
    { id: 'banana-2', type: 'banana', x: 3900, y: 490, width: 24, height: 16 },
    { id: 'barrier-2', type: 'barrier', x: 5750, y: 470, width: 36, height: 40 },
    { id: 'surprise-3', type: 'surprise', x: 7100, y: 400, width: 30, height: 30 },
    { id: 'banana-3', type: 'banana', x: 9600, y: 490, width: 24, height: 16 },
    { id: 'bookbag-2', type: 'bookbag', x: 11800, y: 478, width: 28, height: 32 },
    { id: 'spring-3', type: 'spring', x: 14650, y: 486, width: 34, height: 24 },
    { id: 'barrier-3', type: 'barrier', x: 19000, y: 470, width: 36, height: 40 },
    { id: 'banana-4', type: 'banana', x: 22600, y: 490, width: 24, height: 16 },
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
