extends SceneTree

func _initialize() -> void:
	var story = load("res://scripts/story.gd")
	var count := 0
	for key in story.SCENES:
		var art: Dictionary = story.ART[key]
		if not FileAccess.file_exists("res://assets/" + art.file):
			push_error("Missing scene-specific comic: " + key)
			quit(1)
			return
		for panel in story.SCENES[key]:
			count += 1
			if panel.art < 0 or panel.art >= art.columns * art.rows or panel.lines.size() != panel.bubbles.size():
				push_error("Invalid artwork/bubble layout: " + key)
				quit(1)
				return
			for index in range(panel.lines.size()):
				var line: Array = panel.lines[index]
				var box: Array = panel.bubbles[index]
				if line.size() != 2 or line[1].is_empty() or box[0] < 0 or box[0] + box[2] > 100:
					push_error("Unreadable or out-of-bounds comic dialogue: " + key)
					quit(1)
					return
			if story.panel_text(panel).is_empty():
				push_error("Native comic accessibility dialogue is empty")
				quit(1)
				return
	if count != 29:
		push_error("Nine linked scenes should contain 29 authored panels")
		quit(1)
		return
	print("GODOT COMIC: nine scene assets, 29 panels and shared readable bubble dialogue passed")
	quit(0)
