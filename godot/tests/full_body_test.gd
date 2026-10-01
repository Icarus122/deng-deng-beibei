extends SceneTree

func _initialize() -> void:
	var script = load("res://scripts/runner_visual.gd")
	if not script.can_instantiate():
		print("FAIL: renderer cannot compile")
		quit(1)
		return
	var visual = script.new()
	if not visual is AnimatedSprite2D:
		visual.free()
		print("FAIL: the accepted running workflow must render one complete body, not disconnected parts")
		quit(1)
		return
	var count: int = visual.sprite_frames.get_frame_count("run")
	if count < 12:
		visual.free()
		print("FAIL: full running motion needs real intermediate whole-body poses")
		quit(1)
		return
	for i in range(count):
		if visual.running_frame(i * 176.0 / count + 0.01) != i:
			print("FAIL: run sequence skips or repeats a supplied pose")
			visual.free()
			quit(1)
			return
		var texture: AtlasTexture = visual.sprite_frames.get_frame_texture("run", i)
		if not Rect2(Vector2.ZERO, texture.atlas.get_size()).encloses(texture.region):
			print("FAIL: a source frame lies outside the atlas")
			quit(1)
			return
		var image := texture.atlas.get_image()
		var region := texture.region
		for x in range(int(region.position.x), int(region.end.x)):
			if cuts_body(image, Vector2i(x, int(region.position.y)), Vector2i(x, int(region.position.y) - 1)) or cuts_body(image, Vector2i(x, int(region.end.y) - 1), Vector2i(x, int(region.end.y))):
				print("FAIL: a full-body source is clipped at its upper/lower edge")
				visual.free()
				quit(1)
				return
		for y in range(int(region.position.y), int(region.end.y)):
			if cuts_body(image, Vector2i(int(region.position.x), y), Vector2i(int(region.position.x) - 1, y)) or cuts_body(image, Vector2i(int(region.end.x) - 1, y), Vector2i(int(region.end.x), y)):
				print("FAIL: a full-body source is clipped at its side edge")
				visual.free()
				quit(1)
				return
	if visual.running_frame(176.0) != 0:
		print("FAIL: run sequence does not loop back to its first pose")
		quit(1)
		return
	var actor = load("res://scripts/runner.gd").new()
	actor.action = "run"
	actor.run_distance = 30.0
	actor.previous_run_distance = 30.0
	visual.runner = actor
	visual._process(1.0 / 60)
	var other = script.new()
	var other_actor = load("res://scripts/runner.gd").new()
	other_actor.action = "run"
	other_actor.run_distance = 120.0
	other_actor.previous_run_distance = 120.0
	other.runner = other_actor
	other._process(1.0 / 30)
	if visual.frame != 2 or other.frame != 8:
		print("FAIL: actors must not share their running phase")
		quit(1)
		return
	actor.previous_run_distance = 24.0
	actor.run_distance = 28.0
	if visual.display_distance(0.0) != 24.0 or visual.display_distance(0.5) != 26.0 or visual.display_distance(1.0) != 28.0:
		print("FAIL: render frames between physics ticks must advance the visual phase smoothly")
		quit(1)
		return
	actor.previous_run_distance = actor.run_distance
	actor.facing = 1.0
	visual._process(1.0 / 120)
	var right_offset: float = visual.offset.x
	var frame_width: float = visual.sprite_frames.get_frame_texture(visual.animation, visual.frame).get_width()
	actor.facing = -1.0
	visual._process(1.0 / 120)
	if not visual.flip_h or visual.scale.x <= 0.0 or absf(visual.offset.x + right_offset + frame_width) > 0.01:
		print("FAIL: turning must mirror the complete body around its anchor without shrinking through zero")
		quit(1)
		return
	other_actor.free()
	other.free()
	actor.free()
	visual.free()
	print("GODOT FULL BODY: ", count, " unclipped full poses, independent phases, sub-tick sampling and anchored mirroring passed")
	quit(0)

func cuts_body(image: Image, inside: Vector2i, outside: Vector2i) -> bool:
	if not Rect2i(Vector2i.ZERO, image.get_size()).has_point(outside):
		return image.get_pixelv(inside).a > 0.5
	# Ink may end at its bounding box; reject cutting a continuous painted limb instead.
	return image.get_pixelv(inside).a > 0.5 and image.get_pixelv(outside).a > 0.5
