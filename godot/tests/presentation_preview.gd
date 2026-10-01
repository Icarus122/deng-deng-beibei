# Development-only native render capture; never exported into the game pack.
extends SceneTree

var output_dir: String

func _initialize() -> void:
	call_deferred("run")

func capture(scene: Node, name: String) -> void:
	scene.native_layer.hide()
	await process_frame
	await RenderingServer.frame_post_draw
	var result := root.get_texture().get_image().save_png(output_dir.path_join(name + ".png"))
	if result != OK:
		push_error("Cannot save presentation proof")
		quit(1)

func run() -> void:
	root.size = Vector2i(1280, 720)
	root.content_scale_size = Vector2i(1280, 720)
	output_dir = ProjectSettings.globalize_path("res://").get_base_dir().path_join("artifacts/presentation-proof")
	DirAccess.make_dir_recursive_absolute(output_dir)
	for number in [1, 2, 3]:
		var scene = load("res://scenes/campaign.tscn").instantiate()
		root.add_child(scene)
		scene.set_physics_process(false)
		scene.start_chapter(number)
		while scene.mode == "comic":
			scene.comic_click()
		paused = true
		var x: float = scene.world.data.checkpoints[0] + 1550
		scene.runner.position = Vector2(x, scene.world.Data.floor_y(scene.world.data, x))
		scene.runner.reset_physics_interpolation()
		scene.runner.action = "idle"
		scene.runner.get_child(1)._process(0)
		scene.camera.position = Vector2(x + 100, 360)
		scene.camera.reset_physics_interpolation()
		await capture(scene, "chapter-%d-slope" % number)
		scene.camera.position.x = scene.world.data.gaps[0].x
		scene.camera.reset_physics_interpolation()
		await capture(scene, "chapter-%d-pit" % number)
		scene.free()
		paused = false
	var scene = load("res://scenes/campaign.tscn").instantiate()
	root.add_child(scene)
	scene.set_physics_process(false)
	scene.start_chapter(3)
	while scene.mode == "comic":
		scene.comic_click()
	scene.state.phase = "chase_cao"
	scene.world.hazards.clear()
	scene.world.pickups.clear()
	scene.runner.position = Vector2(41600, 575)
	var cao: CharacterBody2D = scene.partners[1].runner
	cao.position = Vector2(41620, 575)
	scene.runner.reset_physics_interpolation()
	cao.reset_physics_interpolation()
	scene.camera.position = Vector2(41400, 360)
	scene.camera.reset_physics_interpolation()
	for frame in range(20):
		await physics_frame
		scene.runner.step(1.0 / 60, 0, false, true, false)
		cao.step(1.0 / 60, 0, false, true, false)
	cao.get_child(1)._process(0)
	scene.runner.get_child(1)._process(0)
	await capture(scene, "exchange-before")
	scene._physics_process(1.0 / 60)
	if scene.mode != "comic" or scene.comic_key != "3_return":
		push_error("Presentation fixture did not reach the tissue exchange")
		quit(1)
		return
	await capture(scene, "exchange-frozen")
	while scene.mode == "comic":
		scene.comic_click()
	await capture(scene, "exchange-return-first-render")
	await physics_frame
	scene._physics_process(1.0 / 60)
	await capture(scene, "exchange-return-first-tick")
	print("NATIVE PRESENTATION: slopes, real pits and exchange transition captured")
	quit(0)
