@echo off
cd /d "%~dp0.."
echo Running env init from: %CD%
node "%~dp0init-env.mjs"
if errorlevel 1 pause
exit /b %errorlevel%
