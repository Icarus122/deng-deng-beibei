extends SceneTree

func _initialize() -> void:
	run.call_deferred()

func run() -> void:
	var scene = load("res://scenes/campaign.tscn").instantiate()
	root.add_child(scene)
	scene.start_chapter(2)
	while scene.mode == "comic":
		scene.comic_click()
	scene.runner.position = Vector2(19400, 508)
	scene.camera.position.x = 19400
	scene._pickups()
	if not scene.ball.active or scene.ball.velocity.x <= 0:
		print("FAIL: exit-platform route must be able to pick and kick the bridge basketball")
		finish(scene, 1)
		return
	for i in range(100):
		scene._projectile(1.0 / 60)
		if scene.world.bridge_open:
			break
	if not scene.world.bridge_open or scene.comic_key != "2_bridge":
		print("FAIL: visible basketball must hit the bell and connect the bridge story")
		finish(scene, 1)
		return
	print("GODOT BRIDGE PICKUP: upper exit pickup, foot launch, bell hit and bridge comic passed")
	finish(scene, 0)

func finish(scene: Node, code: int) -> void:
	paused = false
	scene.free()
	quit(code)
