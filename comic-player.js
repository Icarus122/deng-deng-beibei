const rescue = [
  [12,12,277,453,9,'别跑！'], [305,12,283,453,9,'这回有帮手，\n你追得到吗？'],
  [604,12,739,453,23,'曹钜钛：你俩每天都这样？'], [1360,12,299,453,9,'等、等一下……'],
  [12,481,316,447,10,'这叫……\n战术暂停。'], [345,481,604,447,19,'拿好，我跟你回去。'],
  [966,481,220,447,7,'纸巾！'], [1203,481,456,447,14,'等着，\n我们马上回来！'],
];
const academy = [
  [8,7,330,456,10,'闭幕钟响前，\n一起去拍合照。'], [353,7,557,456,17,'说好一起走的！'],
  [924,7,738,456,23,'追上我，我就告诉你近路！'],
  [8,474,596,458,18,'货台机关？\n看我的！'], [617,474,393,458,12,'近路可没那么好走！'],
  [1025,474,637,458,20,'好好好，这次等你。'],
];

export function getComicPanels(levelId, kind) {
  let selected;
  let asset;
  if (levelId === 'journey-03') {
    asset = 'design/assets/rescue-comic-v2.webp';
    const indices = kind === 'intro' ? [0,1,2] : kind === 'midpoint' ? [3,4] : kind === 'return' ? [5,6,7] : [7];
    selected = indices.map(i => rescue[i]);
    if (kind === 'outro') selected = [[...rescue[7].slice(0,5),'孟培杰：救命恩人！\n贝贝：以后还跑不跑？']];
  } else {
    asset = 'assets/academy-comic-v1.webp';
    const indices = kind === 'outro' ? [5] : levelId === 'journey-02' ? [3,4,5] : [0,1,2];
    selected = indices.map(i => academy[i]);
  }
  const total = selected.reduce((sum,item) => sum+item[4],0);
  return selected.map(([x,y,w,h,span,text]) => ({x,y,w,h,span:Math.round(span/total*50),text,asset}));
}

export function comicClickAction(shown, count) {
  return shown < count ? 'reveal' : 'continue';
}

export function createComicPlayer(dialog, page, button) {
  let shown = 0;
  let timer;
  const clear = () => clearTimeout(timer);
  function revealAll() {
    clear();
    for (const panel of page.children) panel.classList.add('revealed');
    shown = page.children.length;
    button.textContent = '继续旅程 →';
  }
  function nextPanel() {
    if (!dialog.open || document.hidden) return;
    page.children[shown]?.classList.add('revealed');
    shown += 1;
    if (shown >= page.children.length) revealAll();
    else timer = setTimeout(nextPanel,3300);
  }
  page.addEventListener('click', () => { if (shown < page.children.length) revealAll(); });
  dialog.addEventListener('close',clear);
  document.addEventListener('visibilitychange', () => {
    clear();
    if (!document.hidden && dialog.open && shown < page.children.length) timer = setTimeout(nextPanel,3300);
  });
  return {
    clear,
    click() {
      const action = comicClickAction(shown,page.children.length);
      if (action === 'reveal') revealAll();
      return action;
    },
    open(levelId,kind) {
      clear();
      shown = 0;
      const panels = getComicPanels(levelId,kind);
      const ratio = panels.reduce((sum,panel)=>sum+panel.w/panel.h,0);
      page.replaceChildren();
      page.style.gridTemplateRows = 'minmax(0,1fr)';
      page.style.aspectRatio = String(ratio);
      page.style.width = `min(100%,1600px,calc((100svh - 120px) * ${ratio}))`;
      for (const panel of panels) {
        const element = document.createElement('section');
        element.className = `comic-panel ${panel.w>=500 ? 'wide' : ''}`;
        element.style.cssText = `--span:${panel.span};--ratio:${panel.w/panel.h};background-image:url('${panel.asset}');background-size:${1672/panel.w*100}% ${941/panel.h*100}%;background-position:${panel.x/(1672-panel.w)*100}% ${panel.y/(941-panel.h)*100}%`;
        const speech = document.createElement('p');
        speech.className = 'speech';
        speech.textContent = panel.text;
        element.append(speech);
        page.append(element);
      }
      // Correct rounding without wrapping the last panel onto another row.
      page.lastChild.style.setProperty('--span',50-panels.slice(0,-1).reduce((sum,p)=>sum+p.span,0));
      button.textContent = '点击显示全部';
      dialog.showModal();
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) revealAll();
      else nextPanel();
    },
  };
}
