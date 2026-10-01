extends SceneTree

func _initialize() -> void:
	call_deferred("run")

func run() -> void:
	var World = load("res://scripts/level_world.gd")
	var world = World.new()
	root.add_child(world)
	world.build(1)
	for child in world.get_children():
		if not child is StaticBody2D or child is AnimatableBody2D:
			continue
		var face = child.get_node_or_null("RoadFace")
		if face == null or face.clip_children != CanvasItem.CLIP_CHILDREN_AND_DRAW or face.get_child_count() != 1:
			print("FAIL: road must have an opaque continuous face and clipped stone texture, not floating transparent cap tiles")
			quit(1)
			return
	await physics_frame
	await physics_frame
	var gap: Vector2 = world.data.gaps[0]
	var ray = PhysicsRayQueryParameters2D.create(Vector2((gap.x + gap.y) / 2, 550), Vector2((gap.x + gap.y) / 2, 720), 1)
	if not world.get_world_2d().direct_space_state.intersect_ray(ray).is_empty():
		print("FAIL: presentation must not fill actual pits")
		quit(1)
		return
	print("GODOT ROAD PRESENTATION: continuous stone face clips textures while actual pit stays empty")
	quit(0)
