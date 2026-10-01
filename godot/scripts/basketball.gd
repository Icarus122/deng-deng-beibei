extends Node2D

const Contact = preload("res://scripts/swept_contact.gd")
const PROPS = preload("res://assets/props.png")
const GRAVITY := 800.0
var previous := Vector2.ZERO
var velocity := Vector2.ZERO
var age := 0.0
var active := false

func _init() -> void:
	var texture := AtlasTexture.new()
	texture.atlas = PROPS
	texture.region = Rect2(30, 35, 205, 210)
	var sprite := Sprite2D.new()
	sprite.texture = texture
	sprite.scale = Vector2(0.14, 0.14)
	add_child(sprite)

func shoot(foot: Vector2, direction: float, target: Vector2) -> void:
	position = foot
	previous = foot
	velocity.x = 520.0 * direction
	var travel := clampf(absf(target.x - foot.x) / 520.0, 0.15, 1.3)
	velocity.y = clampf((target.y - foot.y - 0.5 * GRAVITY * travel * travel) / travel, -640, 80)
	age = 0
	active = true
	show()

func step(delta: float) -> void:
	if not active:
		return
	previous = position
	position += velocity * delta + Vector2(0, 0.5 * GRAVITY * delta * delta)
	velocity.y += GRAVITY * delta
	rotation += velocity.x * delta / 14.0
	age += delta
	if age >= 2.5 or position.y > 1000:
		active = false
		queue_redraw()
		if is_inside_tree():
			hide()

func hits(box: Rect2) -> bool:
	return active and Contact.intersects(previous, position, box, 14)

func consume() -> void:
	active = false
	hide()
