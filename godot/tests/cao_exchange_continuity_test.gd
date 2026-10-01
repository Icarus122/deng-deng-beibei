extends SceneTree

var failures: Array[String] = []

func _initialize() -> void:
	run.call_deferred()

func check(value: bool, message: String) -> void:
	if not value:
		failures.append(message)
		print("FAIL: ", message)

func run() -> void:
	for hz in [30, 60]:
		Engine.physics_ticks_per_second = hz
		var scene = load("res://scenes/campaign.tscn").instantiate()
		root.add_child(scene)
		scene.set_physics_process(false)
		scene.start_chapter(3)
		while scene.mode == "comic":
			scene.comic_click()
		scene.state.phase = "chase_cao"
		scene.world.hazards.clear()
		scene.world.pickups.clear()
		scene.runner.position = Vector2(41600, 575)
		var cao: CharacterBody2D = scene.partners[1].runner
		var visual: AnimatedSprite2D = cao.get_child(1)
		cao.position = Vector2(41620, 575)
		for frame in range(hz / 2):
			await physics_frame
			cao.step(1.0 / hz, 0, false, true, false)
			scene.runner.step(1.0 / hz, 0, false, true, false)
		cao.action = "run"
		cao.velocity.x = 30
		cao.run_distance = 66
		cao.previous_run_distance = 66
		visual._process(0)
		var before := cao.position
		await physics_frame
		scene._physics_process(1.0 / hz)
		check(scene.mode == "comic" and scene.comic_key == "3_return", "near-Cao arrival opens tissue exchange at %dHz" % hz)
		check(cao.action == "idle" and visual.animation == "poses" and visual.frame == visual.ACTION_INDEX.idle, "exchange freeze already displays Cao's settled pose, without a stale run frame")
		var frozen := cao.position
		while scene.mode == "comic":
			scene.comic_click()
		check(cao.position.distance_to(frozen) < 0.01, "receiving tissues never relocates the visible Cao actor")
		check(cao.facing == -1 and visual.flip_h, "return facing is synchronized before the first resumed render")
		check(cao.position.distance_to(before) < 10, "arrival and exchange have continuous world position")
		await physics_frame
		scene._physics_process(1.0 / hz)
		check(absf(cao.velocity.x) < 1 and cao.action == "idle", "Cao waits naturally until Beibei creates following distance")
		paused = false
		scene.free()
	print("GODOT CAO EXCHANGE CONTINUITY: ", failures.size(), " failures")
	quit(0 if failures.is_empty() else 1)
