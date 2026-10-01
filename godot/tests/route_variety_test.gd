extends SceneTree

func _initialize() -> void:
	var Data = load("res://scripts/level_data.gd")
	var easy: Dictionary = Data.chapter(1)
	for number in [2, 3]:
		var road: Dictionary = Data.chapter(number)
		var heights: Dictionary = {}
		for hill in road.hills:
			heights[hill.height] = true
		if heights.size() < 3 or road.platforms.size() <= easy.platforms.size() + 8 or road.hazards.size() < 36:
			print("FAIL: chapter ", number, " repeats the same hill and four-platform pattern instead of distinct risk/reward connections")
			quit(1)
			return
		for item in road.platforms:
			if item.id.begins_with("loft_"):
				var supported := false
				for lower in road.platforms:
					if lower.y > item.y and lower.y - item.y <= 90 and absf(lower.x - item.x) <= (item.width + lower.width) / 2 + 80:
						supported = true
				if not supported:
					print("FAIL: reward tier must have an approachable lower platform")
					quit(1)
					return
	print("GODOT ROUTE VARIETY: later roads add varied slopes, approachable reward tiers and encounters")
	quit(0)
