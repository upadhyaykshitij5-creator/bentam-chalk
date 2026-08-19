@echo off
REM ============================================================
REM  Bentam Chalk - one-click local preview launcher
REM  Double-click this file to start the site.
REM ============================================================
title Bentam Chalk - Local Server

cd /d "%~dp0"

REM Check that Node.js is available
where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo   Node.js was not found on this computer.
  echo   Install it from https://nodejs.org  then run this file again.
  echo.
  pause
  exit /b 1
)

echo.
echo   Starting Bentam Chalk at http://localhost:8080
echo   Your browser will open in a moment...
echo.
echo   Keep this window OPEN while viewing the site.
echo   Close it (or press Ctrl+C) to stop the server.
echo.

REM Open the browser after a short delay, then start the server
start "" cmd /c "timeout /t 2 >nul & start http://localhost:8080"

node server.mjs

pause
