# Copies Godot Web export output into the app static folder (or your portfolio) for iframe embed.
# Prerequisites: In Godot, export preset "Web Portfolio" → export/web/index.html exists.
param(
    [Parameter(Mandatory = $true)]
    [string] $GodotProjectPath,
    [string] $PortfolioPublicGames = ""
)

if ([string]::IsNullOrWhiteSpace($PortfolioPublicGames)) {
    $repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
    $PortfolioPublicGames = Join-Path $repoRoot "artifacts\dnd-adventure\public\games\dml-godot"
}

$exportDir = Join-Path $GodotProjectPath "export\web"
$html = Join-Path $exportDir "index.html"

if (-not (Test-Path $html)) {
    Write-Error "Missing $html — in Godot run Project → Export → Web Portfolio → Export Project."
}

New-Item -ItemType Directory -Path $PortfolioPublicGames -Force | Out-Null
Copy-Item -Path (Join-Path $exportDir "*") -Destination $PortfolioPublicGames -Recurse -Force

Write-Host "Copied web build to: $PortfolioPublicGames"
Write-Host "Served URL path: /games/dml-godot/index.html (or with your Vite BASE_PATH prefix)"
Write-Host "Embed page in this app: /embed"
