# Creates dungeon-mastering-lite-v1.zip from dist-package/ (run build:dist first).
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Src = Join-Path $Root "dist-package"
$Out = Join-Path $Root "dungeon-mastering-lite-v1.zip"

if (-not (Test-Path $Src)) {
  Write-Error "dist-package/ not found. Run: pnpm run build:dist"
}

if (Test-Path $Out) {
  Remove-Item $Out -Force
}

$items = Get-ChildItem -Path $Src -Force
if ($items.Count -eq 0) {
  Write-Error "dist-package/ is empty."
}

Compress-Archive -Path (Join-Path $Src "*") -DestinationPath $Out -CompressionLevel Optimal
Write-Host "Wrote $Out"
