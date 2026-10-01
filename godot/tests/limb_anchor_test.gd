extends SceneTree

func _initialize() -> void:
	var visual = load("res://tests/fixtures/rejected_cutout_visual.gd").new()
	if not visual.has_method("_segment_transform"):
		print("FAIL: limb joints must use their actual painted endpoints, not rectangle centers")
		visual.free()
		quit(1)
		return
	# Local pixel landmarks measured from the selected transparent atlas.
	for anchors in [[Vector2(67, 24), Vector2(108, 224)], [Vector2(59, 24), Vector2(33, 224)], [Vector2(100, 29), Vector2(59, 268)], [Vector2(49, 29), Vector2(77, 263)], [Vector2(49, 29), Vector2(45, 261)], [Vector2(37, 21), Vector2(80, 194)], [Vector2(47, 78), Vector2(84, 154)]]:
		for angle in [-1.2, 0.0, 1.2]:
			var start := Vector2(5, -60)
			var end := start + Vector2(0, 28).rotated(angle)
			var transform: Transform2D = visual._segment_transform(anchors[0], anchors[1], start, end)
			if (transform * anchors[0]).distance_to(start) > 0.001 or (transform * anchors[1]).distance_to(end) > 0.001:
				print("FAIL: painted knee/ankle does not coincide with the rig joint")
				quit(1)
				return
			if absf(transform.x.length() - transform.y.length()) > 0.0001 or absf(transform.x.dot(transform.y)) > 0.0001:
				print("FAIL: limb art is squashed or sheared instead of keeping its proportions")
				quit(1)
				return
	visual.free()
	print("GODOT LIMBS: 21 rotated joint mappings preserve endpoints and art proportions")
	quit(0)
