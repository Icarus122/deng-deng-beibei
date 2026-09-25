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
  { id: 'bridge', start: 19200, gaps: [65, 100, 140, 0], lengths: [1700, 420, 440, 1390, 545] },
];
const beatKinds = ['tutorial', 'regular', 'pressure', 'breather', 'climax'];

const groundBeats = beatPlans.flatMap((plan) => {
  let x = plan.start;
  return plan.lengths.map((width, index) => {
    const beat = {
      id: `${plan.id}-${beatKinds[index]}`,
      kind: 'ground',
      material: plan.id === 'lake' ? 'lakeside' : plan.id,
      x,
      width,
      y: GROUND_Y,
      height: 30,
    };
    x += width + (plan.gaps[index] ?? 0);
    return beat;
  });
});

function getBreatherStart(plan) {
  return plan.start + plan.lengths[0] + plan.gaps[0] + plan.lengths[1] + plan.gaps[1] + plan.lengths[2] + plan.gaps[2];
}

// Each district has a hand-shaped two-tier route. The jump pattern, height,
// moving platforms, rewards and upper-route threat change with its theme.
const highRoutePlans = [
  {
    district: 'gate', route: 'gate-route', material: 'gate',
    start: getBreatherStart(beatPlans[0]) + 100, lowerY: 410, upperY: 310,
    energyOffset: 690, heartOffset: 1030, coinOffsets: [500, 700, 870],
    platforms: [
      { id: 'lower-1', offset: 0, y: 410, width: 210, tier: 'lower' },
      { id: 'lower-moving', offset: 230, y: 410, width: 200, tier: 'lower', motion: { axis: 'x', range: 14, period: 2600 } },
      { id: 'upper-1', offset: 440, y: 310, width: 170, tier: 'upper' },
      { id: 'lower-2', offset: 455, y: 410, width: 220, tier: 'lower' },
      { id: 'upper-moving', offset: 625, y: 310, width: 180, tier: 'upper', motion: { axis: 'x', range: 18, period: 2200 } },
      { id: 'upper-crumble', offset: 810, y: 310, width: 170, tier: 'upper', collapse: true },
      { id: 'upper-exit', offset: 985, y: 310, width: 190, tier: 'upper' },
      { id: 'lower-3', offset: 960, y: 410, width: 235, tier: 'lower' },
    ],
    hazard: { id: 'spikes-gate-upper', type: 'spikes', offset: 755, y: 280, width: 72, height: 30 },
  },
  {
    district: 'court', route: 'court-route', material: 'court',
    start: getBreatherStart(beatPlans[1]) + 100, lowerY: 425, upperY: 320,
    energyOffset: 720, heartOffset: 1030, coinOffsets: [500, 710, 875],
    platforms: [
      { id: 'lower-1', offset: 0, y: 425, width: 205, tier: 'lower' },
      { id: 'lower-moving', offset: 230, y: 425, width: 205, tier: 'lower', motion: { axis: 'x', range: 22, period: 2200 } },
      { id: 'upper-1', offset: 455, y: 320, width: 160, tier: 'upper' },
      { id: 'lower-2', offset: 470, y: 425, width: 210, tier: 'lower' },
      { id: 'upper-moving', offset: 620, y: 320, width: 200, tier: 'upper', motion: { axis: 'x', range: 20, period: 1900 } },
      { id: 'upper-crumble', offset: 825, y: 320, width: 160, tier: 'upper', collapse: true },
      { id: 'upper-exit', offset: 990, y: 320, width: 210, tier: 'upper' },
      { id: 'lower-3', offset: 965, y: 425, width: 235, tier: 'lower' },
    ],
    hazard: { id: 'patrol-court-upper', type: 'patrol', offset: 780, y: 284, width: 30, height: 36, motion: { range: 38, period: 1500 } },
  },
  {
    district: 'ginkgo', route: 'ginkgo-route', material: 'ginkgo',
    start: getBreatherStart(beatPlans[2]) + 100, lowerY: 405, upperY: 305,
    energyOffset: 710, heartOffset: 1040, coinOffsets: [505, 720, 875],
    platforms: [
      { id: 'lower-1', offset: 0, y: 405, width: 235, tier: 'lower' },
      { id: 'lower-moving', offset: 255, y: 405, width: 185, tier: 'lower', motion: { axis: 'x', range: 16, period: 2400 } },
      { id: 'upper-1', offset: 450, y: 305, width: 195, tier: 'upper' },
      { id: 'lower-2', offset: 470, y: 405, width: 220, tier: 'lower' },
      { id: 'upper-moving', offset: 650, y: 305, width: 180, tier: 'upper', motion: { axis: 'x', range: 24, period: 1800 } },
      { id: 'upper-crumble', offset: 835, y: 305, width: 185, tier: 'upper', collapse: true },
      { id: 'upper-exit', offset: 1025, y: 305, width: 180, tier: 'upper' },
      { id: 'lower-3', offset: 1005, y: 405, width: 225, tier: 'lower' },
    ],
    hazard: { id: 'spikes-ginkgo-upper', type: 'spikes', offset: 740, y: 275, width: 76, height: 30 },
  },
  {
    district: 'lakeside', route: 'lakeside-route', material: 'lakeside',
    start: getBreatherStart(beatPlans[3]) + 100, lowerY: 420, upperY: 315,
    energyOffset: 730, heartOffset: 1040, coinOffsets: [535, 745, 910],
    platforms: [
      { id: 'lower-1', offset: 0, y: 420, width: 220, tier: 'lower' },
      { id: 'lower-moving', offset: 240, y: 420, width: 230, tier: 'lower', motion: { axis: 'x', range: 26, period: 2100 } },
      { id: 'upper-1', offset: 480, y: 315, width: 170, tier: 'upper' },
      { id: 'lower-2', offset: 500, y: 420, width: 200, tier: 'lower' },
      { id: 'upper-moving', offset: 675, y: 315, width: 180, tier: 'upper', motion: { axis: 'x', range: 28, period: 1700 } },
      { id: 'upper-crumble', offset: 860, y: 315, width: 160, tier: 'upper', collapse: true },
      { id: 'upper-exit', offset: 1025, y: 315, width: 200, tier: 'upper' },
      { id: 'lower-3', offset: 1010, y: 420, width: 220, tier: 'lower' },
    ],
    hazard: { id: 'wind-lakeside-upper', type: 'wind', offset: 705, y: 230, width: 190, height: 85 },
  },
  {
    district: 'bridge', route: 'bridge-route', material: 'bridge',
    start: getBreatherStart(beatPlans[4]) + 100, lowerY: 410, upperY: 310,
    energyOffset: 700, heartOffset: 1040, coinOffsets: [490, 700, 875],
    platforms: [
      { id: 'lower-1', offset: 0, y: 410, width: 200, tier: 'lower' },
      { id: 'lower-moving', offset: 220, y: 410, width: 200, tier: 'lower', motion: { axis: 'x', range: 24, period: 2000 } },
      { id: 'upper-1', offset: 430, y: 310, width: 180, tier: 'upper' },
      { id: 'lower-2', offset: 450, y: 410, width: 200, tier: 'lower' },
      { id: 'upper-moving', offset: 635, y: 310, width: 180, tier: 'upper', motion: { axis: 'x', range: 30, period: 1600 } },
      { id: 'upper-crumble', offset: 820, y: 310, width: 175, tier: 'upper', collapse: true },
      { id: 'upper-exit', offset: 1000, y: 310, width: 190, tier: 'upper' },
      { id: 'lower-3', offset: 980, y: 410, width: 240, tier: 'lower' },
    ],
    hazard: { id: 'barrier-bridge-upper', type: 'blocker', offset: 765, y: 274, width: 36, height: 36 },
  },
];

const highRoutes = highRoutePlans.flatMap((plan) => plan.platforms.map((segment) => ({
  id: segment.collapse ? `collapse-${plan.district}-upper` : `${plan.route}-${segment.id}`,
  kind: 'oneWay',
  route: plan.route,
  oneWay: true,
  oneWayGroup: `${plan.route}-${segment.tier}`,
  material: plan.material,
  x: plan.start + segment.offset,
  y: segment.y,
  width: segment.width,
  height: 22,
  boost: 190,
  ...(segment.motion ? { motion: segment.motion } : {}),
  ...(segment.collapse ? { collapse: true } : {}),
})));

const bridgeUpperPlatforms = [
  ...[19570, 19775, 19980, 20185, 20390].map((x, index) => ({
    id: `bridge-upper-lower-${index + 1}`, route: 'bridge-upper-route', kind: 'oneWay', oneWay: true,
    oneWayGroup: 'bridge-upper-lower', material: 'bridge', x, y: 410, width: 180, height: 22, boost: 190,
  })),
  ...[20470, 20660, 20850].map((x, index) => ({
    id: `bridge-upper-high-${index + 1}`, route: 'bridge-upper-route', kind: 'oneWay', oneWay: true,
    oneWayGroup: 'bridge-upper-high', material: 'bridge', x, y: 310, width: 170, height: 22, boost: 190,
    ...(index === 1 ? { motion: { axis: 'x', range: 16, period: 2100 } } : {}),
  })),
];

const regions = [
  { id: 'gate', name: '校园入口', start: 0, end: 4800, palette: 'morning', landmark: 'gate', foreground: 'flowerbeds', interaction: 'surprise' },
  { id: 'court', name: '篮球场', start: 4800, end: 9600, palette: 'sports', landmark: 'hoop', foreground: 'bleachers', interaction: 'basketball' },
  { id: 'ginkgo', name: '银杏林路', start: 9600, end: 14400, palette: 'golden', landmark: 'bench', foreground: 'leaves', interaction: 'coins' },
  { id: 'lakeside', name: '湖畔施工区', start: 14400, end: 19200, palette: 'lake', landmark: 'crane', foreground: 'water', interaction: 'spring' },
  { id: 'bridge', name: '黄昏天桥', start: 19200, end: 24000, palette: 'sunset', landmark: 'city', foreground: 'lamps', interaction: 'wind' },
];

const routeCoins = highRoutePlans.flatMap((plan, routeIndex) => plan.coinOffsets.map((offset, coinIndex) => ({
  id: `coin-${routeIndex * 3 + coinIndex + 1}`,
  type: 'coin',
  x: plan.start + offset,
  y: plan.upperY - 24,
  width: 20,
  height: 24,
})));

const bridgeUpperCoins = [
  { id: 'bridge-upper-coin-1', type: 'coin', x: 20490, y: 286, width: 20, height: 24 },
  { id: 'bridge-upper-coin-2', type: 'coin', x: 20690, y: 286, width: 20, height: 24 },
  { id: 'bridge-upper-coin-3', type: 'coin', x: 20900, y: 286, width: 20, height: 24 },
];

const routeEnergy = highRoutePlans.map((plan, index) => ({
  id: `energy-route-${index + 1}`,
  type: 'energy',
  route: plan.route,
  x: plan.start + plan.energyOffset,
  y: plan.upperY - 32,
  width: 22,
  height: 22,
}));

const heartPickups = highRoutePlans.map((plan) => ({
  id: `heart-${plan.district}`,
  type: 'heart',
  route: plan.route,
  x: plan.start + plan.heartOffset,
  y: plan.upperY - 24,
  width: 24,
  height: 24,
  district: plan.district,
}));

// Ground energy supports the ordinary route; the bridge's upper spring path
// also carries a single bonus crystal for the harder late-game route.
const groundEnergy = [
  { id: 'energy-0', x: 1880 }, { id: 'energy-1', x: 3850 },
  { id: 'energy-2', x: 6750 }, { id: 'energy-3', x: 8800 },
  { id: 'energy-4', x: 12200 }, { id: 'energy-5', x: 13460 },
  { id: 'energy-6', x: 18400 }, { id: 'energy-7', x: 19720 }, { id: 'energy-8', x: 21800 }, { id: 'energy-9', x: 22900 },
  { id: 'energy-10', x: 21250 },
].map((energy) => ({ ...energy, type: 'energy', y: 468, width: 22, height: 22 }));

const bridgeUpperEnergy = { id: 'energy-11', type: 'energy', x: 20080, y: 378, width: 22, height: 22 };
const pickups = [...routeCoins, ...bridgeUpperCoins, ...groundEnergy, bridgeUpperEnergy, ...routeEnergy, ...heartPickups];

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
    ...bridgeUpperPlatforms,
    { id: 'collapse-gate', kind: 'oneWay', oneWay: true, oneWayGroup: 'collapse-gate', material: 'gate', x: 1560, y: 448, width: 96, height: 18, collapse: true },
    { id: 'collapse-court', kind: 'oneWay', oneWay: true, oneWayGroup: 'collapse-court', material: 'court', x: 8780, y: 448, width: 96, height: 18, collapse: true },
    { id: 'collapse-ginkgo', kind: 'oneWay', oneWay: true, oneWayGroup: 'collapse-ginkgo', material: 'ginkgo', x: 11620, y: 448, width: 100, height: 18, collapse: true },
    { id: 'collapse-bridge', kind: 'oneWay', oneWay: true, oneWayGroup: 'collapse-bridge', material: 'bridge', x: 22980, y: 448, width: 100, height: 18, collapse: true },
  ],
  // Meng independently takes the bridge spring route; it is driven by his own
  // position and is not coupled to Beibei's jump input.
  shortcutNodes: [
    ...highRoutePlans.map((plan) => ({
      start: plan.start - 70,
      end: plan.start + Math.max(...plan.platforms.map((segment) => segment.offset + segment.width)),
      route: plan.route,
    })),
    { start: 19500, end: 21060, route: 'bridge-upper-route' },
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
    ...highRoutePlans.flatMap((plan) => [
      ...plan.platforms.filter((segment) => segment.collapse).map((segment) => ({
        id: `collapse-${plan.district}-upper`,
        type: 'collapse',
        district: plan.district,
        x: plan.start + segment.offset,
        y: segment.y,
        width: segment.width,
        height: 22,
      })),
      ...(plan.hazard ? [{
        ...plan.hazard,
        district: plan.district,
        x: plan.start + plan.hazard.offset,
      }] : []),
    ]),
    ...beatPlans.map((plan) => ({
      id: `spikes-${plan.id}-ground`,
      type: 'spikes',
      district: plan.id === 'lake' ? 'lakeside' : plan.id,
      x: plan.start + ({ gate: 4000, court: 3600, ginkgo: 3700, lake: 3750, bridge: 3550 }[plan.id]),
      y: 482,
      width: 96,
      height: 28,
    })),
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
    { id: 'wind-1', type: 'wind', x: 21150, y: 420, width: 280, height: 90 },
    { id: 'wind-2', type: 'wind', x: 21800, y: 420, width: 320, height: 90 },
    { id: 'wind-3', type: 'wind', x: 22600, y: 420, width: 360, height: 90 },
    { id: 'banana-2', type: 'banana', x: 3900, y: 490, width: 24, height: 16 },
    { id: 'barrier-2', type: 'barrier', x: 5750, y: 470, width: 36, height: 40 },
    { id: 'surprise-3', type: 'surprise', x: 7100, y: 400, width: 30, height: 30 },
    { id: 'banana-3', type: 'banana', x: 9600, y: 490, width: 24, height: 16 },
    { id: 'bookbag-2', type: 'bookbag', x: 11800, y: 478, width: 28, height: 32 },
    { id: 'spring-3', type: 'spring', x: 14650, y: 486, width: 34, height: 24 },
    { id: 'spring-bridge-upper', type: 'spring', x: 19510, y: 486, width: 34, height: 24 },
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
  heartPickups: pickups.filter((pickup) => pickup.type === 'heart'),
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
    return gap > 150 || rise > 120 ? [{ route: platform.route, from: previous.id, to: platform.id, gap, rise }] : [];
  }));
}

export const CHAPTERS = Object.fromEntries(regions.map((region, index) => {
  const start = region.start;
  const end = region.end;
  const localize = (item) => ({ ...item, x: item.x - start });
  const includesX = (item) => item.x >= start && item.x < end;
  const chapterRegion = { ...region, start: 0, end: end - start };
  const chapterPlatforms = JOURNEY.platforms.filter(includesX).map(localize);
  const chapterPickups = JOURNEY.pickups.filter(includesX).map(localize);
  return [index + 2, {
    name: region.name,
    worldEnd: end - start,
    finishX: end - start - 200,
    maxDistance: JOURNEY.maxDistance,
    pursuerSpeed: JOURNEY.pursuerSpeed,
    districts: [chapterRegion],
    regions: [chapterRegion],
    platforms: chapterPlatforms,
    shortcutNodes: [
      ...(highRoutePlans.filter((plan) => plan.district === region.id).map((plan) => ({
        start: plan.start - 70 - start,
        end: plan.start + Math.max(...plan.platforms.map((segment) => segment.offset + segment.width)) - start,
        route: plan.route,
      }))),
      ...(region.id === 'bridge' ? [{ start: 19500 - start, end: 21060 - start, route: 'bridge-upper-route' }] : []),
    ],
    hazards: JOURNEY.hazards.filter((hazard) => hazard.district === region.id).map(localize),
    obstacles: JOURNEY.obstacles.filter(includesX).map(localize),
    pickups: chapterPickups,
    energy: chapterPickups.filter((pickup) => pickup.type === 'energy'),
    coins: chapterPickups.filter((pickup) => pickup.type === 'coin'),
    heartPickups: chapterPickups.filter((pickup) => pickup.type === 'heart'),
    checkpoints: JOURNEY.checkpoints.filter(includesX).map((checkpoint) => ({
      ...localize(checkpoint),
      respawnX: checkpoint.respawnX - start,
    })),
  }];
}));
