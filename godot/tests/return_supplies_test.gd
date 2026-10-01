extends SceneTree

func _initialize() -> void:
	run.call_deferred()

func run() -> void:
	var scene = load("res://scenes/campaign.tscn").instantiate()
	root.add_child(scene)
	scene.start_chapter(3)
	while scene.mode == "comic":
		scene.comic_click()
	var before: int = scene.world.pickups.size()
	scene.state.phase = "comic_return"
	scene.open_comic("3_return", "phase")
	while scene.mode == "comic":
		scene.comic_click()
	if scene.world.pickups.size() <= before:
		print("FAIL: altered return route needs its own visible, reachable supplies")
		finish(scene, 1)
		return
	scene.state.hearts = 1
	scene.runner.position = Vector2(34600, 580)
	scene._pickups()
	if scene.state.hearts != 2:
		print("FAIL: return roadside heart must be reachable without an upper detour")
		finish(scene, 1)
		return
	scene.world.set_returning(true)
	if scene.world.pickups.size() > before + 4:
		print("FAIL: changing return state may not duplicate supplies")
		finish(scene, 1)
		return
	print("GODOT RETURN SUPPLIES: separate return pickups, reachable heart and no duplicate entities passed")
	finish(scene, 0)

func finish(scene: Node, code: int) -> void:
	paused = false
	scene.free()
	quit(code)
