extends SceneTree

func _initialize() -> void:
	run.call_deferred()

func run() -> void:
	var scene = load("res://scenes/campaign.tscn").instantiate()
	root.add_child(scene)
	scene.set_physics_process(false)
	scene.start_chapter(1)
	while scene.mode == "comic":
		scene.comic_click()
	scene.runner.position = Vector2(35000, 580)
	scene.partners[0].runner.position = scene.runner.position
	scene.state.hearts = 1
	var hazard: Dictionary = scene.world.hazards[0]
	hazard.kind = "spikes"
	hazard.x = 35000
	hazard.y = 580
	scene.world.hazards = [hazard]
	scene._physics_process(1.0 / 60)
	var correct: bool = scene.mode == "failed" and scene.state.phase == "failed" and scene.state.hearts == 0
	paused = false
	scene.free()
	if not correct:
		print("FAIL: fatal hazard plus target contact must remain defeat, not completion")
		quit(1)
		return
	print("GODOT TERMINAL CONTACT: fatal damage wins over same-frame target contact passed")
	quit(0)
