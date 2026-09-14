@echo off
chcp 65001 >nul
setlocal
title Ky Mon Local - GPT-5.6 Sol
cd /d "%~dp0"
if not exist "%~dp0KyMonTray.exe" (
  echo Khong tim thay KyMonTray.exe.
  pause
  exit /b 1
)
"%~dp0KyMonTray.exe"
set "result=%errorlevel%"
exit /b %result%
