extends Node2D

const PARTS = preload("res://assets/beibei-parts-v2.png")
const HEAD := Rect2(92, 8, 363, 338)
const TORSO := Rect2(510, 8, 315, 382)
const SKIRT := Rect2(833, 99, 384, 285)
const UPPER_ARM := Rect2(226, 353, 112, 290)
const FOREARM := Rect2(617, 405, 122, 216)
const HAND := Rect2(990, 451, 139, 181)
const THIGH := Rect2(195, 654, 163, 249)
const CALF := Rect2(615, 646, 109, 249)
const SHOE := Rect2(948, 762, 211, 119)
const FAR_THIGH := Rect2(188, 910, 155, 298)
const FAR_CALF := Rect2(616, 904, 110, 293)
const FAR_SHOE := Rect2(957, 1052, 213, 131)

var runner: CharacterBody2D
var phase := 0.0
var clock := 0.0
var pose: Dictionary = {}
var previous_group := ""
var transition_remaining := 0.0

func _process(delta: float) -> void:
	clock += delta
	if runner != null:
		phase = fposmod(runner.run_distance / 144.0, 1.0)
		scale.x = runner.facing
		var group := "ground" if runner.action in ["run", "sprint", "land"] else str(runner.action)
		if group != previous_group:
			transition_remaining = 0.14
		transition_remaining = maxf(0, transition_remaining - delta)
		var target := _target_pose()
		pose = target if pose.is_empty() else _blend_pose(pose, target, delta)
		if group == "ground" and transition_remaining <= 0:
			# The continuous gait is already smooth; retain arm/leg synchronization.
			pose = target
		previous_group = group
		queue_redraw()

func _draw() -> void:
	if runner == null or pose.is_empty():
		return
	var hip: Vector2 = pose["hip"]
	var swing: float = pose["swing"]
	var lean: float = pose["lean"]
	var body := hip + Vector2(-3, 0)
	_arm(_body_point(Vector2(235, 90), body, lean), -swing, true)
	_leg(hip + Vector2(-3, 0), pose["far"], true)
	_leg(hip + Vector2(3, 0), pose["near"], false)
	_piece(TORSO, body, Vector2(40, 47), Vector2(0.5, 1.0), lean)
	_piece(SKIRT, hip + Vector2(0, -12), Vector2(46, 28), Vector2(0.5, 0.0), -swing * 0.035)
	_arm(_body_point(Vector2(44, 95), body, lean), swing, false)
	_piece(HEAD, _body_point(Vector2(155, 32), body, lean), Vector2(40, 37), Vector2(210, 294) / HEAD.size, -lean * 0.35)

func _target_pose() -> Dictionary:
	var running: bool = runner.action in ["run", "sprint", "land"]
	var bob := _hip_bob(phase) if running else sin(clock * 2.0) * 0.5
	var hip := Vector2(0, -60 + bob)
	var near_foot := _foot(phase, running)
	var far_foot := _foot(fposmod(phase + 0.5, 1.0), running)
	if runner.action in ["jump", "double_jump"]:
		near_foot = Vector2(20, -23)
		far_foot = Vector2(-25, -30 if runner.action == "double_jump" else -15)
	elif runner.action == "apex":
		near_foot = Vector2(24, -14)
		far_foot = Vector2(-19, -22)
	elif runner.action == "fall":
		near_foot = Vector2(13, -3)
		far_foot = Vector2(-12, -6)
	elif runner.action == "land":
		hip.y += 3.0
	elif runner.action == "turn":
		hip += Vector2(-3, 2)
		near_foot = Vector2(22, -3)
		far_foot = Vector2(-18, -3)
	elif runner.action == "kick":
		near_foot = Vector2(42, -25)
		far_foot = Vector2(-6, -3)
	elif runner.action == "hit":
		hip += Vector2(-7, 3)
		near_foot = Vector2(17, -5)
	elif runner.action == "slip":
		hip.y += 12
		near_foot = Vector2(30, -3)
		far_foot = Vector2(-25, -3)
	elif runner.action in ["cry", "stomach", "down"]:
		hip.y += 22
		near_foot = Vector2(18, -3)
		far_foot = Vector2(-15, -3)
	var swing := _arm_swing(phase) if running else 0.05
	if runner.action == "cheer":
		swing = -2.4
	elif runner.action in ["cry", "stomach"]:
		swing = -1.3
	return {"hip": hip, "near": near_foot, "far": far_foot, "swing": swing, "lean": 0.10 if running else 0.03}

func _blend_pose(current: Dictionary, target: Dictionary, delta: float) -> Dictionary:
	var weight := 1.0 - exp(-18.0 * delta)
	return {
		"hip": current["hip"].lerp(target["hip"], weight),
		"near": current["near"].lerp(target["near"], weight),
		"far": current["far"].lerp(target["far"], weight),
		"swing": lerpf(current["swing"], target["swing"], weight),
		"lean": lerpf(current["lean"], target["lean"], weight)
	}

func _arm_swing(p: float) -> float:
	return cos(p * TAU) * 0.75

func _hip_bob(p: float) -> float:
	var half_cycle := fposmod(p, 0.5) * 2.0
	if half_cycle < 0.72:
		return 2.5 * pow(sin(half_cycle / 0.72 * PI), 2)
	return -3.0 * pow(sin((half_cycle - 0.72) / 0.28 * PI), 2)

func _foot(p: float, running: bool) -> Vector2:
	if not running:
		return Vector2(7 if p < 0.5 else -7, -3)
	if p < 0.36:
		return Vector2(25.92 - p * 144.0, -3)
	var t := (p - 0.36) / 0.64
	var passing := t * t * (3.0 - 2.0 * t)
	var x := lerpf(-25.92, 25.92, passing) - 92.16 * (2 * t * t * t - 3 * t * t + t)
	return Vector2(x, -3 - 29 * pow(sin(t * PI), 2))

func _leg(hip: Vector2, foot: Vector2, far: bool) -> void:
	var shoe := FAR_SHOE if far else SHOE
	var shoe_scale := 25.0 / shoe.size.x
	var sole := Vector2(45, 117) if far else Vector2(52, 103)
	var shoe_socket := Vector2(45, 27) if far else Vector2(52, 24)
	var ankle := foot + (shoe_socket - sole) * shoe_scale
	var reach := ankle - hip
	var distance := clampf(reach.length(), 2.0, 57.8)
	var angle := reach.angle() - acos(clampf((28.0 * 28.0 + distance * distance - 30.0 * 30.0) / (56.0 * distance), -1.0, 1.0))
	var knee := hip + Vector2.from_angle(angle) * 28.0
	var tint := Color(0.78, 0.82, 0.88) if far else Color.WHITE
	_segment(FAR_THIGH if far else THIGH, Vector2(100, 29) if far else Vector2(67, 24), Vector2(59, 268) if far else Vector2(108, 224), hip, knee, tint)
	_segment(FAR_CALF if far else CALF, Vector2(49, 29) if far else Vector2(59, 24), Vector2(77, 263) if far else Vector2(33, 224), knee, ankle, tint)
	_piece(shoe, foot, shoe.size * shoe_scale, sole / shoe.size, 0.0, tint)

func _arm(shoulder: Vector2, swing: float, far: bool) -> void:
	var angle := swing + 0.12
	var elbow := shoulder + Vector2(0, 20).rotated(angle)
	var fore_angle := angle - 1.25
	var wrist := elbow + Vector2(0, 18).rotated(fore_angle)
	var tint := Color(0.80, 0.83, 0.90) if far else Color.WHITE
	_segment(UPPER_ARM, Vector2(49, 29), Vector2(45, 261), shoulder, elbow, tint)
	_segment(FOREARM, Vector2(37, 21), Vector2(80, 194), elbow, wrist, tint)
	_segment(HAND, Vector2(47, 78), Vector2(84, 154), wrist, wrist + Vector2(0, 8).rotated(fore_angle), tint)

func _body_point(pixel: Vector2, body: Vector2, angle: float) -> Vector2:
	return body + (pixel * Vector2(40, 47) / TORSO.size - Vector2(20, 47)).rotated(angle)

func _segment_transform(source_start: Vector2, source_end: Vector2, start: Vector2, end: Vector2) -> Transform2D:
	var source_axis := source_end - source_start
	var axis := end - start
	var factor := axis.length() / source_axis.length()
	var angle := axis.angle() - source_axis.angle()
	var x_axis := Vector2.RIGHT.rotated(angle) * factor
	var y_axis := Vector2.DOWN.rotated(angle) * factor
	return Transform2D(x_axis, y_axis, start - x_axis * source_start.x - y_axis * source_start.y)

func _segment(source: Rect2, source_start: Vector2, source_end: Vector2, start: Vector2, end: Vector2, tint: Color) -> void:
	draw_set_transform_matrix(_segment_transform(source_start, source_end, start, end))
	draw_texture_rect_region(PARTS, Rect2(Vector2.ZERO, source.size), source, tint)
	draw_set_transform(Vector2.ZERO)

func _piece(source: Rect2, pivot: Vector2, size: Vector2, origin: Vector2, angle: float, tint := Color.WHITE) -> void:
	draw_set_transform(pivot, angle)
	draw_texture_rect_region(PARTS, Rect2(-size * origin, size), source, tint)
	draw_set_transform(Vector2.ZERO)
