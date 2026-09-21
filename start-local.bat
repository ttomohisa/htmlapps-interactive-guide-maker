@echo off
setlocal
cd /d "%~dp0"

if not exist "dist\index.html" (
  echo [Interactive Guide Maker] dist\index.html was not found. Building first...
  call build-standalone.bat
  if errorlevel 1 exit /b 1
)

start "Interactive Guide Maker" "%~dp0dist\index.html"
endlocal
