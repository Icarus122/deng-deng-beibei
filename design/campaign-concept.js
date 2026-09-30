const $ = id => document.getElementById(id);
// UI demonstration only. Does not read/write real game saves.
const levels = [
  {id:'campus-01',x:18,y:67,name:'等到天桥尽头',state:'complete',difficulty:'入门',art:'../assets/bg-gate-story-v2.webp',copy:'校园节的钟声快响了，孟培杰却笑着跑开了。穿过银杏小路与天桥，赶在日落之前叫住他。',mechanics:['跳跃教学','上下路线','篮球追逐']},
  {id:'river-02',x:36,y:53,name:'沿河旧街',state:'open',difficulty:'进阶',art:'../assets/bg-riverside-story-v1.webp',copy:'“刚才是我让你的。”孟培杰指向河岸钟楼。货箱正上下穿梭，踢球打开栈桥，选一条真正能追上他的路。',mechanics:['移动栈桥','踢球开桥','逆风冲刺']},
  {id:'rescue-03',x:55,y:34,name:'纸巾救援',state:'locked',difficulty:'去程进阶 · 返程挑战',art:'assets/campaign-map-v2.webp',copy:'这次曹钜钛也加入了追逐。谁料半路孟培杰扶着肚子坐下……追上曹之后，还要带着纸巾限时赶回来。',mechanics:['追逐两人','目标切换','限时返程']},
  {id:'library-04',x:21,y:26,name:'旧书里的约定',state:'locked',difficulty:'后续规划',art:'assets/campaign-map-v2.webp',copy:'学院图书馆里，旧书页夹着一张没拍完的照片。新的线索，藏在会移动的书架之间。',mechanics:['机关路线','故事线索']},
  {id:'lake-05',x:79,y:30,name:'湖风来信',state:'locked',difficulty:'后续规划',art:'../assets/bg-riverside-story-v1.webp',copy:'魔法温室亮起蓝光，晚风把纸上的半句约定吹向湖面。沿着码头，去寻找那张合照的缘由。',mechanics:['风向变化','节拍平台']},
  {id:'lookout-06',x:78,y:72,name:'日落之前',state:'locked',difficulty:'章节终点规划',art:'../assets/bg-clocktower-story-v1.webp',copy:'他终于停了下来：“谁说我不等你？我一直在找最好看的日落。”去观星台，让这段旅程留下第一张合照。',mechanics:['综合挑战','章节收束']},
];
const panels=[
  {x:12,y:12,w:277,h:453,span:9,line:'别跑！'},
  {x:305,y:12,w:283,h:453,span:9,line:'这回有帮手，\n你追得到吗？'},
  {x:604,y:12,w:739,h:453,span:23,line:'曹钜钛：你俩每天都这样？'},
  {x:1360,y:12,w:299,h:453,span:9,line:'等、等一下……'},
  {x:12,y:481,w:316,h:447,span:10,line:'这叫……\n战术暂停。'},
  {x:345,y:481,w:604,h:447,span:19,line:'曹钜钛：拿好，我跟你回去。'},
  {x:966,y:481,w:220,h:447,span:7,line:'纸巾！'},
  {x:1203,y:481,w:456,h:447,span:14,line:'等着，\n我们马上回来！'},
];
let selected=1,revealed=0,comicTimer;
function info(title,html){$('info-title').textContent=title;$('info-content').innerHTML=html;$('info-dialog').showModal();}
function nextPanel(){
  if(! $('comic-dialog').open || document.hidden)return;
  if(revealed<panels.length){$('comic-page').children[revealed].classList.add('revealed');revealed++;}
  if(revealed===panels.length){$('comic-reveal').textContent='继续旅程 →';clearTimeout(comicTimer);}
  else comicTimer=setTimeout(nextPanel,3300);
}
function revealAll(){clearTimeout(comicTimer);for(const panel of $('comic-page').children)panel.classList.add('revealed');revealed=panels.length;$('comic-reveal').textContent='继续旅程 →';}
function showComic(){clearTimeout(comicTimer);revealed=0;$('comic-reveal').textContent='点击显示全部';$('comic-page').innerHTML=panels.map((panel,i)=>`<section class="comic-panel ${panel.w>=500?'wide':''}" style="--span:${panel.span};--ratio:${panel.w/panel.h};background-size:${1672/panel.w*100}% ${941/panel.h*100}%;background-position:${panel.x/(1672-panel.w)*100}% ${panel.y/(941-panel.h)*100}%" aria-label="第 ${i+1} 格"><p class="speech">${panel.line}</p></section>`).join('');$('comic-dialog').showModal();if(matchMedia('(prefers-reduced-motion: reduce)').matches)revealAll();else nextPanel();}
function selectLevel(index){
  selected=index;const level=levels[index];$('level-title').textContent=`${index+1}. ${level.name}`;
  $('level-content').innerHTML=`<div class="level-grid"><div class="level-image" style="background-image:url('${level.art}')"><div class="image-ribbon"><strong>${level.state==='complete'?'★★☆':'☆☆☆'}</strong><span>${level.difficulty}</span></div></div><div class="level-description"><h3>旅程</h3><p>${level.copy}</p><div class="mechanics">${level.mechanics.map(x=>`<span>${x}</span>`).join('')}</div><button id="depart" class="wood-button" ${level.state==='locked'?'disabled':''}>${level.state==='locked'?'尚未解锁':'出发！'}</button><div class="small-note">${level.state==='locked'?'后续关卡规划，尚未制作。':'设计样稿，进度不影响正式存档。'}</div>${index===2?'<button id="rescue-comic" class="wood-button secondary">预览本关漫画</button>':''}</div></div>`;
  $('depart').addEventListener('click',()=>{$('level-dialog').close();info('出发准备','<p>这是未来正式关卡的出发入口。样稿尚未接入新玩法；下方打开的是目前已有的游戏首页。</p><a href="../index.html">打开现有游戏</a>');});
  $('rescue-comic')?.addEventListener('click',()=>{$('level-dialog').close();showComic();});$('level-dialog').showModal();
}
for(const [i,level] of levels.entries()){
  const node=document.createElement('button');node.className=`map-node ${level.state}`;node.style.left=`${level.x}%`;node.style.top=`${level.y}%`;
  node.setAttribute('aria-label',`${i+1} ${level.name}，${level.state==='locked'?'规划中':level.state==='complete'?'演示已完成':'演示可进入'}`);
  node.innerHTML=`<span class="node-stars" aria-hidden="true">${level.state==='complete'?'★★☆':level.state==='locked'?'☆☆☆':''}</span><span class="flag"><b>${i+1}</b></span>`;
  node.addEventListener('click',()=>selectLevel(i));$('map-nodes').append(node);
}
function locate(){const world=$('map-world'),viewport=$('map-viewport');viewport.scrollTo({left:Math.max(0,world.clientWidth*levels[selected].x/100-viewport.clientWidth/2),behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});}
$('start').addEventListener('click',()=>{$('home').hidden=true;$('campaign').hidden=false;$('back-home').focus();locate();});
$('back-home').addEventListener('click',()=>{$('campaign').hidden=true;$('home').hidden=false;$('start').focus();});$('locate').addEventListener('click',locate);
$('journal').addEventListener('click',showComic);$('journal-home').addEventListener('click',showComic);
$('comic-page').addEventListener('click',()=>{if(revealed<panels.length)revealAll();});$('comic-reveal').addEventListener('click',()=>{if(revealed<panels.length)revealAll();else $('comic-dialog').close();});
$('comic-dialog').addEventListener('close',()=>clearTimeout(comicTimer));document.addEventListener('visibilitychange',()=>{clearTimeout(comicTimer);if(!$('comic-dialog').open||revealed===panels.length)return;if(!document.hidden)comicTimer=setTimeout(nextPanel,3300);});
$('characters').addEventListener('click',()=>info('学院伙伴','<img class="character-sheet" src="assets/academy-lineup-v4.webp" alt="贝贝与戴眼镜的孟培杰同高；曹钜钛更高、更壮，均为学院风动漫形象"><div class="character-labels"><span>贝贝 · 170cm</span><span>孟培杰 · 170cm</span><span>曹钜钛 · 183cm</span></div><p>造型概念；正式动作与漫画将统一服装。</p>'));
$('practice').addEventListener('click',()=>info('练习场','<ol><li>短跳、二段跳与落地</li><li>上下平台与穿台</li><li>踢球与开关桥</li><li>冲刺、逆风和返程</li></ol>'));
document.querySelectorAll('.settings-button').forEach(b=>b.addEventListener('click',()=>info('设置','<p>电脑：方向键回头 / 加速、空格跳跃、↓ + 跳穿台、P / Esc 暂停。</p><p>手机：画面外左侧方向键，右侧跳跃；按住前进方向冲刺。返程前进方向是向左。</p><p>正式版提供音乐、音效、台词和减少动态效果。本页为设计预览。</p>')));
$('close-level').addEventListener('click',()=>$('level-dialog').close());$('close-info').addEventListener('click',()=>$('info-dialog').close());$('close-comic').addEventListener('click',()=>$('comic-dialog').close());
