# Godot 三关开发试玩

2026-10-01-dev4：这是可游玩的开发版，不是商业发布候选。根地址现在直接进入本游戏；历史 Canvas 源码保留但不再作为游玩入口。默认进入首页、学院地图、道路简介、漫画与前三关；带 ?sample 可打开独立动作测试场。

## 已接入

- 第一关校园、第二关河岸定位铃、第三关独立夜市；每关六段地形，坡道、单向/移动台、第三关塌陷台。
- 三颗心、进入接触扣心与无敌窗口、施工箱无害预警、移动推车扫掠碰撞、能量/补心、真实篮球弧线与命中。
- 第三关两人追逐，中点孟肚子疼停下；实际追到曹后拿纸巾，90 秒返回服务站。返程使用另一套陷阱与地面补给，失败从返程检查点重试。
- 首尾漫画、第二关机关漫画与第三关中点/返程漫画；自动逐格、首次点击展开，再次继续、跳过、独立回看。
- Web 学院首页/地图/道路简介、暂停/设置、音效、星级/音效/60或120渲染上限存档；存储受限时提示，仍可继续玩。
- 完整身体绘制、独立地面相位、人物/镜头物理插值；曹站立采用单独完整新原画。贝贝与孟约同高，曹按 183/170 比例更高。

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

dev4 替换后重新通过 38 个 Godot 测试脚本、Python 7 项原画/重打包检查、Node 138 项与历史 Canvas 关卡机器人。Godot 六次实际输入整关回放覆盖 30/60Hz，第三关经过中点、拿纸巾和返程，剩余约 13.77/13.45 秒；AI 无跌出世界救援。第三关玩家回放仍各掉坑一次并回到检查点，不能把这些结果称为零失误或新手平衡。新增的二、三关 24 个上层路线连接分别通过 30/60Hz 实际落脚模拟；未证明所有历史移动台相位均可达。旧关节数学测试是保留的诊断夹具，不驱动本轮完整人物帧，也不是新原画自然动作证明。

桌面 DPR1、手机竖屏/横屏 DPR2 采用实际 Web 引擎测试：地图/道路简介、漫画比例/隔格裁切/逐格交互、独立回看、刷新设置存档、双指冲刺+跳跃、暂停冻结与按钮不遮 canvas。禁用 IndexedDB 后有保存警告，仍能开始游玩。不是手机实机性能验收。

贝贝使用大步幅 v3 的 12 个核心全身姿势。dev4 按用户“和贝贝一样”的要求，孟/曹采用贝贝姿势流程重新绘制的完整人物十二帧，不采用拆分肢体方案。原画、无损打包清单及完整提示词见 assets/PARTNER-RUN-BEIBEI-PROMPTS.md；旧候选的记录仍保留在 assets/PARTNER-RUN-PROMPTS.md。两人各自独立相位、176px 一轮，普通/冲刺 240/330px/s，约 16.4/22.5 次姿势切换每秒。120 是渲染上限，不是 120 张新原画。原生逐帧/四倍慢放与实际 Web 游戏检查已覆盖全身完整范围、镜像和首尾锚点；并未证明严格左右腿交换、脚滑≤4px或商业动画质量。跳跃、受伤等非跑步动作沿用现有独立动作，不属于本轮重画。

首包 WASM 39,514,754 字节、PCK 16,843,264 字节（未压缩），加外部 UI 后超过 ≤25MB 目标；尚未做模板裁剪/按需关卡包。用户最终动作观感确认、所有移动高台连接极值、真人试玩平衡、手机实机帧耗、Canvas→Godot 存档迁移、原生 UI/完整声音仍是后续品质门槛。不得将本开发版改名 v0.4.0-alpha 或声称达到 Steam 上架品质。

dev3 还修复了追逐目标地形减速后无法恢复领先、曹交接闪帧/返程瞬移；道路不再只有薄砖帽和灰色侧面，坡道使用裁切石材且保留真实坑洞；二、三关增加坡度变化、上层风险奖励路线与返程陷阱；地图旗帜/星级/设置齿轮为原创 SVG。完整本轮记录见 docs/2026-10-01-chase-road-presentation-delivery.md。

长线剧情、Boss/选角/换装/合作仍属设计稿，见 docs/2026-10-01-world-story-bible.md。交付明细及实施取舍见 docs/2026-10-01-godot-development-delivery.md。美术来源与完整工具提示词见 assets/ASSETS.md 和 assets/CAMPAIGN-PROMPTS.md。
