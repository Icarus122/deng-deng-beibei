extends SceneTree

func _initialize() -> void:
	run.call_deferred()

func run() -> void:
	var failures := 0
	var scene = load("res://scenes/campaign.tscn").instantiate()
	root.add_child(scene)
	scene.start_chapter(1)
	while scene.mode == "comic":
		scene.comic_click()
	var coin: Dictionary = scene.world.pickups[0]
	scene.runner.position = coin.node.position + Vector2(0, 48)
	scene._pickups()
	var total: int = scene.state.coins
	scene.state.checkpoint_x = 1200
	scene.retry()
	scene.runner.position = coin.node.position + Vector2(0, 48)
	scene._pickups()
	if scene.state.coins != total:
		print("FAIL: checkpoint retry may not count the same coin twice")
		failures += 1
	scene.start_chapter(3)
	scene.state.has_tissues = true
	scene.state.phase = "completed"
	scene.state.coins = 99
	scene.state.checkpoint_x = 41600
	scene.mode = "completed"
	scene.control("restart", true)
	if scene.mode != "comic" or scene.comic_key != "3_intro" or scene.state.has_tissues or scene.state.coins != 0:
		print("FAIL: completed replay must start a fresh chapter intro, not return checkpoint")
		failures += 1
	paused = false
	scene.free()
	if failures:
		quit(1)
		return
	print("GODOT RETRY INTEGRITY: unique coin totals and fresh completed replay passed")
	quit(0)
