extends SceneTree

func _initialize() -> void:
	var visual = load("res://scripts/runner_visual.gd").new()
	var actor = load("res://scripts/runner.gd").new()
	visual.runner = actor
	for key in ["idle", "anticipation", "jump", "apex", "fall", "double_jump", "land", "turn", "hurt", "slip", "fallen", "rise", "kick", "celebrate", "cry", "concern"]:
		if not visual.sprite_frames.has_animation(key):
			print("FAIL: dedicated complete-body action missing: ", key)
			visual.free()
			actor.free()
			quit(1)
			return
		actor.action = key
		visual._process(0.01)
		if visual.animation != key:
			print("FAIL: feedback action incorrectly falls through to running: ", key)
			quit(1)
			return
		var texture: AtlasTexture = visual.sprite_frames.get_frame_texture(key, 0)
		if not texture.atlas.resource_path.contains("actions"):
			print("FAIL: jumping/feedback still borrows a running pose")
			quit(1)
			return
		if not Rect2(Vector2.ZERO, texture.atlas.get_size()).encloses(texture.region):
			print("FAIL: action crops an incomplete body")
			quit(1)
			return
		var image := texture.atlas.get_image()
		var rect := Rect2i(texture.region)
		for x in range(rect.position.x, rect.end.x):
			if cuts_body(image, Vector2i(x, rect.position.y), Vector2i(x, rect.position.y - 1)) or cuts_body(image, Vector2i(x, rect.end.y - 1), Vector2i(x, rect.end.y)):
				print("FAIL: action contains a clipped head or shoe: ", key)
				visual.free()
				actor.free()
				quit(1)
				return
		for y in range(rect.position.y, rect.end.y):
			if cuts_body(image, Vector2i(rect.position.x, y), Vector2i(rect.position.x - 1, y)) or cuts_body(image, Vector2i(rect.end.x - 1, y), Vector2i(rect.end.x, y)):
				print("FAIL: action clips a connected arm or leg: ", key)
				visual.free()
				actor.free()
				quit(1)
				return
	visual.free()
	actor.free()
	print("GODOT WHOLE ACTION: 16 dedicated complete-body states passed")
	quit(0)

func cuts_body(image: Image, inside: Vector2i, outside: Vector2i) -> bool:
	if not Rect2i(Vector2i.ZERO, image.get_size()).has_point(outside):
		return image.get_pixelv(inside).a > 0.5
	return image.get_pixelv(inside).a > 0.5 and image.get_pixelv(outside).a > 0.5
