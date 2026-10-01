extends SceneTree

func _initialize() -> void:
	var config := ConfigFile.new()
	if config.load("res://export_presets.cfg") != OK:
		print("FAIL: export configuration cannot load")
		quit(1)
		return
	var files: PackedStringArray = config.get_value("preset.0", "export_files", PackedStringArray())
	if config.get_value("preset.0", "export_filter") != "resources":
		print("FAIL: development export needs explicit dependencies and no raw rejected art")
		quit(1)
		return
	for path in ["res://scenes/boot.tscn", "res://scenes/campaign.tscn", "res://scripts/campaign.gd", "res://scripts/level_world.gd", "res://scenes/sample.tscn", "res://scripts/runner.gd", "res://scripts/runner_visual.gd", "res://assets/beibei-actions-packed-v2.png", "res://assets/meng-run-short-packed-v1.png", "res://assets/cao-run-short-packed-v1.png", "res://assets/cao-actions-packed-v2.png", "res://assets/academy-ui.otf"]:
		if not files.has(path):
			print("FAIL: explicit development manifest omits runtime dependency: ", path)
			quit(1)
			return
	for path in ["res://assets/beibei-parts-v1.png", "res://assets/cao-actions-v1.png", "res://assets/meng-run-beibei-style-v2.png", "res://assets/cao-run-beibei-style-v1.png", "res://assets/meng-run-packed-v2.png", "res://assets/cao-run-packed-v2.png", "res://tests/fixtures/rejected_cutout_visual.gd"]:
		if files.has(path):
			print("FAIL: raw rejected art or diagnostic fixture is included")
			quit(1)
			return
	var scene: PackedScene = load("res://scenes/sample.tscn")
	var root_node = scene.instantiate()
	if root_node.UI_FONT == null:
		print("FAIL: selected-scene export must retain Chinese font as a real dependency")
		quit(1)
		return
	root_node.free()
	print("GODOT PACKAGE: boot/sample/development dependencies, rejected-art exclusion and Chinese font passed")
	quit(0)
