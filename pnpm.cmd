@echo off
REM Project-local pnpm (lives under .tools) or npx fallback.
set "ROOT=%~dp0"
set "PNPM=%ROOT%.tools\node_modules\.bin\pnpm.cmd"
if exist "%PNPM%" (
  call "%PNPM%" %*
  exit /b %ERRORLEVEL%
)
REM Fallback: use npx (may download pnpm on first run)
echo Local pnpm not found at: %PNPM%
echo.
echo To install: powershell -NoProfile -ExecutionPolicy Bypass -File "%ROOT%scripts\bootstrap-pnpm.ps1"
echo.
echo Using npx fallback (may download on first run)...
call npx pnpm@10.32.1 %*
exit /b %ERRORLEVEL%
