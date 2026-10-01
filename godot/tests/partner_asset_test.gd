extends SceneTree

func _initialize() -> void:
	var source = load("res://scripts/partner_visual.gd")
	if not source.can_instantiate():
		print("FAIL: partner renderer cannot compile")
		quit(1)
		return
	for character in range(2):
		var visual = source.new()
		visual.configure(character)
		for i in range(16):
			var texture: AtlasTexture = visual.sprite_frames.get_frame_texture("poses", i)
			var image := texture.atlas.get_image()
			var rect := Rect2i(texture.region)
			# Production sampling requires actual empty borders, not just a valid rectangle.
			for y in range(rect.position.y, rect.end.y):
				for x in range(rect.position.x, rect.end.x):
					if x < rect.position.x + 12 or x >= rect.end.x - 12 or y < rect.position.y + 12 or y >= rect.end.y - 12:
						if image.get_pixel(x, y).a > 0.12:
							print("FAIL: partner pose lacks safe empty border: ", character, "/", i)
							visual.free()
							quit(1)
							return
		visual.free()
	print("GODOT PARTNER ASSETS: both atlases have 16 isolated source cells with 12px safety margins; not anatomical acceptance")
	quit(0)
