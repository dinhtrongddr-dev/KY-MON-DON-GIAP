@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"
set "QIMEN_CODEX_HOME=%LOCALAPPDATA%\KyMonCodex\codex-home"
set "CODEX_HOME=%QIMEN_CODEX_HOME%"
where codex >nul 2>&1 || (
  echo Khong tim thay Codex CLI. Hay cai @openai/codex truoc.
  pause
  exit /b 1
)
echo Dang mo quy trinh dang nhap ChatGPT chinh thuc cho Ky Mon...
call codex login
if errorlevel 1 (
  echo Dang nhap chua hoan tat.
) else (
  call codex login status
)
pause
