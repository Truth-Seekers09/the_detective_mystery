# Browser version (main Phase 3 front end)

All game rules are still the C++ classes (Map, Stack, Queue, hash table, Dijkstra, sorting, file handling…).
`server/web_main.cpp` is a small local web server (cpp-httplib, MIT licence, one header in `third_party/`).
The `web/` folder only draws the game and sends the same text commands as the console game.
Nothing to install except g++. No internet needed while playing.

## Windows (WinLibs 64-bit g++ already installed)
1. Open PowerShell in the folder that contains `build_web_windows.bat`, `data` and `web` (in File Explorer click the address bar, type `powershell`, press Enter; or `cd "GameZip"`). Type `dir` to check that `build_web_windows.bat` is listed.
2. If `g++ --version` does not say x86_64, run: `$env:Path = "C:\mingw64\bin;" + $env:Path`
3. `.\build_web_windows.bat`  – builds (~30 s), starts the server and opens the browser.
Next time just run `.\hiddentruth_web.exe` from the same folder.

## Mac
`./play_web.sh`   (or `make web` then `./hiddentruth_web`)

If the browser does not open, go to http://127.0.0.1:8080 yourself. Keep the terminal open; Ctrl+C stops it.

## Controls
A/D or arrows walk · W/S depth · Shift run · E interact (doors, people) · F search · J evidence board · U suspects · H hint · M big map · L case log · click the map to auto-travel along the fastest route (Dijkstra).

## Real campus photos
All 12 photos are already in `assets/backgrounds/`, named by place number: 0 BTECH, 1 CSIT, 2 Petroleum, 3 Ravi Canteen, 4 Quick Bite, 5 Library, 6 Exam Cell, 7 Happiness Cafe, 8 Civil, 9 Silver Jubilee, 10 Gate 1, 11 Gate 2.
To replace one, save a new photo under the same name and refresh the page. If you change a photo, also check where the characters' feet land: the ground line for each photo is the `PHOTO_GROUND` table at the top of the photo section in `web/scene.js` (a number from 0 to 1, how far down the photo the ground is).

