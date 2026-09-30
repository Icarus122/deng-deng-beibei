import { CAMPAIGN, isCampaignUnlocked } from './campaign.js?v=20260930a';

export function createCampaignUI({ getProgress, startLevel, replayStory, levels }) {
  const $ = id => document.getElementById(id);
  let selected = 0;
  const map = $('level-select-dialog');
  const intro = $('level-intro-dialog');
  const info = $('info-dialog');
  const nodes = $('map-nodes');
  function locate() {
    const viewport = $('map-viewport');
    viewport.scrollTo({ left: Math.max(0, $('map-world').clientWidth * CAMPAIGN[selected].x / 100 - viewport.clientWidth / 2), behavior: 'smooth' });
  }
  function refresh() {
    const progress = getProgress();
    nodes.replaceChildren();
    let stars = 0;
    CAMPAIGN.forEach((level, index) => {
      const unlocked = isCampaignUnlocked(level.id, progress);
      const record = progress.records[level.id];
      const count = record?.stars ?? (record?.wins ? 1 : 0);
      stars += count;
      const node = document.createElement('button');
      node.type = 'button';
      node.className = `map-node ${record?.wins ? 'complete' : unlocked ? 'current' : 'locked'}`;
      node.style.left = `${level.x}%`;
      node.style.top = `${level.y}%`;
      node.setAttribute('aria-label', `${index+1}. ${level.name}，${unlocked ? '可进入' : level.id ? '未解锁' : '待开发'}`);
      node.innerHTML = `<span class="node-stars" aria-hidden="true">${'★'.repeat(count)}${'☆'.repeat(3-count)}</span><span class="flag"><b>${index+1}</b></span>`;
      node.addEventListener('click', () => select(index));
      nodes.append(node);
    });
    $('map-stars').textContent = stars;
  }
  function select(index) {
    selected = index;
    const level = CAMPAIGN[index];
    const unlocked = isCampaignUnlocked(level.id, getProgress());
    $('level-intro-title').textContent = `${index+1}. ${level.name}`;
    const record = getProgress().records[level.id];
    const count = record?.stars ?? (record?.wins ? 1 : 0);
    $('level-intro-content').innerHTML = `<div class="level-grid"><div class="level-image" style="background-image:url('${level.art ?? 'design/assets/campaign-map-v2.webp'}')"><div class="image-ribbon"><strong>${'★'.repeat(count)}${'☆'.repeat(3-count)}</strong><span>${level.difficulty}</span></div></div><div class="level-description"><h3>旅程</h3><p>${level.copy}</p><div class="mechanics">${level.mechanics.map(text => `<span>${text}</span>`).join('')}</div><button id="depart-button" class="wood-button" ${unlocked ? '' : 'disabled'}>${unlocked ? '出发！' : level.id ? '通关上一关解锁' : '待开发'}</button><div class="small-note">${record?.wins ? `通关 ${record.wins} 次 · 最多 ${record.bestCoins} 枚硬币` : unlocked ? '通关得一星 · 无伤得一星 · 收集一半硬币得一星' : ''}</div>${unlocked ? '<button id="replay-scene" class="wood-button secondary">回看漫画</button>' : ''}</div></div>`;
    $('depart-button').addEventListener('click', () => { intro.close(); map.close(); startLevel(level.id); });
    $('replay-scene')?.addEventListener('click', () => { intro.close(); replayStory(level.id); });
    intro.showModal();
  }
  function showInfo(title, html) {
    $('info-title').textContent = title;
    $('info-content').innerHTML = html;
    info.showModal();
  }
  $('level-intro-close').addEventListener('click', () => intro.close());
  $('info-close').addEventListener('click', () => info.close());
  $('map-locate').addEventListener('click', locate);
  $('map-journal').addEventListener('click', () => replayStory(CAMPAIGN[selected].id ?? 1));
  $('map-characters').addEventListener('click', () => showInfo('学院伙伴', '<img class="character-sheet" src="design/assets/academy-lineup-v4.webp" alt="学院风动漫人物：贝贝、戴眼镜的孟培杰和更高大的曹钜钛"><div class="character-labels"><span>贝贝 · 170cm</span><span>孟培杰 · 170cm</span><span>曹钜钛 · 183cm</span></div>'));
  $('map-practice').addEventListener('click', () => {
    showInfo('分段练习', '<div class="practice-buttons"></div>');
    for (let id = 2; id <= 6; id++) {
      const button = document.createElement('button');
      button.className = 'wood-button secondary';
      button.textContent = levels[id].name;
      button.disabled = id > getProgress().unlockedThrough;
      button.addEventListener('click', () => { info.close(); map.close(); startLevel(id); });
      $('info-content').firstChild.append(button);
    }
  });
  document.querySelectorAll('.settings-button').forEach(button => button.addEventListener('click', () => showInfo('操作指南', '<p>电脑：自动前进；← / A 回头，→ / D 按住冲刺；空格 / W / ↑ 跳跃；↓ + 跳穿过高台；P / Esc 暂停。</p><p>手机：画面外左侧方向键，右侧跳跃。按住当前前进方向冲刺；返程前进方向为向左。</p><p>漫画：自动逐格显示，点击一次显示全部，再点击继续。</p><a href="animation-preview.html">动作预览</a>')));
  return {
    refresh,
    open() {
      refresh();
      selected = Math.max(0, CAMPAIGN.findLastIndex(level => level.id && isCampaignUnlocked(level.id, getProgress())));
      map.showModal();
      requestAnimationFrame(locate);
    },
    close() { if (intro.open) intro.close(); if (info.open) info.close(); if (map.open) map.close(); },
  };
}
