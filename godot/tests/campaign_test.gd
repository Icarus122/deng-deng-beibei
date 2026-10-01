extends SceneTree

var errors: Array[String] = []
var checks := 0

func _initialize() -> void:
	run.call_deferred()

func check(ok: bool, why: String) -> void:
	checks += 1
	if not ok:
		errors.append(why)
		print("FAIL: ", why)

func run() -> void:
	if not ResourceLoader.exists("res://scripts/campaign_state.gd"):
		check(false, "campaign starts with real three-chapter state")
		finish()
		return
	var state = load("res://scripts/campaign_state.gd").new()
	state.start(3)
	check(state.phase == "dual_chase" and state.hearts == 3, "third chapter starts chasing both partners with three hearts")
	state.advance(21001)
	check(state.phase == "comic_mid" and state.time_left == 90, "service station stops play before return clock")
	state.tick(20)
	check(state.time_left == 90, "comic never consumes rescue time")
	state.continue_story()
	check(state.phase == "chase_cao", "after stomachache only Cao remains a target")
	state.advance(41800)
	check(state.phase == "comic_return", "catch Cao triggers tissue scene")
	state.continue_story()
	check(state.phase == "return" and state.direction == -1 and state.has_tissues, "tissues reverse objective and auto direction")
	state.tick(7)
	check(state.time_left == 83, "active return counts seconds exactly")
	state.paused = true
	state.tick(12)
	check(state.time_left == 83, "pause freezes return timer")
	state.paused = false
	check(state.contact("cart-1", true), "first dangerous entry causes damage")
	check(not state.contact("cart-1", true) and state.hearts == 2, "continuous contact cannot drain another heart")
	state.tick(2)
	check(not state.contact("cart-1", true), "invulnerability ending does not create a new entry")
	state.contact("cart-1", false)
	check(state.contact("cart-1", true) and state.hearts == 1, "leaving then entering permits one new hit")
	state.time_left = 0.1
	state.tick(0.2)
	check(state.phase == "failed", "return timeout is an explicit failure")
	state.retry()
	check(state.phase == "return" and state.time_left == 90 and state.has_tissues and state.checkpoint_x == 41600, "retry return never replays outbound and retains tissues")
	state.advance(21000)
	check(state.phase == "comic_outro", "return completes at actual service station")
	state.continue_story()
	check(state.phase == "completed", "outro is needed before chapter completion")
	state.start(1)
	state.advance(15000)
	check(state.phase == "chase", "early catch cannot end first level before 85 percent")
	state.advance(36000)
	check(state.phase == "comic_outro", "first chapter ends at rendezvous not through opponent falling in pit")
	var story = load("res://scripts/story.gd")
	for key in ["1_intro", "1_outro", "2_intro", "2_bridge", "2_outro", "3_intro", "3_mid", "3_return", "3_outro"]:
		check(story.SCENES.has(key) and story.SCENES[key].size() >= 2, "linked comic exists: " + key)
	var reveal = load("res://scripts/comic_reveal.gd").new()
	reveal.open(3)
	reveal.tick(4.1)
	check(reveal.visible_count == 2, "automatic comic reveals one panel at a time")
	check(not reveal.click() and reveal.visible_count == 3, "first click reveals current page without advancing")
	check(reveal.click(), "next click advances after whole page visible")
	finish()

func finish() -> void:
	print("GODOT CAMPAIGN: ", checks - errors.size(), "/", checks, " passed")
	quit(0 if errors.is_empty() else 1)
