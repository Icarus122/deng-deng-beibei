extends Node2D

const Runner = preload("res://scripts/runner.gd")
const Visual = preload("res://scripts/runner_visual.gd")
const BACKGROUND = preload("res://assets/campus.webp")
const PLATFORM_ATLAS = preload("res://assets/platforms.png")
const UI_FONT = preload("res://assets/academy-ui.otf")
const WORLD_END := 15200.0

var runner: CharacterBody2D
var moving_platform: AnimatableBody2D
var pickup: Node2D
var camera: Camera2D
var elapsed := 0.0
var left_held := false
var right_held := false
var down_held := false
var jump_held := false
var forward_hold := 0.0
var paused := false
var pickup_taken := false
var completed := false
var status: Label
var pause_panel: PanelContainer
var energy_bar: ProgressBar
var web_callback: JavaScriptObject

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	_build_world()
	runner = Runner.new()
	runner.process_mode = Node.PROCESS_MODE_PAUSABLE
	add_child(runner)
	var visual := Visual.new()
	visual.runner = runner
	runner.add_child(visual)
	camera = Camera2D.new()
	camera.process_callback = Camera2D.CAMERA2D_PROCESS_PHYSICS
	camera.position = Vector2(520, 360)
	camera.limit_left = 0
	camera.limit_right = int(WORLD_END + 700)
	camera.limit_top = 0
	camera.limit_bottom = 720
	add_child(camera)
	_build_ui()
	get_tree().auto_accept_quit = true
	reset_run()

func _build_world() -> void:
	for x in range(0, 16500, 1280):
		var background := Sprite2D.new()
		background.texture = BACKGROUND
		background.centered = false
		background.position = Vector2(x, 0)
		background.scale = Vector2(1280.0 / BACKGROUND.get_width(), 620.0 / BACKGROUND.get_height())
		background.modulate = Color(0.76, 0.79, 0.86)
		background.z_index = -10
		add_child(background)
	var vertices := PackedVector2Array([Vector2(0, 580), Vector2(1100, 580), Vector2(1500, 515), Vector2(1850, 515), Vector2(2250, 580), Vector2(16000, 580), Vector2(16000, 750), Vector2(0, 750)])
	var floor_body := StaticBody2D.new()
	var collision := CollisionPolygon2D.new()
	collision.polygon = vertices
	floor_body.add_child(collision)
	add_child(floor_body)
	var earth := Polygon2D.new()
	earth.polygon = vertices
	earth.color = Color("514653")
	floor_body.add_child(earth)
	var curb := Line2D.new()
	curb.points = PackedVector2Array([Vector2(0, 580), Vector2(1100, 580), Vector2(1500, 515), Vector2(1850, 515), Vector2(2250, 580), Vector2(16000, 580)])
	curb.width = 12
	curb.default_color = Color("dbbf8c")
	floor_body.add_child(curb)
	for x in range(2600, 14500, 900):
		_platform(Vector2(x, 452), 220.0, false)
		_platform(Vector2(x + 310, 368), 210.0, false)
	moving_platform = _platform(Vector2(3220, 424), 210.0, true)
	pickup = Node2D.new()
	pickup.position = Vector2(800, 532)
	var gem := Polygon2D.new()
	gem.polygon = PackedVector2Array([Vector2(0, -19), Vector2(13, 0), Vector2(0, 19), Vector2(-13, 0)])
	gem.color = Color("73e3d4")
	pickup.add_child(gem)
	add_child(pickup)

func _platform(at: Vector2, width: float, moving: bool) -> AnimatableBody2D:
	var body := AnimatableBody2D.new()
	body.position = at
	body.collision_layer = 2
	body.sync_to_physics = false
	body.process_mode = Node.PROCESS_MODE_PAUSABLE
	var collision := CollisionShape2D.new()
	var rectangle := RectangleShape2D.new()
	rectangle.size = Vector2(width, 12)
	collision.position.y = 6
	collision.shape = rectangle
	collision.one_way_collision = true
	collision.one_way_collision_margin = 5
	body.add_child(collision)
	var texture := AtlasTexture.new()
	texture.atlas = PLATFORM_ATLAS
	texture.region = Rect2(273, 132 if not moving else 605, 224, 75 if not moving else 92)
	var sprite := Sprite2D.new()
	sprite.texture = texture
	sprite.centered = false
	sprite.position = Vector2(-width / 2.0, -3)
	sprite.scale = Vector2(width / 224.0, 0.60)
	body.add_child(sprite)
	add_child(body)
	return body

func _build_ui() -> void:
	var layer := CanvasLayer.new()
	add_child(layer)
	var theme := Theme.new()
	theme.default_font = UI_FONT
	theme.default_font_size = 24
	var bar := PanelContainer.new()
	bar.position = Vector2(24, 18)
	bar.theme = theme
	bar.size = Vector2(1232, 58)
	var layout := HBoxContainer.new()
	layout.add_theme_constant_override("separation", 30)
	bar.add_child(layout)
	status = Label.new()
	status.add_theme_font_size_override("font_size", 24)
	status.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	layout.add_child(status)
	energy_bar = ProgressBar.new()
	energy_bar.custom_minimum_size = Vector2(170, 28)
	energy_bar.show_percentage = false
	layout.add_child(energy_bar)
	var pause_button := Button.new()
	pause_button.text = "暂停"
	pause_button.pressed.connect(func(): set_paused(not paused))
	layout.add_child(pause_button)
	layer.add_child(bar)
	pause_panel = PanelContainer.new()
	pause_panel.theme = theme
	pause_panel.position = Vector2(440, 245)
	pause_panel.size = Vector2(400, 190)
	var box := VBoxContainer.new()
	box.add_theme_constant_override("separation", 18)
	pause_panel.add_child(box)
	var title := Label.new()
	title.text = "动作样板 · 暂停"
	title.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title.add_theme_font_size_override("font_size", 30)
	box.add_child(title)
	var resume := Button.new()
	resume.text = "继续"
	resume.pressed.connect(func(): set_paused(false))
	box.add_child(resume)
	var restart := Button.new()
	restart.text = "重新开始"
	restart.pressed.connect(reset_run)
	box.add_child(restart)
	layer.add_child(pause_panel)
	pause_panel.hide()
	if OS.has_feature("web"):
		web_callback = JavaScriptBridge.create_callback(func(args): control(str(args[0]), bool(args[1])))
		JavaScriptBridge.get_interface("window").godotControl = web_callback
		JavaScriptBridge.eval("window.godotSampleReady = true")

func _physics_process(delta: float) -> void:
	if paused or completed:
		return
	elapsed += delta
	moving_platform.position.x = 3220 + sin(elapsed * 1.4) * 110
	var direction := -1.0 if left_held else 1.0
	forward_hold = forward_hold + delta if right_held else 0.0
	runner.step(delta, direction, forward_hold > 0.22, jump_held, down_held)
	if not pickup_taken and runner.position.distance_to(pickup.position + Vector2(0, 45)) < 60:
		runner.energy = minf(100, runner.energy + 35)
		pickup_taken = true
		pickup.hide()
	if runner.position.y > 900:
		reset_run()
	if runner.position.x >= WORLD_END:
		completed = true
		set_paused(true)
	status.text = "动作样板  ·  ♥ ♥ ♥   ·   %d%%" % int(clampf(runner.position.x / WORLD_END, 0.0, 1.0) * 100)
	energy_bar.value = runner.energy
	camera.position.x = clampf(runner.position.x + direction * 210, 640, WORLD_END)
	if OS.has_feature("web") and JavaScriptBridge.eval("new URLSearchParams(location.search).has('debug')"):
		var state := JSON.stringify({"x": runner.position.x, "y": runner.position.y, "vx": runner.velocity.x, "vy": runner.velocity.y, "action": runner.action, "energy": runner.energy, "elapsed": elapsed, "paused": paused})
		JavaScriptBridge.eval("window.sampleState = " + state)

func _input(event: InputEvent) -> void:
	if event is InputEventKey and not event.echo:
		if event.keycode in [KEY_ESCAPE, KEY_P] and event.pressed:
			set_paused(not paused)
			return
		if paused:
			return
		match event.keycode:
			KEY_LEFT, KEY_A: control("left", event.pressed)
			KEY_RIGHT, KEY_D: control("right", event.pressed)
			KEY_DOWN, KEY_S: control("down", event.pressed)
			KEY_SPACE, KEY_UP, KEY_W: control("jump", event.pressed)

func control(command: String, pressed: bool) -> void:
	if command == "suspend" and pressed:
		set_paused(true)
		return
	if command == "pause" and pressed:
		set_paused(not paused)
		return
	if command == "restart" and pressed:
		reset_run()
		return
	if paused:
		return
	match command:
		"left": left_held = pressed
		"right": right_held = pressed
		"down": down_held = pressed
		"jump":
			jump_held = pressed
			if pressed:
				runner.request_jump()
			else:
				runner.release_jump()

func _notification(what: int) -> void:
	if what == NOTIFICATION_APPLICATION_FOCUS_OUT and is_instance_valid(runner):
		set_paused(true)

func set_paused(value: bool) -> void:
	paused = value
	if OS.has_feature("web"):
		JavaScriptBridge.eval("window.samplePaused = " + str(value).to_lower())
	get_tree().paused = value
	pause_panel.visible = value
	left_held = false
	right_held = false
	down_held = false
	jump_held = false
	forward_hold = 0.0
	runner.jump_buffer = 0.0

func reset_run() -> void:
	elapsed = 0.0
	runner.position = Vector2(160, 580)
	runner.velocity = Vector2.ZERO
	runner.energy = 100.0
	runner.jumps_used = 0
	runner.run_distance = 0.0
	runner.previous_run_distance = 0.0
	runner.jump_buffer = 0.0
	pickup_taken = false
	pickup.show()
	completed = false
	camera.position = Vector2(640, 360)
	runner.reset_physics_interpolation()
	camera.reset_physics_interpolation()
	moving_platform.position.x = 3220.0
	moving_platform.reset_physics_interpolation()
	set_paused(false)
