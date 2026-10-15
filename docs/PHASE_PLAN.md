# Phase Plan: what we build when

Phase 2 is our **first basic working model**. It is small on purpose. The advanced version is what we show in Phase 3, the final phase. Every later feature plugs into the same structure so nothing built now is thrown away.

## What the Phase 2 model does

You start in the BTECH Block, find an authorisation letter that opens the locked Exam Cell, search seven places for clues and accuse a suspect. The commands are `look`, `go`, `back`, `search`, `journal`, `clue`, `suspects`, `accuse`, `quit`.

| Member | Phase 2 (now) | Phase 3 (final) |
|---|---|---|
| Karan | Load the story from files, `Case`, hash table for `clue <id>`, accusation rules | Scoring, a hint system, save and load progress |
| Khushi | `Location`, `Map` as an adjacency list, `go`, locked Exam Cell | BFS shortest route (`path`), Underground Tunnel and Main Gate as real places |
| Tanmay | `Clue` family with polymorphism, `Suspect`, insertion sort for the journal | Keyword search over clues (`find`), suspects ranked by suspicion, SFML window and screens, final tests and documents |
| Suraj | `Player`, our own `Stack<T>`, the `back` command | Our own `Queue<T>`, the leads list and `interrogate`, connecting the player to the SFML screens |

Phase 2 data: 7 locations, 3 suspects, 8 clues. Phase 3 adds Mr. Rawat (the night guard), the Underground Tunnel, the Main Gate,two more clues and more..

From Phase 3 we will work on one branch per member and use pull requests.

Commit messages will say what changed (for example `Add Stack push and pop` or `Make go refuse locked locations`).

