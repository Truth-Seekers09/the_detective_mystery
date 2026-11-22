@echo off
cd /d "%~dp0"
echo Detective Mystery: The Hidden Truth
echo The game opens in its own window. Closing that window stops the game.
hiddentruth_web.exe data web --auto-close
if errorlevel 1 pause
