# Development capture of actual renderer scales; excluded from Web export.
extends SceneTree

func _initialize() -> void:
	run.call_deferred()

func run() -> void:
	RenderingServer.set_default_clear_color(Color("#ced8e2"))
	root.size = Vector2i(1080, 660)
	root.content_scale_size = root.size
	var actors: Array = []
	var visuals: Array = []
	var keys := ["run", "idle", "jump", "apex", "fall", "land", "double_jump"]
	for person in range(3):
		for index in range(keys.size()):
			var actor = load("res://scripts/runner.gd").new()
			var visual = load("res://scripts/runner_visual.gd").new() if person == 0 else load("res://scripts/partner_visual.gd").new()
			if person > 0:
				visual.configure(person - 1)
			visual.runner = actor
			actor.action = keys[index]
			visual.position = Vector2(72 + index * 150, 196 + person * 214)
			visual.set_process(false)
			root.add_child(visual)
			visual._process(0)
			var label := Label.new()
			label.text = ["Beibei", "Meng", "Cao"][person] + " / " + keys[index]
			label.position = Vector2(10 + index * 150, 12 + person * 214)
			label.add_theme_color_override("font_color", Color("#243441"))
			root.add_child(label)
			var ground := ColorRect.new()
			ground.position = Vector2(10 + index * 150, 197 + person * 214)
			ground.size = Vector2(138, 2)
			ground.color = Color("#73868c")
			root.add_child(ground)
			actors.append(actor)
			visuals.append(visual)
	await process_frame
	await RenderingServer.frame_post_draw
	var destination := ProjectSettings.globalize_path("res://").trim_suffix("/").get_base_dir().path_join("artifacts/short-action-proof")
	DirAccess.make_dir_recursive_absolute(destination)
	if root.get_texture().get_image().save_png(destination + "/families.png") != OK:
		quit(1)
		return
	for visual in visuals:
		visual.queue_free()
	for actor in actors:
		actor.free()
	await process_frame
	print("ACTION FAMILY PREVIEW: three native full-body renderers, seven states at game scale")
	quit(0)
