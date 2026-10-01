extends SceneTree

func _initialize() -> void:
	run.call_deferred()

func run() -> void:
	var world = load("res://scripts/level_world.gd").new()
	root.add_child(world)
	world.build(2)
	var bell_texture: AtlasTexture = world.bell.texture
	if not bell_texture.atlas.resource_path.ends_with("campaign-props-packed-v3.png"):
		print("FAIL: bridge bell must use actual bell art, not a tinted gem")
		world.free()
		quit(1)
		return
	if world.signs.size() != world.data.checkpoints.size():
		print("FAIL: every safe checkpoint needs a visible marker")
		world.free()
		quit(1)
		return
	world.free()
	var scene = load("res://scenes/campaign.tscn").instantiate()
	root.add_child(scene)
	scene.start_chapter(1)
	while scene.mode == "comic":
		scene.comic_click()
	scene.state.hearts = 0
	scene.state.phase = "failed"
	scene._physics_process(1.0 / 60)
	if scene.runner.get_child(1).animation != "cry" or not paused:
		print("FAIL: defeat pose must be visible before freezing the tree")
		paused = false
		scene.free()
		quit(1)
		return
	paused = false
	scene.free()
	print("GODOT SIGNAGE: bell art, checkpoint markers and frozen defeat pose passed")
	quit(0)
