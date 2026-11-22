# Team Contributions (Team T152, Truth Seekers)

## Phase 2 modules

| Member | Module | OOP concepts | Data structure | Files |
|---|---|---|---|---|
| Karan Badhani (Team Lead) | Game flow, case, loading the story, accusation | Encapsulation | Hash table | `GameManager.*`, `Case.h`, `ClueTable.*`, `main.cpp`, `data/case.txt` |
| Khushi Singal | World map and navigation | Classes, encapsulation | Graph (adjacency list) | `Location.h`, `Map.*`, `data/locations.txt`, `data/connections.txt` |
| Tanmay Arora | Clues and suspects, tests, documents | Inheritance, polymorphism, abstraction | Sorting | `Clue.*`, `Suspect.h`, `Sorting.*`, `data/clues.txt`, `data/suspects.txt`, `tests/`, `docs/` |
| Suraj Giri Goswami | Player and movement history | Class design, templates | Stack | `Player.*`, `Stack.h` |

## Phase 3 (each member on their own branch)

Phase 3 continues the Phase 2 modules. Every file belongs to one member, so the four branches never conflict.

| Member | Branch | Phase 3 area (continues Phase 2) | Files |
|---|---|---|---|
| Karan Badhani (Team Lead) | `karan/game-rules` | Game flow, case, loading, accusation: difficulty levels, one accusation, hint, deduce, save / resume, the helper classes for the web page, the scripted playtest, build setup | `GameManager.*`, `Case.h`, `main.cpp`, `data/case.txt`, `data/difficulty.txt`, `Json.h`, `ConsoleCapture.h`, `tests/playtest.sh`, `Makefile`, `.gitignore`, `third_party/` |
| Suraj Giri Goswami | `suraj/routing` | Player history Stack (Back, save / resume), the new Queue, BFS and Dijkstra routes on the weighted map, the game page logic, scene drawing and page style, README | `Player.h`, `Queue.h`, `Map.*`, `web/game.js`, `web/scene.js`, `web/style.css`, `README.md`, `examples/stack_demo.cpp` |
| Tanmay Arora | `tanmay/story-and-score` | Clues and suspects grow to 12 suspects and 33 clues with interviews and deductions, the practice case, score with insertion-sorted high scores, page HTML, intro and tutorial, all the unit tests | `Suspect.h`, `data/` story files, `data_tutorial/`, `Score.*`, `tests/test_structures.cpp`, `web/index.html`, `web/intro.js`, `docs/` notes, `assets/README.md` |
| Khushi Singal | `khushi/map-and-server` | World map data (12 places, 17 routes with walking minutes), the exam clock, the C++ web server, the Walker and Typewriter helpers, sound and portraits, Windows scripts, setup guide | `Location.h`, `data/locations.txt`, `data/connections.txt`, `GameClock.h`, `server/web_main.cpp`, `Walker.h`, `Typewriter.h`, `web/art.js`, `packaging/`, `*.bat`, `SETUP_GUIDE.md`, `PHASE3_PLAN.md`, this file |
