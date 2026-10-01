extends AnimatedSprite2D

const SHEETS := [preload("res://assets/meng-actions-packed-v2.png"), preload("res://assets/cao-actions-packed-v2.png")]
const RUN_SHEETS := [preload("res://assets/meng-run-short-packed-v1.png"), preload("res://assets/cao-run-short-packed-v1.png")]
const CYCLE_DISTANCE := 176.0
const RUN_ANCHOR := Vector2(224, 400)
const RUN_SCALE := [0.418, 0.424]
# Fixed native-art scales, not per-pose ink-box normalization.
const ACTION_SCALE := [0.552, 0.676]
const ACTION_INDEX := {"idle": 0, "anticipation": 1, "jump": 2, "apex": 3, "fall": 4, "double_jump": 5, "land": 6, "turn": 7, "hurt": 8, "slip": 9, "fallen": 10, "rise": 11, "kick": 12, "celebrate": 13, "stomach": 14, "concern": 15}
var runner: CharacterBody2D
var character := 0
var sources: Array
var origins: Array[Vector2] = []

func configure(number: int) -> void:
	character = clampi(number, 0, 1)
	# Parent motion remains interpolated; frame-driven local scale must switch immediately.
	physics_interpolation_mode = Node.PHYSICS_INTERPOLATION_MODE_OFF
	sources = []
	origins.clear()
	sprite_frames = SpriteFrames.new()
	sprite_frames.remove_animation("default")
	sprite_frames.add_animation("poses")
	sprite_frames.add_animation("run")
	for i in range(16):
		var rect := Rect2((i % 4) * 384, (i / 4) * 432, 384, 432)
		sources.append(rect)
		var texture := AtlasTexture.new()
		texture.atlas = SHEETS[character]
		texture.region = rect
		texture.margin = Rect2(8, 8, 16, 16)
		texture.filter_clip = true
		sprite_frames.add_frame("poses", texture)
		origins.append(rect.position + Vector2(192, 400))
	for i in range(12):
		var texture := AtlasTexture.new()
		texture.atlas = RUN_SHEETS[character]
		texture.region = Rect2((i % 4) * 448, (i / 4) * 432, 448, 432)
		texture.margin = Rect2(8, 8, 16, 16)
		texture.filter_clip = true
		sprite_frames.add_frame("run", texture)
	animation = "poses"
	centered = false
	scale = Vector2.ONE * ACTION_SCALE[character]
	texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR

func _process(_delta: float) -> void:
	if runner == null or sources.is_empty():
		return
	var distance := lerpf(runner.previous_run_distance, runner.run_distance, clampf(Engine.get_physics_interpolation_fraction(), 0.0, 1.0))
	var index := floori(fposmod(distance, CYCLE_DISTANCE) / CYCLE_DISTANCE * 12)
	var key := "run"
	if ACTION_INDEX.has(runner.action):
		index = ACTION_INDEX[runner.action]
		key = "poses"
	animation = key
	frame = index
	scale = Vector2.ONE * (RUN_SCALE[character] if key == "run" else ACTION_SCALE[character])
	flip_h = runner.facing < 0
	var rect: Rect2 = sprite_frames.get_frame_texture(key, index).region
	var anchor: Vector2 = (RUN_ANCHOR if key == "run" else origins[index] - rect.position) + Vector2(8, 8)
	offset = Vector2(anchor.x - rect.size.x - 16 if flip_h else -anchor.x, -anchor.y)
