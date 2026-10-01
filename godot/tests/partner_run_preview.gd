extends SceneTree

func _initialize() -> void:
	run.call_deferred()

func run() -> void:
	RenderingServer.set_default_clear_color(Color(0.82, 0.86, 0.91))
	root.size = Vector2i(760, 260)
	root.content_scale_size = Vector2i(760, 260)
	var actors: Array = []
	var visuals: Array = []
	for index in range(4):
		var actor = load("res://scripts/runner.gd").new()
		var visual = load("res://scripts/partner_visual.gd").new()
		visual.configure(index % 2)
		visual.runner = actor
		visual.position = Vector2(90 + index * 190, 220)
		actor.action = "run"
		actor.facing = -1 if index >= 2 else 1
		visual.set_process(false)
		root.add_child(visual)
		actors.append(actor)
		visuals.append(visual)
	var destination := ProjectSettings.globalize_path("res://project.godot").get_base_dir().get_base_dir().path_join("artifacts/partner-run-proof")
	DirAccess.make_dir_recursive_absolute(destination)
	for frame_index in range(12):
		for index in range(4):
			actors[index].previous_run_distance = (frame_index + 0.25) * 176.0 / 12.0
			actors[index].run_distance = actors[index].previous_run_distance
			visuals[index]._process(0.0)
		await process_frame
		await RenderingServer.frame_post_draw
		if root.get_texture().get_image().save_png(destination + "/run-%02d.png" % frame_index) != OK:
			quit(1)
			return
	for index in range(4):
		actors[index].action = "idle"
		visuals[index]._process(0.0)
	await process_frame
	await RenderingServer.frame_post_draw
	if root.get_texture().get_image().save_png(destination + "/idle.png") != OK:
		quit(1)
		return
	for visual in visuals:
		visual.queue_free()
	for actor in actors:
		actor.free()
	await process_frame
	print("PARTNER RUN PREVIEW: 12 native-rendered frames at gameplay scale plus idle, right/left")
	quit(0)
