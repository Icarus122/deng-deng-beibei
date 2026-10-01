extends AnimatedSprite2D

const SHEET = preload("res://assets/beibei-run-wide-v3.png")
const COLOR_SHEET = preload("res://assets/beibei-run-wide-color-v3.png")
const Actions = preload("res://scripts/beibei_actions.gd")
const CYCLE_DISTANCE := 176.0
const PADDING := 8.0
# Complete connected bodies; virtual margins avoid sampling adjacent painted frames.
const SOURCES := [
	Rect2(48, 29, 305, 359),
	Rect2(439, 22, 226, 364),
	Rect2(840, 26, 171, 357),
	Rect2(1205, 24, 165, 358),
	Rect2(47, 399, 303, 353),
	Rect2(408, 395, 315, 348),
	Rect2(793, 400, 259, 348),
	Rect2(1157, 400, 248, 349),
	Rect2(128, 753, 164, 331),
	Rect2(488, 753, 166, 281),
	Rect2(775, 757, 302, 326),
	Rect2(1149, 759, 298, 324)
]
# Face/torso landmarks and contact baselines are explicit; ink bounds are never auto-centred.
# Flight keys retain a small authored lift instead of forcing every shoe onto the floor.
const ORIGINS := [
	Vector2(194, 386),
	Vector2(552, 385),
	Vector2(908, 382),
	Vector2(1274, 381),
	Vector2(200, 751),
	Vector2(552, 748),
	Vector2(912, 747),
	Vector2(1280, 748),
	Vector2(194, 1083),
	Vector2(552, 1083),
	Vector2(916, 1083),
	Vector2(1282, 1083)
]
const AIR_KEYS = Actions.KEYS

var runner: CharacterBody2D

func _init() -> void:
	sprite_frames = SpriteFrames.new()
	sprite_frames.remove_animation("default")
	sprite_frames.add_animation("run")
	for i in range(SOURCES.size()):
		var texture := AtlasTexture.new()
		# Only the corrected brown-shoe pose is used from the edit; other edited frames overflow.
		texture.atlas = COLOR_SHEET if i == 4 else SHEET
		texture.region = SOURCES[i]
		texture.margin = Rect2(PADDING, PADDING, PADDING * 2.0, PADDING * 2.0)
		texture.filter_clip = true
		sprite_frames.add_frame("run", texture)
	for name in AIR_KEYS:
		sprite_frames.add_animation(name)
		var texture := AtlasTexture.new()
		texture.atlas = Actions.SHEET
		texture.region = AIR_KEYS[name][0]
		texture.margin = Rect2(PADDING, PADDING, PADDING * 2.0, PADDING * 2.0)
		texture.filter_clip = true
		sprite_frames.add_frame(name, texture)
	animation = "run"
	centered = false
	# Same approximate on-screen body height; no horizontal stretching to fake a stride.
	scale = Vector2(0.37, 0.37)
	texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR

func running_frame(distance: float) -> int:
	return floori(fposmod(distance, CYCLE_DISTANCE) / CYCLE_DISTANCE * SOURCES.size())

func display_distance(fraction: float) -> float:
	return lerpf(runner.previous_run_distance, runner.run_distance, clampf(fraction, 0.0, 1.0))

func _process(_delta: float) -> void:
	if runner == null:
		return
	var index := running_frame(display_distance(Engine.get_physics_interpolation_fraction()))
	var source: Rect2 = SOURCES[index]
	var origin: Vector2 = ORIGINS[index]
	var key := "run"
	if AIR_KEYS.has(runner.action):
		key = runner.action
	if key != "run":
		source = AIR_KEYS[key][0]
		origin = AIR_KEYS[key][1]
		index = 0
	animation = key
	frame = index
	# The feedback sheet was drawn at a smaller native art scale than the run sheet.
	# One fixed scale per asset family; crouched/airborne poses are never stretched to fit.
	scale = Vector2.ONE * (0.37 if key == "run" else 0.41)
	flip_h = runner.facing < 0.0
	var local_origin := origin - source.position + Vector2(PADDING, PADDING)
	var frame_width := source.size.x + PADDING * 2.0
	offset = Vector2(local_origin.x - frame_width if flip_h else -local_origin.x, -local_origin.y)
