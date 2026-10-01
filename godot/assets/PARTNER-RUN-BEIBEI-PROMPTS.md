# 孟／曹与贝贝同类完整跑步帧：生成记录

日期：2026-10-01。模式：内置 ImageGen 编辑／参考生成，三次均使用 referenced_image_paths 和 transparent_background=true。生成器原图保留；运行素材只经过用户授权的无损像素隔离、裁切、透明边距与打包。

## 采用与拒用

- 孟初稿：exec-45f1eee0-b2a4-48cc-b147-148b6b00882f.png；末行鞋尖被图边切断，未采用。可恢复备份在本机忽略目录 artifacts/rejected-partner-fullbody。以下排版修正版替代它。
- 孟采用：exec-6c98291e-2364-4b59-8ba7-b26d8fc2e6ba.png → meng-run-beibei-style-v2.png。
- 曹采用：exec-4902ed26-e503-4b89-806d-8a40255ba53c.png → cao-run-beibei-style-v1.png。
- 两套源图均为1448×1086 RGBA；对应 run-beibei-packed-v1.png 与 JSON 保留原始像素及显式原图锚点。JSON 中各帧最小透明边距27px；输出1792×1296，四列三行，虚拟锚点224,400。
- 用户否定的拆分肢体尝试已退出运行代码与导出白名单，本机备份在 artifacts/rejected-partner-rig。不是最终交付素材。

## 参考图来源

1. beibei-run-wide-v3.png：项目现有已采用贝贝完整人物十二姿势，参照动作流程与画风，不更换贝贝。
2. artifacts/partner-run-v4/meng-identity.png：从项目原有 meng-run-v2.png 无损裁出的角色脸／服装参考，无真人新输入。
3. 孟排版修正以本轮初稿为编辑目标；不使用拆分部件图作为新全身图的参考。
4. 曹以采用的孟修正版作为姿势／排版参考；artifacts/partner-run-v4/cao-identity.png 是从项目原有 cao-run-v2.png 无损裁出的脸／服装参考。保留较白肤色、较壮体型、绿开衫／卡其裤／白鞋，无眼镜；运行时身高与原有183:170设定一致。

## 孟初稿完整提示词

~~~text
Use case: style-transfer. Create a COMPLETE FULL-BODY twelve-frame running sheet for Meng. Image 1 (Beibei) is the user's APPROVED running movement and illustration template. Use its exact twelve whole-body poses, temporal order, broad stride, continuous neck, head/body proportion, lean, support and folded-leg recovery, and natural complete shoes. DO NOT design a new skeletal or cutout animation. Image 2 is Meng face/hairstyle/clothing identity ONLY. Replace Beibei in EVERY pose with Meng: tousled dark brown-black hair, dark round spectacles always, friendly focused youthful anime face, navy academy waistcoat over white rolled-sleeve shirt, red tie, navy full-length trousers, brown loafers. Same natural silhouette and body proportions as image1, not giant-headed, not chibi, not photorealistic. Keep shoulders male and limbs full anatomically connected, hips, knees, ankles, elbows and neck clean. Full pants follow the underlying leg gestures of image1; do not change gait because of costume. Each pose remains ONE completely drawn connected person, no assembly seams, no separated parts or joints, no detached neck, no hollow endcaps, no extra hands/shoes. Across all frames, identical face, spectacles, shirt, vest, tie, pants, shoes, fixed limb lengths and body scale. The frame order is exactly image1 row-major FOUR columns and THREE rows. Both arms visibly counter-swing with each same-side leg as in reference. Keep every complete figure generously inside its own equal invisible cell with at least24px genuine transparent gutters on all four sides; the source reference's clipped bottom row must be fully drawn, not clipped in new sheet. Head/hip placement stays on same authored baseline per cell, contact soles share same invisible floor; flight poses retain natural small lift. Crisp detailed illustrated colored anime linework and clean shading matching approved Beibei, readable at game size. Genuine transparent RGBA background, no painted checkerboard or dark fill, no glows, shadows, background, ground, labels, grid, text, trails, blur or spare fragments. Twelve full bodies, not limb parts.
~~~

## 孟排版修正版完整提示词

~~~text
Use case: precise-object-edit. Edit the twelve FULL-BODY Meng running drawings in this image. Keep these SAME twelve running poses, order, face, spectacles, navy waistcoat, white rolled-sleeve shirt, red tie, navy long trousers, brown shoes and crisp anime style. Change ONLY COMPOSITION and fit: this sheet currently has bottom/right shoes clipped and oversized for its 4x3 invisible cells. REDUCE EACH COMPLETE FIGURE uniformly to about 70% of its cell HEIGHT and center within its cell, keeping constant head/torso/thigh/shin proportions and scale across all twelve. Each cell must have at least40 pixels of truly transparent padding on all four sides. Four columns by three rows remains, NO visible grid. Every last shoe and hand must be entirely drawn within its own cell, including row3 col3 and col4. Redraw the previously clipped last shoe tips intact. Do NOT convert to cutout limb parts. Do NOT change pose gestures or head/body ratios to make fit. Do NOT stretch or squash, or leave one row at a different native scale. Each whole body stays seamlessly connected at neck and joints. Consistent head size and limb length across cells, small natural posture-related crouch only. Contact frames share invisible floor; flight retain small lift. True transparent alpha PNG; no diffuse halos, no backdrop, no shadows, checkerboard, ground, labels, text, fragment, trailing ghost. Professional production atlas with generous completely empty transparent gutters.
~~~

## 曹完整提示词

~~~text
Use case: style-transfer. Make Cao's complete twelve-frame running atlas in the SAME movement as approved Beibei. Image1 is the whole-body motion/pose/layout template already derived directly from Beibei. Image2 is Cao identity and clothes ONLY. Replace every Meng figure in image1 with Cao, preserving precisely all twelve leg poses, temporal order, leaning torso, arm counter-swing, proportions, native head/limb scale and generous empty gutters. Cao is not a photographic person: crisp colored anime character matching the template. Fair/light complexion, fluffy curly dark hair, NO glasses, cheerful determined face; sturdy broader shoulders and slightly fuller build, NOT obese, NOT excessively muscular. Deep forest green academy cardigan with white trim/cuffs, white shirt, navy tie, taupe full-length trousers, complete white sneakers. Keep fixed body/head/thigh/shin proportions across all twelve frames. His 183cm stature compared to Meng/Beibei170cm will be applied by the engine uniformly; do not enlarge one pose or row. Each drawing is ONE complete seamless figure with intact head neck collar shoulders hips knees elbows hands and both shoes. NOT a cutout rig, no detached limb parts, joint sockets or mechanical-looking seams. Keep limb gestures identical to template, cloth folds follow them, no frozen extra limb or overlapping body ghost. FOUR invisible columns THREE invisible rows row-major; each full figure has at least35px genuine transparent padding all around within its cell, especially last row's shins and shoe tips. Preserve contact vs recovery vs high-knee vs wide airborne stances of the template. Readable dark contours and clean controlled cel shading, not photorealistic. TRUE transparent alpha PNG, no painted checkerboard, diffuse glow, backdrop, shadows, ground, text, labels, grid, motion blur, trails or extra feet. Twelve full-body poses.
~~~

## 验证边界

工具不能保证多帧严格解剖一致。Python验证12个独立连通身体、边距、原图像素不变、显式锚点和12张不同原画。新素材头顶变化约束为16源像素（运行缩放后约6.9世界像素），不是零头部起伏。原生预览检查全身／镜像／首尾，Web实际游戏检查接入；这些不等于严格左右腿交换、脚滑≤4px或用户最终观感认可。120是引擎渲染上限，不是120张新原画。
