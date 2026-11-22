# Phase 3 summary: Detective Mystery, The Hidden Truth

Team T152 Truth Seekers, Graphic Era Deemed to be University, Dehradun. Deadline 10 November 2026.

## What changed from Phase 2
| Rule / feature | Phase 2 | Phase 3 (final) |
|---|---|---|
| Places | 7 | 12 (+ Happiness Cafe, Civil Block, Silver Jubilee Convention Centre, Gate 1, Gate 2) |
| Suspects | 3 | 12, each found at a place |
| Clues | 8 | 33: 28 found by searching (C01-C28) and 5 created by deduction (D01-D05) |
| Locked places | Exam Cell | Exam Cell (needs C01) and Silver Jubilee (needs C09) |
| Accusations | 2 wrong allowed | 1 only; wrong, or right with too little proof, ends the game; asks YES first |
| Difficulty | none | easy (240 min, 4 proofs, 10 hints), normal (180, 6, 3), detective (120, 7, no hints) |
| Map | unweighted | walking minutes on every route; BFS (fewest stops) and Dijkstra (fastest) |
| New data structures | - | Queue (BFS and interrogation lines), hash table also used for deductions, high-score file |
| New features | - | exam clock, hints (BFS), deduce, Back (Stack), save / resume (file handling), practice case |
| Front end | text game | browser page served by our C++ program: walking character, real campus photos, minimap, sound |

Story data and rules live in `data/` and `data_tutorial/`; nothing about the story is hard-coded in C++.

## Who did what
See `CONTRIBUTIONS.md` (areas, branches and files for each member).

## Status
- Built and tested with g++ , `make test` (unit tests for Stack, Queue, hash table with collisions, BFS vs Dijkstra, sorting, scores, clock, save / resume) and `make playtest` (scripted full games: win, wrong accusation, too little proof, running out of time, locked places, no hints on detective).
- Random-command stress test (300 games, with address and undefined-behaviour checks on) found no crashes. Damaged save files are rejected without breaking the running game.
- The browser front end was checked in Chromium (walking, searching, travelling, accusing, winning, losing, tutorial, save and continue, pause).
- The Windows build scripts, and the app-window launcher (`build_web_windows.bat`, `package_windows.bat`, `Play.vbs`) could not be run in our test environment. Run `build_web_windows.bat` and `package_windows.bat` once on a Windows laptop before the demo.

## Honest notes
- Walking minutes and which routes exist are the team's reading of the real campus.
- Suspect names other than Anand Verma, Neha Kapoor, Mr. Rawat and Ms. Seema Joshi are invented. Do not use real staff or students.
- The people who walk around in each scene are scenery only. They are not suspects and cannot be questioned.
