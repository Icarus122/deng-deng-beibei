# 贝贝大步幅 v3 素材记录

2026-10-01，内置 ImageGen，真实 RGBA 透明背景。当前跑步改为 12 个完整核心姿势，不把重复图片凑为 24 帧。

- `beibei-run-wide-v3.png`：1448×1086，原输出 exec-02df152b-5238-4772-bab3-50535e83ee14.png；除第 4 帧外使用此图。原第 4 帧把引导颜色误画进鞋袜，不能直接用于游戏。
- `beibei-run-wide-color-v3.png`：同尺寸，原输出 exec-3aa7a053-f985-4ff7-8747-5c8b34e9ae69.png。仅使用修正为棕色鞋/藏蓝袜的第 4 帧；其他编辑后姿势有边界溢出，不使用。
- 先前 24 姿势请求输出实际只有 20 个姿势，exec-62465bc2-59d0-4aab-9c42-dab35277fcb1.png；拒绝，不接入。
- 运动引导由项目自己的几何姿势代码产生，4 列×3 行；输入参考为 v2 角色与大步幅引导。
- 使用每帧完整连通身体的显式源框，AtlasTexture 提供虚拟透明 margin 与 filter_clip。没有运行时人物碎片擦除、局部拉伸或全身叠图。参考 [Godot 官方 AtlasTexture](https://docs.godotengine.org/en/stable/classes/class_atlastexture.html)。
- 正常游戏速度 240px/s、冲刺 330px/s 不变。整轮 176px，12 个姿势，约 16.4/22.5 次姿势切换每秒；渲染仍固定物理 60Hz/上限 120FPS。渲染帧率不等于美术姿势数量。
- 自动边界/腿部展开检查不能证明动作顺序、支撑脚滑移或观感达到发布品质。专用跳跃动画仍待完善。本次只更新本地动作样板，不替换线上 Canvas 游戏。

## 核心姿势生成提示词

Use case: precise-object-edit. Asset: Beibei whole-body running sprite sheet. Input 1 is the character/outfit to preserve. Input 2 is the REQUIRED 12-pose anatomical guide in chronological order, 4 columns x 3 rows. Create EXACTLY TWELVE full-body sprites, not 20 or 24. Follow the guide's leg silhouettes and depth identities exactly: orange is the NEAR leg/arm, blue is the FAR leg/arm. First half: near foot reaches forward and plants, passes below hip, drives backward behind hip, toe pushes off; far knee unfolds into brief flight and prepares to land. Second half performs this with the FAR foot grounded and the NEAR leg swinging forward. Arms oppose their matching leg. This is a forward RUN, not repeated high-knee marching or walking. Wider front/back shoe spread by 20–25% than the current run; extended-stride poses need horizontal shoe spread about 80–85% of full-body height. Recovery heels fold naturally backward, supporting legs are not locked straight. Preserve the exact girl, face, connected neck, hair/star pin, navy JK blazer, red bow, white shirt, plaid skirt, dark socks, brown loafers, clear crisp anime linework. Stable body/face proportions and consistent side-three-quarter facing RIGHT; keep head over the same torso pivot and use natural small body bob. No full-body stretching. TRUE TRANSPARENT BACKGROUND with no background color or painted checkerboard, no shadows, no ground, no guides, no labels. Landscape sheet, 4 columns x 3 rows, all 12 complete heads/hair/arms/legs/shoes safely INSIDE their cells; at least 24px empty margins. Do not crop any limb. Twelve DISTINCT sequential poses and a natural frame12-to-frame1 loop. Repose only the character; never add accessories, extra limbs, duplicate frames, or costume changes.

## 鞋袜颜色修正提示词

Use case: precise-object-edit. Edit this existing 12-pose transparent Beibei running atlas. Change ONLY the incorrectly blue shoe/sock in row 2 column 1: make the shoe the exact same brown leather loafer color and dark sole as her other eleven poses, and make the sock the same dark navy as the other stockings. Preserve EVERY pose, limb silhouette, face, head/neck, costume, 4x3 layout, source scale, margins, and transparency completely unchanged. No blue/orange guide colors anywhere in character art. No new content, no resizing, no repacking, no background.

