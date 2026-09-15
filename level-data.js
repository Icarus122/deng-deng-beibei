const GROUND_Y = 510;

function makePlatforms(start, end, widths, gaps) {
  let x = start;
  const platforms = [];
  let index = 0;
  while (x < end) {
    const width = widths[index % widths.length];
    platforms.push({ x, y: GROUND_Y, width: Math.min(width, end - x), height: 30 });
    x += width + gaps[index % gaps.length];
    index += 1;
  }
  return platforms;
}

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
    ...makePlatforms(0, 4800, [500, 420, 540, 450], [70, 85, 55, 90]),
    ...makePlatforms(4800, 9600, [520, 430, 390, 500], [65, 95, 115, 70]),
    ...makePlatforms(9600, 14400, [460, 410, 530, 400], [110, 70, 95, 120]),
    ...makePlatforms(14400, 19200, [400, 330, 480, 370], [135, 115, 90, 140]),
    ...makePlatforms(19200, 24000, [500, 370, 480, 340], [80, 120, 75, 110]),
    { x: 900, y: 414, width: 118, height: 18 }, { x: 2050, y: 442, width: 105, height: 18 }, { x: 3200, y: 390, width: 118, height: 18 },
    { x: 5600, y: 414, width: 118, height: 18 }, { x: 7400, y: 390, width: 96, height: 18, motion: { axis: 'x', range: 46, period: 2100 } },
    { x: 10300, y: 414, width: 118, height: 18 }, { x: 12500, y: 442, width: 105, height: 18 },
    { x: 15100, y: 390, width: 96, height: 18, motion: { axis: 'y', range: 46, period: 2400 } }, { x: 16800, y: 414, width: 118, height: 18 },
    { x: 20200, y: 442, width: 105, height: 18 }, { x: 22100, y: 390, width: 96, height: 18, motion: { axis: 'x', range: 50, period: 1900 } },
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
