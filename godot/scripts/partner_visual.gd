extends AnimatedSprite2D

const SHEETS := [preload("res://assets/meng-actions-packed-v1.png"), preload("res://assets/cao-actions-packed-v1.png")]
const CAO_IDLE = preload("res://assets/cao-idle-packed-v2.png")
const ACTION_INDEX := {"idle": 8, "jump": 9, "double_jump": 9, "apex": 9, "fall": 10, "land": 11, "hurt": 12, "slip": 12, "fallen": 13, "stomach": 14, "concern": 14, "celebrate": 15}
var runner: CharacterBody2D
var character := 0
var sources: Array
var origins: Array[Vector2] = []

func configure(number: int) -> void:
	character = clampi(number, 0, 1)
	sources = []
	origins.clear()
	sprite_frames = SpriteFrames.new()
	sprite_frames.remove_animation("default")
	sprite_frames.add_animation("poses")
	for i in range(16):
		var rect := Rect2((i % 4) * 384, (i / 4) * 400, 384, 400)
		sources.append(rect)
		var texture := AtlasTexture.new()
		texture.atlas = SHEETS[character]
		texture.region = rect
		if character == 1 and i == 8:
			texture.atlas = CAO_IDLE
			texture.region = Rect2(0, 0, 1152, 1664)
			sources[i] = texture.region
		texture.margin = Rect2(8, 8, 16, 16)
		texture.filter_clip = true
		sprite_frames.add_frame("poses", texture)
		origins.append(rect.position + Vector2(192, 368))
		if character == 1 and i == 8:
			origins[i] = Vector2(576, 1600)
	animation = "poses"
	centered = false
	scale = Vector2.ONE * (0.459 if character == 0 else 0.495)
	texture_filter = CanvasItem.TEXTURE_FILTER_LINEAR

func _process(_delta: float) -> void:
	if runner == null or sources.is_empty():
		return
	var distance := lerpf(runner.previous_run_distance, runner.run_distance, Engine.get_physics_interpolation_fraction())
	var index := floori(fposmod(distance, 176) / 176 * 8)
	if ACTION_INDEX.has(runner.action):
		index = ACTION_INDEX[runner.action]
	frame = index
	scale = Vector2.ONE * (0.459 if character == 0 else (0.0978 if index == 8 else 0.495))
	flip_h = runner.facing < 0
	var rect: Rect2 = sources[index]
	var anchor: Vector2 = origins[index] - rect.position + Vector2(8, 8)
	offset = Vector2(anchor.x - rect.size.x - 16 if flip_h else -anchor.x, -anchor.y)
