extends SceneTree

func _initialize() -> void:
	if not ResourceLoader.exists("res://scripts/level_data.gd"):
		print("FAIL: campaign requires three authored independent roads")
		quit(1)
		return
	var data = load("res://scripts/level_data.gd")
	var backgrounds: Array = []
	for number in range(1, 4):
		var road: Dictionary = data.chapter(number)
		backgrounds.append(road.background)
		if road.sections.size() != 6 or road.platforms.size() < 12:
			print("FAIL: six populated sections are required")
			quit(1)
			return
		var ids: Dictionary = {}
		for object in road.platforms + road.hazards + road.pickups:
			if ids.has(object.id):
				print("FAIL: duplicated world entity ID")
				quit(1)
				return
			ids[object.id] = true
		for hole in road.gaps:
			if hole.y - hole.x > 280:
				print("FAIL: ordinary pits cannot exceed tested double-jump envelope")
				quit(1)
				return
	if backgrounds[0] == backgrounds[1] or backgrounds[1] == backgrounds[2]:
		print("FAIL: third road is not another river scene")
		quit(1)
		return
	if data.chapter(3).return_hazards.is_empty():
		print("FAIL: return journey requires a distinct encounter layout")
		quit(1)
		return
	print("GODOT LEVEL DATA: independent roads, six sections, unique IDs and return layout passed")
	quit(0)
