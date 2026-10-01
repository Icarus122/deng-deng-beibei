extends Node

var runner: CharacterBody2D
var goal := 36000.0
var direction := 1.0
var following := false
var stunned := 0.0
var no_progress := 0.0
var previous_x := 0.0
var jump_cooldown := 0.0
var pit_jump := false
var launch_y := 580.0
var landing_x := 0.0

func floor_at(x: float, y: float) -> Dictionary:
	var ray := PhysicsRayQueryParameters2D.create(Vector2(x, y - 12), Vector2(x, y + 200), 3, [runner.get_rid()])
	return runner.get_world_2d().direct_space_state.intersect_ray(ray)

func step(delta: float, player: Vector2, catch_open: bool) -> void:
	stunned = maxf(0, stunned - delta)
	jump_cooldown = maxf(0, jump_cooldown - delta)
	var move := direction
	if following:
		move = direction if (player.x - runner.position.x) * direction > 115 else 0.0
	elif (goal - runner.position.x) * direction < 20:
		move = 0.0
	# Following distance/goal changes cannot cancel travel to the selected bank.
	if pit_jump and not runner.is_on_floor():
		move = direction
	# A hit cannot stop an already committed jump over empty space.
	# Land first; the remaining stun still applies on the receiving bank.
	if stunned > 0 and runner.is_on_floor():
		move = 0.0
	var lead := (runner.position.x - player.x) * direction
	var escaping := not following and not catch_open
	var sprint := escaping and lead < 360
	# Rebuild distance lost on terrain using the same acceleration/collisions.
	# Catch windows, return following and a grounded stun retain ordinary pace.
	var pace_scale := 1.0 + clampf((280 - lead) / 360, 0, 0.18) if escaping and stunned <= 0 else 1.0
	if move != 0.0 and (stunned <= 0 or not runner.is_on_floor()):
		var ahead := floor_at(runner.position.x + direction * 75, runner.position.y)
		var landing := floor_at(runner.position.x + direction * 340, runner.position.y)
		if runner.is_on_floor():
			pit_jump = false
			if ahead.is_empty() and not landing.is_empty() and jump_cooldown == 0:
				runner.request_jump()
				jump_cooldown = 0.65
				pit_jump = true
				launch_y = runner.position.y
				landing_x = landing.position.x
		elif pit_jump and runner.jumps_used == 1 and runner.velocity.y > 200 and runner.position.y >= launch_y - 55 and not floor_at(landing_x, launch_y).is_empty():
			# Delay the second impulse until descending: an apex impulse lands short of wide pits.
			# Retain the selected bank; probing farther every tick can mistake the next pit for it.
			runner.request_jump()
		# A real wall/step ahead is checked separately from empty space.
		var wall_ray := PhysicsRayQueryParameters2D.create(runner.position + Vector2(0, -45), runner.position + Vector2(direction * 60, -45), 3, [runner.get_rid()])
		if runner.is_on_floor() and not runner.get_world_2d().direct_space_state.intersect_ray(wall_ray).is_empty() and jump_cooldown == 0:
			runner.request_jump()
			jump_cooldown = 0.65
	# The selected-bank double jump is tuned for walking pace; a recovery
	# sprint can sail across its short landing bank into the following pit.
	if pit_jump:
		sprint = false
		pace_scale = 1.0
	if move != 0 and absf(runner.position.x - previous_x) < delta * 8:
		no_progress += delta
	else:
		no_progress = 0
	previous_x = runner.position.x
	var drop := no_progress > 0.9 and runner.is_on_floor()
	if drop:
		runner.request_jump()
		no_progress = 0
	runner.energy = 100
	runner.step(delta, move, sprint, true, drop, pace_scale)

func knock_down() -> void:
	stunned = 1.0
	runner.perform("fallen", 0.65)
