extends SceneTree

func _initialize() -> void:
	run.call_deferred()

func floor_box(x: float, y: float, width: float, one_way := false) -> void:
	var body := StaticBody2D.new()
	body.collision_layer = 2 if one_way else 1
	body.position = Vector2(x, y)
	var shape := CollisionShape2D.new()
	var rect := RectangleShape2D.new()
	rect.size = Vector2(width, 12)
	shape.position.y = 6
	shape.shape = rect
	shape.one_way_collision = one_way
	body.add_child(shape)
	root.add_child(body)

func run() -> void:
	if not ResourceLoader.exists("res://scripts/chase_ai.gd"):
		print("FAIL: partners need shared physical navigation, not animated position offsets")
		quit(1)
		return
	floor_box(350, 580, 700)
	floor_box(1650, 580, 1500)
	floor_box(380, 508, 240, true)
	for fps in [30, 60]:
		Engine.physics_ticks_per_second = fps
		var runner = load("res://scripts/runner.gd").new()
		root.add_child(runner)
		runner.position = Vector2(350, 503)
		var ai = load("res://scripts/chase_ai.gd").new()
		ai.runner = runner
		ai.goal = 1950
		root.add_child(ai)
		var fell := false
		for i in range(fps * 11):
			await physics_frame
			ai.step(1.0 / fps, Vector2.ZERO, true)
			fell = fell or runner.position.y > 800
		if fell or runner.position.x < 1900 or not runner.is_on_floor() or absf(runner.position.y - 580) > 2:
			print("FAIL: AI must leave upper surface, clear pit and stop grounded at %d FPS: " % fps, runner.position)
			quit(1)
			return
		ai.free()
		runner.free()
	print("GODOT AI: upper-route exit, pit clearance and grounded stop at 30/60 FPS passed")
	quit(0)
