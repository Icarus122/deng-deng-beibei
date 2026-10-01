extends SceneTree

var failures: Array[String] = []
var checks := 0

func _initialize() -> void:
	run.call_deferred()

func check(ok: bool, message: String) -> void:
	checks += 1
	if not ok:
		failures.append(message)
		print("FAIL: ", message)

func tick(runner: CharacterBody2D, count: int, direction := 0.0) -> void:
	for i in range(count):
		await physics_frame
		runner.step(1.0 / Engine.physics_ticks_per_second, direction, false, true, false)

func platform(at: Vector2, width: float, one_way: bool) -> AnimatableBody2D:
	var body := AnimatableBody2D.new()
	body.position = at
	body.sync_to_physics = false
	body.collision_layer = 2 if one_way else 1
	var collision := CollisionShape2D.new()
	var shape := RectangleShape2D.new()
	shape.size = Vector2(width, 12)
	collision.position.y = 6
	collision.shape = shape
	collision.one_way_collision = one_way
	body.add_child(collision)
	root.add_child(body)
	return body

func run() -> void:
	for fps in [60, 30]:
		Engine.physics_ticks_per_second = fps
		var runner = load("res://scripts/runner.gd").new()
		root.add_child(runner)
		var upper := platform(Vector2(200, 300), 220, true)
		var lower := platform(Vector2(200, 540), 1400, false)
		runner.position = Vector2(200, 290)
		await tick(runner, fps / 2)
		check(runner.is_on_floor() and absf(runner.position.y - 300) < 1, "one-way landing at %d FPS" % fps)
		runner.request_jump()
		runner.step(1.0 / fps, 0.0, false, true, true)
		await tick(runner, fps / 2)
		check(runner.position.y > 310, "down+jump leaves one-way at %d FPS" % fps)
		await tick(runner, fps)
		check(runner.is_on_floor() and absf(runner.position.y - 540) < 1, "drop lands on solid floor at %d FPS" % fps)
		runner.request_jump()
		runner.step(1.0 / fps, 0, false, true, true)
		check(runner.velocity.y < 0, "down+jump never disables solid floor at %d FPS" % fps)
		runner.position = Vector2(200, 290)
		runner.velocity = Vector2.ZERO
		await tick(runner, fps / 2)
		var start_x: float = runner.position.x
		for i in range(fps / 2):
			await physics_frame
			upper.position.x += 40.0 / fps
			runner.step(1.0 / fps, 0, false, true, false)
		check(runner.position.x > start_x + 10, "moving support carries runner at %d FPS" % fps)
		upper.queue_free()
		await tick(runner, fps / 3)
		check(not runner.is_on_floor() and runner.position.y > 310, "removed support cannot leave floating at %d FPS" % fps)
		runner.queue_free()
		lower.queue_free()
		await physics_frame
	print("GODOT PLATFORMS: ", checks - failures.size(), "/", checks, " passed")
	quit(0 if failures.is_empty() else 1)
