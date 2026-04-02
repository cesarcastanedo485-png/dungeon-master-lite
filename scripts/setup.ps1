# One-shot setup for Windows (Node required). Project-local pnpm under .tools (e.g. on D: drive).
# No Corepack - avoids EPERM writing to C:\Program Files\nodejs\pnpm
# ASCII-only script text - safe for Windows PowerShell 5.1 default encoding.
# Run: powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\setup.ps1
param(
  [switch]$Clean,
  [switch]$BootstrapOnly
)

$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
Set-Location $root

$logDir = Join-Path $root "logs"
$logFile = Join-Path $logDir "setup-last.log"

function Write-Log {
  param([string]$Message)
  $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
  $line = "$ts $Message"
  if (-not (Test-Path $logDir)) {
    New-Item -ItemType Directory -Force -Path $logDir | Out-Null
  }
  Add-Content -Path $logFile -Value $line -Encoding UTF8
  Write-Host $Message
}

function Exit-Fail {
  param([string]$Message)
  Write-Log "ERROR: $Message"
  Write-Host "ERROR: $Message" -ForegroundColor Red
  Write-Host "Diagnostics: powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\verify-env.ps1" -ForegroundColor Yellow
  Write-Host "Log file: $logFile" -ForegroundColor DarkGray
  exit 1
}

if (-not (Test-Path (Join-Path $root "pnpm-workspace.yaml"))) {
  Exit-Fail "pnpm-workspace.yaml not found. This script must live in the project scripts folder."
}
if (-not (Test-Path (Join-Path $root "package.json"))) {
  Exit-Fail "package.json not found at project root."
}

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Exit-Fail "Install Node.js 18+ from https://nodejs.org then re-run this script."
}

$toolsDir = Join-Path $root ".tools"
$pnpmCmd = Join-Path $toolsDir "node_modules\.bin\pnpm.cmd"
$bootstrapScript = Join-Path $root "scripts\bootstrap-pnpm.ps1"

try {
  Write-Log "== D&D Adventure Bot setup started =="

  if ($Clean) {
    $nm = Join-Path $toolsDir "node_modules"
    if (Test-Path $nm) {
      Write-Log "Clean: removing $nm"
      Remove-Item -Recurse -Force $nm
    }
  }

  Write-Log "Phase 1: Bootstrap pnpm..."
  & powershell -NoProfile -ExecutionPolicy Bypass -File $bootstrapScript
  if ($LASTEXITCODE -ne 0) {
    Exit-Fail "Bootstrap failed. Re-run: powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\bootstrap-pnpm.ps1"
  }

  if ($BootstrapOnly) {
    Write-Log "BootstrapOnly: skipping pnpm install and typecheck."
    Write-Host "Done. Run full setup without -BootstrapOnly to continue." -ForegroundColor Green
    exit 0
  }

  Write-Log "Phase 2: Installing dependencies..."
  & $pnpmCmd install
  if ($LASTEXITCODE -ne 0) {
    Exit-Fail "pnpm install failed."
  }

  Write-Log "Running pnpm run typecheck..."
  & $pnpmCmd run typecheck
  if ($LASTEXITCODE -ne 0) {
    Exit-Fail "pnpm run typecheck failed."
  }

  Write-Log "Running init-env..."
  node (Join-Path $root "scripts\init-env.mjs")
  if ($LASTEXITCODE -ne 0) {
    Exit-Fail "node scripts/init-env.mjs failed."
  }

  Write-Log "Setup completed successfully."
  Write-Host ""
  Write-Host "Done. Use project-local pnpm:" -ForegroundColor Green
  Write-Host "  .\pnpm.cmd --filter @workspace/api-server run dev" -ForegroundColor Gray
  Write-Host "  .\pnpm.cmd --filter @workspace/dnd-adventure run dev" -ForegroundColor Gray
  Write-Host "Or add to PATH for this session:" -ForegroundColor DarkGray
  $pathHint = '  $env:PATH = "' + $toolsDir + '\node_modules\.bin;$env:PATH"'
  Write-Host $pathHint -ForegroundColor DarkGray
  Write-Host "Verify: powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\verify-env.ps1" -ForegroundColor Cyan
}
catch {
  Write-Log "EXCEPTION: $($_.Exception.Message)"
  Write-Host $_.Exception.Message -ForegroundColor Red
  Write-Host "Run verify-env.ps1. Log: $logFile" -ForegroundColor Yellow
  exit 1
}
