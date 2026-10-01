# Partner 12-key run artwork — 2026-10-01

## Final focused v3 edits (both rejected)

Each edit used only the corresponding v2 raw sheet as edit target, built-in image_gen.imagegen, transparent_background=true. Both outputs were inspected locally before selection. Originals v2 were preserved.

- Meng v3: godot/assets/meng-run-v3-review.png, generated exec-82ac4edb-5d3f-48bc-b542-8a88e89680c4.png. 12 connected bodies remain, but opposite contact height only partially improves; arms/leg-role exchange remain unclear and key11-to0 extension mismatch becomes worse. No packed/runtime replacement.
- Cao v3: godot/assets/cao-run-v3-review.png, generated exec-2d3060f8-38af-46a0-8bde-526a45a59cb3.png. Neighboring row bodies touch; lossless component isolation reports10 connected bodies rather than12. Unsafe row adjacency and unchanged arm/leg-cycle issues; no packed/runtime replacement.

The two requested focused edits are complete. Current v2 wiring stays a structural preview. The user goal of matching Beibei running smoothness has not been visually satisfied. Native proof was captured with Godot's project content scale explicitly760x260; both directions are represented. Normal and25% APNGs preserve each native screenshot pixel with no frame blending. These expose the motion issue; they do not establish passing anatomy or planted-foot sliding.

### Meng v3 focused edit prompt

```text
Edit this Meng transparent running spritesheet. Keep his face, dark round glasses, tousled dark hair, anime academy illustration style, navy waistcoat, white shirt, red tie, navy trousers and brown shoes unchanged. Keep exactly 12 separate full-body original keys arranged 4 columns x 3 rows in temporal order. Preserve genuine transparent background.
Correct the run-cycle anatomy and two foot contacts. One consistent anatomical body is animated: identical head size, torso length, thigh length and shin length throughout. The first key (top left) and seventh key (second row third cell) are opposite-leg forward heel contacts. BOTH must reach the SAME imaginary floor line relative to their equal cells, and have the SAME head-to-floor height, shoulder/head position and wide stride extent. The seventh must not have shorter legs. The last key (bottom right) is a near heel moving just above its next contact, so it transitions smoothly into the first without a sudden foot-height jump.
Animate a single coherent cycle: six keys from NEAR leg forward contact through compression, passing under the hips, toe push-off, knee recovery and FAR leg precontact; then six equivalent phases with FAR and NEAR roles exchanged. The two arms also exchange roles in the second half, bent elbows counter-swinging against the opposite legs. Make the near and far leg contours clearly readable and genuinely alternate, not the same right-facing stride copied repeatedly. Near leg slightly lighter and far leg slightly darker consistently. Stable torso lean and head only slight natural bob. Flight foot lift comes from the knees, never shortened anatomical legs.
Every drawing must contain one connected full head-neck-torso-hips-two complete thighs-knees-shins-ankles-and-two complete shoes. Equal-sized cells with generous empty transparent gutters all around, no clipping or neighboring feet. No labels, grid, lines, ground, shadows, motion blur, ghosting, crossfade, spare body parts or realistic photo rendering.
```

### Cao v3 focused edit prompt

```text
Edit this Cao transparent running spritesheet. Keep his same face, fluffy dark curly hair, fair skin, wide sturdy shoulders and body, forest green academy cardigan with white cuffs, white shirt, navy tie, light taupe full trousers and complete white sneakers unchanged. Same crisp anime illustration. Exactly 12 separate full-body original keys in 4 columns x 3 rows temporal order. Preserve genuine transparency.
Correct the consistent anatomy and two foot contacts. Animate ONE anatomical model with exactly the same head size, torso, thigh and shin lengths in every key. First key (top left) and seventh key (second row third cell) are opposite-leg heel contacts. Make BOTH reach the SAME imaginary floor line relative to equal cells, with the SAME head-to-floor height and wide stride width. Do not shorten the legs at seventh contact. Last key (bottom right) must lead naturally into first: the arriving near heel is just above its next contact, not a big vertical jump.
A coherent running cycle alternates six phases on NEAR leg followed by six matching phases on FAR leg: forward heel contact, knee compression, passing under hip, toe push-off, recovery/floating, opposite leg precontact. The entire second half EXCHANGES arm and leg roles, maintaining the same profile and body lean. Bent elbows counter-swing to opposite legs. Distinct near/far leg contours and subtle consistent far-leg darker shading. Show clear actual leg alternation, not the same stride pose repeated. Stable head and torso with small natural bob; foot lift comes from knee bend and hips, never shrinking anatomical limbs.
Keep one fully connected whole body in every key: head,neck,torso,hips,two thighs,knees,shins,ankles and two COMPLETE white shoes. Same scale and generous transparent space around each sprite on all sides. No fragments, clipping, neighboring shoes, extra limbs, labels, cell borders, shadows, ground line, background, motion blur, ghosting, crossfade, text or photorealism.
```


Tool mode: built-in image_gen.imagegen with referenced_image_paths and transparent_background=true. No API/CLI fallback.

Selected raw originals: godot/assets/meng-run-v2.png and godot/assets/cao-run-v2.png. Runtime copies: godot/assets/meng-run-packed-v2.png and godot/assets/cao-run-packed-v2.png. Matching JSON metadata records the original source anchors, one-pixel scale, and ink margins. 12 connected bodies per sheet were isolated using the user-authorized tools/pack-poses.py; crop/pad/repack only, no repaint, rescale, morph, limb splitting, neck patch, duplicated key or alpha crossfade.

Runtime cells are 448x432 with explicit anchor (224,400), 176 world-pixels per 12-key cycle. Fixed whole-family run scales are Meng 0.381 and Cao 0.391; existing nonrun actions and corrected Cao standing art keep their original fixed scales. Standing stature remains Beibei/Meng approximately 133 world pixels and Cao143.47, representing 170:183cm.

Structural acceptance: 12 distinct original RGBA bodies, unchanged packed pixels, empty margins ≥32px Meng/≥23px Cao, stable top-of-head anchor within8 source pixels, independent distance phases, mirrored floor anchor, immediate idle/action selection. These checks do not measure anatomical leg identity or planted-foot sliding. Normal/25% loop and in-campaign/browser inspection are separate visual acceptance, not implied by unit tests.

Visual status: not accepted as a smooth anatomical run cycle. Native Godot screenshots at the gameplay scale are in ignored artifacts/partner-run-proof: run-00.png through run-11.png, idle.png, partner-run-normal-speed.png (61ms per key), and partner-run-quarter-speed.png (244ms per key). Raw chronological order does not establish actual near/far leg alternation; most arm keys retain similar silhouettes. With stable head anchors, the intended opposite contact (key6) has its shoes about 13 world pixels higher for Meng and12 for Cao than key0. Last key11 to key0 also moves the lowest shoe vertically by approximately9.1 world pixels Meng and6.3 Cao. Reordering cannot repair that anatomical extension mismatch; aligning each shoe by changing vertical anchors would instead make the head jump. This v2 is a complete-body structural preview, not final motion-quality acceptance. The refined Meng generation did not fix this and is excluded.

Generated source provenance:
- Meng: exec-263135ee-06df-4df9-bd2f-fef1934756a6.png under generated_images/01a0f69e-ce2f-7a00-982a-6df5823b8eca.
- Cao: exec-d434c36f-6d19-4aaf-8523-c978cc3e7a4f.png under the same generated-images directory.
- A targeted Meng proportional refinement was attempted as exec-da22780f-e4f2-490d-8354-a6d77b0ca3a8.png. It did not materially correct the pose ordering/extension variation and was not selected. Selected raw sources remain unchanged.

References were inspected locally before generation: Beibei run-wide-v3 for rendering/fullbody motion and each partner's actions-packed-v1 for identity/costume.

## Meng selected prompt

```text
Use case: stylized-concept
Asset type: production Godot 2D transparent full-body run-cycle spritesheet, 12 distinct original animation drawings.
Input images: Image 1 is Beibei's running sprite sheet, use only as linework/rendering, dynamic complete-body motion and composition reference. Image 2 is Meng's identity/costume reference; preserve his character identity. These are references, not images to paste.
Primary request: Draw Meng, the boy in Image 2, doing a genuinely smooth complete RUN CYCLE facing right, all 12 original poses in exact temporal order. Anime academy game illustration, crisp consistent ink and soft clean shading like the references. Black tousled hair, unmistakable dark round glasses visible on EVERY frame, playful focused expression, white rolled sleeve shirt, navy waistcoat, red tie, navy full-length trousers, brown leather shoes. Slim compact 170cm young adult proportions. Complete connected head-neck-torso-arms-hips-two legs-two complete shoes in every pose.
Composition: exactly 4 evenly spaced columns x 3 evenly spaced rows, 12 sprites. Each sprite alone in its own equally sized generous cell, same native scale, same head size, same stable torso x position, full body visible, generous transparent gutters of at least 10% of the cell width and 5% at top/bottom. No limb or shoe crosses into neighboring cells. Side profile with a slight 3/4 face like references. No labels.
Motion sequence, near leg is viewer-side and must alternate with far leg:
0 near heel reaches forward and far leg extends behind, wide contact;
1 near knee compresses while far heel recovers up;
2 near foot moves under hip, far knee swings forward, passing;
3 near toe pushes off behind, far knee high in front;
4 airborne, far knee opens into forward reach and near heel folds behind;
5 far heel reaches toward ground, near thigh recovers behind;
6 far heel forward contact, near leg back, opposite of0;
7 far knee compresses while near heel recovers up;
8 far foot under hip, near knee swings forward, opposite passing of2;
9 far toe pushes off behind, near knee high in front;
10 airborne near knee opens into forward reach and far heel folds behind;
11 near heel reaches toward contact and far thigh recovers behind, flows smoothly into0.
Keep same character/head/hair/glasses, torso lean, clothing colours and scale in all frames; head only modest natural few-pixel vertical bob. Arms counter-swing with alternating legs, elbows bent naturally. Distinct knee bend/stance/passing/push-off/flight phases; do not repeat poses. Both legs trace cleanly from hips to shoes, no fused shins or missing far leg. Keep shoe style/colour consistent. Genuine transparent RGBA background, no ground, shadows, scenery, borders, texts, numbers, motion lines, ghosting, transparency crossfade, montage fragments, spare feet or stray pixels. Production sprites, not a poster, no photorealism.
```

## Cao selected prompt

```text
Use case: stylized-concept
Asset type: production Godot 2D transparent full-body run-cycle spritesheet, 12 distinct original animation drawings.
Input images: Image 1 is Beibei's running sheet, use only as consistent anime linework/rendering, complete-body motion and stable composition reference. Image 2 is Cao's identity/costume reference. Preserve Cao, not Beibei.
Primary request: Draw Cao, the boy in Image2, in a truly smooth complete 12-frame RUN CYCLE facing right. Same head/hair/face and outfit in every frame. Anime academy game illustration, crisp ink and clean soft shading. Fair/light skin, tousled fluffy dark curly hair, no glasses, broad shoulders and noticeably wider torso and sturdy limbs than Meng, taller adult 183cm proportions; human-sized, not a giant. Deep forest green academy cardigan with white striped cuffs, white shirt, dark navy tie, light taupe full-length trousers, complete white sneakers. Focused mild friendly expression. Full connected body from hair to both shoes.
Composition: exactly 4 equally spaced columns x3 equally spaced rows,12 sprites ordered left-to-right then top-to-bottom. Each sprite alone inside a generous identical cell, same native scale/head size, stable torso x-axis, allbody visible. 10% cellwidth transparent sidegutters and5% cellheight top/bottom gutters. No overlap acrosscells. Sideprofile with slight3/4face matching references. No labels.
The near leg is clearly the viewer-side leg; far leg has subtle consistent darker occlusion shading. Gait must actually alternate which leg leads. Twelve distinct temporal keys:
0 near left leg reaches forward heel-contact, far right leg extended behind;
1 near left knee compresses, far right heel bends back;
2 near left foot passes under hip and then behind, far right knee swings forward;
3 near left toe pushes behind hip, far right knee raised forward;
4 bothfeet airborne, far right shin extends forward while near left heel folds up behind;
5 far right heel approaches ground infront, near left leg recoversbehind;
6 far right forward heel-contact with near left leg extendedbehind (opposite0);
7 far right knee compresses, near left heel bendsback (opposite1);
8 far right foot passesunderhip thenbehind, near left knee swingsforward (opposite2);
9 far right toe pushes behindhip, near left knee raisedforward (opposite3);
10 bothfeet airborne, near left shin extendsforward and far right heel foldsback (opposite4);
11 near left heel approaches groundinfront and far right leg recoversbehind (opposite5), smoothly connectsto0.
Bent arms COUNTERSWING with opposite legs, not the same elbow pose in everyframe. Complete thighs, knees, shins, ankles and two full white shoes remain visibly connected; separate overlapping leg contours cleanly. Stable head size, gentle natural verysmallverticalbob, same body lean andviewangle. No duplicated keys, no mirrorface, no isolatedspareshoes, no legstumps or fusedknees. Genuine transparentRGBAbackground, no backdrop, ground, castshadows, motionstreaks, annotations, gridlines, texts, letters, ghosting, crossfade, or watermark. Original fullbody drawings, no collage of limbs, no photorealism.
```

## Meng targeted refinement prompt (not selected)

```text
Use case: identity-preserve
Asset type: refined 12-key Godot 2D transparent full-body run spritesheet.
Input image1: the current Meng running spritesheet to refine. Input image2: Beibei style reference only.
Keep Meng identity, dark round glasses in everyframe, black tousledhair, navywaistcoat, whiterolledsleeves,redtie, navytrousers, brownshoes, animeacademy rendering.
Correct only motion/consistency: ALL12 drawings must use exactly the SAME HEAD SIZE, shoulderwidth, torsoheight, thighlength and shinlength. Current firstrow figures appear taller thanlaterrows; eliminate this shrinking. A single anatomical model animates. Frame0 andframe6 are opposing heelcontact and must have the samecompletebodyheight. Camera doesnot move/zoom. Torso orientation steadylean forward10degrees, head/eyeposition stable,4pxgentleverticalbob maximum. No abrupt torsorotation betweenframes. Identical cellheight andbaseline inall3rows.
Create a coherent complete one-stride12key run cycle, exactly4columns x3rows temporalrowmajor:
0 near left leg forward heelstrike, far right legback;
1 near left legloads with kneecompressed, far right heel foldsback;
2 near left legstraight underhip movingback, far right knee liftsforward;
3 near left toe behindhippushesoff, far right knee highestforward;
4 flight, nearleftheel foldsback, farrightleg extendsforward;
5 farright forwardprecontact, nearleft recoveringback;
6 farright heelstrike, nearleftlegback (sameanatomicalheight as0);
7 farrightloadscompressed, nearleftheel foldsback;
8 farright straight underhipmovingback, nearleftknee liftsforward;
9 farrighttoebehindhippushesoff, nearleftkneehighestforward;
10 flight, farrightheel foldsback, nearleftshinextendsforward;
11 nearleft forwardprecontact, farrightrecoveringback.
Nearleg has consistent slightly lighter trouser shading; farleg darker behind it, actual leg alternation obvious. Botharms counter-swing naturally. Frame0and6 differentarms/legs, frame2and8 oppositepassing, no repeatedposes. Consistent proportions. Gentle4pixelheadbob, shoeslift naturallyduringflight and recovery; contactshoestouchsameimaginarybaseline. Head,neck,body,hips,both thighs,knees,shins,anklesandfullshoes remain connected; no splitbodyor collage.
Composition: Draw sprites at samehighresolution native scale. Exactly4x3, equalcellsize, generous emptytransparent guttersaroundEVERYpose,especiallybelow shoes and betweenthe rows. Leave20%ofcellwidthforgutter. No labels/numbers/text/grids/shadows/backgrounds. Preserve genuine transparency. Crisp original illustration with no motionblur,ghosting,crossfadeor sparelimbs.
```
