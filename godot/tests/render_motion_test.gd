extends SceneTree

func _initialize() -> void:
	run.call_deferred()

func run() -> void:
	var scene = load("res://scenes/sample.tscn").instantiate()
	root.add_child(scene)
	await physics_frame
	await physics_frame
	if not scene.runner.is_physics_interpolated_and_enabled() or not scene.camera.is_physics_interpolated_and_enabled():
		print("FAIL: runner and camera must both interpolate for high-refresh rendering")
		quit(1)
		return
	scene.set_paused(true)
	scene.camera.position.x = 5000.0
	scene.runner.position.x = 5000.0
	scene.runner.previous_run_distance = 500.0
	scene.reset_run()
	if scene.camera.position.x != 640.0 or scene.runner.previous_run_distance != 0.0:
		print("FAIL: restart must reset camera and animation history, not interpolate back across the level")
		quit(1)
		return
	print("GODOT RENDER MOTION: interpolated runner/camera and clean restart passed")
	quit(0)
