extends SceneTree

func painted_height(visual: AnimatedSprite2D) -> float:
	var texture: AtlasTexture = visual.sprite_frames.get_frame_texture(visual.animation, visual.frame)
	var region := Rect2i(texture.region)
	var image := texture.atlas.get_image()
	var top := region.end.y
	var bottom := region.position.y
	for y in range(region.position.y, region.end.y):
		for x in range(region.position.x, region.end.x):
			if image.get_pixel(x, y).a > 0.5:
				top = mini(top, y)
				bottom = maxi(bottom, y)
	return (bottom - top + 1) * visual.scale.y

func _initialize() -> void:
	var actor = load("res://scripts/runner.gd").new()
	actor.action = "idle"
	var beibei = load("res://scripts/runner_visual.gd").new()
	beibei.runner = actor
	beibei._process(0)
	var meng = load("res://scripts/partner_visual.gd").new()
	meng.configure(0)
	meng.runner = actor
	meng._process(0)
	var cao = load("res://scripts/partner_visual.gd").new()
	cao.configure(1)
	cao.runner = actor
	cao._process(0)
	var a := painted_height(beibei)
	var b := painted_height(meng)
	var c := painted_height(cao)
	var cao_texture: AtlasTexture = cao.sprite_frames.get_frame_texture(cao.animation, cao.frame)
	var valid := absf(a - b) < 2 and absf(c / b - 183.0 / 170.0) < 0.02 and cao_texture.atlas.resource_path.ends_with("cao-actions-packed-v2.png")
	print("STANDING HEIGHTS Beibei=", a, " Meng=", b, " Cao=", c, " ratio=", c / b)
	beibei.free()
	meng.free()
	cao.free()
	actor.free()
	if not valid:
		print("FAIL: equal 170cm characters, complete corrected Cao standing pose and 183cm scale required")
		quit(1)
		return
	print("GODOT CHARACTER SCALE: two matching 170cm silhouettes and corrected taller 183cm Cao")
	quit(0)
