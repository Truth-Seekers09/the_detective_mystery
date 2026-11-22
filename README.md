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

