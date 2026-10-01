extends SceneTree

func _initialize() -> void:
	run.call_deferred()

func run() -> void:
	var scene = load("res://scenes/campaign.tscn").instantiate()
	root.add_child(scene)
	scene.set_physics_process(false)
	scene.start_chapter(3)
	while scene.mode == "comic":
		scene.comic_click()
	scene.state.phase = "comic_return"
	scene.open_comic("3_return", "phase")
	while scene.mode == "comic":
		scene.comic_click()
	scene.runner.position = Vector2(41600, 575)
	scene.control("right", true)
	var before: float = scene.runner.position.x
	scene._physics_process(1.0 / 60)
	if scene.runner.position.x <= before:
		fail("right input must move right even during leftward return", scene)
		return
	scene.state.phase = "failed"
	scene.camera.position.x = 640
	scene.retry()
	if absf(scene.camera.position.x - 41390) > 1:
		fail("retry camera must immediately follow the return checkpoint", scene)
		return
	scene.control("map", true)
	scene.control("replay:2_intro", true)
	if scene.mode != "comic" or scene.world != null or scene.selected_chapter != 2:
		fail("comic replay must not start or reset a gameplay world", scene)
		return
	while scene.mode == "comic":
		scene.comic_click()
	if scene.mode != "archive" or not paused:
		fail("replay must return to the archive, not begin gameplay", scene)
		return
	paused = false
	scene.free()
	print("GODOT CAMPAIGN CONTROLS: return direction, retry camera and independent replay passed")
	quit(0)

func fail(message: String, scene: Node) -> void:
	print("FAIL: ", message)
	paused = false
	scene.free()
	quit(1)
