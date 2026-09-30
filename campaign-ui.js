import { CAMPAIGN, isCampaignUnlocked } from './campaign.js?v=20260930b';

export function createCampaignUI({ getProgress, startLevel, replayStory, levels, audio }) {
  const $ = id => document.getElementById(id);
  let selected = 0;
  const map = $('level-select-dialog');
  const intro = $('level-intro-dialog');
  const info = $('info-dialog');
  const nodes = $('map-nodes');
  const audioKey = 'deng-deng-beibei-audio-muted';
  try { audio.setMuted(localStorage.getItem(audioKey) === 'true'); } catch { /* Settings can work without storage. */ }
  function locate() {
    const viewport = $('map-viewport');
    const world = $('map-world');
    viewport.scrollTo({
      left: Math.max(0, world.clientWidth * CAMPAIGN[selected].x / 100 - viewport.clientWidth / 2),
      top: Math.max(0, world.offsetTop + world.clientHeight * CAMPAIGN[selected].y / 100 - viewport.clientHeight * .58),
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
    });
  }
  function updateSelection() {
    [...nodes.children].forEach((node, index) => {
      node.classList.toggle('selected', index === selected);
      node.setAttribute('aria-current', String(index === selected));
    });
    $('map-journal').disabled = !isCampaignUnlocked(CAMPAIGN[selected].id, getProgress());
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
      node.className = `map-node ${record?.wins ? 'complete' : unlocked ? 'available' : 'locked'}${level.id === null ? ' planned' : ''}`;
      node.style.left = `${level.x}%`;
      node.style.top = `${level.y}%`;
      node.setAttribute('aria-label', `${index+1}. ${level.name}，${unlocked ? '可进入' : level.id ? '未解锁' : '待开发'}`);
      node.title = `${level.name} · ${unlocked ? '点击查看道路与关卡介绍' : level.id ? '通关上一关解锁' : '筹备中'}`;
      node.innerHTML = `<span class="node-stars" aria-hidden="true">${level.id ? '★'.repeat(count)+'☆'.repeat(3-count) : '筹备中'}</span><svg class="node-art" viewBox="0 0 96 116" aria-hidden="true"><use href="assets/campaign-ui-icons-v1.svg#flag"/><text class="flag-number" x="57" y="49" text-anchor="middle">${index+1}</text>${unlocked ? '' : '<use class="flag-lock" href="assets/campaign-ui-icons-v1.svg#lock" x="72" y="80" width="19" height="19"/>'}</svg>`;
      node.addEventListener('click', () => select(index));
      nodes.append(node);
    });
    $('map-stars').textContent = stars;
    updateSelection();
  }
  function select(index) {
    selected = index;
    updateSelection();
    const level = CAMPAIGN[index];
    const unlocked = isCampaignUnlocked(level.id, getProgress());
    $('level-intro-title').textContent = `${index+1}. ${level.name}`;
    const record = getProgress().records[level.id];
    const count = record?.stars ?? (record?.wins ? 1 : 0);
    $('level-intro-content').innerHTML = `<div class="level-grid"><figure class="level-preview"><div class="level-image" role="img" aria-label="${level.name}道路场景${level.id ? '' : '氛围示意'}" style="background-image:url('${level.art}')"></div><figcaption class="image-ribbon"><strong>${'★'.repeat(count)}${'☆'.repeat(3-count)}</strong><span>${level.difficulty}</span></figcaption></figure><div class="level-description"><h3>旅程</h3><p>${level.copy}</p><div class="mechanics">${level.mechanics.map(text => `<span>${text}</span>`).join('')}</div><button id="depart-button" class="wood-button" ${unlocked ? '' : 'disabled'}>${unlocked ? '出发！' : level.id ? '通关上一关解锁' : '待开发'}</button><div class="small-note">${record?.wins ? `通关 ${record.wins} 次 · 最多 ${record.bestCoins} 枚硬币` : unlocked ? '通关得一星 · 无伤得一星 · 收集一半硬币得一星' : ''}</div>${unlocked ? '<button id="replay-scene" class="wood-button secondary">回看漫画</button>' : ''}</div></div>`;
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
  $('map-journal').addEventListener('click', () => replayStory(CAMPAIGN[selected].id));
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
  document.querySelectorAll('.settings-button').forEach(button => button.addEventListener('click', () => {
    showInfo('设置', `<div class="settings-row"><div><h3>游戏音效</h3><p>跳跃、拾取与追逐反馈</p></div><button id="audio-toggle" class="audio-toggle" role="switch" aria-label="游戏音效" aria-checked="${!audio.muted}" ${audio.supported ? '' : 'disabled'}><span class="switch-track" aria-hidden="true"></span><span class="toggle-state">${audio.supported ? audio.muted ? '关闭' : '开启' : '不可用'}</span></button></div><details class="control-guide"><summary>操作方式</summary><p>电脑：← / A 回头，→ / D 按住冲刺；空格 / W / ↑ 跳跃；↓ + 跳穿过高台；P / Esc 暂停。</p><p>手机：左侧方向键、右侧跳跃。按住前进方向冲刺；返程向左前进。</p><p>漫画：自动逐格显示，点击显示全部，再点击继续。</p></details><a href="animation-preview.html">动作预览 ↗</a>`);
    $('audio-toggle').addEventListener('click', () => {
      audio.setMuted(!audio.muted);
      $('audio-toggle').setAttribute('aria-checked', String(!audio.muted));
      $('audio-toggle').querySelector('.toggle-state').textContent = audio.muted ? '关闭' : '开启';
      try { localStorage.setItem(audioKey, String(audio.muted)); } catch { /* The toggle still works for this session. */ }
    });
  }));
  window.addEventListener('resize', () => { if (map.open) requestAnimationFrame(locate); });
  return {
    refresh,
    open() {
      selected = Math.max(0, CAMPAIGN.findLastIndex(level => level.id && isCampaignUnlocked(level.id, getProgress())));
      refresh();
      map.showModal();
      requestAnimationFrame(locate);
    },
    close() { if (intro.open) intro.close(); if (info.open) info.close(); if (map.open) map.close(); },
  };
}
