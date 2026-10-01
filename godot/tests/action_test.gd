extends SceneTree

func _initialize() -> void:
	run.call_deferred()

func run() -> void:
	var actor = load("res://scripts/runner.gd").new()
	root.add_child(actor)
	if not actor.has_method("perform"):
		print("FAIL: actor has independent short feedback poses")
		quit(1)
		return
	actor.perform("kick", 0.18)
	actor.step(1.0 / 60, 1, false, true, false)
	if actor.action != "kick":
		print("FAIL: kick pose does not reuse running or crying")
		quit(1)
		return
	actor.request_jump()
	actor.step(1.0 / 60, 1, false, true, false)
	if actor.velocity.y >= 0:
		print("FAIL: feedback animation must not block jump input")
		quit(1)
		return
	actor.perform("", 0)
	actor.request_jump()
	actor.step(1.0 / 60, 1, false, true, false)
	if actor.action != "double_jump":
		print("FAIL: second jump has its own readable pose")
		quit(1)
		return
	var visual = load("res://tests/fixtures/rejected_cutout_visual.gd").new()
	root.add_child(visual)
	for i in range(1, 48):
		var phase := i / 48.0 * 0.36
		var world_foot: Vector2 = Vector2(phase * 144, 0) + visual._foot(phase, true)
		if world_foot.distance_to(Vector2(25.92, -3)) > 0.01:
			print("FAIL: planted shoe slides during support phase")
			quit(1)
			return
	actor.queue_free()
	visual.queue_free()
	print("GODOT ACTION: rejected cutout fixture feedback and 47 mathematical contact samples passed; not production animation acceptance")
	quit(0)
