extends SceneTree

func _initialize() -> void:
	var Data = load("res://scripts/level_data.gd")
	for chapter in [1, 2, 3]:
		var data: Dictionary = Data.chapter(chapter)
		for hazard in data.hazards + data.return_hazards:
			var margin := 185.0 if hazard.kind == "cart" else 70.0
			for gap in data.gaps:
				if hazard.x + margin > gap.x and hazard.x - margin < gap.y:
					print("FAIL: hazard ", hazard.id, " in chapter ", chapter, " crosses an unsupported pit/approach at ", hazard.x)
					quit(1)
					return
	print("GODOT HAZARD LAYOUT: all static and moving danger footprints stay on supported road")
	quit(0)
