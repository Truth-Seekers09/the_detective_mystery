# Setup Guide: Detective Mystery, The Hidden Truth

Team T152 Truth Seekers, Graphic Era Deemed to be University, Dehradun.

The game is C++ (all the rules, data structures and story logic). A small C++ program serves the game screen to your browser, so you only need **g++** and **Edge or Chrome**. No SFML, no Node, no internet while playing.

## 1. Windows (the normal way)

1. Right-click `GameZip` and choose **Extract All...** into a simple folder such as `C:\hidden truth\`. Do not run it from inside the zip, and avoid OneDrive or other synced folders (they can lock files). Windows often adds an extra folder named after the zip, so the game may end up at `C:\hidden truth\GameZip\`.
2. Open the folder that **directly contains** `build_web_windows.bat`, `data`, `web` and `src` (the inner `HiddenTruth` folder). In File Explorer click the address bar, type `powershell` and press Enter. PowerShell opens in exactly that folder. Check by typing `dir`: `build_web_windows.bat` must be in the list.
3. Check the compiler: `g++ --version`. It must say **x86_64** (64-bit WinLibs). If it is not found or says 32-bit, run:
   `$env:Path = "C:\mingw64\bin;" + $env:Path`
4. Run `.\build_web_windows.bat`. It builds in about 30 seconds, starts the game server and opens your browser at **http://127.0.0.1:8080**.
5. Keep the PowerShell window open while you play. Close it (or press Ctrl+C) to stop the game.

Next time you do not need to build again. In the same folder run `.\hiddentruth_web.exe`.

## 2. Mac / Linux

    ./play_web.sh

(If it says permission denied: `chmod +x play_web.sh`.) The same thing by hand: `make web` and then `./hiddentruth_web`. On a Mac you need the Xcode command line tools for g++.

## 3. How to play (30 seconds)

- Type your detective name, pick a difficulty and press **Begin the investigation**. First time? Press **Tutorial** for a small practice case.
- **A / D** or the arrow keys walk, **W / S** move in depth, **Shift** runs.
- **E** talks to people or opens glowing doors. **F** searches the place (10 minutes).
- **J** evidence board, **U** suspects, **H** hint, **B** back to the previous place, **M** big map, **L** case log, **X** accuse, **Esc** pause menu.
- Click a place on the minimap to walk there by the fastest route.
- Pause menu: **Save game** here, then **Continue saved game** on the main menu next time.
- You get **one** accusation. A wrong one, or a right one with too few proofs, ends the case.

| Difficulty | Time | Proofs needed | Hints |
|---|---|---|---|
| Easy | 240 min | 4 | 10 |
| Normal | 180 min | 6 | 3 |
| Detective | 120 min | 7 | none (combining two clues with a deduction can save you time) |

## 4. Run the tests (useful for the viva)

Mac / Linux or Git Bash: `make test` (unit tests) and `make playtest` (scripted full games).

Windows PowerShell, same compiler, no `make` needed:

    g++ -std=c++17 -Iinclude tests\test_structures.cpp src\Clue.cpp src\ClueTable.cpp src\GameManager.cpp src\Map.cpp src\Player.cpp src\Score.cpp src\Sorting.cpp -o run_tests.exe
    .\run_tests.exe

Text version of the game (the same rules without graphics):

    g++ -std=c++17 -Iinclude src\Clue.cpp src\ClueTable.cpp src\GameManager.cpp src\Map.cpp src\Player.cpp src\Score.cpp src\Sorting.cpp src\main.cpp -o hiddentruth.exe
    .\hiddentruth.exe data normal

## 5. Where things are

| Folder / file | What it holds |
|---|---|
| `include/`, `src/` | The C++ game: Stack, Queue, hash table, graph with BFS and Dijkstra, sorting, clues, suspects, case, clock, save / resume |
| `data/` | The story as text files: places, routes, suspects, clues, interviews, deductions, difficulty |
| `data_tutorial/` | The small practice case, loaded by the same classes from different files |
| `server/web_main.cpp` | The small local web server (cpp-httplib, MIT licence, in `third_party/`) |
| `web/` | The game screen: HTML, CSS and JavaScript that draws the game and sends text commands |
| `assets/backgrounds/` | The 12 campus photos, named 0.jpg to 11.jpg by place number |
| `docs/` | Notes for the viva (`WEB_FRONTEND_EXPLAIN.md`, `HOW_TO_EXPLAIN_FEATURES.md`) and `WEB_SETUP.md` |
| `package_windows.bat` | Makes the stand-alone game folder and its zip (see section 4 and `docs/WEB_SETUP.md`) |
| `packaging/` | The player launcher, the app icon (`HiddenTruth.ico`) and the player read-me |


