extends RefCounted

const BACKGROUNDS := ["campus", "riverside", "night-market"]
const SECTION_NAMES := [
	["银杏校门", "坡路课堂", "旧桥练习", "图书廊", "操场近路", "钟楼集合"],
	["河岸入口", "货台上下", "铃桥机关", "风车台阶", "落箱街区", "星灯出口"],
	["夜市入口", "灯笼坡街", "服务站", "送货巷", "收棚长街", "巡游街口"]]

static func chapter(number: int) -> Dictionary:
	number = clampi(number, 1, 3)
	var length: float = [36000.0, 48000.0, 41600.0][number - 1]
	var road := {"number": number, "length": length, "background": BACKGROUNDS[number - 1],
		"sections": SECTION_NAMES[number - 1], "hills": [], "gaps": [], "platforms": [],
		"hazards": [], "pickups": [], "return_hazards": [], "return_pickups": []}
	var starts: Array = [1200, 6500, 12500, 18500, 24500, 30500] if number == 1 else ([1500, 8500, 16000, 24000, 32000, 40500] if number == 2 else [1300, 8000, 15000, 22200, 28500, 35500])
	road.checkpoints = starts.duplicate()
	for i in range(6):
		var x: float = starts[i]
		var height := 45.0 if number == 1 else (70.0 if number == 2 else 95.0)
		road.hills.append(Vector4(x + 700, x + 1200, x + 1700, x + 2300))
		road.hills[-1] = {"range": road.hills[-1], "height": height}
		var gap_width := 145.0 if number == 1 else 215.0
		road.gaps.append(Vector2(x + 3050, x + 3050 + gap_width))
		if number > 1:
			road.gaps.append(Vector2(x + 4400, x + 4650))
		# Four authored stepping surfaces: entry, upper reward, bridge, exit.
		for p in range(4):
			var px := x + 2450 + p * 285
			var py := 508.0 if p in [0, 3] else 436.0
			road.platforms.append({"id": "p_%d_%d" % [i, p], "x": px, "y": py,
				"width": 250.0, "kind": "moving" if number > 1 and p == 2 else ("collapse" if number == 3 and p == 1 else "stone"), "amplitude": 55.0})
		var count := 2 if number == 1 else 5
		for h in range(count):
			var hx := x + 400 + h * 900
			# Gap approaches remain visible and free of unavoidable stacked damage.
			if h == 3:
				hx = x + 3900
			var kind: String = ["banana", "spikes"][h % 2] if number == 1 else (["cart", "spikes", "crate", "banana", "crate"][h] if number == 2 else ["cart", "crate", "spikes", "banana", "cart"][h])
			road.hazards.append({"id": "h_%d_%d" % [i, h], "x": hx, "y": floor_y(road, hx), "kind": kind, "phase": i * 0.7 + h})
		for p in range(14 if number == 1 else 20):
			var px := x + 180 + p * 245
			if _in_gap(road, px):
				continue
			road.pickups.append({"id": "coin_%d_%d" % [i, p], "x": px, "y": floor_y(road, px) - 43, "kind": "coin"})
		for p in range(4):
			var platform: Dictionary = road.platforms[i * 4 + p]
			road.pickups.append({"id": "upper_%d_%d" % [i, p], "x": platform.x, "y": platform.y - 40, "kind": "gem" if p == 1 else "coin"})
		road.pickups.append({"id": "energy_%d" % i, "x": x + 3650, "y": floor_y(road, x + 3650) - 35, "kind": "gem"})
		if i in [1, 4]:
			road.pickups.append({"id": "heart_%d" % i, "x": x + 3305, "y": 390.0, "kind": "heart"})
		if number == 3 and x > 21000:
			for h in range(5):
				var hx := x + 250 + h * 680
				road.return_hazards.append({"id": "return_%d_%d" % [i, h], "x": hx, "y": floor_y(road, hx), "kind": ["cart", "spikes", "crate", "cart", "banana"][h], "phase": 0.5 + h})
	if number == 2:
		road.pickups.append({"id": "bridge_ball", "x": 19400.0, "y": 490.0, "kind": "ball"})
		road.gaps.append(Vector2(20000, 20260))
		road.platforms.append({"id": "bell_bridge", "x": 20130.0, "y": 580.0, "width": 320.0, "kind": "bridge", "amplitude": 0.0})
		# Keep the bell/pit decision separate from the next falling-box lesson.
		for hazard in road.hazards:
			if hazard.id == "h_2_4":
				hazard.x = 21100.0
				hazard.y = floor_y(road, hazard.x)
	for number_ball in range(4):
		var bx := 4200.0 + number_ball * 8000
		road.pickups.append({"id": "ball_%d" % number_ball, "x": bx, "y": floor_y(road, bx) - 28, "kind": "ball"})
	if number == 3:
		for supply in [[34600.0, "heart"], [29100.0, "heart"], [38900.0, "gem"], [26300.0, "gem"]]:
			road.return_pickups.append({"id": "return_supply_%s" % supply[0], "x": supply[0], "y": floor_y(road, supply[0]) - 35, "kind": supply[1]})
	return road

static func _in_gap(road: Dictionary, x: float) -> bool:
	for gap in road.gaps:
		if x > gap.x and x < gap.y:
			return true
	return false

static func floor_y(road: Dictionary, x: float) -> float:
	for hill in road.hills:
		var bounds: Vector4 = hill.range
		if x >= bounds.x and x <= bounds.w:
			if x < bounds.y:
				return 580 - hill.height * inverse_lerp(bounds.x, bounds.y, x)
			if x <= bounds.z:
				return 580 - hill.height
			return 580 - hill.height * (1 - inverse_lerp(bounds.z, bounds.w, x))
	return 580.0

static func floor_segments(road: Dictionary) -> Array:
	var marks: Array = [0.0, road.length + 900]
	for hill in road.hills:
		var bounds: Vector4 = hill.range
		marks.append_array([bounds.x, bounds.y, bounds.z, bounds.w])
	for gap in road.gaps:
		marks.append_array([gap.x, gap.y])
	marks.sort()
	var segments: Array = []
	for i in range(marks.size() - 1):
		if marks[i + 1] > marks[i] and not _in_gap(road, (marks[i] + marks[i + 1]) / 2.0):
			segments.append([Vector2(marks[i], floor_y(road, marks[i])), Vector2(marks[i + 1], floor_y(road, marks[i + 1]))])
	return segments
