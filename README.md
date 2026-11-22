# Detective Mystery: The Hidden Truth (Phase 3)

C++17 detective game using OOP and data structures. Team T152 Truth Seekers. Set on our own campus.

Someone stole the sealed Data Structures paper from the Exam Cell. 12 places, 12 suspects, 33 clues (28 found by searching, 5 created by deduction). The clock runs from 7:00 AM to the 10:00 AM exam and you get **one** accusation.

**New here? Start with `SETUP_GUIDE.md`** (Windows, Mac, and what to do if something goes wrong).

## Build and play (text version)
    make            # builds ./hiddentruth
    make test       # unit tests
    make playtest   # scripted full-game checks
    ./hiddentruth data normal      # easy | normal | detective

## Commands
| Command | What it does | Concept |
|---|---|---|
| look / go N / back | move around | graph, stack |
| search | search this place (10 min) | linear search |
| journal / clue ID | collected clues by importance / one clue by id | insertion sort, hash table |
| route N / fastest N | fewest stops / shortest time | BFS + Queue / Dijkstra |
| interrogate N | question a suspect here (15 min) | queue |
| deduce A B | combine two clues | hash table on pairs |
| find word | keyword search of the journal | string search |
| hint | nearest unsearched place (15 min, -50 score) | BFS |
| accuse N | name the culprit, once | encapsulation |

## Where each concept lives
| File | Concept |
|---|---|
| include/Clue.h, src/Clue.cpp | abstract class, inheritance, polymorphism, factory |
| include/Case.h | encapsulation (private culprit) |
| include/Stack.h | stack on a linked list |
| include/Queue.h | queue on a linked list |
| include/ClueTable.h | hash table with chaining |
| src/Map.cpp | weighted graph, BFS, Dijkstra |
| src/Sorting.cpp, src/Score.cpp | insertion sort |
| include/GameClock.h | exam clock |
| include/Walker.h, include/Typewriter.h | small unit-tested helpers: walking along waypoints, typewriter text (the browser page does its own walking in JavaScript) |
| server/web_main.cpp, web/ | local web server and the browser screen (drawing only) |
| data/*.txt | story, places, suspects, clues, deductions, difficulty |


## Phase 3 front end: browser version
In Phase 2 we planned an SFML window. For Phase 3 we moved the screen to a browser page served by our own C++ program, because it looks far better and runs on any laptop with only g++. All game rules are still our C++ classes; the page only draws and sends the same text commands the console game uses.
The recommended way to play is the browser version (see `docs/WEB_SETUP.md`): `make web && ./hiddentruth_web` (Windows: `build_web_windows.bat`).
Game logic stays in C++; a small C++ web server (`server/web_main.cpp`, cpp-httplib in `third_party/`) serves the HTML/Canvas/JavaScript front end in `web/`.
The text version remains as a fallback.

## Phase 3 extras
- Opening screens: team introduction with a loading bar, a four-page How to play guide, and an animated opening.
- Tutorial: a small practice case (`data_tutorial/`) played with the same classes, loaded from different data files.
- Case file: a styled end-of-game report (also saved as `case_report.txt`).
- Dark mystery music is synthesised in the browser; drop your own `assets/sounds/theme.mp3` to replace it.
- Windows package: run `package_windows.bat` (see `docs/WEB_SETUP.md`).
- Back (undo a move with our Stack), Save / Continue (file handling), and a Pause menu with volume.
- Real photos of all 12 campus places as backdrops (`assets/backgrounds/0.jpg` ... `11.jpg`, taken by the team), with a name plate on each scene. Students and staff who are not suspects walk about in every place (scenery only, they cannot be questioned).

## Credits
- Web server: cpp-httplib by Yuji Hirose, MIT licence (`third_party/httplib_LICENSE.txt`).
- Campus photos: taken by the team at Graphic Era Deemed to be University. Music and sound effects are generated in the browser, nothing is downloaded.
- All suspects other than the four names the team agreed on are invented. No real staff or students are used.

