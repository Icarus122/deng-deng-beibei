extends Node

const CAMPAIGN = preload("res://scenes/campaign.tscn")
const SAMPLE = preload("res://scenes/sample.tscn")

func _ready() -> void:
	var sample := OS.has_feature("web") and bool(JavaScriptBridge.eval("new URLSearchParams(location.search).has('motion') || new URLSearchParams(location.search).has('sample')"))
	add_child((SAMPLE if sample else CAMPAIGN).instantiate())
