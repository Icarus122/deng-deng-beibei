# 完整人物跑步候选 v2：内置 ImageGen 提示词

生成日期：2026-10-01。本轮使用内置 ImageGen，不使用 CLI/API 回退。最终候选复制为 `godot/assets/beibei-run-full-v2.png`；输入为本项目 `design/assets/academy-lineup-v4.webp` 中的贝贝，以及 `design/assets/beibei-run-guide-v1.png` 的 24 姿势布局。生成文件为 `exec-ee29accc-3d38-4050-88de-03944ac0b5ba.png`。

图像实际输出是 1254×1254 RGBA，不是提示中的 1536×1536。因此游戏使用完整人物的明确源框，不按预期格子等分裁切。主 alpha 连通区域为 24 个人物；未用修图遮盖身体碎片。生成器不能保证精确关节、步幅或风格一致，仍需循环、脚滑与人工视觉验收。

此前 `exec-d79301a7-158c-4fac-8f57-bb9360f626be.png` 底排被裁切且有重复姿势，已拒绝接入，不进入游戏资源。

```text
Use case: identity-preserve / game sprite animation.
Replace the old run artwork with a new correct FULL-BODY running animation, guided by the exact poses in Image 2.
Image 1: identity/outfit reference, ONLY the girl on the left, NOT either boy. Image 2: pose and layout guide, exactly 24 chronological complete run poses, six columns by four rows. Orange indicates the NEAR arm and leg, blue the FAR arm and leg; these colors are guides only, not clothes.
Draw ONE Beibei over EVERY guide figure, matching its pelvis, head center, knees, hands and complete feet positions closely. This is crucial: do NOT default to generic repeated running pictures. First two rows show near-leg support and far-leg swing, bottom two rows reverse the limbs. The near arm swings back to front to back. Preserve all 24 poses, 6x4 exact cell arrangement and generous outer margins, INCLUDING ALL SIX COMPLETE FIGURES IN THE BOTTOM ROW. All shoes remain inside the canvas and their own cells.
Use the reference girl's beautiful chestnut bob, small golden flower hairpin, expressive face, navy blazer with white fine piping, white shirt, burgundy bow, plaid pleated skirt, dark knee socks, brown loafers, no handbag. Clean refined 2D anime ink/cel shading matching her appearance. Same body proportions, clothes, face and hair across frames; consistent almost-side RIGHT view. Draw the neck continuously into the collar and head, not floating. Draw whole bodies, not cutout parts.
Output 1536x1536 genuine transparent RGBA. The complete character including hair and both full shoes fits within each 256x384 cell, with at least 16px safety padding; body height about 300px. No drawn grid or guide colors, labels, numbering, stick figures, floor, shadows, trails, duplicates, missing legs, cropped shoes, extra limbs or opaque background. Anatomically coherent knee bending, opposite arms/legs, slight contact compression and flight; legs alternate clearly. Follow Image 2's 24 different poses and leg front/back order, do not copy the same silhouette to every cell.
```
