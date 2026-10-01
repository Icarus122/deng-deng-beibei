extends SceneTree

func _initialize() -> void:
	run.call_deferred()

func run() -> void:
	var backup := ConfigFile.new()
	backup.load("user://campaign-v1.cfg")
	var scene = load("res://scenes/campaign.tscn").instantiate()
	root.add_child(scene)
	scene.stars = [1, 2, 3]
	scene.sound_enabled = false
	scene.control("fps:60", true)
	Engine.max_fps = 120
	var restored = load("res://scenes/campaign.tscn").instantiate()
	root.add_child(restored)
	var correct: bool = Engine.max_fps == 60 and not restored.sound_enabled and restored.stars == [1, 2, 3]
	backup.save("user://campaign-v1.cfg")
	paused = false
	scene.free()
	restored.free()
	if not correct:
		print("FAIL: stars, sound and render cap must all survive a new scene")
		quit(1)
		return
	print("GODOT SETTINGS: real config round trip passed")
	quit(0)
