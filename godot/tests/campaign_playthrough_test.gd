extends SceneTree

var scene: Node
var bank := 0.0
var launch_y := 580.0
var pending_pit := false
var jump_hold := 0.0
var visited: Dictionary = {}

func _initialize() -> void:
	run.call_deferred()

func run() -> void:
	for hz in [30, 60]:
		Engine.physics_ticks_per_second = hz
		for chapter in [1, 2, 3]:
			scene = load("res://scenes/campaign.tscn").instantiate()
			root.add_child(scene)
			scene.set_physics_process(false)
			scene.start_chapter(chapter)
			bank = 0
			pending_pit = false
			visited.clear()
			var wall_time := 0.0
			var minimum_lead: Array = [100000.0, 100000.0]
			var delta: float = 1.0 / hz
			while scene.mode != "completed" and wall_time < 400:
				await physics_frame
				if scene.mode == "comic":
					visited[scene.comic_key] = true
					while scene.mode == "comic":
						scene.comic_click()
				if scene.mode == "failed":
					print("FAIL: playable course ", chapter, " at ", hz, "Hz failed x=", scene.runner.position.x, " phase=", scene.state.phase, " hearts=", scene.state.hearts, " time=", scene.state.time_left)
					cleanup(1)
					return
				if scene.mode == "play":
					choose_input(delta)
					var recoveries: int = scene.ai_recoveries
					var hearts: int = scene.state.hearts
					scene._physics_process(delta)
					if scene.runner.position.x / scene.world.data.length < 0.85 and scene.state.phase in ["chase", "dual_chase", "chase_cao"]:
						for partner in scene.partners:
							if chapter != 3 or partner.character == 1 or scene.state.phase == "dual_chase":
								minimum_lead[partner.character] = minf(minimum_lead[partner.character], partner.runner.position.x - scene.runner.position.x)
					if scene.state.hearts < hearts:
						print("HURT ", chapter, " ", hz, "Hz at=", scene.runner.position, " v=", scene.runner.velocity, " jumps=", scene.runner.jumps_used, " phase=", scene.state.phase, " contacts=", scene.state.contacts.keys(), " health=", scene.state.hearts)
					if scene.ai_recoveries > recoveries:
						print("AI RECOVERY ", chapter, " ", hz, "Hz player=", scene.runner.position)
					wall_time += delta
			if scene.mode != "completed":
				print("FAIL: campaign course ", chapter, " stalled at ", scene.runner.position)
				cleanup(1)
				return
			if chapter == 3 and not (visited.has("3_mid") and visited.has("3_return") and scene.state.has_tissues):
				print("FAIL: full road must pass midpoint, tissue transfer and return, not skip phases")
				cleanup(1)
				return
			if scene.ai_recoveries > 0:
				print("FAIL: course needed off-world AI rescue")
				cleanup(1)
				return
			print("COURSE ", chapter, " ", hz, "Hz completed seconds=", snappedf(wall_time, 0.01), " hearts=", scene.state.hearts, " return_margin=", snappedf(scene.state.time_left, 0.01), " min_pre85_lead=", minimum_lead, " scenes=", visited.keys())
			cleanup(-1)
	print("GODOT PLAYTHROUGH: all three actual campaign roads and timed return passed at 30/60Hz")
	quit(0)

func floor_at(x: float, y: float) -> Dictionary:
	return scene.partners[0].ai.floor_at(x, y)

func choose_input(delta: float) -> void:
	var runner: CharacterBody2D = scene.runner
	var direction: int = scene.state.direction
	var wait_for_crate := false
	for hazard in scene.world.hazards:
		var distance: float = (hazard.x - runner.position.x) * direction
		var arrival := fposmod(scene.world.elapsed + hazard.phase + maxf(0, distance - 60) / 270.0, 4.5)
		if hazard.kind == "crate" and distance > 10 and distance < 210 and arrival > 0.95 and arrival < 2.85:
			wait_for_crate = true
	var chosen := -direction if wait_for_crate else direction
	scene.control("left", chosen < 0)
	scene.control("right", chosen > 0)
	jump_hold = maxf(0, jump_hold - delta)
	if jump_hold == 0:
		scene.control("jump", false)
	var jump := false
	if runner.is_on_floor():
		pending_pit = false
		var ahead := floor_at(runner.position.x + direction * 80, runner.position.y)
		var landing := floor_at(runner.position.x + direction * 340, runner.position.y)
		if ahead.is_empty() and not landing.is_empty():
			jump = true
			pending_pit = true
			bank = landing.position.x
			launch_y = runner.position.y
		for hazard in scene.world.hazards:
			var distance: float = (hazard.node.position.x - runner.position.x) * chosen
			var trigger := 115.0
			if hazard.kind == "cart":
				var cart_speed: float = (hazard.box.position.x - hazard.previous_box.position.x) / delta
				var closing: float = absf(runner.velocity.x) - cart_speed * chosen
				trigger = clampf(closing * 0.25 + 44, 80, 155)
			var same_height: bool = hazard.y >= runner.position.y - 100 and hazard.y <= runner.position.y + 60
			if distance > 20 and distance < trigger and hazard.kind != "crate" and same_height:
				jump = true
		var ray := PhysicsRayQueryParameters2D.create(runner.position + Vector2(0, -45), runner.position + Vector2(direction * 55, -45), 3, [runner.get_rid()])
		if not runner.get_world_2d().direct_space_state.intersect_ray(ray).is_empty():
			jump = true
	elif pending_pit and runner.jumps_used == 1 and runner.velocity.y > 200 and runner.position.y >= launch_y - 55 and not floor_at(bank, launch_y).is_empty():
		jump = true
	elif runner.jumps_used == 1 and runner.velocity.y > 200 and runner.position.y >= 525 and floor_at(runner.position.x + chosen * 20, 580).is_empty() and not floor_at(runner.position.x + chosen * 300, 580).is_empty():
		jump = true
	if not runner.is_on_floor() and runner.jumps_used == 1 and runner.velocity.y > 0:
		# A moving cart can turn underneath a descending first jump.
		var lookahead := 0.16
		var feet: Vector2 = runner.position + runner.velocity * lookahead + Vector2(0, 725 * lookahead * lookahead)
		var body := Rect2(feet - Vector2(16, 100), Vector2(32, 100))
		for hazard in scene.world.hazards:
			if not hazard.dangerous:
				continue
			var box: Rect2 = hazard.box
			box.position += (hazard.box.position - hazard.previous_box.position) / delta * lookahead
			if body.intersects(box):
				jump = true
	if pending_pit:
		# Releasing forward keeps the ordinary navigation pace until landing.
		scene.control("left", false)
		scene.control("right", false)
	if jump:
		jump_hold = 0.7
		scene.control("jump", false)
		scene.control("jump", true)

func cleanup(code: int) -> void:
	paused = false
	scene.free()
	if code >= 0:
		quit(code)
