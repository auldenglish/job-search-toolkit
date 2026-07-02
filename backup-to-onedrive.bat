@echo off
REM Double-click to back up personal resume files + job-search DB to OneDrive.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0backup-to-onedrive.ps1"
echo.
pause
