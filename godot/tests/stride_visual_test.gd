extends SceneTree

func _initialize() -> void:
	var visual = load("res://scripts/runner_visual.gd").new()
	var count: int = visual.sprite_frames.get_frame_count("run")
	var wide_keys := [0, 0]
	var widest := 0.0
	for i in range(count):
		var texture: AtlasTexture = visual.sprite_frames.get_frame_texture("run", i)
		var image := texture.atlas.get_image()
		var region := texture.region
		var left := int(region.end.x)
		var right := int(region.position.x)
		# Bottom 40% isolates lower legs/shoes, not swinging arms or hair.
		for y in range(int(region.position.y + region.size.y * 0.6), int(region.end.y)):
			for x in range(int(region.position.x), int(region.end.x)):
				if image.get_pixel(x, y).a > 0.5:
					left = mini(left, x)
					right = maxi(right, x)
		var spread: float = (right - left + 1) * visual.scale.x
		widest = maxf(widest, spread)
		if spread >= 100.0:
			wide_keys[0 if i < count / 2 else 1] += 1
	if wide_keys[0] < 2 or wide_keys[1] < 2:
		print("FAIL: each half-cycle needs two genuinely wide leg silhouettes at game scale; widest=", widest)
		visual.free()
		quit(1)
		return
	if not is_equal_approx(visual.scale.x, visual.scale.y):
		print("FAIL: wider stride must come from new leg poses, not stretching the whole character")
		visual.free()
		quit(1)
		return
	visual.free()
	print("GODOT STRIDE: both half-cycles contain wide complete leg silhouettes without body stretching; widest=", widest)
	quit(0)
