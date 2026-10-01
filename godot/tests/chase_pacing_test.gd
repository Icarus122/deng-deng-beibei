extends SceneTree

var failures: Array[String] = []

func _initialize() -> void:
	run.call_deferred()

func check(value: bool, message: String) -> void:
	if not value:
		failures.append(message)
		print("FAIL: ", message)

func floor_box() -> void:
	var body := StaticBody2D.new()
	body.position = Vector2(25000, 586)
	var shape := CollisionShape2D.new()
	var rectangle := RectangleShape2D.new()
	rectangle.size = Vector2(52000, 12)
	shape.shape = rectangle
	body.add_child(shape)
	root.add_child(body)

func actor(x: float) -> CharacterBody2D:
	var result = load("res://scripts/runner.gd").new()
	result.position = Vector2(x, 575)
	root.add_child(result)
	return result

func run() -> void:
	floor_box()
	for hz in [30, 60]:
		Engine.physics_ticks_per_second = hz
		var delta: float = 1.0 / hz
		for initial_lead in [-120.0, 360.0]:
			var player := actor(1000)
			var target := actor(1000 + initial_lead)
			var ai = load("res://scripts/chase_ai.gd").new()
			ai.runner = target
			ai.goal = 21000
			root.add_child(ai)
			var continuous := true
			var maximum_speed := 0.0
			for frame in range(hz * 12):
				await physics_frame
				player.energy = 100
				player.step(delta, 1, true, true, false)
				var previous := target.position
				ai.step(delta, player.position, false)
				maximum_speed = maxf(maximum_speed, target.velocity.x)
				continuous = continuous and absf(target.position.x - previous.x) <= 410 * delta + 0.01
			var lead := target.position.x - player.position.x
			print("PACING ", hz, "Hz initial=", initial_lead, " final_lead=", snappedf(lead, 0.01), " max_speed=", maximum_speed)
			check(lead >= 220 and lead <= 450, "outbound target rebuilds a visible lead against sustained player sprint at %dHz (initial %s)" % [hz, initial_lead])
			check(continuous and maximum_speed <= 410, "lead recovery is bounded physical movement without a position jump")
			check(is_equal_approx(player.velocity.x, 330), "player sprint speed stays unchanged")
			ai.free()
			target.free()
			player.free()
		for open_window in [false, true]:
			var target := actor(1000)
			var ai = load("res://scripts/chase_ai.gd").new()
			ai.runner = target
			ai.goal = 21000
			ai.following = not open_window
			root.add_child(ai)
			for frame in range(hz * 2):
				await physics_frame
				ai.step(delta, Vector2(3000, 580), open_window)
			check(target.velocity.x <= 240.01, "catch window and following mode never receive the outbound escape pace")
			ai.following = false
			ai.knock_down()
			var before := target.position.x
			for frame in range(hz / 2):
				await physics_frame
				ai.step(delta, Vector2(3000, 580), false)
			check(target.position.x - before < 35 and absf(target.velocity.x) < 1, "a grounded basketball stun keeps its real stopping effect")
			ai.free()
			target.free()
		for goal in [21000.0, 41600.0]:
			var target := actor(goal - 500)
			var ai = load("res://scripts/chase_ai.gd").new()
			ai.runner = target
			ai.goal = goal
			root.add_child(ai)
			for frame in range(hz * 5):
				await physics_frame
				ai.step(delta, Vector2(goal - 100, 580), false)
			check(absf(target.position.x - goal) < 40 and absf(target.velocity.x) < 1, "outbound escape pace still settles at the %s story goal" % goal)
			ai.free()
			target.free()
	print("GODOT CHASE PACING: ", failures.size(), " failures")
	quit(0 if failures.is_empty() else 1)
