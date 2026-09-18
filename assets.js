const BACKGROUND_SOURCES = {
  gate: ['assets/bg-gate-hd.webp', 'assets/bg-gate-hd.png'],
  court: ['assets/bg-court-hd.webp', 'assets/bg-court-hd.png'],
  ginkgo: ['assets/bg-ginkgo-hd.webp', 'assets/bg-ginkgo-hd.png'],
  lakeside: ['assets/bg-lakeside-hd.webp', 'assets/bg-lakeside-hd.png'],
  bridge: ['assets/bg-bridge-hd.webp', 'assets/bg-bridge-hd.png'],
};

function loadCandidate(images, id, sourceIndex = 0) {
  if (images[id] || images.loading.has(id) || sourceIndex >= BACKGROUND_SOURCES[id].length) return;
  images.loading.add(id);
  const image = new Image();
  image.onload = () => { images[id] = image; images.loading.delete(id); };
  image.onerror = () => { images.loading.delete(id); loadCandidate(images, id, sourceIndex + 1); };
  image.src = BACKGROUND_SOURCES[id][sourceIndex];
}

export function createLazyBackgrounds(firstRegion = 'gate') {
  const images = { loading: new Set() };
  loadCandidate(images, firstRegion);
  return images;
}

export function preloadBackground(images, regionId) {
  if (regionId && BACKGROUND_SOURCES[regionId]) loadCandidate(images, regionId);
}

export { BACKGROUND_SOURCES };
