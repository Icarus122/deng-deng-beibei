# 2026-10-01 素材提示词与来源

全部原画使用内置 ImageGen，不使用外部 API。原 PNG 保留不变。后续用户明确允许 Python 裁切和透明重打包，以确定性的连通像素分离解决相邻人物进入同一裁切框，派生布局不重画、不缩放人物，命令与锚点见 ASSETS.md 和输出 JSON。漫画文字由游戏 UI 绘制，不由图片生成。以下是素材候选记录，不代表动作质量或三关集成通过。只有贝贝独立动作已接入样板。

## 贝贝独立动作

目标：beibei-actions-v1.png。原输出：exec-ce0ffb95-ae2e-4adc-80ef-1a6ff0bbb025.png。

```text
Use case: stylized-concept. Asset: complete-body action sprite atlas for Godot anime academy platformer. Reference image 1 is girl identity and outfit ONLY; reference 2 is her whole-body game drawing style. Generate exactly SIXTEEN separate complete poses of ONLY Beibei in four columns x four rows, regular equal invisible cells with very generous transparent safety margins. True alpha background. Each pose full body connected neck/arms/legs/feet, consistent 4.5-head height, chestnut bob gold flower/star clip, navy academy blazer with light trim, white shirt burgundy bow, navy green plaid skirt, dark knee socks, BROWN loafers. Right-facing side-threequarter like running reference. Natural anatomy, appealing readable ink/cel-shaded drawing. Same pixel scale across poses, grounded poses use same sole baseline within cells, airborne poses share virtual baseline allowing legs lift. No bags. Left-right top-bottom: 1 relaxed standing confident; 2 small knees-bent jump anticipation; 3 upward leap extending back leg and raising leading knee; 4 apex tucked legs; 5 downward leap one foot forward landing-ready; 6 second-jump compact upward thrust arms; 7 gentle landing knees bent weight visible; 8 decelerating turn braking with rear heel and cautious expression; 9 hit recoil startled; 10 slip stagger arms balancing NO dismemberment; 11 fallen seated tears face hands nearby; 12 getting up one knee down with determined face; 13 right-foot kick fully extended modestly forward other foot planted; 14 happy celebration arms raised feet on ground; 15 sad crying seated wiping eyes; 16 concerned kneeling looking forward (friend help). EVERY CELL contains exactly one isolated complete character separated at least 25 transparent pixels from cell edges; entire scalp and both shoes contained. Body proportion remains same no bounding-box normalization. No text, labels, grid, floor, shadows, shoe fragments, particles, extra people, photo faces, guide colors. Single crisp full-body drawings, no motion blur, no copies pretending to animate.
```

## 第一关漫画

目标：comic-1.png。原输出：exec-2b41051b-03f0-4746-9e43-efb8ec721e0e.png。

```text
Use case: illustration-story. Original EIGHT PANEL comic atlas for academy game chapter1. Reference defines ONLY our characters. Exactly 4 columns x2 rows equal rectangular panels with black gutters. Clear thick ink/cel shadows, expressive simplified anime-comic faces, warm golden ginkgo campus festival twilight, NOT photorealistic. Beibei chestnut bob golden flower hairpin navy JK blazer white blouse burgundy bow plaid skirt knee socks brown loafers; Meng black hair glasses navy waistcoat white shirt red tie dark trousers brown shoes. SAME adult height170cm. No bags on Beibei. Story left-to-right: 1 wide academy courtyard clocktower preparing star lantern festival photo;2 Beibei happily fixing hair clip, determined wants whole group in photo;3 Meng teasing grin holding photo invitation;4 Meng playfully sprints right Beibei surprised/annoyed starts following;5 Beibei determined running over gentle campus steps while Meng glances back waiting ahead;6 footbridge Beibei catches invitation corner smiling triumphant catching breath;7 Meng apologetic lowers shoulders offers invitation and Beibei attentive;8 glowing star lantern unexpectedly flies toward river both surprised look at it. Every panel conveys unique event and different emotion, no generic repeated portraits. Compose faces/actions in lower 65% leaving upper sky/wall room for readable engine dialogue overlays. FULL complete characters when long shot; close-ups intentionally framed, not malformed. NO text letters numbers logos speech bubbles or watermark. Draw all eight at equal panel rectangles for code to crop. Original art; no proprietary game assets.
```

## 第二关漫画

目标：comic-2.png。原输出：exec-13800d40-a100-4132-bbf8-14e98c0c174f.png。

```text
Use case: illustration-story. ORIGINAL chapter2 comic atlas, exactly TEN panels, five columns by two rows equal rectangular panels black gutters. Reference image defines protagonists only. Beautiful strong clean ink anime comic with controlled cel shadows, expressive acting, warm turquoise riverside cargo street and navy-spired clocktower. Beibei chestnut bob gold flower clip navy JK blazer white shirt burgundy bow plaid skirt socks brown shoes, Meng black hair glasses always navy waistcoat white shirt burgundy tie dark trousers, SAME height170cm. Cao curled hair no glasses fair skin broader green cardigan taupe trousers cream shoes 183cm only8% taller. No borrowed logos, no lettering/speech bubbles. Upper portions room for engine text. Panels top-left to bottom-right:1 Beibei surprised watching runaway star lantern over riverside awnings;2 Meng seriously inspecting small locator bell glasses on;3 Beibei thoughtfully points to two paths cargo upper ledge and riverground;4 Meng playful salute gripping bell Beibei unimpressed;5 two protagonists running toward clocktower glowing lantern ahead over river;6 Beibei kicks BASKETBALL into bell-shaped bridge switch on wall, clear action physical orange ball;7 folding footbridge opens, Meng waits at far end looking nervously back;8 two friends carefully close lantern shell on clocktower workshop table relieved sweaty;9 Cao arrives with practical paper bag fair skin friendly dry smile joining others;10 close lantern bottom gray cracked star mark, three faces puzzled looking at it. Every frame distinct story-rich acting no reused portraits. Academy magic friendly world, no combat, no photoreal faces. Ten equal frames with clear gutters for programmatic crops.
```

## 第三关漫画

目标：comic-3.png。原输出：exec-b380f68c-1e51-42dc-b3e4-e7d15bdd1732.png。

```text
Use case: illustration-story. ORIGINAL SIXTEEN PANEL equal-grid comic atlas exactly FOUR columns FOUR rows, black gutters. Academy anime-comic confident clean ink and cel shadows, expressive simplified faces, friendly violet/navy night street with golden star lanterns and market stalls. Image1 defines identities ONLY. Beibei chestnut bob gold flower clip navy JK uniform burgundy bow plaid skirt socks brown shoes; Meng black hair glasses navy waistcoat white shirt red tie dark trousers; Cao fair/light skin dark curls NO glasses broader green cardigan white shirt navy tie taupe trousers cream shoes. Beibei and Meng170cm, Cao183cm only8% taller same ground body ratio not giant. Unique nocturnal shopping street not river map. Panels left-right top-bottom:1 three friends arrive at pretty star lantern NIGHT MARKET delighted Beibei;2 Meng eating second bag spicy snacks smug Cao skeptical;3 Cao practical shoulder bag holding tissue packet sets off toward street entrance;4 Meng playfully runs after Cao Beibei exasperated chases BOTH;5 wide downhill market street parade barrier being prepared, two men ahead Beibei behind;6 Meng pauses clutching belly at service-station bench mildly uncomfortable NOT medical danger/humiliation;7 Beibei kneels checking friend worried gentle Meng glasses intact;8 Beibei determined gestures WAIT then runs after distant Cao, Meng sits nods;9 Beibei catches Cao breathless worried Cao turns surprised;10 Cao calmly passes tissue pack from bag to Beibei serious helpful expression;11 Beibei now runs LEFT clutching tissues Cao follows behind on her RIGHT, delivery carts changing direction background;12 back at service station Meng accepts tissues embarrassed grateful Beibei relieved;13 Cao hides remaining snack bag with dry humorous smile two friends laugh;14 warm final group photograph all THREE friendly varied expressions under lantern fair Cao visibly8%taller;15 close quiet oldwall gray cracked star emblem subtle mystery;16 wide tranquil festival clocktower three small companions reunited. Each frame own unique meaningful action, no repeated portrait. NO text lettering symbols that look like fonts, no speech bubbles or logos, no watermark. Leave modest upper room for engine captions; compositional actors remain below. Whole fullbodies on wide shots, anatomical sound, hand/tissue interaction clear, no photorealism. Equal cell frames for safe code cropping.
```

## 孟动作候选

目标：meng-actions-v1.png。原输出：exec-c7097af3-5808-45b3-9534-3631e9094f4d.png。

```text
Use case: stylized-concept. Original complete-body action atlas of ONLY Meng Peijie, middle male from reference1. Reference2 shows game's whole-body cel anime style ONLY. Exactly SIXTEEN isolated full characters FOUR columns x FOUR rows, invisible regular cells, actual alpha transparent background. Meng slim same170cm as girl, black tousled hair, ROUND GLASSES IN EVERY FRAME, white rolled-sleeve academy shirt navy fitted waistcoat burgundy tie navy trousers BROWN leather shoes. No jacket carried over shoulder no bag. Keep connected neck and limbs, full clear shoes, same body scale and consistent right-facing threequarter side view. Top two rows are EIGHT DISTINCT ordered complete RUN cycle phases:1 left foot forward ground contact right arm forward right foot far back;2 left bearing bent knee other knee passes torso leftarmback;3 left toe push-off right leg extends forward arms counter;4 flight right foot prepares forward contact left heel folding;5 right foot forward contact left arm forward;6 right bearing left knee passing opposite arms;7 right toe push left leg extends forward;8 flight left leg preparing contact right heel folds. Meaningful broad forward/back running stride, NOT stepping in place/highknees, visibly opposite arm-leg timing, distinguish far limb via subtle shading not recolouring clothes. Bottom two rows:9 relaxed upright standing sly grin;10 upward jump both legs naturally airborne;11 descending one foot reaching ground;12 gentle landed knees bent;13 hit recoil surprised;14 seated fallen supporting himself with one hand;15 seated slightly hunched hands on stomach mildly embarrassed discomfort NO tears/blood;16 celebration relieved smile waving. At least25px transparent border around ALL ink in every cell including scalp and shoe tips, no components touching adjacent cells or canvas. Same face outfit scale across poses; no fragments, text, grid, background, floor, shadows, blur, repeated duplicate poses.
```

## 曹动作候选

目标：cao-actions-v1.png。原输出：exec-79c5a1a5-61bd-470e-971c-7cf607ef20b4.png。

```text
Use case: stylized-concept. ORIGINAL full-body action sprite atlas of ONLY Cao Jutai, rightmost from reference1. Reference2 provides wholebody game drawing style, not a pose to duplicate. Exactly SIXTEEN isolated complete bodies FOUR columns x FOUR rows, invisible equal grid, true alpha. Fair LIGHT ivory skin, friendly stylized anime face NOT photo, dark curly hair NO GLASSES, broader shoulders/sturdy body, forest-green academy cardigan white shirt navy striped tie taupe trousers ivory sneakers. 183cm compared170cm other protagonists, modest natural8% body-height increase, not giant/chibi. No bag. RIGHT-facing side-threequarter, confident clear ink cel shading, same pixel scale across all poses. Top two rows EIGHT DISTINCT natural full run phases:1 left foot forward touches ground rightarmforward other foot rear;2 left knee bearing right knee passes arms opposite;3 left toes push right leg reaches forward;4 airborne right foot prepares contact rear heel folds;5 right forward contact leftarmforward;6 right bearing left leg passes;7 right toes push left leg extends;8 flight left foot prepares contact. Broad readable forward/back stride and counter-swing arm, not marching/highknees. Bottomtwo rows:9 upright relaxed standing thoughtful;10 natural upward jump one knee raised other leg rear;11 descending feet preparing landing;12 mild landed knees bend;13 surprised hit recoil;14 seated fallen one hand bracing;15 kneeling offers helping hand concerned;16 standing celebration happy relieved wave. Both feet complete including sneaker toes, scalp/hands/neck all connected, all ink at least25px from cell and canvas edges. Never reuse duplicate poses, no fragmented shoes, clipping, shadows, particles, labels, grids, letters, checkerboard, blur or extra people. Keep every face/cloth colour consistent, feet on shared virtual ground for contact keys, natural lift in airborne keys.
```

## 夜市背景

目标：night-market.png。原输出：exec-d6463501-8cd7-469c-9acf-93928281474c.png。

```text
Use case: stylized-concept. Original high-resolution side-scrolling Godot 2D platformer NIGHT MARKET background. Charming magical academy old-city shopping street after dusk, navy sky, warm gold star lantern strings, shop windows, ivory stone and dark timber stalls, service station doorway, distant academy clocktower, restrained teal magic lamps. Crisp anime game illustration outlines/cel painted shading matching friendly academy world, NO photo texture. 16:9 wide panorama, STRICT side-on game camera, storefronts behind open broad horizontal slate pedestrian road in lowest25% at y about80% image height. Streetscape extends off left and right naturally; no dramatic perspective road receding diagonally, no giant foreground objects blocking player. Quiet readable area around character playing height, rich scenery above/behind. Unique commercial night street, NOT lakeside/riverside campus scenery. No characters, vehicles, dangers, collectible props, platforms, fences ghost images, textual shop lettering, UI, panels, logos or watermark. Actual collision ground and gameplay objects added separately by engine. Original world layout, no proprietary game landmarks. Full opaque background.
```

## 未采用跑步候选

目标：未导入默认游戏。原输出：exec-ab55a360-4d24-44f0-abfa-ad7145457d7a.png。

```text
Use case: stylized-concept.
Asset: twelve COMPLETE whole-body keyframes of one single anatomically correct RUN cycle for a 2D game. Image 1 is an IDENTITY/outfit reference only, not a motion reference: its running sequence was wrong. New drawing required.
Exactly 12 figures in 4 columns by 3 rows, generous real transparent padding, full heads AND shoes. Continuous neck connected naturally to collar in every frame. Crisp readable cel-shaded anime, no fragments or tiny detached components. Same chestnut bob, golden flower hairpin, navy blazer/white piping, red bow, white shirt, navy green plaid skirt, dark knee socks, brown loafers throughout. All figures facing RIGHT at identical side-view, identical proportions and fixed scale. Standard expressive eyes, determined but cheerful. Horizontal velocity is to right.
THIS IS A REAL LEFT/RIGHT RUN CYCLE, not twelve marching poses. Near leg is left; far leg is right. Near arm is left, far arm right. Near/far limb shading visibly distinguishes them. Hips stay in the same horizontal position in each cell. Shoulders counter-rotate slightly. Knees bend anatomically. Hair/skirt follow with tiny delay.
Reading row-major:
1 LEFT contact: near left foot ahead planted, far right foot behind airborne; FAR right arm forwards, NEAR left arm backwards.
2 LEFT compression: near left foot moves backward under hips, left knee absorbs weight; far right knee begins coming forward; arms halfway.
3 LEFT passing: near left stance foot behind hip, far right knee raised ahead; FAR right arm moving backwards, NEAR left arm moving forwards.
4 LEFT push-off: near left toe far behind pushes, far right thigh forwards; near arm forwards.
5 first flight: both feet CLEAR of virtual floor, far right leg extends forward preparing contact, near left leg folds behind; near arm forward.
6 RIGHT pre-contact: far right foot reaches ahead downward, near left heel folds behind; NEAR left arm FORWARDS, far right arm BACKWARDS.
7 RIGHT contact: far right foot ahead planted, near left foot behind airborne; NEAR left arm FORWARDS, FAR right arm BACKWARDS. This must differ from frame 1 by which limb is near and the arm direction.
8 RIGHT compression: far right stance foot moves backward under hip, right knee absorbs weight; near left knee coming forward.
9 RIGHT passing: far right stance foot behind hip, near left knee raised ahead; near arm moving backwards, far arm forwards.
10 RIGHT push-off: far right toe far behind pushes, near left thigh forwards; far arm forward.
11 second flight: both feet clear of floor, near left leg extends forward, far right leg folds behind; far arm forwards.
12 LEFT pre-contact: near left foot ahead descends toward next frame1, far right heel folds behind; FAR right arm FORWARD, near left arm BACKWARDS.
Cycle motion must clearly exchange which leg and arm is ahead after half a cycle. Wide but natural stride with distinct touchdown/compression/passing/flight. No duplicate poses, no walking, no standing on one leg in every frame, no same forward arm throughout, no shoe colour changes. No text/grid/floor/shadows. TRUE transparent background. Entire body ink at least 20px inside its own cell.
```

## 采用边界

未采用动作间距编辑候选 `exec-a1e693a8-2a02-46be-b341-6db65b6f658c.png`：实际为 1254×1254，仍有姿势侵入相邻矩形源框，未满足要求的 35px 留白，站立服装细节也有变化。没有用这张重画图替换原画。用户随后授权确定性 Python 裁切、透明边距与重新打包，采用该方式整理原始 16 动作而不改人物像素。

```text
Use case: precise-object-edit.
Image 1 is the EDIT TARGET, a 16-pose complete-body animation sheet. Change ONLY packing/spacing, preserve all 16 existing poses, character identity, costumes and expressions. Need SQUARE canvas 1536x1536 or larger, 4 columns by 4 rows. Each pose belongs to its own equally sized invisible cell, occupying at most 78 percent of cell width/height, leaving at least 35 pixels transparent space on EVERY side. Uniform scale for all sixteen bodies, not different scales per pose. No part of a figure may overlap the rectangular source region of any other figure: this is crucial. Existing hair/shoes at inter-row edges overlap rectangular crops; FIX by spacing, not deleting any body part.
Keep row-major existing actions: idle / crouch anticipation / upward jump / knees tucked apex; downward jump / double jump hands raised / landing compression / turning; hurt surprise / slip / seated fall / rising; kick / standing celebration / seated crying / concern crouch.
Every head neck hand thigh shin sock and brown loafer must remain complete, connected and clear. No alterations to navy white-piped blazer, white shirt, red bow, navy green plaid skirt, dark socks, chestnut bob and golden flower pin. Precise crisp cel-shaded anime same young woman throughout, not chibi, not photorealistic. No new poses, no duplicates, no auxiliary fragments. True transparent alpha, no grid, text, floor line, shadow or checkerboard. Figures must NEVER touch outside canvas edges.
```

## 原画重打包命令

在仓库根目录运行（Python 需要 Pillow 与 NumPy）。输出为新文件，原图不覆盖。每个源锚点由人工对照姿势填写，不按每帧墨迹居中或拉伸：

```text
python tools/pack-poses.py godot/assets/beibei-actions-v1.png godot/assets/beibei-actions-packed-v1.png --origins "196,334;550,334;910,334;1274,334;196,600;550,600;910,593;1274,600;196,836;550,830;910,835;1274,842;150,1081;550,1083;910,1073;1274,1071"
python tools/pack-poses.py godot/assets/meng-actions-v1.png godot/assets/meng-actions-packed-v1.png --cell 384 400 --origins "190,314;555,314;920,314;1278,314;190,600;555,600;920,600;1278,600;190,871;555,871;920,871;1277,854;190,1082;579,1071;913,1068;1285,1070"
python tools/pack-poses.py godot/assets/cao-actions-v1.png godot/assets/cao-actions-packed-v1.png --cell 384 400 --origins "190,301;555,301;920,301;1278,301;190,585;555,585;920,585;1278,585;190,829;555,851;920,851;1291,826;190,1080;587,1069;924,1079;1303,1079"
python tools/test_pose_pack.py
```

选择最大连通身体后，仅保留与该身体相连的原有抗锯齿像素，去掉原图分离的小噪点；不重画、不重采样。原图与锚点清单一起保留以便复核。脚接触位置仍需按动作逐帧验收，安全边距不是步态正确证明。


跑步新候选 exec-ab55a360 未采用：尾帧鞋子到达画布下边缘，左右腿/摆臂关系和动作顺序仍需人工修正。不能靠改帧率、拉伸身体或遮挡碎片弥补。不再次无条件批量生成。

沿用的 `world-map.webp`、`home.webp`、`riverside.webp`、`clocktower.webp`、`props.png` 分别来自项目内 design/assets/campaign-map-v2.webp、design/assets/home-academy-v1.webp、assets/bg-riverside-story-v1.webp、assets/bg-clocktower-story-v1.webp、assets/props-atlas-v2.png。未新增第三方游戏资产。字体许可和引擎声明见 ASSETS.md。

## 2026-10-01 机关透明提取与曹完整站姿

工具模式：内置 ImageGen，真实透明背景；参考本项目人物原画，不上传照片。机关编辑输入 exec-c6f0795c-b30a-4d20-9144-a5ca0940bce0.png，输出 exec-77d2ce88-12a4-46db-9854-1d140637eb8e.png；原图保存为 campaign-props-v3.png，像素隔离后为 campaign-props-packed-v3.png。单独曹站姿输出 exec-823fe048-fa51-4b23-9fe8-48345a4f6669.png，保存 cao-idle-v2.png；像素隔离/原锚点打包到 cao-idle-packed-v2.png。

### 机关最终编辑提示词

```text
Use case: background-extraction. Image 1 is the edit target: four illustrated academy game props in a two by two atlas. Remove ONLY all black/brown/grey exterior backgrounds, light halos, bloom and ground shadows, preserving the entire bell arch, tissue box, hanging lantern and blue-gold checkpoint flag exactly with their original crisp ink and internal painted colours. Keep all four objects in the same 2x2 arrangement, same style/proportions and generous margins. Actual transparent alpha outside each solid object including inside the bell arch, around the flagpole and between objects. No diffuse coloured pixels anywhere beyond the physical silhouette; no glow around lantern (its inner glass can remain bright). Complete stone bases and flag tips contained with at least 32 transparent pixels on every side. No checkerboard, additional elements, text or labels. These are isolated gameplay sprites, not product presentation.
```

### 曹站姿最终生成提示词

```text
Use case: stylized-concept.
Image 1 identity reference: ONLY Cao Jutai in green cardigan. The idle pose in row3col1 of this reference is incomplete: do NOT copy its truncated trousers.
Draw ONE original COMPLETE full-body neutral standing Cao Jutai, natural right-facing three-quarter view, on true transparent background. Head AND BOTH FEET fully visible, all ink at least60px away from canvas edges. Fair ivory skin, friendly stylized anime face, tousled curly dark hair NO glasses, broad shoulders/sturdy build, forest-green academy cardigan with ivory piping, white shirt/navy tie, taupe full-length trousers, two complete IVORY SNEAKERS. Calm thoughtful slight smile, one hand lightly touching chin, other relaxed. Tall183cm natural anime proportions compared170cm friends, not giant, not chibi, not photorealistic. Same cel-shaded line style, clear connected neck/head, trouser legs naturally continue through shins to both shoe soles. No chopped lower legs, props, bag, text, floor/shadow/checkerboard, duplicates or extra figures.
```

```text
python tools/pack-poses.py godot/assets/campaign-props-v3.png godot/assets/campaign-props-packed-v3.png --origins "449,479;1109,469;450,996;1102,1008" --columns 2 --cell 512 640 --anchor 256 600
python tools/pack-poses.py godot/assets/cao-idle-v2.png godot/assets/cao-idle-packed-v2.png --columns 1 --cell 1152 1664 --anchor 576 1600 --origins "512,1490"
```

未采用的新跑步候选：exec-1e59cd4e（姿势交换不明确）、exec-88e62e84（参考色污染鞋袜）、exec-91383d0f / exec-5399ea1e（单姿势风格/比例及发光不一致）。不把它们混进正式跑步，继续保留大步幅 v3；动画品质门槛仍未通过。

