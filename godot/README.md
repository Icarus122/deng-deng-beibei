# Godot 三关开发试玩

2026-10-01-dev5：这是可游玩的开发版，不是商业发布候选。根地址现在直接进入本游戏；历史 Canvas 源码保留但不再作为游玩入口。默认进入首页、学院地图、道路简介、漫画与前三关；带 ?sample 可打开独立动作测试场。

## 已接入

- 第一关校园、第二关河岸定位铃、第三关独立夜市；每关六段地形，坡道、单向/移动台、第三关塌陷台。
- 三颗心、进入接触扣心与无敌窗口、施工箱无害预警、移动推车扫掠碰撞、能量/补心、真实篮球弧线与命中。
- 第三关两人追逐，中点孟肚子疼停下；实际追到曹后拿纸巾，90 秒返回服务站。返程使用另一套陷阱与地面补给，失败从返程检查点重试。
- 首尾漫画、第二关机关漫画与第三关中点/返程漫画；自动逐格、首次点击展开，再次继续、跳过、独立回看。
- Web 学院首页/地图/道路简介、暂停/设置、音效、星级/音效/60或120渲染上限存档；存储受限时提示，仍可继续玩。
- 完整身体绘制、独立地面相位、人物/镜头物理插值；孟／曹短发跑步与三人16种非跑步动作采用固定原画尺度，局部帧变换不跨素材插值。贝贝与孟约同高，曹按 183/170 比例更高。

自动前进；空格/上/W 跳，松开短跳，支持二段跳；左/A 回头，长按前进方向冲刺；下/S＋跳穿单向台；P/Esc 暂停。手机方向与跳跃键在画面外，支持双指；电脑隐藏触控键。

## 运行、测试和导出

使用 Godot 4.7.2 标准版打开 project.godot，运行 boot.tscn；本机忽略的编辑器在主仓库 artifacts/godot-4.7.2/editor，不随 Git 上传。原生菜单目前是文本后备界面，地图/漫画美术界面以 Web 试玩为准。

在仓库根目录执行：

~~~powershell
$taskGodot = 'D:/TIstudy-project/ddbbBa/artifacts/godot-4.7.2/editor/Godot_v4.7.2-stable_win64_console.exe'
& $taskGodot --headless --path godot --editor --import --quit
Get-ChildItem godot/tests -Filter '*_test.gd' | ForEach-Object {
    & $taskGodot --headless --fixed-fps 60 --path godot --script ('tests/' + $_.Name)
    if ($LASTEXITCODE -ne 0) { throw $_.Name }
}
python tools/test_pose_pack.py
python tools/test_partner_run_pack.py
node --test
node tools/level-bot.mjs
./tools/export-godot.ps1
~~~

导出需要官方同版本单线程 Web 模板，预设使用相对路径 artifacts/godot-templates。Web 导出脚本同时核验实际 PCK 启动并复制外部 UI 图及许可。通过 HTTP 打开 /godot-demo/；?debug 开启只读 window.campaignState，不在人物头顶绘制技术数字。浏览器测试见 tools/check-godot-web.mjs，需要 Playwright 和已安装浏览器。

## 验证与边界

dev5 最终源码重新通过39个 Godot测试脚本、Python9项原画／打包检查、Node138项；实际 Web 全部九段漫画、电脑和手机模拟横竖屏通过。Godot六次实际输入整关回放覆盖30/60Hz；第三关回放仍各掉坑一次并回到检查点，不是零失误或新手平衡验收。旧关节数学测试仅为保留的诊断夹具，不证明当前原画动作自然。

桌面 DPR1、手机竖屏/横屏 DPR2 采用实际 Web 引擎测试：地图/道路简介、漫画比例/隔格裁切/逐格交互、独立回看、刷新设置存档、双指冲刺+跳跃、暂停冻结与按钮不遮 canvas。禁用 IndexedDB 后有保存警告，仍能开始游玩。不是手机实机性能验收。

贝贝保留大步幅v3十二姿势；孟／曹使用同类完整十二姿势的短发版。三人跳跃、落地、站立、受伤等16动作已重画并固定尺度接入，不采用拆分肢体。原画与无损锚点清单均保留；完整提示词见 ../docs/2026-10-01-short-actions-comic-prompts.json。两人独立相位、176px一轮，普通／冲刺240/330px/s不变。120仅为渲染上限，不是120张原画。原生七状态对比已检查完整身体与切换比例；严格左右腿交换、脚滑≤4px及用户最终观感仍未验收。

首包WASM39,514,754字节、PCK15,763,264字节（未压缩）；九张外部漫画合计25,782,789字节，按场景加载，尚未达到小包目标。用户最终动作观感、所有移动平台极值、真人平衡、手机实机帧耗、存档迁移、原生美术UI仍是品质门槛。不得将本开发版称为Steam上架品质。详见 ../docs/2026-10-01-short-actions-comic-delivery.md。

dev3 还修复了追逐目标地形减速后无法恢复领先、曹交接闪帧/返程瞬移；道路不再只有薄砖帽和灰色侧面，坡道使用裁切石材且保留真实坑洞；二、三关增加坡度变化、上层风险奖励路线与返程陷阱；地图旗帜/星级/设置齿轮为原创 SVG。完整本轮记录见 docs/2026-10-01-chase-road-presentation-delivery.md。

长线剧情、Boss/选角/换装/合作仍属设计稿，见 docs/2026-10-01-world-story-bible.md。交付明细及实施取舍见 docs/2026-10-01-godot-development-delivery.md。美术来源与完整工具提示词见 assets/ASSETS.md 和 assets/CAMPAIGN-PROMPTS.md。
