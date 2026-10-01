extends SceneTree

# Runtime contract; this checks integration, not animation aesthetic acceptance.

func _initialize() -> void:
	run.call_deferred()

func run() -> void:
	if not ResourceLoader.exists("res://scenes/campaign.tscn"):
		print("FAIL: story state must be connected to a playable three-chapter scene")
		quit(1)
		return
	var scene = load("res://scenes/campaign.tscn").instantiate()
	root.add_child(scene)
	scene.start_chapter(3)
	if scene.mode != "comic" or scene.state.time_left != 90:
		fail("chapter has real intro and timer is frozen", scene)
		return
	while scene.mode == "comic":
		scene.comic_click()
	if scene.mode != "play" or scene.partners.size() != 2:
		fail("third level starts with both physical partners", scene)
		return
	if scene.world.data["background"] == load("res://scripts/level_data.gd").chapter(2)["background"]:
		fail("third chapter must not reuse second chapter geography/background", scene)
		return
	scene.runner.position.x = 21000
	scene._physics_process(1.0 / 60)
	if scene.mode != "comic" or scene.state.phase != "comic_mid":
		fail("actual service-station position opens midpoint comic", scene)
		return
	var before: float = scene.state.time_left
	scene._physics_process(10)
	if scene.state.time_left != before:
		fail("comic must not spend time", scene)
		return
	while scene.mode == "comic":
		scene.comic_click()
	if scene.state.phase != "chase_cao":
		fail("midpoint switches target to Cao", scene)
		return
	scene.state.phase = "comic_return"
	scene.open_comic("3_return", "phase")
	while scene.mode == "comic":
		scene.comic_click()
	if not scene.state.has_tissues or not scene.world.returning:
		fail("return has tissue objective and independent road hazards", scene)
		return
	scene.set_paused(true)
	scene._physics_process(5)
	if scene.state.time_left != 90:
		fail("pause freezes real return clock", scene)
		return
	scene.state.phase = "failed"
	scene.retry()
	if scene.state.phase != "return" or scene.runner.position.x != 41600:
		fail("retry starts at return checkpoint, not outbound", scene)
		return
	scene.get_tree().paused = false
	scene.free()
	print("GODOT RUNTIME CAMPAIGN: connected intros, two actors, midpoint, return, pause and retry passed")
	quit(0)

func fail(message: String, scene: Node) -> void:
	print("FAIL: ", message)
	paused = false
	scene.free()
	quit(1)
