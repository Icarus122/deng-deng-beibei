extends SceneTree

var failures: Array[String] = []
var checks := 0

func _initialize() -> void:
	run.call_deferred()

func check(value: bool, message: String) -> void:
	checks += 1
	if not value:
		failures.append(message)
		print("FAIL: ", message)

func run() -> void:
	var runner = load("res://scripts/runner.gd").new()
	root.add_child(runner)
	check(runner.has_method("request_jump"), "runner accepts buffered jump requests")
	if not failures.is_empty():
		finish()
		return
	var floor_body := StaticBody2D.new()
	var shape := CollisionShape2D.new()
	var rectangle := RectangleShape2D.new()
	rectangle.size = Vector2(1600, 40)
	shape.shape = rectangle
	floor_body.position = Vector2(500, 540)
	floor_body.add_child(shape)
	root.add_child(floor_body)
	runner.position = Vector2(180, 500)
	await frames(runner, 30)
	check(runner.is_on_floor(), "runner lands on visible floor")
	runner.request_jump()
	runner.step(1.0 / 60.0, 1.0, false, true, false)
	check(runner.velocity.y < -400, "ground jump immediately leaves floor")
	await frames(runner, 8)
	runner.request_jump()
	runner.step(1.0 / 60.0, 1.0, false, true, false)
	check(runner.jumps_used == 2, "one independent second jump is available")
	runner.request_jump()
	runner.step(1.0 / 60.0, 1.0, false, true, false)
	check(runner.jumps_used == 2, "third air jump cannot reset the limit")
	runner.release_jump()
	check(runner.velocity.y >= -220, "releasing jump cuts upward velocity")
	await frames(runner, 80)
	check(runner.is_on_floor(), "jump returns to real floor without floating")
	await frames(runner, 20, 1.0)
	runner.step(1.0 / 60, -1.0, false, true, false)
	check(runner.action == "turn" and runner.facing == 1.0, "reversal brakes before flipping the moving model")
	await frames(runner, 20, -1.0)
	check(runner.velocity.x < 0 and runner.facing == -1.0, "turn finishes in the actual travel direction")
	var before: float = runner.run_distance
	await frames(runner, 20, 1.0)
	check(runner.run_distance > before + 35, "ground displacement drives run phase")
	runner.request_jump()
	runner.step(1.0 / 60.0, 1.0, false, true, false)
	before = runner.run_distance
	await frames(runner, 10, 1.0)
	check(is_equal_approx(before, runner.run_distance), "air displacement cannot advance running phase")
	check(runner.energy <= 100.0, "jump cannot fill or overfill energy")
	runner.queue_free()
	floor_body.queue_free()
	await physics_frame
	var landing_floor := StaticBody2D.new()
	var landing_shape := CollisionShape2D.new()
	var landing_rect := RectangleShape2D.new()
	landing_rect.size = Vector2(800, 40)
	landing_shape.shape = landing_rect
	landing_floor.position = Vector2(300, 540)
	landing_floor.add_child(landing_shape)
	root.add_child(landing_floor)
	var buffered = load("res://scripts/runner.gd").new()
	root.add_child(buffered)
	buffered.position = Vector2(200, 500)
	buffered.velocity.y = 550
	buffered.jumps_used = 2
	buffered.request_jump()
	await frames(buffered, 5)
	check(buffered.velocity.y < -400, "third-air press before landing buffers a real ground jump")
	buffered.energy = 55.0
	await frames(buffered, 8)
	check(buffered.energy == 55.0, "airborne idle cannot regenerate sprint energy")
	buffered.queue_free()
	landing_floor.queue_free()
	await physics_frame
	var ledge := StaticBody2D.new()
	var ledge_shape := CollisionShape2D.new()
	var ledge_rect := RectangleShape2D.new()
	ledge_rect.size = Vector2(100, 12)
	ledge_shape.shape = ledge_rect
	ledge.position = Vector2(200, 306)
	ledge.add_child(ledge_shape)
	root.add_child(ledge)
	var edge_runner = load("res://scripts/runner.gd").new()
	root.add_child(edge_runner)
	edge_runner.position = Vector2(245, 295)
	await frames(edge_runner, 20)
	edge_runner.velocity.x = 240
	await frames(edge_runner, 7, 1.0)
	check(not edge_runner.is_on_floor(), "coyote fixture actually leaves support")
	edge_runner.request_jump()
	edge_runner.step(1.0 / 60, 1.0, false, true, false)
	check(edge_runner.jumps_used == 1 and edge_runner.velocity.y < -500, "edge grace preserves first jump instead of spending double jump")
	edge_runner.queue_free()
	ledge.queue_free()
	finish()

func frames(runner: CharacterBody2D, count: int, direction := 0.0) -> void:
	for i in range(count):
		await physics_frame
		runner.step(1.0 / 60.0, direction, false, true, false)

func finish() -> void:
	print("GODOT TESTS: ", checks - failures.size(), "/", checks, " passed")
	quit(0 if failures.is_empty() else 1)
