extends SceneTree

func _initialize() -> void:
	if not ResourceLoader.exists("res://scripts/basketball.gd"):
		print("FAIL: basketball needs a real flying projectile")
		quit(1)
		return
	var ball = load("res://scripts/basketball.gd").new()
	ball.shoot(Vector2(100, 540), 1, Vector2(400, 440))
	var start: Vector2 = ball.position
	ball.step(0.1)
	if ball.position.x - start.x < 50 or ball.position.y == start.y:
		print("FAIL: kicked ball must separate visibly with an arc")
		quit(1)
		return
	var hit := false
	for i in range(60):
		ball.step(1.0 / 30)
		if ball.hits(Rect2(380, 410, 40, 100)):
			hit = true
	if not hit:
		print("FAIL: ground-to-high target must be hit at 30 FPS")
		quit(1)
		return
	ball.step(3.0)
	if ball.active:
		print("FAIL: missed ball cannot stay in world forever")
		quit(1)
		return
	ball.free()
	print("GODOT BALL: visible separation, arc, swept high target and lifetime passed")
	quit(0)
