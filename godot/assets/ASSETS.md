# 样板素材与来源

2026-10-01 接入更新：本目录现用于单独的 Godot 三关开发版，孟/曹反馈动作、三关漫画、夜市、学院首页/地图均已接入 Web。旧段落中“未接入”是早期记录，以本段为准；接入不等于画面质量验收。曹原第 8 帧仍拒用，新 cao-idle-v2.png 为内置 ImageGen 单独生成的完整站姿，cao-idle-packed-v2.png 仅透明留白/像素隔离，原图不改，锚点与尺寸见对应 JSON。运行时使用固定 .0978 比例匹配身高，非逐帧强拉伸。

campaign-props-v3.png 为内置 ImageGen 学院机关原图（真实 alpha）；campaign-props-packed-v3.png 用相同无重采样隔离工具输出 4×512×640 单元格，铃铛/纸巾/灯笼/旗帜按原序，至少 30px 留白。实际铃铛与纸巾/检查点旗帜已接入，灯笼暂留素材，不新增碰撞。原稿中的散漫光晕不进入连通实物源框；不是用游戏里的遮盖矩形去擦边。

Godot 4.7.2 引擎 MIT 及完整第三方版权分别在 GODOT-LICENSE.txt / GODOT-COPYRIGHT.txt，直接来自官方同版本 tag，与 FONT-LICENSE.txt 一起复制到 Web 试玩目录。完整提示词/工具模式及未采用候选见 CAMPAIGN-PROMPTS.md。

2026-10-01：新增贝贝 16 个完整身体动作并接入样板。用户明确允许 Python 像素裁切/透明重打包后，以 `tools/pack-poses.py` 从三人的 `*-actions-v1.png` 输出 `*-actions-packed-v1.png` 与锚点清单；不重画、不缩放原身体，分离相邻姿势，保留连接的抗锯齿边缘，至少 12px 透明留白。原图保留不改。贝贝单元格为 384×384，孟/曹为 384×400；统一虚拟锚点为 (192,368)，每帧保留原图锚点记录。`tools/test_pose_pack.py` 逐像素核对三人共 48 帧的颜色/透明度不变与安全边距。孟/曹动作、三关漫画、夜市背景及地图候选尚未接入正式关卡。来源、完整提示词、未采用候选见 `CAMPAIGN-PROMPTS.md`。边界检查不能代替跑步动作、身高和实际游玩尺寸验收。

已确认不合格原画：曹第 8 帧（从 0 编号，第三行第一格）站立姿势的原图只画到裤腿上段，缺小腿和鞋。重打包保留的是原图像素，不能补出缺失肢体。此帧不允许进入正式角色动作；孟/曹整套仍是隔离候选，默认样板导出不包含它们。三人的跑步姿势次序与左右肢体交换也仍需单独校正，不能把 48 帧像素/边界检查称为 48 帧动作质量验收。

- `beibei-run-wide-v3.png` / `beibei-run-wide-color-v3.png`：2026-10-01 内置 ImageGen 大步幅核心姿势，均为 1448×1086 RGBA。当前跑步使用 12 个明确完整人物源框，仅第 4 帧取鞋袜修色版；其他修色版姿势未采用。以 AtlasTexture 虚拟透明边距隔离源框，不拉伸全身。完整提示词、被拒候选和验收边界见 `RUN-V3-PROMPT.md`。
- `beibei-run-full-v2.png`：2026-10-01 早期内置 ImageGen 完整人物候选，24 姿势、实际 1254×1254 RGBA；用户反馈像踏步，已由大步幅 v3 取代，保留为历史对照。完整输入/提示词及被拒候选记录见 `RUN-V2-PROMPT.md`。透明边界检查不证明动作自然。
- `beibei-run-full-v1.png`：用户在 2026-09-30 明确指定采用的完整人物十二姿势图片，原文件 `codex-clipboard-a29264b2-383c-42ba-96e3-63a6d8b4b931.png`，1254×1254 RGBA。原图保持不变，作为历史完整人物参考保留；当前样板已使用大步幅 v3，不再使用此图驱动跑步或临时腾空姿势。

- `beibei-parts-v1.png`：使用内置 ImageGen 生成的透明关节部件候选。参考本项目 `design/assets/academy-lineup-v4.webp` 中贝贝的外观；不使用真人照片。未人工精修，不宣称为最终角色模型。
- `beibei-parts-v2.png`：内置 ImageGen 修补同一候选的肩部露空和关节端口，保留脸、服装与部件位置；RGBA 1295×1215。绘制按图内真实关节标点进行等比例连接，不用单元格中心作为关节。仍是需要视觉验收的动作样板，不是最终模型。
- `campus.webp`：沿用本项目原创 `assets/bg-gate-story-v2.webp`；只是动作测试背景，不是新增正式关卡。
- `platforms.png`：沿用本项目 `assets/platforms-atlas-v2.png`，显式源框绘制。
- `academy-ui.otf`：Noto Sans CJK SC Regular 的样板字形子集；原文件 https://raw.githubusercontent.com/notofonts/noto-cjk/main/Sans/OTF/SimplifiedChinese/NotoSansCJKsc-Regular.otf 。原许可证见 `FONT-LICENSE.txt`（SIL OFL 1.1）。子集由 fontTools 制作，包含样板文字及 ASCII/心形/间隔符；新文字需重新生成子集。
- Godot Web 引擎来自官方 4.7.2 导出模板（仅提取两项单线程 Web ZIP，校验 ZIP CRC），按 MIT 许可证使用；引擎及第三方声明见官方 https://godotengine.org/license/ 。导出时必须随附完整引擎许可声明。

## v2 关节修补提示词（内置 ImageGen）

Use case: precise-object-edit. Asset: existing transparent cutout rig atlas for a 2D anime platformer.
Image 1 is the edit target. Change ONLY the exposed joint endcaps, keeping this exact girl's face, hair, flower pin, navy JK blazer, red bow, plaid skirt, stockings, brown loafers, all 12 part locations and relative dimensions unchanged. Keep the atlas layout and transparent background.
These are flat overlapping animation parts, NOT severed hollow tubes. On the torso replace the large bare round shoulder opening on its left with continuous navy blazer fabric. Upper sleeve shoulder and elbow ends and lower sleeve elbow ends should be rounded solid navy fabric extensions with no visible flesh cap, no outlined oval opening, no socket rim. Thighs are solid skin, calves solid stocking at their attachment ends: remove the oval cross-section outlines and use simple smooth rounded overlap ends. Preserve each part's silhouette and shading elsewhere. Hand keeps cuff. No text, guides, bones, assembled character or additional parts. Genuine transparent alpha, no checkerboard. Production crisp anime linework.

## v1 初始 ImageGen 提示词

Use case: stylized-concept. Asset: transparent 2D cutout animation parts atlas for a Godot side-scrolling game. Input image: identity and outfit reference ONLY the girl on the left. Create a clean professionally drawn cel-shaded anime character parts sheet, not a poster, not photorealistic, not chibi. She is Beibei: chestnut bob haircut, golden star hairpin, navy gold-trim academy blazer, white shirt, burgundy bow, navy-green plaid pleated skirt, dark knee-high socks, brown loafers. All parts seen from consistent side/three-quarter RIGHT, at same pixel scale, enough to assemble a complete 4.5-head-tall runner. TRUE transparent background. Twelve invisible equal cells in 3 columns by 4 rows. Each part centered with huge transparent padding, no ink anywhere near cell boundaries. Row 1: complete head with hair and neck / torso blazer with white shirt and bow NO arms / complete plaid skirt with waistband. Row 2: near upper arm sleeve vertical down / near forearm sleeve vertical down / small relaxed fist hand with wrist. Row 3: bare near thigh vertical down / near lower leg with dark knee-high sock NO shoe / near brown loafer toe RIGHT. Row 4: far bare thigh / far lower leg with sock NO shoe / far brown loafer toe RIGHT. Draw continuous rounded overlap caps at every shoulder/elbow/hip/knee/ankle pivot for clean articulation. Do NOT draw full bodies, do NOT attach arms to torso, do NOT put shoes on lower-leg pieces. No fragments, no extra limbs, no shadows, no text, no labels, no outlines of grid, no painted checkerboard. Thick crisp readable contours, simple controlled shading matching reference outfit. The isolated limbs must be complete and generously separated.
