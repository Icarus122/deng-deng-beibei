extends Node2D

const Data = preload("res://scripts/level_data.gd")
const Contact = preload("res://scripts/swept_contact.gd")
const PROPS = preload("res://assets/props.png")
const PLATFORM = preload("res://assets/platforms.png")
const RoadSurface = preload("res://scripts/road_surface.gd")
const SIGNS = preload("res://assets/campaign-props-packed-v3.png")
const BACKGROUNDS := {"campus": preload("res://assets/campus.webp"), "riverside": preload("res://assets/riverside.webp"), "night-market": preload("res://assets/night-market.png")}
const RECTS := {
	"ball": Rect2(30, 35, 205, 210), "banana": Rect2(270, 45, 235, 195),
	"crate": Rect2(16, 278, 234, 218), "coin": Rect2(25, 525, 210, 209),
	"gem": Rect2(305, 515, 169, 222), "cart": Rect2(500, 532, 260, 206),
	"spikes": Rect2(774, 598, 234, 121), "heart": Rect2(20, 768, 220, 205)}

var data: Dictionary
var platforms: Array = []
var hazards: Array = []
var pickups: Array = []
var returning := false
var elapsed := 0.0
var bridge_open := false
var bell: Sprite2D
var signs: Array[Sprite2D] = []
var tissues: Sprite2D

func build(number: int) -> void:
	data = Data.chapter(number)
	var backdrop := Parallax2D.new()
	backdrop.scroll_scale = Vector2(0.18, 1)
	backdrop.repeat_size = Vector2(1280, 0)
	backdrop.repeat_times = 2
	backdrop.z_index = -20
	var art := Sprite2D.new()
	art.texture = BACKGROUNDS[data.background]
	art.centered = false
	art.scale = Vector2(1280.0 / art.texture.get_width(), 720.0 / art.texture.get_height())
	backdrop.add_child(art)
	add_child(backdrop)
	for segment in Data.floor_segments(data):
		_ground(segment[0], segment[1])
	for checkpoint in data.checkpoints:
		signs.append(_sign_sprite(3, Vector2(checkpoint, Data.floor_y(data, checkpoint)), 0.22))
	for item in data.platforms:
		_platform(item)
	set_returning(false)
	for item in data.pickups:
		var entity: Dictionary = item.duplicate()
		entity.node = prop(item.kind, Vector2(item.x, item.y), 26 if item.kind == "coin" else 36)
		entity.taken = false
		pickups.append(entity)
	if number == 2:
		bell = _sign_sprite(0, Vector2(19760, 510), 0.24)
	if number == 3:
		tissues = _sign_sprite(1, Vector2(41600, Data.floor_y(data, 41600)), 0.16)

func _sign_sprite(index: int, at: Vector2, size_scale: float) -> Sprite2D:
	var sprite := Sprite2D.new()
	var texture := AtlasTexture.new()
	texture.atlas = SIGNS
	texture.region = Rect2((index % 2) * 512, (index / 2) * 640, 512, 640)
	texture.filter_clip = true
	sprite.texture = texture
	sprite.centered = false
	sprite.offset = Vector2(-256, -600)
	sprite.position = at
	sprite.scale = Vector2.ONE * size_scale
	add_child(sprite)
	return sprite

func _ground(a: Vector2, b: Vector2) -> void:
	var vertices := PackedVector2Array([a, b, Vector2(b.x, 820), Vector2(a.x, 820)])
	var body := StaticBody2D.new()
	var shape := CollisionPolygon2D.new()
	shape.polygon = vertices
	body.add_child(shape)
	add_child(body)
	var earth := Polygon2D.new()
	earth.name = "RoadFace"
	earth.polygon = vertices
	earth.color = [Color("69594e"), Color("515968"), Color("414c64")][data.number - 1]
	earth.clip_children = CanvasItem.CLIP_CHILDREN_AND_DRAW
	body.add_child(earth)
	var surface := RoadSurface.new()
	surface.configure(a, b, data.number)
	earth.add_child(surface)

func _platform(item: Dictionary) -> void:
	var entity: Dictionary = item.duplicate()
	var body := AnimatableBody2D.new()
	body.position = Vector2(item.x, item.y)
	body.collision_layer = 2
	body.sync_to_physics = false
	var shape := CollisionShape2D.new()
	var rectangle := RectangleShape2D.new()
	rectangle.size = Vector2(item.width, 12)
	shape.shape = rectangle
	shape.position.y = 6
	shape.one_way_collision = true
	shape.one_way_collision_margin = 5
	body.add_child(shape)
	var texture := AtlasTexture.new()
	texture.atlas = PLATFORM
	texture.region = Rect2(273, 605 if item.kind == "moving" else 132, 224, 75)
	var sprite := Sprite2D.new()
	sprite.texture = texture
	sprite.centered = false
	sprite.position = Vector2(-item.width / 2, 0)
	sprite.scale = Vector2(item.width / 224, 0.6)
	body.add_child(sprite)
	add_child(body)
	entity.body = body
	entity.shape = shape
	entity.sprite = sprite
	entity.state = "solid"
	entity.timer = 0.0
	platforms.append(entity)
	if item.kind == "bridge":
		shape.disabled = true
		body.hide()

func prop(kind: String, at: Vector2, width: float) -> Sprite2D:
	var sprite := Sprite2D.new()
	var texture := AtlasTexture.new()
	texture.atlas = PROPS
	texture.region = RECTS[kind]
	texture.filter_clip = true
	sprite.texture = texture
	sprite.position = at
	sprite.scale = Vector2.ONE * width / texture.region.size.x
	add_child(sprite)
	return sprite

func set_returning(value: bool) -> void:
	returning = value
	for i in range(pickups.size() - 1, -1, -1):
		if pickups[i].get("return_only", false):
			pickups[i].node.free()
			pickups.remove_at(i)
	if value:
		for item in data.return_pickups:
			var entity: Dictionary = item.duplicate()
			entity.node = prop(item.kind, Vector2(item.x, item.y), 36)
			entity.taken = false
			entity.return_only = true
			pickups.append(entity)
	for entity in hazards:
		entity.node.free()
	hazards.clear()
	var layout: Array = data.return_hazards if value else data.hazards
	for item in layout:
		var entity: Dictionary = item.duplicate()
		entity.node = prop(item.kind, Vector2(item.x, item.y - 20), 76 if item.kind in ["cart", "crate", "spikes"] else 42)
		entity.box = Rect2()
		entity.previous_box = Rect2()
		entity.dangerous = false
		hazards.append(entity)

func tick(delta: float, actors: Array) -> void:
	elapsed += delta
	for entity in platforms:
		if entity.kind == "moving":
			entity.body.position.x = entity.x + sin(elapsed * 1.2) * entity.amplitude
		elif entity.kind == "collapse":
			entity.timer += delta
			if entity.state == "solid":
				for actor in actors:
					if actor.is_on_floor() and absf(actor.position.y - entity.y) < 3 and absf(actor.position.x - entity.x) < entity.width / 2:
						entity.state = "warning"
						entity.timer = 0
			elif entity.state == "warning" and entity.timer >= 0.65:
				entity.state = "gone"
				entity.timer = 0
				entity.shape.disabled = true
				entity.body.hide()
			elif entity.state == "gone" and entity.timer >= 3:
				entity.state = "solid"
				entity.shape.disabled = false
				entity.body.show()
			entity.sprite.modulate = Color("ffbe84") if entity.state == "warning" else Color.WHITE
	for entity in hazards:
		entity.previous_box = entity.box
		var px: float = entity.x
		var py: float = entity.y
		var height := 34.0
		var width := 56.0
		entity.dangerous = true
		if entity.kind == "cart":
			px += sin(elapsed * 1.6 + entity.phase) * 140
			py = Data.floor_y(data, px)
			height = 46
		elif entity.kind == "crate":
			var phase := fposmod(elapsed + entity.phase, 4.5)
			# The warning is a ground shadow; it never enters the damage snapshot.
			entity.dangerous = phase >= 1.4 and phase <= 2.75
			py -= 240.0 * (1 - clampf((phase - 1.4) / 0.55, 0, 1))
			height = 64
			entity.node.modulate.a = 1.0 if phase < 2.8 else 0.2
		elif entity.kind == "banana":
			height = 16
			width = 30
		entity.box = Rect2(px - width / 2, py - height, width, height)
		if entity.previous_box.size == Vector2.ZERO:
			entity.previous_box = entity.box
		entity.node.position = Vector2(px, py - height / 2)
	for entity in pickups:
		if not entity.taken:
			entity.node.rotation = 0.06 * sin(elapsed * 3 + entity.x)
	queue_redraw()

func _draw() -> void:
	for entity in hazards:
		if entity.kind == "crate":
			var warning := fposmod(elapsed + entity.phase, 4.5) < 1.4
			if warning:
				draw_line(Vector2(entity.x - 35, entity.y - 2), Vector2(entity.x + 35, entity.y - 2), Color("ffc869"), 5)
				draw_circle(Vector2(entity.x, entity.y - 15), 6, Color("ffbd5c"))

func contacts(before: Vector2, after: Vector2) -> Array:
	var result: Array = []
	for entity in hazards:
		if not entity.dangerous:
			continue
		var relative_finish: Vector2 = after - (entity.box.position - entity.previous_box.position)
		# Runner centre and half-extents match CharacterBody2D, not visible ink bounds.
		var expanded: Rect2 = entity.previous_box.grow_individual(16, 50, 16, 50)
		if Contact.intersects(before + Vector2(0, -50), relative_finish + Vector2(0, -50), expanded):
			result.append(entity)
	result.sort_custom(func(a, b): return a.kind != "banana" and b.kind == "banana")
	return result

func unlock_bridge() -> void:
	bridge_open = true
	for entity in platforms:
		if entity.kind == "bridge":
			entity.shape.disabled = false
			entity.body.show()
	if bell:
		bell.modulate = Color("9bffd7")

func reset_pickups_after(x: float, direction: int) -> void:
	for entity in pickups:
		# Coins and their score are retained together; only consumable aids respawn.
		if entity.kind != "coin" and (entity.x - x) * direction > 0:
			entity.taken = false
			entity.node.show()
