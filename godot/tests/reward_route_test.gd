extends SceneTree

func _initialize() -> void:
	call_deferred("run")

func run() -> void:
	for hz in [30, 60]:
		Engine.physics_ticks_per_second = hz
		for chapter in [2, 3]:
			var world = load("res://scripts/level_world.gd").new()
			root.add_child(world)
			world.build(chapter)
			for target in world.data.platforms:
				if not target.id.begins_with("loft_"):
					continue
				var lower: Dictionary = {}
				for candidate in world.data.platforms:
					if candidate.y == 436 and (lower.is_empty() or absf(candidate.x - target.x) < absf(lower.x - target.x)):
						lower = candidate
				var runner = load("res://scripts/runner.gd").new()
				runner.position = Vector2(lower.x, lower.y - 5)
				root.add_child(runner)
				for frame in range(hz / 3):
					await physics_frame
					runner.step(1.0 / hz, 0, false, true, false)
				runner.request_jump()
				var landed := false
				for frame in range(hz * 2):
					await physics_frame
					var move := clampf((target.x - runner.position.x) / 80, -1, 1)
					runner.step(1.0 / hz, move, false, true, false)
					if runner.is_on_floor() and absf(runner.position.y - target.y) < 2 and absf(runner.position.x - target.x) < target.width / 2:
						landed = true
						break
				runner.free()
				if not landed:
					print("FAIL: actual reward connection ", chapter, " ", target.id, " cannot be landed at ", hz, "Hz")
					quit(1)
					return
			for hazard in world.data.hazards:
				if hazard.id.begins_with("loft_"):
					var supported := false
					for platform in world.data.platforms:
						supported = supported or (hazard.y == platform.y and absf(hazard.x - platform.x) + 38 <= platform.width / 2)
					if not supported:
						print("FAIL: upper danger must sit on an actual surface")
						quit(1)
						return
			world.free()
	print("GODOT REWARD ROUTE: all 24 new upper connections physically landed at 30/60Hz; danger supported")
	quit(0)
