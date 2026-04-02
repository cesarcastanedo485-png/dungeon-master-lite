# Post-setup diagnostics (ASCII-only for Windows PowerShell 5.1).
# Run: powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\verify-env.ps1
$ErrorActionPreference = "Continue"
$root = Split-Path $PSScriptRoot -Parent
Set-Location $root

$criticalFail = $false
$warn = @()

Write-Host "== verify-env ==" -ForegroundColor Cyan

if (-not (Test-Path (Join-Path $root "pnpm-workspace.yaml"))) {
  Write-Host "[FAIL] pnpm-workspace.yaml missing at project root." -ForegroundColor Red
  $criticalFail = $true
}
else {
  Write-Host "[OK] pnpm-workspace.yaml" -ForegroundColor Green
}

if (-not (Test-Path (Join-Path $root "package.json"))) {
  Write-Host "[FAIL] package.json missing." -ForegroundColor Red
  $criticalFail = $true
}
else {
  Write-Host "[OK] package.json" -ForegroundColor Green
}

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Host "[FAIL] node not on PATH." -ForegroundColor Red
  $criticalFail = $true
}
else {
  $nv = & node -v 2>$null
  Write-Host "[OK] node $nv" -ForegroundColor Green
}

if (Get-Command npm -ErrorAction SilentlyContinue) {
  $npmv = & npm -v 2>$null
  Write-Host "[OK] npm $npmv" -ForegroundColor Green
}
else {
  Write-Host "[WARN] npm not on PATH (node may still work)." -ForegroundColor Yellow
}

$pnpmCmd = Join-Path $root ".tools\node_modules\.bin\pnpm.cmd"
if (-not (Test-Path $pnpmCmd)) {
  Write-Host "[FAIL] Local pnpm not found. Run scripts\setup.ps1 first." -ForegroundColor Red
  $criticalFail = $true
}
else {
  $pv = & $pnpmCmd -v 2>$null
  Write-Host "[OK] local pnpm $pv" -ForegroundColor Green
}

$envFile = Join-Path $root ".env"
if (-not (Test-Path $envFile)) {
  $warn += ".env missing - run: node scripts\init-env.mjs or .\pnpm.cmd run env:init"
}
else {
  $raw = Get-Content -Path $envFile -Raw -ErrorAction SilentlyContinue
  if ($raw -match "PASTE_YOUR_") {
    $warn += ".env still contains PASTE_YOUR_ placeholders - replace with real secrets"
  }
  else {
    Write-Host "[OK] .env exists (no PASTE_YOUR_ placeholders)" -ForegroundColor Green
  }

  $dbLine = (Select-String -Path $envFile -Pattern "^\s*DATABASE_URL\s*=" -SimpleMatch:$false | Select-Object -First 1)
  if (-not $dbLine) {
    $warn += "DATABASE_URL is missing from .env"
  } elseif ($dbLine.Line -match "^\s*DATABASE_URL\s*=\s*$") {
    $warn += "DATABASE_URL is blank in .env"
  }

  $apiLine = (Select-String -Path $envFile -Pattern "^\s*AI_INTEGRATIONS_OPENAI_API_KEY\s*=" -SimpleMatch:$false | Select-Object -First 1)
  if (-not $apiLine) {
    $warn += "AI_INTEGRATIONS_OPENAI_API_KEY is missing from .env"
  } elseif ($apiLine.Line -match "^\s*AI_INTEGRATIONS_OPENAI_API_KEY\s*=\s*$") {
    $warn += "AI_INTEGRATIONS_OPENAI_API_KEY is blank in .env"
  }
}

$store = Join-Path $root ".pnpm-store"
if (Test-Path $store) {
  Write-Host "[OK] .pnpm-store exists (pnpm store on project drive)" -ForegroundColor Green
}
else {
  Write-Host "[INFO] .pnpm-store not created yet (appears after pnpm install)" -ForegroundColor DarkGray
}

$npmrc = Join-Path $root ".npmrc"
if (Test-Path $npmrc) {
  if (Select-String -Path $npmrc -Pattern "store-dir" -Quiet) {
    Write-Host "[OK] .npmrc defines store-dir" -ForegroundColor Green
  }
}

$logFile = Join-Path $root "logs\setup-last.log"
if (Test-Path $logFile) {
  Write-Host "[INFO] Last setup log: $logFile" -ForegroundColor DarkGray
}

# Incomplete node_modules (common when install is cancelled mid-way or AV is slow)
Write-Host "" 
Write-Host "== node_modules (Vite / dnd-adventure) ==" -ForegroundColor Cyan
$motionProbe = Join-Path $root "node_modules\motion-dom\dist\es\animation\utils\active-animations.mjs"
if (-not (Test-Path $motionProbe)) {
  Write-Host "[FAIL] motion-dom is missing or incomplete (needed by framer-motion)." -ForegroundColor Red
  Write-Host "       Run: .\pnpm.cmd install   (let it FINISH; hoisted install can take 10-20+ min on Windows)" -ForegroundColor DarkYellow
  $criticalFail = $true
}
else {
  Write-Host "[OK] motion-dom (framer-motion chain)" -ForegroundColor Green
}

if ($env:OS -match "Windows") {
  $oxideWin = Join-Path $root "node_modules\@tailwindcss\oxide-win32-x64-msvc"
  if (-not (Test-Path $oxideWin)) {
    Write-Host "[FAIL] @tailwindcss/oxide-win32-x64-msvc missing - Vite/Tailwind build will error on Windows." -ForegroundColor Red
    Write-Host "       Run: .\pnpm.cmd install (root package.json lists this devDependency)" -ForegroundColor DarkYellow
    $criticalFail = $true
  }
  else {
    Write-Host "[OK] Tailwind oxide Windows native module" -ForegroundColor Green
  }
}

foreach ($w in $warn) {
  Write-Host "[WARN] $w" -ForegroundColor Yellow
}

Write-Host ""
if ($criticalFail) {
  Write-Host "Summary: FAILED (fix items above, then re-run setup.ps1)" -ForegroundColor Red
  exit 1
}
Write-Host "Summary: critical checks passed." -ForegroundColor Green
exit 0
