extends SceneTree

func _initialize() -> void:
	run.call_deferred()

func run() -> void:
	var scene = load("res://scenes/sample.tscn").instantiate()
	root.add_child(scene)
	if not scene.has_method("reset_run"):
		print("FAIL: playable sample can restart without reloading the app")
		quit(1)
		return
	await physics_frame
	await physics_frame
	if not scene.has_method("control"):
		print("FAIL: keyboard and touch share a real control handler")
		quit(1)
		return
	scene.control("right", true)
	assert(scene.right_held, "touch forward remains held")
	scene.control("jump", true)
	assert(scene.runner.jump_buffer > 0, "touch jump enters same input buffer")
	scene.control("jump", false)
	assert(not scene.jump_held, "touch release allows short jump")
	scene.set_paused(true)
	var before: Vector2 = scene.runner.position
	var platform_before: Vector2 = scene.moving_platform.position
	var elapsed_before: float = scene.elapsed
	for i in range(10):
		await process_frame
	assert(scene.runner.position == before, "pause freezes runner")
	assert(scene.moving_platform.position == platform_before, "pause freezes moving platform")
	assert(scene.elapsed == elapsed_before, "pause freezes elapsed time")
	scene.set_paused(false)
	scene.control("suspend", true)
	if not scene.paused:
		print("FAIL: background suspension always pauses")
		quit(1)
		return
	scene.control("suspend", true)
	assert(scene.paused, "two focus events must never toggle back to running")
	scene.set_paused(false)
	scene.runner.energy = 55.0
	scene.runner.position = scene.pickup.position
	await physics_frame
	await physics_frame
	assert(scene.runner.energy > 80.0, "reachable pickup actually adds energy")
	scene.reset_run()
	assert(scene.runner.position == Vector2(160, 580), "restart restores start checkpoint")
	assert(scene.runner.energy == 100.0, "restart restores energy")
	assert(scene.pickup.visible, "restart restores collectible")
	print("GODOT SAMPLE: pause, pickup and restart passed")
	quit(0)
