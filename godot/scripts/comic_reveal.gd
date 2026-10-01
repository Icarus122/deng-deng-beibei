extends RefCounted

var count := 0
var visible_count := 0
var elapsed := 0.0

func open(panels: int) -> void:
	count = panels
	visible_count = mini(1, panels)
	elapsed = 0

func tick(delta: float) -> void:
	elapsed += delta
	while elapsed >= 4.0 and visible_count < count:
		elapsed -= 4.0
		visible_count += 1

func click() -> bool:
	if visible_count < count:
		visible_count = count
		return false
	return true
