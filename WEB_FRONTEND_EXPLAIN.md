# What to say about the browser version (and what NOT to claim)

## The DSA and OOP are all in C++ (this is what we explain)
| What the player does | C++ concept behind it |
|---|---|
| Walk to a door and press E | Map = graph (adjacency list); `go` checks the edge exists and the place is unlocked (Location::lock/unlock) |
| Click a place on the map -> fastest route | `Map::fastestRoute` = Dijkstra on the minutes; `route` command = BFS (fewest stops) using our own Queue |
| Search a place | Clue hierarchy (abstract class + Physical/Testimony/Document), factory `createClue`, Player journal |
| Evidence board | journal sorted with insertion sort; clue lookup by hash table (ClueTable, chaining) |
| Combine two cards | `deduce`: hash table keyed "A+B" (sorted pair) -> new Clue |
| Interrogate | Suspect objects + Queue<InterviewLine> per suspect (FIFO: new lines unlock as you find clues) |
| One accusation | Case class: private culprit, `isCulprit()`, chances = 1 |
| Clock, score, high scores | GameClock, Score formula, file handling (data/scores.txt, case_report.txt), insertion sort for top 5 |
| Data files | Data-driven design: places, routes, suspects, clues are text files, not hard-coded |

## The browser part is only presentation
- `server/web_main.cpp` (about 140 lines) just receives a text command (the same one you would type in the console), runs it through `GameManager::handleLine`, and sends back the text plus the current state as JSON.
- `web/` (HTML, CSS, JavaScript) only draws pictures and animations. It makes no game decisions: it never knows who the culprit is, and a locked door is refused by the C++ code, not by the page.
- Say it as: "the logic is the same C++ game; the browser is the screen and keyboard."
- The scene drawing and sound effects are graphics code, not DSA/OOP. Do not present them as part of the data-structure work.
- The small mutex in the server only makes sure two requests never change the game at the same moment.
