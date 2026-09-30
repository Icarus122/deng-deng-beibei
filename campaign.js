export const CAMPAIGN = [
  { id: 1, name: '银杏学院 · 追上约定', x:23, y:73, art:'assets/bg-gate-story-v2.webp', difficulty:'入门', copy:'学院节快结束了。贝贝要在天桥尽头叫住总爱抢跑的孟培杰，一起去拍合照。', mechanics:['短跳与二段跳','分层近路','三颗心'] },
  { id:'journey-02', name:'沿河旧街 · 钟楼约定', x:43, y:49, art:'assets/bg-riverside-story-v1.webp', difficulty:'进阶', copy:'旧街的货台与钟楼连成六段挑战。踢球打开桥、在移动货台上找准落脚点，留好最后一段的冲刺能量。', mechanics:['开关桥','移动货台','风区冲刺'] },
  { id:'journey-03', name:'学院集市 · 纸巾救援', x:55, y:38, art:'assets/bg-clocktower-story-v1.webp', difficulty:'进阶 · 限时返程', copy:'这次曹钜钛也来了。追逐半途孟培杰突然肚子疼；先追上曹钜钛拿到纸巾，再沿换了道具的路限时跑回来。', mechanics:['双目标追逐','剧情换目标','90 秒返程'] },
  { id:null, name:'星书图书馆', x:22, y:26, art:'assets/bg-ginkgo-hd.webp', difficulty:'待开发', copy:'尚未制作的后续旅程。道路图片为氛围示意，并非已完成关卡。', mechanics:[] },
  { id:null, name:'雾湖秘径', x:78, y:35, art:'assets/bg-lakeside-hd.webp', difficulty:'待开发', copy:'尚未制作的后续旅程。道路图片为氛围示意，并非已完成关卡。', mechanics:[] },
  { id:null, name:'观星台', x:80, y:70, art:'assets/bg-bridge-story-v2.webp', difficulty:'待开发', copy:'尚未制作的后续旅程。道路图片为氛围示意，并非已完成关卡。', mechanics:[] },
];

export function parseLevelId(value) {
  return String(value).startsWith('journey-') ? value : Number(value);
}

export function isCampaignUnlocked(id, progress) {
  if (id === 1) return true;
  if (id === 'journey-02') return progress.campaignUnlocked;
  if (id === 'journey-03') return (progress.records['journey-02']?.wins ?? 0) > 0;
  return false;
}

export function getNextCampaign(id) {
  return CAMPAIGN[CAMPAIGN.findIndex(level => level.id === id) + 1]?.id ?? null;
}
