# Godot 三关开发试玩

2026-10-01：这是可游玩的开发版，不是商业发布候选；根目录的 Canvas v0.3.1-alpha 继续保留。开发版默认进入首页、学院地图、道路简介、漫画与前三关；带 ?sample 可打开独立动作测试场。

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
node --test
node tools/level-bot.mjs
./tools/export-godot.ps1
~~~

导出需要官方同版本单线程 Web 模板，预设使用相对路径 artifacts/godot-templates。Web 导出脚本同时核验实际 PCK 启动并复制外部 UI 图及许可。通过 HTTP 打开 /godot-demo/；?debug 开启只读 window.campaignState，不在人物头顶绘制技术数字。浏览器测试见 tools/check-godot-web.mjs，需要 Playwright 和已安装浏览器。

## 验证与边界

28 个 Godot 测试脚本、Python 3 项原画/重打包检查、旧 Canvas 138 项与其关卡机器人已通过。Godot 六次实际输入整关回放覆盖 30/60Hz，第三关经过中点、拿纸巾和返程，剩余约 12.57/10.20 秒；AI 无跌出世界救援。机器人会受伤/回到检查点，不能把这些结果称为零失误、新手平衡或所有高台连接的证明。

桌面 DPR1、手机竖屏/横屏 DPR2 采用实际 Web 引擎测试：地图/道路简介、漫画比例/隔格裁切/逐格交互、独立回看、刷新设置存档、双指冲刺+跳跃、暂停冻结与按钮不遮 canvas。禁用 IndexedDB 后有保存警告，仍能开始游玩。不是手机实机性能验收。

跑步当前仍为大步幅 v3 的 12 个核心全身姿势，176px 一轮；普通/冲刺 240/330px/s，约 16.4/22.5 次姿势切换每秒。120 是渲染上限，不是 120 张新原画。完整裁切、相位与腿轮廓测试不证明严格左右腿交换、脚滑≤4px或最终动作观感。被否决的拆分关节图只在 tests/fixtures，数学检查不代表正式画面。

首包 WASM 39,514,754 字节、PCK 15,308,632 字节（未压缩），加外部 UI 后超过 ≤25MB 目标；尚未做模板裁剪/按需关卡包。跑姿精修、所有移动高台连接极值、真人试玩平衡、手机实机帧耗、Canvas→Godot 存档迁移、原生 UI/完整声音仍是后续品质门槛。不得将本开发版改名 v0.4.0-alpha 或声称达到 Steam 上架品质。

长线剧情、Boss/选角/换装/合作仍属设计稿，见 docs/2026-10-01-world-story-bible.md。交付明细及实施取舍见 docs/2026-10-01-godot-development-delivery.md。美术来源与完整工具提示词见 assets/ASSETS.md 和 assets/CAMPAIGN-PROMPTS.md。
