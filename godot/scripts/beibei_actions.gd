extends RefCounted

# Original artist pixels isolated and repacked with user-authorized Python tooling.
# Anchors retain the same virtual floor/centre; no per-pose scaling or recentering.
const SHEET = preload("res://assets/beibei-actions-packed-v1.png")
const KEYS := {
	"idle": [Rect2(0, 0, 384, 384), Vector2(192, 368)],
	"anticipation": [Rect2(384, 0, 384, 384), Vector2(576, 368)],
	"jump": [Rect2(768, 0, 384, 384), Vector2(960, 368)],
	"apex": [Rect2(1152, 0, 384, 384), Vector2(1344, 368)],
	"fall": [Rect2(0, 384, 384, 384), Vector2(192, 752)],
	"double_jump": [Rect2(384, 384, 384, 384), Vector2(576, 752)],
	"land": [Rect2(768, 384, 384, 384), Vector2(960, 752)],
	"turn": [Rect2(1152, 384, 384, 384), Vector2(1344, 752)],
	"hurt": [Rect2(0, 768, 384, 384), Vector2(192, 1136)],
	"slip": [Rect2(384, 768, 384, 384), Vector2(576, 1136)],
	"fallen": [Rect2(768, 768, 384, 384), Vector2(960, 1136)],
	"rise": [Rect2(1152, 768, 384, 384), Vector2(1344, 1136)],
	"kick": [Rect2(0, 1152, 384, 384), Vector2(192, 1520)],
	"celebrate": [Rect2(384, 1152, 384, 384), Vector2(576, 1520)],
	"cry": [Rect2(768, 1152, 384, 384), Vector2(960, 1520)],
	"concern": [Rect2(1152, 1152, 384, 384), Vector2(1344, 1520)]
}
