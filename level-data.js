const GROUND_Y = 510;

function makePlatforms(start, end, widths, gaps) {
  let x = start;
  const platforms = Array.from({ length: 16 }, (_, index) => {
    const width = widths[index % widths.length];
    const platform = { x, y: GROUND_Y, width, height: 30 };
    x += width + gaps[index % gaps.length];
    return platform;
  });
  if (x < end) platforms.push({ x, y: GROUND_Y, width: end - x, height: 30 });
  return platforms;
}

const regions = [
  { id: 'gate', name: '校园入口', start: 0, end: 9600, palette: 'morning', landmark: 'gate', foreground: 'flowerbeds', interaction: 'bookbag' },
  { id: 'court', name: '篮球场', start: 9600, end: 19200, palette: 'sports', landmark: 'hoop', foreground: 'bleachers', interaction: 'basketball' },
  { id: 'ginkgo', name: '银杏林路', start: 19200, end: 28800, palette: 'golden', landmark: 'bench', foreground: 'leaves', interaction: 'banana' },
  { id: 'lakeside', name: '湖畔施工区', start: 28800, end: 38400, palette: 'lake', landmark: 'crane', foreground: 'water', interaction: 'swingBridge' },
  { id: 'bridge', name: '黄昏天桥', start: 38400, end: 48000, palette: 'sunset', landmark: 'city', foreground: 'lamps', interaction: 'wind' },
];

const pickups = [
  { id: 'energy-1', type: 'energy', x: 5400, y: 468, width: 22, height: 22 },
  { id: 'energy-2', type: 'energy', x: 17700, y: 468, width: 22, height: 22 },
  { id: 'energy-3', type: 'energy', x: 26500, y: 468, width: 22, height: 22 },
  { id: 'energy-4', type: 'energy', x: 36500, y: 468, width: 22, height: 22 },
];

export const JOURNEY = {
  name: '等到天桥尽头',
  worldEnd: 48000,
  finishX: 47200,
  maxDistance: 520,
  pursuerSpeed: 136,
  regions,
  districts: regions,
  platforms: [
    ...makePlatforms(0, 9600, [500, 420, 540, 450], [70, 85, 55, 90]),
    ...makePlatforms(9600, 19200, [520, 430, 390, 500], [65, 95, 115, 70]),
    ...makePlatforms(19200, 28800, [460, 410, 530, 400], [110, 70, 95, 120]),
    ...makePlatforms(28800, 38400, [400, 330, 480, 370], [135, 115, 90, 140]),
    ...makePlatforms(38400, 48000, [500, 370, 480, 340], [80, 120, 75, 110]),
    { x: 900, y: 414, width: 118, height: 18 }, { x: 3200, y: 442, width: 105, height: 18 },
    { x: 10700, y: 414, width: 118, height: 18 }, { x: 14400, y: 390, width: 96, height: 18, motion: { axis: 'x', range: 46, period: 2100 } },
    { x: 20400, y: 414, width: 118, height: 18 }, { x: 23600, y: 442, width: 105, height: 18 },
    { x: 29800, y: 390, width: 96, height: 18, motion: { axis: 'y', range: 46, period: 2400 } }, { x: 33400, y: 414, width: 118, height: 18 },
    { x: 39700, y: 442, width: 105, height: 18 }, { x: 42900, y: 390, width: 96, height: 18, motion: { axis: 'x', range: 50, period: 1900 } },
  ],
  obstacles: [
    { id: 'bookbag-1', type: 'bookbag', x: 2250, y: 478, width: 28, height: 32 },
    { id: 'basketball-1', type: 'basketball', x: 10000, y: 482, width: 22, height: 22 },
    { id: 'basketball-2', type: 'basketball', x: 15300, y: 482, width: 22, height: 22 },
    { id: 'banana-1', type: 'banana', x: 19400, y: 490, width: 24, height: 16 },
    { id: 'banana-2', type: 'banana', x: 24400, y: 490, width: 24, height: 16 },
    { id: 'barrier-1', type: 'barrier', x: 31000, y: 470, width: 36, height: 40 },
    { id: 'wind-1', type: 'wind', x: 41500, y: 360, width: 280, height: 150 },
  ],
  pickups,
  energy: pickups.filter((pickup) => pickup.type === 'energy'),
  checkpoints: [
    { x: 7200, respawnX: 7100 }, { x: 15800, respawnX: 15700 }, { x: 18600, respawnX: 18500 },
    { x: 25200, respawnX: 25100 }, { x: 28000, respawnX: 27900 }, { x: 34600, respawnX: 34500 },
    { x: 37500, respawnX: 37400 }, { x: 43800, respawnX: 43700 },
  ],
};

export function getRegionAt(regionList, x) {
  return regionList.find((region) => x >= region.start && x < region.end) ?? regionList.at(-1);
}
