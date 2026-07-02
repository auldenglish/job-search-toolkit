@echo off
REM Launch the job-search kanban board: starts the server and opens the browser.
cd /d "%~dp0"

REM Find node (fall back to the default install path if it's not on PATH)
set "NODE_EXE=node"
where node >nul 2>nul || set "NODE_EXE=C:\Program Files\nodejs\node.exe"

start "" "http://localhost:3000/kanban.html"
"%NODE_EXE%" kanban-server.js
pause
