extends RefCounted

# Relative motion against an expanded rectangle; also covers initial overlap.
static func intersects(start: Vector2, finish: Vector2, box: Rect2, radius := 0.0) -> bool:
	box = box.grow(radius)
	var motion := finish - start
	var enter := 0.0
	var leave := 1.0
	for axis in range(2):
		if absf(motion[axis]) < 0.00001:
			if start[axis] < box.position[axis] or start[axis] > box.end[axis]:
				return false
		else:
			var a: float = (box.position[axis] - start[axis]) / motion[axis]
			var b: float = (box.end[axis] - start[axis]) / motion[axis]
			enter = maxf(enter, minf(a, b))
			leave = minf(leave, maxf(a, b))
			if enter > leave:
				return false
	return leave >= 0.0 and enter <= 1.0
