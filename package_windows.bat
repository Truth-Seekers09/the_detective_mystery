@echo off
REM Builds a ready-to-share Windows folder + zip: HiddenTruth_Windows.zip
REM Needs g++ (64-bit WinLibs/MinGW-w64). Double-click it, or run from the HiddenTruth folder:  .\package_windows.bat
setlocal
cd /d "%~dp0"
where g++ >nul 2>nul || set "PATH=C:\mingw64\bin;%PATH%"
set OUT=HiddenTruth_Windows
echo Building the game (about 30 seconds)...
g++ -std=c++17 -O2 -Iinclude -Ithird_party server\web_main.cpp src\Clue.cpp src\ClueTable.cpp src\GameManager.cpp src\Map.cpp src\Player.cpp src\Score.cpp src\Sorting.cpp -o hiddentruth_web.exe -lws2_32 -lwsock32 -static-libgcc -static-libstdc++
if errorlevel 1 ( echo Build failed. & pause & exit /b 1 )
if exist %OUT% rmdir /s /q %OUT%
mkdir %OUT%
copy hiddentruth_web.exe %OUT%\ >nul
REM Put the compiler's thread library next to the game so it also runs on computers that do not have g++.
for /f "delims=" %%i in ('where g++') do set "GPPDIR=%%~dpi"
if exist "%GPPDIR%libwinpthread-1.dll" copy "%GPPDIR%libwinpthread-1.dll" %OUT%\ >nul
xcopy /e /i /q web %OUT%\web >nul
xcopy /e /i /q data %OUT%\data >nul
xcopy /e /i /q data_tutorial %OUT%\data_tutorial >nul
xcopy /e /i /q assets %OUT%\assets >nul
if exist %OUT%\data\scores.txt del %OUT%\data\scores.txt
copy packaging\Play.vbs "%OUT%\Play Detective Mystery.vbs" >nul
copy packaging\Play.bat "%OUT%\Play (show errors).bat" >nul
copy packaging\README_PLAYERS.txt %OUT%\README.txt >nul
copy packaging\HiddenTruth.ico %OUT%\ >nul
powershell -NoProfile -Command "Compress-Archive -Path '%OUT%' -DestinationPath 'HiddenTruth_Windows.zip' -Force"
echo.
echo Done. The game folder is HiddenTruth_Windows and the zip is HiddenTruth_Windows.zip
echo To play: open HiddenTruth_Windows and double-click "Play Detective Mystery.vbs".
pause
