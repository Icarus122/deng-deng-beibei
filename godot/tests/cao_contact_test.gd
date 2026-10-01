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
	scene.state.phase = "chase_cao"
	scene.runner.position = Vector2(41600, 575)
	scene.partners[1].runner.position = Vector2(41200, 575)
	scene._physics_process(1.0 / 60)
	if scene.mode != "play":
		fail("reaching the street endpoint without Cao must not transfer tissues", scene)
		return
	scene.partners[1].runner.position = scene.runner.position
	scene._physics_process(1.0 / 60)
	if scene.comic_key != "3_return" or scene.mode != "comic":
		fail("actual close contact with Cao must open the return story", scene)
		return
	paused = false
	scene.free()
	print("GODOT CAO CONTACT: tissue transfer requires target proximity passed")
	quit(0)

func fail(message: String, scene: Node) -> void:
	print("FAIL: ", message)
	paused = false
	scene.free()
	quit(1)
