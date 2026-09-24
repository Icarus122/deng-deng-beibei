export const PROGRESS_STORAGE_KEY = 'deng-deng-beibei-progress-v1';
const MAX_LEVEL_ID = 6;

function emptyProgress() {
  return { schemaVersion: 2, unlockedThrough: 2, campaignUnlocked: false, storySeen: [], records: {} };
}

function finiteInteger(value, fallback = 0) {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : fallback;
}

function normalizeProgress(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return emptyProgress();
  const records = {};
  for (let levelId = 1; levelId <= MAX_LEVEL_ID; levelId += 1) {
    const record = value.records?.[levelId];
    if (!record || typeof record !== 'object') continue;
    records[levelId] = {
      bestProgress: Math.max(0, Math.min(1, Number(record.bestProgress) || 0)),
      bestCoins: finiteInteger(record.bestCoins),
      wins: finiteInteger(record.wins),
      badges: Array.isArray(record.badges) ? [...new Set(record.badges.filter((badge) => typeof badge === 'string'))] : [],
    };
  }
  const campaignRecord = value.records?.['journey-02'];
  if (campaignRecord && typeof campaignRecord === 'object') {
    records['journey-02'] = {
      bestProgress: Math.max(0, Math.min(1, Number(campaignRecord.bestProgress) || 0)),
      bestCoins: finiteInteger(campaignRecord.bestCoins),
      wins: finiteInteger(campaignRecord.wins),
      badges: Array.isArray(campaignRecord.badges) ? [...new Set(campaignRecord.badges.filter((badge) => typeof badge === 'string'))] : [],
    };
  }
  return {
    schemaVersion: 2,
    unlockedThrough: Math.max(2, Math.min(MAX_LEVEL_ID, finiteInteger(value.unlockedThrough, 2))),
    campaignUnlocked: Boolean(value.campaignUnlocked || records[1]?.wins > 0),
    storySeen: Array.isArray(value.storySeen) ? [...new Set(value.storySeen.filter((key) => typeof key === 'string'))] : [],
    records,
  };
}

function getStorage(storage) {
  if (storage !== undefined) return storage;
  try {
    return globalThis.localStorage;
  } catch {
    return null;
  }
}

export function loadProgress(storage) {
  try {
    const target = getStorage(storage);
    const serialized = target?.getItem(PROGRESS_STORAGE_KEY);
    return serialized ? normalizeProgress(JSON.parse(serialized)) : emptyProgress();
  } catch {
    return emptyProgress();
  }
}

export function saveProgress(progress, storage) {
  try {
    const target = getStorage(storage);
    if (!target?.setItem) return false;
    target.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(normalizeProgress(progress)));
    return true;
  } catch {
    return false;
  }
}

export function recordLevelResult(progress, levelId, state, level) {
  const current = normalizeProgress(progress);
  const previous = current.records[levelId] ?? { bestProgress: 0, bestCoins: 0, wins: 0, badges: [] };
  const finished = state.phase === 'caught';
  const earnedBadges = [];
  if (finished && (state.damageCount ?? 0) === 0) earnedBadges.push('无伤追逐');
  if (finished && (state.collectedCoinIds?.length ?? 0) >= (level.coins?.length ?? 0)) earnedBadges.push('硬币全收');
  if (finished && !state.sprinted) earnedBadges.push('节能大师');

  const nextProgress = { ...current, records: { ...current.records } };
  nextProgress.records[levelId] = {
    bestProgress: Math.max(previous.bestProgress, finished ? 1 : Math.min(1, Math.max(0, (state.player?.x ?? 0) / (level.finishX || level.worldEnd || 1)))),
    bestCoins: Math.max(previous.bestCoins, finiteInteger(state.coins)),
    wins: previous.wins + Number(finished),
    badges: [...new Set([...previous.badges, ...earnedBadges])],
  };
  const beforeUnlock = nextProgress.unlockedThrough;
  let unlockedLevel = null;
  if (finished && levelId === 1) {
    nextProgress.unlockedThrough = MAX_LEVEL_ID;
    if (!nextProgress.campaignUnlocked) unlockedLevel = 'journey-02';
    nextProgress.campaignUnlocked = true;
  } else if (finished && typeof levelId === 'number' && levelId >= 2 && levelId < MAX_LEVEL_ID) {
    nextProgress.unlockedThrough = Math.max(nextProgress.unlockedThrough, levelId + 1);
    if (nextProgress.unlockedThrough > beforeUnlock) unlockedLevel = nextProgress.unlockedThrough;
  }

  return {
    progress: nextProgress,
    earnedBadges,
    unlockedLevel,
  };
}

export function markStorySeen(progress, sceneKey) {
  const current = normalizeProgress(progress);
  return { ...current, storySeen: [...new Set([...current.storySeen, sceneKey])] };
}
