param(
    [string]$Editor = 'D:/TIstudy-project/ddbbBa/artifacts/godot-4.7.2/editor/Godot_v4.7.2-stable_win64_console.exe'
)
$ErrorActionPreference = 'Stop'
$taskRepo = Split-Path -Parent $PSScriptRoot
Push-Location $taskRepo
try {
    & $Editor --headless --path godot --editor --import --quit
    if ($LASTEXITCODE -ne 0) { throw 'Godot import failed' }
    & $Editor --headless --path godot --export-release Web ../godot-demo/index.html
    if ($LASTEXITCODE -ne 0) { throw 'Godot Web export failed' }
    $taskUi = Join-Path $taskRepo 'godot-demo/ui'
    New-Item -ItemType Directory -Path $taskUi -Force | Out-Null
    foreach ($taskAsset in @('home.webp', 'world-map.webp', 'campus.webp', 'riverside.webp', 'night-market.png', 'comic-1.png', 'comic-2.png', 'comic-3.png')) {
        Copy-Item -LiteralPath (Join-Path $taskRepo ('godot/assets/' + $taskAsset)) -Destination (Join-Path $taskUi $taskAsset) -Force
    }
    foreach ($taskLicense in @('FONT-LICENSE.txt', 'GODOT-LICENSE.txt', 'GODOT-COPYRIGHT.txt')) {
        Copy-Item -LiteralPath (Join-Path $taskRepo ('godot/assets/' + $taskLicense)) -Destination (Join-Path $taskRepo ('godot-demo/' + $taskLicense)) -Force
    }
    $taskSmoke = & $Editor --headless --path godot-demo --main-pack index.pck --quit-after 15 2>&1
    $taskSmoke | ForEach-Object { Write-Output $_ }
    if ($LASTEXITCODE -ne 0 -or ($taskSmoke -join "`n") -match '(?m)SCRIPT ERROR:|^ERROR:') { throw 'Actual exported PCK startup failed' }
    Get-Item godot-demo/index.pck, godot-demo/index.wasm | Select-Object Name, Length
} finally { Pop-Location }
