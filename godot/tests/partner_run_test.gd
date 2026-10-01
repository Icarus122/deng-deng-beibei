extends SceneTree

func fail(message: String) -> void:
	print("FAIL: ", message)
	quit(1)

func _initialize() -> void:
	var actors: Array = []
	var visuals: Array = []
	for character in range(2):
		var actor = load("res://scripts/runner.gd").new()
		var visual = load("res://scripts/partner_visual.gd").new()
		visual.configure(character)
		visual.runner = actor
		actors.append(actor)
		visuals.append(visual)
		if not visual.sprite_frames.has_animation("run") or visual.sprite_frames.get_frame_count("run") != 12:
			fail("each partner needs 12 original complete running keys")
			return
		var previous_regions: Array = []
		for index in range(12):
			actor.action = "run"
			actor.previous_run_distance = (index + 0.25) * 176.0 / 12.0
			actor.run_distance = actor.previous_run_distance
			visual._process(0.0)
			if visual.animation != "run" or visual.frame != index:
				fail("distance selects the corresponding run key")
				return
			var texture: AtlasTexture = visual.sprite_frames.get_frame_texture("run", index)
			if previous_regions.has(texture.region):
				fail("running keys must not duplicate atlas cells")
				return
			previous_regions.append(texture.region)
			var unflipped: Vector2 = visual.offset
			actor.facing = -1.0
			visual._process(0.0)
			var frame_width := texture.region.size.x + texture.margin.size.x
			if absf(visual.offset.x + unflipped.x + frame_width) > 0.01 or visual.offset.y != unflipped.y:
				fail("turning must preserve the authored ground anchor")
				return
			actor.facing = 1.0
		actor.action = "idle"
		visual._process(0.0)
		if visual.animation != "poses" or visual.frame != 8:
			fail("idle must select its existing independent action artwork immediately")
			return
	# Separate actors at different phases cannot share a clock or phase accumulator.
	actors[0].action = "run"
	actors[0].previous_run_distance = 1.0
	actors[0].run_distance = 1.0
	actors[1].action = "run"
	actors[1].previous_run_distance = 95.0
	actors[1].run_distance = 95.0
	visuals[0]._process(1.0 / 30.0)
	visuals[1]._process(1.0 / 120.0)
	if visuals[0].frame != 0 or visuals[1].frame != 6:
		fail("partners need independent distance phases at different render rates")
		return
	for visual in visuals:
		visual.free()
	for actor in actors:
		actor.free()
	print("GODOT PARTNER RUN: 12 distinct cells, distance phase, preserved action families and mirrored anchors passed")
	quit(0)
