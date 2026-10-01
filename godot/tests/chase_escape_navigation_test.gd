extends SceneTree

func _initialize() -> void:
	run.call_deferred()

func run() -> void:
	for hz in [30, 60]:
		Engine.physics_ticks_per_second = hz
		for chapter in [1, 2, 3]:
			var world = load("res://scripts/level_world.gd").new()
			root.add_child(world)
			world.build(chapter)
			var target = load("res://scripts/runner.gd").new()
			target.position = Vector2(520, 575)
			root.add_child(target)
			var ai = load("res://scripts/chase_ai.gd").new()
			ai.runner = target
			ai.goal = world.data.length - 40
			root.add_child(ai)
			var airborne := 0.0
			var reached := false
			var continuous := true
			var maximum_speed := 0.0
			var delta: float = 1.0 / hz
			for frame in range(hz * 240):
				await physics_frame
				world.tick(delta, [target])
				var before: Vector2 = target.position
				# Sustained deficit exercises the recovery cap on actual terrain.
				ai.step(delta, target.position + Vector2(120, 0), false)
				maximum_speed = maxf(maximum_speed, target.velocity.x)
				continuous = continuous and absf(target.position.x - before.x) <= 410 * delta + 0.01
				airborne = 0.0 if target.is_on_floor() else airborne + delta
				if target.position.y > 780 or airborne > 2.2 or not continuous:
					print("FAIL: physical escape navigation chapter=", chapter, " hz=", hz, " frame=", frame, " position=", target.position, " air=", airborne)
					cleanup(ai, target, world)
					quit(1)
					return
				if absf(target.position.x - ai.goal) < 40 and target.is_on_floor() and absf(target.velocity.x) < 1:
					reached = true
					break
			print("ESCAPE COURSE ", chapter, " ", hz, "Hz reached=", reached, " max_speed=", maximum_speed)
			cleanup(ai, target, world)
			if not reached:
				print("FAIL: pursuit recovery pace must reach the real chapter goal")
				quit(1)
				return
	print("GODOT ESCAPE NAVIGATION: bounded physical recovery crosses all outbound courses at 30/60Hz")
	quit(0)

func cleanup(ai: Node, target: Node, world: Node) -> void:
	ai.free()
	target.free()
	world.free()
