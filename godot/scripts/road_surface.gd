extends Node2D

const STONE = preload("res://assets/platforms.png")
const CAP := Rect2(280, 136, 208, 28)
const FACE := Rect2(280, 169, 208, 28)
var start := Vector2.ZERO
var finish := Vector2.ZERO
var chapter := 1

func configure(a: Vector2, b: Vector2, number: int) -> void:
	start = a
	finish = b
	chapter = number
	queue_redraw()

func _draw() -> void:
	var length := start.distance_to(finish)
	if length == 0:
		return
	# The parent polygon clips overlap at corners and actual pit boundaries.
	draw_set_transform(start, (finish - start).angle())
	var count := ceili(length / 150.0)
	var width := length / count
	var tint := Color("ede0be") if chapter == 1 else (Color("bbcace") if chapter == 2 else Color("a3b1cc"))
	for row in range(8):
		var stagger := -width / 2 if row % 2 else 0.0
		for tile in range(count + 1):
			draw_texture_rect_region(STONE, Rect2(stagger + tile * width - 1, 22 + row * 30, width + 2, 30), FACE, tint)
	for tile in range(count):
		draw_texture_rect_region(STONE, Rect2(tile * width - 1, 0, width + 2, 22), CAP, tint)
	draw_line(Vector2.ZERO, Vector2(length, 0), Color("f3dfb4"), 2, true)
	# Recessed lower courses keep the road grounded without a flat placeholder block.
	draw_rect(Rect2(0, 80, length, 200), Color(0.06, 0.09, 0.15, 0.17))
	draw_set_transform(Vector2.ZERO)
