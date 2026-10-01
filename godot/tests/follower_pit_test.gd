extends SceneTree

func _initialize() -> void:
	run.call_deferred()

func floor_box(x: float, width: float) -> void:
	var body := StaticBody2D.new()
	body.position = Vector2(x, 586)
	var shape := CollisionShape2D.new()
	var rectangle := RectangleShape2D.new()
	rectangle.size = Vector2(width, 12)
	shape.shape = rectangle
	body.add_child(shape)
	root.add_child(body)

func run() -> void:
	floor_box(350, 700)
	floor_box(1650, 1500)
	for hz in [30, 60]:
		Engine.physics_ticks_per_second = hz
		for direction in [1, -1]:
			var runner = load("res://scripts/runner.gd").new()
			root.add_child(runner)
			runner.position = Vector2(550 if direction > 0 else 1050, 575)
			var ai = load("res://scripts/chase_ai.gd").new()
			ai.runner = runner
			ai.direction = direction
			ai.goal = 1950 if direction > 0 else 150
			root.add_child(ai)
			var committed := false
			var landed := false
			for i in range(hz * 5):
				await physics_frame
				if ai.pit_jump and not runner.is_on_floor():
					committed = true
					ai.following = true
				ai.step(1.0 / hz, runner.position - Vector2(direction * 50, 0), true)
				if committed and runner.is_on_floor():
					landed = runner.position.x >= 900 if direction > 0 else runner.position.x <= 700
					break
			ai.free()
			runner.free()
			if not landed:
				print("FAIL: committed following jump must finish after player reversal at ", hz, "Hz direction=", direction)
				quit(1)
				return
	print("GODOT FOLLOWER PIT: both directions at 30/60Hz finish committed jumps before stopping")
	quit(0)
