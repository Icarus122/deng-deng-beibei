extends SceneTree

func _initialize() -> void:
	run.call_deferred()

func run() -> void:
	for fps in [30, 60]:
		Engine.physics_ticks_per_second = fps
		for chapter in range(1, 4):
			if not await traverse(chapter, fps, false):
				quit(1)
				return
		if not await traverse(3, fps, true):
			quit(1)
			return
	print("GODOT COURSE AI: all three outbound roads and reversed night street at 30/60Hz, no pits or prolonged suspension")
	quit(0)

func traverse(chapter: int, fps: int, reverse: bool) -> bool:
	var world = load("res://scripts/level_world.gd").new()
	root.add_child(world)
	world.build(chapter)
	world.set_returning(reverse)
	var runner = load("res://scripts/runner.gd").new()
	root.add_child(runner)
	runner.position = Vector2(41580 if reverse else 160, 575)
	var ai = load("res://scripts/chase_ai.gd").new()
	ai.runner = runner
	ai.goal = 21120 if reverse else world.data.length - 160
	ai.direction = -1 if reverse else 1
	root.add_child(ai)
	var airborne := 0.0
	var max_airborne := 0.0
	var seconds: float = absf(ai.goal - runner.position.x) / 240 + 25
	var reached := false
	for frame in range(ceili(seconds * fps)):
		await physics_frame
		world.tick(1.0 / fps, [runner])
		ai.step(1.0 / fps, runner.position - Vector2(ai.direction * 300, 0), true)
		airborne = 0.0 if runner.is_on_floor() else airborne + 1.0 / fps
		max_airborne = maxf(max_airborne, airborne)
		if runner.position.y > 780 or airborne > 2.2 or ai.no_progress > 1.0:
			print("FAIL: course navigation chapter=", chapter, " fps=", fps, " reverse=", reverse, " frame=", frame, " at=", runner.position, " air=", airborne)
			ai.free()
			runner.free()
			world.free()
			return false
		if absf(runner.position.x - ai.goal) < 40 and runner.is_on_floor():
			reached = true
			break
	print("COURSE chapter=", chapter, " fps=", fps, " reverse=", reverse, " reached=", reached, " max_air=", snappedf(max_airborne, 0.01))
	ai.free()
	runner.free()
	world.free()
	return reached
