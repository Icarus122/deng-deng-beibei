extends Node2D

const Runner = preload("res://scripts/runner.gd")
const Visual = preload("res://scripts/runner_visual.gd")
const PartnerVisual = preload("res://scripts/partner_visual.gd")
const World = preload("res://scripts/level_world.gd")
const AI = preload("res://scripts/chase_ai.gd")
const Ball = preload("res://scripts/basketball.gd")
const Story = preload("res://scripts/story.gd")
const State = preload("res://scripts/campaign_state.gd")
const Reveal = preload("res://scripts/comic_reveal.gd")
const UI_FONT = preload("res://assets/academy-ui.otf")

var state = State.new()
var reveal = Reveal.new()
var runner: CharacterBody2D
var world: Node2D
var camera: Camera2D
var ball: Node2D
var partners: Array = []
var mode := "home"
var comic_key := ""
var comic_after := ""
var selected_chapter := 1
var stars: Array = [0, 0, 0]
var paused := false
var left_held := false
var right_held := false
var down_held := false
var jump_held := false
var forward_hold := 0.0
var elapsed := 0.0
var ui_elapsed := 0.0
var hurt_remaining := 0.0
var sound_enabled := true
var save_failed := false
var bridge_story_seen := false
var ai_recoveries := 0
var callback: JavaScriptObject
var native_layer: CanvasLayer
var native_status: Label
var native_body: VBoxContainer

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS
	_load_progress()
	_build_native_ui()
	if OS.has_feature("web"):
		native_layer.hide()
		callback = JavaScriptBridge.create_callback(func(args): control(str(args[0]), bool(args[1])))
		JavaScriptBridge.get_interface("window").godotControl = callback
		JavaScriptBridge.eval("window.godotCampaignReady = true")
	get_tree().paused = true
	emit_ui()

func start_chapter(number: int) -> void:
	_clear_world()
	selected_chapter = clampi(number, 1, 3)
	state.start(selected_chapter)
	world = World.new()
	world.process_mode = Node.PROCESS_MODE_PAUSABLE
	add_child(world)
	world.build(selected_chapter)
	runner = _actor(Vector2(160, 575), -1)
	partners.clear()
	for character in range(2 if selected_chapter == 3 else 1):
		var actor := _actor(Vector2(520 + character * 140, 575), character)
		var ai := AI.new()
		ai.runner = actor
		ai.goal = 21000 if selected_chapter == 3 and character == 0 else world.data.length - 40
		add_child(ai)
		partners.append({"runner": actor, "ai": ai, "character": character, "safe": actor.position})
	ball = Ball.new()
	add_child(ball)
	ball.hide()
	camera = Camera2D.new()
	camera.process_callback = Camera2D.CAMERA2D_PROCESS_PHYSICS
	camera.limit_left = 0
	camera.limit_right = int(world.data.length + 600)
	camera.limit_top = 0
	camera.limit_bottom = 720
	camera.position = Vector2(640, 360)
	add_child(camera)
	elapsed = 0
	hurt_remaining = 0
	bridge_story_seen = false
	ai_recoveries = 0
	open_comic("%d_intro" % selected_chapter, "start")

func _actor(at: Vector2, character: int) -> CharacterBody2D:
	var actor := Runner.new()
	actor.process_mode = Node.PROCESS_MODE_PAUSABLE
	actor.position = at
	add_child(actor)
	var visual: AnimatedSprite2D = Visual.new() if character < 0 else PartnerVisual.new()
	if character >= 0:
		visual.configure(character)
	visual.runner = actor
	actor.add_child(visual)
	return actor

func open_comic(key: String, after: String) -> void:
	comic_key = key
	comic_after = after
	reveal.open(Story.SCENES[key].size())
	mode = "comic"
	_clear_controls()
	get_tree().paused = true
	emit_ui()

func comic_click() -> void:
	if mode != "comic":
		return
	if not reveal.click():
		emit_ui()
		return
	if comic_after == "archive":
		mode = "archive"
		emit_ui()
		return
	if comic_after == "phase":
		state.continue_story()
	if state.phase == "return":
		world.set_returning(true)
		if world.tissues:
			world.tissues.hide()
		runner.facing = -1
		partners[1].ai.direction = -1
		partners[1].ai.following = true
		partners[1].runner.position.x = maxf(runner.position.x + 130, 41700)
		partners[1].runner.reset_physics_interpolation()
	elif state.phase == "chase_cao":
		state.checkpoint_x = 21000
	elif state.phase == "completed":
		stars[selected_chapter - 1] = maxi(stars[selected_chapter - 1], 1 + int(state.hearts >= 2) + int(state.coins >= 40))
		_save_progress()
		mode = "completed"
		emit_ui()
		return
	mode = "play"
	paused = false
	state.paused = false
	get_tree().paused = false
	emit_ui()

func _physics_process(delta: float) -> void:
	if mode != "play" or paused:
		return
	elapsed += delta
	state.tick(delta)
	hurt_remaining = maxf(0, hurt_remaining - delta)
	var actors: Array = [runner]
	for partner in partners:
		actors.append(partner.runner)
	world.tick(delta, actors)
	var before := runner.position
	var direction: float = -1.0 if left_held else (1.0 if right_held else state.direction)
	var forward_pressed := left_held if state.direction < 0 else right_held
	forward_hold = forward_hold + delta if forward_pressed else 0.0
	var old_jumps: int = runner.jumps_used
	runner.step(delta, direction * (0.35 if hurt_remaining > 0 else 1.0), forward_hold > 0.22, jump_held, down_held)
	if runner.jumps_used > old_jumps:
		sound("jump")
	for partner in partners:
		if selected_chapter == 3 and partner.character == 0 and state.phase != "dual_chase":
			partner.runner.perform("stomach", 0.2)
			partner.runner.step(delta, 0, false, true, false)
		else:
			partner.ai.step(delta, runner.position, runner.position.x / world.data.length >= 0.85 or state.phase == "return")
		if partner.runner.is_on_floor():
			partner.safe = partner.runner.position
		if partner.runner.position.y > 900:
			partner.runner.position = partner.safe
			partner.runner.velocity = Vector2.ZERO
			partner.runner.reset_physics_interpolation()
			partner.ai.pit_jump = false
			ai_recoveries += 1
	_resolve_contacts(before)
	if state.phase != "failed":
		_pickups()
		_projectile(delta)
	if mode != "play":
		return
	if runner.position.y > 900:
		state.contact("pit", true)
		runner.position = Vector2(state.checkpoint_x, world.Data.floor_y(world.data, state.checkpoint_x) - 5)
		runner.velocity = Vector2.ZERO
		runner.reset_physics_interpolation()
		state.contact("pit", false)
		sound("hurt")
	if state.phase != "return" and runner.is_on_floor():
		for checkpoint in world.data.checkpoints:
			if runner.position.x >= checkpoint:
				state.checkpoint_x = maxf(state.checkpoint_x, checkpoint)
	var previous_phase: String = state.phase
	if selected_chapter == 3:
		var cao: CharacterBody2D = partners[1].runner
		if state.phase != "chase_cao" or (absf(cao.position.x - runner.position.x) < 50 and absf(cao.position.y - runner.position.y) < 70):
			state.advance(runner.position.x)
	elif state.phase == "chase" and runner.position.x / world.data.length >= 0.85:
		var target: CharacterBody2D = partners[0].runner
		if absf(target.position.x - runner.position.x) < 50 and absf(target.position.y - runner.position.y) < 70:
			state.phase = "comic_outro"
	if state.phase != previous_phase and state.phase.begins_with("comic"):
		var suffix := "mid" if state.phase == "comic_mid" else ("return" if state.phase == "comic_return" else "outro")
		open_comic("%d_%s" % [selected_chapter, suffix], "phase")
	if state.phase == "failed":
		mode = "failed"
		_clear_controls()
		runner.perform("cry", 100)
		runner.action = "cry"
		runner.get_child(1)._process(0)
		get_tree().paused = true
		emit_ui()
	camera.position.x = clampf(runner.position.x + state.direction * 210, 640, world.data.length)
	runner.modulate.a = 0.55 if state.invulnerability > 0 and int(elapsed * 12) % 2 == 0 else 1.0

func _resolve_contacts(before: Vector2) -> void:
	var contacts: Array = world.contacts(before, runner.position)
	var touched: Dictionary = {}
	for entity in contacts:
		touched[entity.id] = true
		if state.contact(entity.id, true):
			hurt_remaining = 0.65
			runner.perform("slip" if entity.kind == "banana" else "hurt", 0.55)
			sound("hurt")
	for id in state.contacts.keys():
		if not touched.has(id) and id != "pit":
			state.contact(id, false)

func _pickups() -> void:
	for entity in world.pickups:
		if entity.taken or runner.position.distance_to(entity.node.position + Vector2(0, 48)) > 55:
			continue
		entity.taken = true
		entity.node.hide()
		match entity.kind:
			"coin": state.coins += 1
			"gem": runner.energy = minf(100, runner.energy + 30)
			"heart": state.hearts = mini(3, state.hearts + 1)
			"ball":
				var target: Vector2 = partners[1 if state.phase == "chase_cao" else 0].runner.position - Vector2(0, 50)
				if selected_chapter == 2 and not world.bridge_open and absf(runner.position.x - 19400) < 100:
					target = Vector2(19760, 475)
				ball.shoot(runner.position + Vector2(runner.facing * 30, -23), runner.facing, target)
				runner.perform("kick", 0.15)
				sound("kick")
		if entity.kind != "ball":
			sound("coin")

func _projectile(delta: float) -> void:
	ball.step(delta)
	if not ball.active:
		return
	if selected_chapter == 2 and not world.bridge_open and ball.hits(Rect2(19735, 450, 50, 50)):
		world.unlock_bridge()
		ball.consume()
		sound("bell")
		if not bridge_story_seen:
			bridge_story_seen = true
			open_comic("2_bridge", "resume")
		return
	for partner in partners:
		if ball.hits(Rect2(partner.runner.position - Vector2(16, 100), Vector2(32, 100))):
			partner.ai.knock_down()
			ball.consume()
			sound("kick")
			break
	if absf(ball.position.x - camera.position.x) > 1100:
		ball.consume()

func _process(delta: float) -> void:
	if mode == "comic":
		var shown: int = reveal.visible_count
		reveal.tick(delta)
		if shown != reveal.visible_count:
			emit_ui()
	elif mode == "play":
		ui_elapsed += delta
		if ui_elapsed > 0.12:
			ui_elapsed = 0
			emit_ui()

func set_paused(value: bool) -> void:
	if mode not in ["play", "pause"]:
		return
	paused = value
	state.paused = value
	mode = "pause" if value else "play"
	get_tree().paused = value
	_clear_controls()
	emit_ui()

func retry() -> void:
	state.retry()
	runner.position = Vector2(state.checkpoint_x, world.Data.floor_y(world.data, state.checkpoint_x) - 5)
	runner.velocity = Vector2.ZERO
	runner.energy = 100
	runner.feedback_remaining = 0
	runner.jump_buffer = 0
	runner.reset_physics_interpolation()
	world.set_returning(state.phase == "return")
	world.reset_pickups_after(state.checkpoint_x, state.direction)
	ball.consume()
	for partner in partners:
		var x: float = runner.position.x + 130 if state.phase == "return" else runner.position.x + 320 + partner.character * 140
		if selected_chapter == 3 and partner.character == 0 and state.phase != "dual_chase":
			x = 21000
		partner.runner.position = Vector2(x, world.Data.floor_y(world.data, x) - 5)
		partner.runner.velocity = Vector2.ZERO
		partner.runner.feedback_remaining = 0
		partner.runner.reset_physics_interpolation()
		partner.ai.stunned = 0
		partner.ai.pit_jump = false
		partner.ai.direction = state.direction
		partner.ai.following = state.phase == "return" and partner.character == 1
	mode = "play"
	camera.position.x = clampf(runner.position.x + state.direction * 210, 640, world.data.length)
	camera.reset_physics_interpolation()
	set_paused(false)

func control(command: String, pressed: bool) -> void:
	if command.begins_with("start:") and pressed:
		start_chapter(command.get_slice(":", 1).to_int())
	elif command.begins_with("brief:") and pressed:
		selected_chapter = clampi(command.get_slice(":", 1).to_int(), 1, 3)
		mode = "brief"
		emit_ui()
	elif command == "comic" and pressed:
		comic_click()
	elif command == "skip" and pressed:
		reveal.visible_count = reveal.count
		comic_click()
	elif command == "archive" and pressed:
		_clear_world()
		mode = "archive"
		get_tree().paused = true
		emit_ui()
	elif command.begins_with("replay:") and pressed:
		var key := command.get_slice(":", 1)
		if Story.SCENES.has(key):
			selected_chapter = key.get_slice("_", 0).to_int()
			open_comic(key, "archive")
	elif command in ["map", "home"] and pressed:
		_clear_world()
		mode = command
		get_tree().paused = true
		emit_ui()
	elif command == "pause" and pressed:
		set_paused(not paused)
	elif command == "suspend" and pressed:
		set_paused(true)
	elif command == "restart" and pressed and runner != null:
		if mode == "completed":
			start_chapter(selected_chapter)
		else:
			retry()
	elif command == "sound" and pressed:
		sound_enabled = not sound_enabled
		_save_progress()
		emit_ui()
	elif command.begins_with("fps:") and pressed:
		Engine.max_fps = 60 if command.ends_with("60") else 120
		_save_progress()
		emit_ui()
	elif mode == "play":
		match command:
			"left": left_held = pressed
			"right": right_held = pressed
			"down": down_held = pressed
			"jump":
				jump_held = pressed
				if pressed: runner.request_jump()
				else: runner.release_jump()

func _input(event: InputEvent) -> void:
	if event is InputEventKey and not event.echo:
		if event.pressed and event.keycode in [KEY_P, KEY_ESCAPE]:
			control("pause", true)
			return
		if event.pressed and mode == "comic" and event.keycode in [KEY_SPACE, KEY_ENTER]:
			comic_click()
			return
		match event.keycode:
			KEY_LEFT, KEY_A: control("left", event.pressed)
			KEY_RIGHT, KEY_D: control("right", event.pressed)
			KEY_DOWN, KEY_S: control("down", event.pressed)
			KEY_SPACE, KEY_UP, KEY_W: control("jump", event.pressed)

func _notification(what: int) -> void:
	if what == NOTIFICATION_APPLICATION_FOCUS_OUT:
		set_paused(true)

func _clear_controls() -> void:
	left_held = false
	right_held = false
	down_held = false
	jump_held = false
	forward_hold = 0
	if is_instance_valid(runner):
		runner.jump_buffer = 0

func _clear_world() -> void:
	_clear_controls()
	for partner in partners:
		partner.ai.free()
		partner.runner.free()
	partners.clear()
	for node in [runner, world, camera, ball]:
		if is_instance_valid(node):
			node.free()
	runner = null
	world = null
	camera = null
	ball = null

func sound(key: String) -> void:
	if sound_enabled and OS.has_feature("web"):
		JavaScriptBridge.eval("window.campaignSound?.(" + JSON.stringify(key) + ")")

func _load_progress() -> void:
	var config := ConfigFile.new()
	if config.load("user://campaign-v1.cfg") == OK:
		var saved = config.get_value("progress", "stars", [0, 0, 0])
		if saved is Array and saved.size() == 3:
			for i in range(3):
				stars[i] = clampi(int(saved[i]), 0, 3)
		sound_enabled = config.get_value("settings", "sound", true)
		Engine.max_fps = 60 if config.get_value("settings", "fps", 120) == 60 else 120
	save_failed = not OS.is_userfs_persistent()

func _save_progress() -> void:
	var config := ConfigFile.new()
	config.set_value("progress", "stars", stars)
	config.set_value("settings", "sound", sound_enabled)
	config.set_value("settings", "fps", Engine.max_fps)
	save_failed = config.save("user://campaign-v1.cfg") != OK or not OS.is_userfs_persistent()

func ui_state() -> Dictionary:
	var payload := {"mode": mode, "chapter": selected_chapter, "titles": Story.TITLES, "scenes": Story.SCENES.keys(), "brief": Story.BRIEFS[selected_chapter - 1],
		"stars": stars, "hearts": state.hearts, "coins": state.coins, "time": state.time_left, "phase": state.phase,
		"sound": sound_enabled, "fps": Engine.max_fps, "save_failed": save_failed}
	if mode == "comic":
		payload["panels"] = Story.SCENES[comic_key]
		payload["shown"] = reveal.visible_count
		payload["comic_key"] = comic_key
	if is_instance_valid(runner):
		payload["energy"] = runner.energy
		payload["progress"] = clampf(runner.position.x / world.data.length, 0, 1)
		payload["x"] = runner.position.x
		payload["y"] = runner.position.y
		payload["action"] = runner.action
		payload["elapsed"] = elapsed
		payload["ai_recoveries"] = ai_recoveries
	return payload

func emit_ui() -> void:
	var payload := ui_state()
	if OS.has_feature("web"):
		JavaScriptBridge.eval("window.renderCampaign?.(" + JSON.stringify(payload) + ")")
	else:
		_refresh_native(payload)

func _build_native_ui() -> void:
	native_layer = CanvasLayer.new()
	add_child(native_layer)
	var theme := Theme.new()
	theme.default_font = UI_FONT
	theme.default_font_size = 25
	var panel := PanelContainer.new()
	panel.theme = theme
	panel.position = Vector2(30, 20)
	panel.size = Vector2(1220, 170)
	native_body = VBoxContainer.new()
	panel.add_child(native_body)
	native_status = Label.new()
	native_status.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	native_body.add_child(native_status)
	native_layer.add_child(panel)

func _refresh_native(payload: Dictionary) -> void:
	for child in native_body.get_children():
		if child != native_status:
			child.queue_free()
	native_status.text = "等等贝贝吧 · Godot 开发版"
	var commands: Array = [["学院地图", "map"]]
	if mode in ["map", "home", "completed"]:
		for i in range(3):
			commands.append([Story.TITLES[i], "start:%d" % (i + 1)])
	elif mode == "archive":
		for key in Story.SCENES:
			commands.append([key, "replay:" + key])
	elif mode == "brief":
		native_status.text = Story.BRIEFS[selected_chapter - 1]
		commands.append(["出发", "start:%d" % selected_chapter])
	elif mode == "comic":
		native_status.text = ""
		for i in range(reveal.visible_count):
			native_status.text += Story.SCENES[comic_key][i][0] + "\n"
		commands = [["展开 / 继续", "comic"], ["跳过", "skip"]]
	elif mode == "play":
		native_status.text = "%s · 生命 %d/3 · 硬币 %d" % [Story.TITLES[selected_chapter - 1], state.hearts, state.coins]
		commands = [["暂停", "pause"]]
	elif mode in ["pause", "failed"]:
		commands.append(["继续" if mode == "pause" else "检查点重试", "pause" if mode == "pause" else "restart"])
	var row := HBoxContainer.new()
	native_body.add_child(row)
	for item in commands:
		var button := Button.new()
		button.text = item[0]
		button.pressed.connect(control.bind(item[1], true))
		row.add_child(button)
