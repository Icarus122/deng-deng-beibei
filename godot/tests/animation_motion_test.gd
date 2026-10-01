extends SceneTree

func _initialize() -> void:
	var visual = load("res://tests/fixtures/rejected_cutout_visual.gd").new()
	root.add_child(visual)
	if not visual.has_method("_arm_swing"):
		print("FAIL: arm swing is synchronized to the opposite leading leg")
		quit(1)
		return
	if visual._arm_swing(0) <= 0 or visual._arm_swing(0.5) >= 0:
		print("FAIL: leading leg must oppose the visible near arm")
		quit(1)
		return
	for p in [0.43, 0.93]:
		if visual._foot(p, true).y >= -4 or visual._foot(fposmod(p + 0.5, 1), true).y >= -4:
			print("FAIL: running has a brief two-foot flight after push-off")
			quit(1)
			return
	for boundary in [0.0, 0.36, 0.5, 0.86]:
		var before: Vector2 = visual._foot(fposmod(boundary - 0.0001, 1), true)
		var after: Vector2 = visual._foot(fposmod(boundary + 0.0001, 1), true)
		if before.distance_to(after) > 0.05:
			print("FAIL: foot trajectory jumps at a cycle boundary")
			quit(1)
			return
	if not visual.has_method("_blend_pose"):
		print("FAIL: jump pose changes must ease instead of snapping in one frame")
		quit(1)
		return
	var start := {"hip": Vector2(0, -48), "near": Vector2(26, -3), "far": Vector2(-26, -15), "swing": 0.75, "lean": 0.08}
	var target := {"hip": Vector2(0, -48), "near": Vector2(20, -23), "far": Vector2(-25, -30), "swing": -0.5, "lean": 0.04}
	var one_frame: Dictionary = visual._blend_pose(start, target, 1.0 / 60)
	if one_frame["near"].distance_to(target["near"]) < 10 or one_frame["near"].distance_to(start["near"]) > 8:
		print("FAIL: takeoff snaps instead of retaining a short continuous transition")
		quit(1)
		return
	var sixty: Dictionary = start.duplicate()
	var thirty: Dictionary = start.duplicate()
	for i in range(12):
		sixty = visual._blend_pose(sixty, target, 1.0 / 60)
	for i in range(6):
		thirty = visual._blend_pose(thirty, target, 1.0 / 30)
	if sixty["near"].distance_to(thirty["near"]) > 0.001 or sixty["near"].distance_to(target["near"]) > 1:
		print("FAIL: transition duration changes at 30/60 FPS")
		quit(1)
		return
	print("GODOT MOTION: opposite arms, flight, continuous feet and frame-rate independent transitions passed")
	visual.queue_free()
	quit(0)
