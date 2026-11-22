@echo off
REM Builds and starts the browser version on Windows. Needs g++ (WinLibs / MinGW-w64, 64-bit).
REM Double-click this file, or run it in PowerShell from the HiddenTruth folder:   .\build_web_windows.bat
cd /d "%~dp0"
where g++ >nul 2>nul || set "PATH=C:\mingw64\bin;%PATH%"
echo Building Detective Mystery (browser version)... this takes about 30 seconds.
g++ -std=c++17 -O2 -Iinclude -Ithird_party server\web_main.cpp src\Clue.cpp src\ClueTable.cpp src\GameManager.cpp src\Map.cpp src\Player.cpp src\Score.cpp src\Sorting.cpp -o hiddentruth_web.exe -lws2_32 -lwsock32 -static-libgcc -static-libstdc++
if errorlevel 1 (
  echo.
  echo Build failed. Check that "g++ --version" says x86_64 / 64-bit.
  pause
  exit /b 1
)
echo Starting... the game opens in its own window. Keep this window open while you play.
hiddentruth_web.exe
pause
