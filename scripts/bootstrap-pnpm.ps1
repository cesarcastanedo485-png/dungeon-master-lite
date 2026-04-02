# Minimal bootstrap: install pnpm into .tools only. Retriable standalone step.
# ASCII-only - safe for Windows PowerShell 5.1 default encoding.
# Run: powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\bootstrap-pnpm.ps1
$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
Set-Location $root

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Host "ERROR: Node.js not found. Install from https://nodejs.org" -ForegroundColor Red
  exit 1
}

$toolsDir = Join-Path $root ".tools"
New-Item -ItemType Directory -Force -Path $toolsDir | Out-Null
$toolsDirAbs = (Resolve-Path -Path $toolsDir).Path
$pnpmCmd = Join-Path $toolsDir "node_modules\.bin\pnpm.cmd"

if (Test-Path $pnpmCmd) {
  $pv = & $pnpmCmd -v 2>$null
  Write-Host "Local pnpm already present: $pv" -ForegroundColor Green
  exit 0
}

Write-Host "Installing pnpm@10.32.1 into .tools (project drive only)..." -ForegroundColor Cyan
npm install pnpm@10.32.1 --prefix $toolsDirAbs --no-fund --no-audit
if ($LASTEXITCODE -ne 0) {
  Write-Host "ERROR: npm install pnpm failed. Check network or run: npm cache verify" -ForegroundColor Red
  exit 1
}

if (-not (Test-Path $pnpmCmd)) {
  Write-Host "ERROR: pnpm.cmd not found at: $pnpmCmd" -ForegroundColor Red
  exit 1
}

$pv = & $pnpmCmd -v 2>$null
if ($LASTEXITCODE -ne 0) {
  Write-Host "ERROR: pnpm installed but failed to run. Check .tools folder." -ForegroundColor Red
  exit 1
}

Write-Host "Bootstrap OK. Local pnpm: $pv" -ForegroundColor Green
exit 0
