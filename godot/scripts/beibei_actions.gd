extends RefCounted

# Complete original bodies, isolated losslessly with explicit virtual-floor anchors.
const SHEET = preload("res://assets/beibei-actions-packed-v2.png")
const KEYS := {
	"idle": [Rect2(0, 0, 384, 432), Vector2(192, 400)],
	"anticipation": [Rect2(384, 0, 384, 432), Vector2(576, 400)],
	"jump": [Rect2(768, 0, 384, 432), Vector2(960, 400)],
	"apex": [Rect2(1152, 0, 384, 432), Vector2(1344, 400)],
	"fall": [Rect2(0, 432, 384, 432), Vector2(192, 832)],
	"double_jump": [Rect2(384, 432, 384, 432), Vector2(576, 832)],
	"land": [Rect2(768, 432, 384, 432), Vector2(960, 832)],
	"turn": [Rect2(1152, 432, 384, 432), Vector2(1344, 832)],
	"hurt": [Rect2(0, 864, 384, 432), Vector2(192, 1264)],
	"slip": [Rect2(384, 864, 384, 432), Vector2(576, 1264)],
	"fallen": [Rect2(768, 864, 384, 432), Vector2(960, 1264)],
	"rise": [Rect2(1152, 864, 384, 432), Vector2(1344, 1264)],
	"kick": [Rect2(0, 1296, 384, 432), Vector2(192, 1696)],
	"celebrate": [Rect2(384, 1296, 384, 432), Vector2(576, 1696)],
	"cry": [Rect2(768, 1296, 384, 432), Vector2(960, 1696)],
	"concern": [Rect2(1152, 1296, 384, 432), Vector2(1344, 1696)]
}
