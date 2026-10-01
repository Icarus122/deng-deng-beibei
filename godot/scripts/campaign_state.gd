extends RefCounted

var chapter := 1
var phase := "chase"
var hearts := 3
var coins := 0
var direction := 1
var time_left := 90.0
var has_tissues := false
var paused := false
var invulnerability := 0.0
var checkpoint_x := 160.0
var contacts: Dictionary = {}

func start(number: int) -> void:
	chapter = clampi(number, 1, 3)
	phase = "dual_chase" if chapter == 3 else "chase"
	hearts = 3
	coins = 0
	direction = 1
	time_left = 90.0
	has_tissues = false
	paused = false
	invulnerability = 0
	checkpoint_x = 160
	contacts.clear()

func tick(delta: float) -> void:
	if paused or phase.begins_with("comic") or phase in ["failed", "completed"]:
		return
	invulnerability = maxf(0, invulnerability - delta)
	if phase == "return":
		time_left = maxf(0, time_left - delta)
		if time_left == 0:
			phase = "failed"

func advance(x: float) -> void:
	if paused:
		return
	if chapter == 3:
		if phase == "dual_chase" and x >= 21000:
			phase = "comic_mid"
		elif phase == "chase_cao" and x >= 41600:
			phase = "comic_return"
		elif phase == "return" and x <= 21000:
			phase = "comic_outro"
	elif phase == "chase" and x >= (36000 if chapter == 1 else 48000):
		phase = "comic_outro"

func continue_story() -> void:
	match phase:
		"comic_mid": phase = "chase_cao"
		"comic_return":
			phase = "return"
			direction = -1
			has_tissues = true
			checkpoint_x = 41600
			contacts.clear()
		"comic_outro": phase = "completed"

func contact(id: String, overlapping: bool) -> bool:
	if not overlapping:
		contacts.erase(id)
		return false
	if contacts.has(id):
		return false
	contacts[id] = true
	if paused or invulnerability > 0 or phase.begins_with("comic") or phase in ["failed", "completed"]:
		return false
	hearts = maxi(0, hearts - 1)
	invulnerability = 1.4
	if hearts == 0:
		phase = "failed"
	return true

func retry() -> void:
	hearts = 3
	invulnerability = 1.4
	contacts.clear()
	paused = false
	if chapter == 3 and has_tissues:
		phase = "return"
		direction = -1
		time_left = 90
		checkpoint_x = 41600
	else:
		phase = "chase_cao" if chapter == 3 and checkpoint_x >= 21000 else ("dual_chase" if chapter == 3 else "chase")

