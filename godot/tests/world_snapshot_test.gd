extends SceneTree

func _initialize() -> void:
	run.call_deferred()

func run() -> void:
	var source = load("res://scripts/level_world.gd")
	if not source.can_instantiate():
		print("FAIL: dynamic world cannot compile")
		quit(1)
		return
	var world = source.new()
	root.add_child(world)
	world.build(3)
	world.tick(0.1, [])
	var warning = world.hazards[1]
	if warning.dangerous:
		print("FAIL: crate warning cannot hurt a runner")
		quit(1)
		return
	var runner = load("res://scripts/runner.gd").new()
	root.add_child(runner)
	var collapse = world.platforms[1]
	runner.position = collapse.body.position - Vector2(0, 5)
	for i in range(15):
		await physics_frame
		runner.step(1.0 / 60, 0, false, true, false)
		world.tick(1.0 / 60, [runner])
	if collapse.state != "warning":
		print("FAIL: supporting player must trigger warning")
		quit(1)
		return
	for i in range(40):
		await physics_frame
		world.tick(1.0 / 60, [runner])
		runner.step(1.0 / 60, 0, false, true, false)
	if collapse.state != "gone" or collapse.body.visible or not collapse.shape.disabled or runner.is_on_floor():
		print("FAIL: collision, art and support must disappear together")
		quit(1)
		return
	var old_ids: Array = []
	for entity in world.hazards:
		old_ids.append(entity.id)
	world.set_returning(true)
	world.tick(1.0 / 60, [])
	for entity in world.hazards:
		if old_ids.has(entity.id) or not entity.id.begins_with("return_"):
			print("FAIL: return cannot retain outbound damage entities")
			quit(1)
			return
	runner.free()
	world.free()
	print("GODOT WORLD: harmless warning, shared collapse state, support removal and replaced return layout passed")
	quit(0)
