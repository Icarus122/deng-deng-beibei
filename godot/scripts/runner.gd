extends CharacterBody2D

const WALK_SPEED := 240.0
const SPRINT_SPEED := 330.0
const GRAVITY := 1450.0
const JUMP_SPEED := -560.0
const COYOTE_SECONDS := 0.10
const BUFFER_SECONDS := 0.12

var jumps_used := 0
var run_distance := 0.0
var previous_run_distance := 0.0
var energy := 100.0
var facing := 1.0
var action := "idle"
var jump_buffer := 0.0
var coyote := 0.0
var drop_remaining := 0.0
var landing_remaining := 0.0
var feedback := ""
var feedback_remaining := 0.0

func perform(pose: String, seconds: float) -> void:
	feedback = pose
	feedback_remaining = seconds

func _init() -> void:
	collision_layer = 4
	collision_mask = 3
	floor_snap_length = 8.0
	floor_constant_speed = true
	platform_on_leave = CharacterBody2D.PLATFORM_ON_LEAVE_DO_NOTHING
	var shape := CollisionShape2D.new()
	var rectangle := RectangleShape2D.new()
	rectangle.size = Vector2(32, 100)
	shape.shape = rectangle
	shape.position = Vector2(0, -50)
	add_child(shape)

func request_jump() -> void:
	jump_buffer = BUFFER_SECONDS

func release_jump() -> void:
	if velocity.y < -220.0:
		velocity.y = -220.0

func step(delta: float, direction: float, sprint: bool, jump_held: bool, down: bool, pace_scale := 1.0) -> void:
	previous_run_distance = run_distance
	feedback_remaining = maxf(0.0, feedback_remaining - delta)
	var was_grounded := is_on_floor()
	var before := position
	drop_remaining = maxf(0.0, drop_remaining - delta)
	set_collision_mask_value(2, drop_remaining <= 0.0)
	landing_remaining = maxf(0.0, landing_remaining - delta)
	if was_grounded and drop_remaining <= 0.0:
		jumps_used = 0
		coyote = COYOTE_SECONDS
	else:
		coyote = maxf(0.0, coyote - delta)
	var speed := (SPRINT_SPEED if sprint and energy > 0.0 else WALK_SPEED) * pace_scale
	velocity.x = move_toward(velocity.x, clampf(direction, -1.0, 1.0) * speed, 1800.0 * delta)
	var turning := absf(velocity.x) > 15.0 and velocity.x * direction < 0.0
	if absf(velocity.x) > 15.0:
		facing = signf(velocity.x)
	if sprint and absf(direction) > 0.1 and energy > 0.0:
		energy = maxf(0.0, energy - 26.0 * delta)
	elif was_grounded:
		energy = minf(100.0, energy + 14.0 * delta)
	velocity.y = minf(900.0, velocity.y + GRAVITY * delta)
	if jump_buffer > 0.0:
		if down and was_grounded and _on_one_way():
			drop_remaining = 0.22
			set_collision_mask_value(2, false)
			position.y += 5.0
			velocity.y = 150.0
			jumps_used = 1
			coyote = 0.0
			jump_buffer = 0.0
		elif coyote > 0.0 or jumps_used < 2:
			jumps_used = 1 if coyote > 0.0 else maxi(1, jumps_used) + 1
			velocity.y = JUMP_SPEED if jumps_used == 1 else -495.0
			coyote = 0.0
			jump_buffer = 0.0
	jump_buffer = maxf(0.0, jump_buffer - delta)
	if not jump_held:
		release_jump()
	move_and_slide()
	if not was_grounded and is_on_floor():
		landing_remaining = 0.10
	if was_grounded and is_on_floor() and drop_remaining <= 0.0:
		run_distance += absf(position.x - before.x)
	if not is_on_floor():
		action = ("double_jump" if jumps_used == 2 else "jump") if velocity.y < -100 else ("apex" if velocity.y < 100 else "fall")
	elif landing_remaining > 0.0:
		action = "land"
	elif turning:
		action = "turn"
	elif absf(velocity.x) < 15.0:
		action = "idle"
	else:
		action = "sprint" if speed > WALK_SPEED else "run"
	if feedback_remaining > 0.0:
		action = feedback

func _on_one_way() -> bool:
	for i in range(get_slide_collision_count()):
		var collision := get_slide_collision(i)
		var body = collision.get_collider()
		if collision.get_normal().y < -0.6 and body is CollisionObject2D:
			if body.get_collision_layer_value(2):
				return true
	return false
