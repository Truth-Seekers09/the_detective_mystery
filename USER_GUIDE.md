## Commands

| Command | What it does |
|---|---|
| `look` | Describes the location and its exits |
| `go <n>` | Moves to a connected location (number shown beside the exit) |
| `back` | Returns to the previous location (stack) |
| `search` | Searches the location for clues |
| `journal` | Collected clues, most important first (sorting) |
| `clue <id>` | Re-reads a collected clue, e.g. `clue C03` (hash table) |
| `suspects` | Lists the suspects, their motives and alibis |
| `accuse <n>` | Names the culprit |
| `quit` | Leaves the game |

## Where each concept lives

| Concept | Where | Files |
|---|---|---|
| Graph (adjacency list) | Campus map, locked rooms | `Map.h`, `Map.cpp` |
| Stack (linked list) | `back` command | `Stack.h`, `Player.cpp` |
| Hash table (chaining) | `clue <id>` | `ClueTable.h`, `ClueTable.cpp` |
| Sorting (insertion sort) | Journal by importance | `Sorting.cpp` |
| Encapsulation | Culprit hidden in `Case` | `Case.h` |
| Inheritance, polymorphism, abstraction | `Clue` and its three kinds | `Clue.h`, `Clue.cpp` |
| File handling | Story loaded from `data/` | `GameManager.cpp` |

## Data files (`data/`)

- `case.txt`: `title|crime|culpritId|requiredEvidence|intro`
- `locations.txt`: `id|name|description|locked(0/1)|requiredClueId`
- `connections.txt`: `locationA locationB`
- `suspects.txt`: `id|name|role|motive|alibi|statement`
- `clues.txt`: `id|type|name|description|locationId|suspectId|incriminating|importance`

