#include "GameManager.h"

#include <algorithm>
#include <cctype>
#include <fstream>
#include <iostream>
#include <sstream>

#include "Score.h"
#include "Sorting.h"

namespace {

// Minutes each action costs on the exam clock (the walking cost comes from connections.txt).
const int SEARCH_MINUTES = 10;
const int INTERROGATE_MINUTES = 15;
const int HINT_MINUTES = 15;
const int DEDUCE_MINUTES = 5;

std::string trim(const std::string& s) {
    std::size_t a = s.find_first_not_of(" \t\r\n");
    if (a == std::string::npos) return "";
    std::size_t b = s.find_last_not_of(" \t\r\n");
    return s.substr(a, b - a + 1);
}

std::string toLower(std::string s) {
    std::transform(s.begin(), s.end(), s.begin(),
                   [](unsigned char c) { return static_cast<char>(std::tolower(c)); });
    return s;
}

std::string toUpper(std::string s) {
    std::transform(s.begin(), s.end(), s.begin(),
                   [](unsigned char c) { return static_cast<char>(std::toupper(c)); });
    return s;
}

std::vector<std::string> split(const std::string& line, char sep) {
    std::vector<std::string> parts;
    std::string current;
    std::istringstream in(line);
    while (std::getline(in, current, sep)) parts.push_back(trim(current));
    return parts;
}

bool toInt(const std::string& s, int& out) {
    try {
        std::size_t used = 0;
        out = std::stoi(s, &used);
        return used == s.size();
    } catch (...) {
        return false;
    }
}

// Reads a data file, skipping blank lines and lines that start with '#'.
bool readLines(const std::string& path, std::vector<std::string>& lines) {
    std::ifstream in(path);
    if (!in) {
        std::cerr << "Error: cannot open " << path << "\n";
        return false;
    }
    std::string line;
    while (std::getline(in, line)) {
        line = trim(line);
        if (!line.empty() && line[0] != '#') lines.push_back(line);
    }
    return true;
}

}  // namespace

GameManager::GameManager(const std::string& dataDir)
    : dataDir(dataDir), player(0), accusationsUsed(0), interrogationCount(0),
      won(false), running(true) {
    difficulty = Difficulty{"normal", 180, 6, 3};
    hintsUsed = 0;
}

// ---------------------------------------------------------------- loading

bool GameManager::loadData() {
    if (!(loadCase() && loadLocations() && loadConnections() && loadSuspects() && loadClues() &&
          loadInterviews() && loadDifficulty() && loadDeductions()))
        return false;
    searched.assign(map.size(), false);
    routeLog.push_back(player.getLocation());
    return setDifficulty("normal");
}

bool GameManager::setDifficulty(const std::string& name) {
    for (const Difficulty& d : difficulties) {
        if (d.name == toLower(name)) {
            difficulty = d;
            clock = GameClock(7 * 60, d.minutes);
            theCase.setRequiredEvidence(d.proofsNeeded);
            return true;
        }
    }
    return false;
}
// ---- Save / resume -------------------------------------------------------
// Plain text file, one "key|value" line per item (same style as the data files).
// A save keeps only what changes while playing; the case itself is reloaded from data/.
bool GameManager::saveGame(const std::string& path) {
    if (!running || practice) return false;
    std::ofstream out(path);
    if (!out) return false;
    auto join = [](const std::vector<std::string>& v) {
        std::string r;
        for (std::size_t i = 0; i < v.size(); ++i) r += (i ? "," : "") + v[i];
        return r;
    };
    std::vector<std::string> hist, ids, found, route, seen, left;
    for (int h : player.historyList()) hist.push_back(std::to_string(h));
    for (const Clue* c : player.getJournal()) ids.push_back(c->getId());
    for (const auto& f : findLog) found.push_back(f.first + ":" + std::to_string(f.second));
    for (int r : routeLog) route.push_back(std::to_string(r));
    for (std::size_t i = 0; i < searched.size(); ++i) if (searched[i]) seen.push_back(std::to_string(i));
    for (const Queue<InterviewLine>& q : interviews) left.push_back(std::to_string(q.size()));
    out << "HTSAVE|1\n"
        << "difficulty|" << difficulty.name << "\n"
        << "elapsed|" << clock.getElapsed() << "\n"
        << "location|" << player.getLocation() << "\n"
        << "moves|" << player.getMoves() << "\n"
        << "history|" << join(hist) << "\n"
        << "hints|" << hintsUsed << "\n"
        << "interrogations|" << interrogationCount << "\n"
        << "clues|" << join(ids) << "\n"
        << "found|" << join(found) << "\n"
        << "route|" << join(route) << "\n"
        << "searched|" << join(seen) << "\n"
        << "interviews|" << join(left) << "\n";
    return static_cast<bool>(out);
}

// Rebuilds the state from a save. Call on a freshly loaded game. Every value is
// checked; on any problem it returns false and the caller throws this game away.
bool GameManager::loadGame(const std::string& path) {
    std::ifstream in(path);
    if (!in) return false;
    std::vector<std::pair<std::string, std::string>> kv;
    std::string line;
    while (std::getline(in, line)) {
        if (!line.empty() && line.back() == '\r') line.pop_back();
        std::size_t bar = line.find('|');
        if (bar == std::string::npos) return false;
        kv.push_back({line.substr(0, bar), line.substr(bar + 1)});
    }
    if (kv.size() != 13 || kv[0].first != "HTSAVE" || kv[0].second != "1") return false;
    auto get = [&](const std::string& key, std::string& value) {
        for (const auto& p : kv) if (p.first == key) { value = p.second; return true; }
        return false;
    };
    auto list = [](const std::string& text) {
        std::vector<std::string> v;
        for (const std::string& t : split(text, ',')) if (!t.empty()) v.push_back(t);
        return v;
    };
    std::string diff, elapsedS, locS, movesS, histS, hintsS, intS, cluesS, foundS, routeS, seenS, ivS;
    if (!get("difficulty", diff) || !get("elapsed", elapsedS) || !get("location", locS) || !get("moves", movesS) ||
        !get("history", histS) || !get("hints", hintsS) || !get("interrogations", intS) || !get("clues", cluesS) ||
        !get("found", foundS) || !get("route", routeS) || !get("searched", seenS) || !get("interviews", ivS))
        return false;
    int elapsed = 0, loc = 0, moves = 0, hints = 0, talks = 0;
    if (!setDifficulty(diff) || !toInt(elapsedS, elapsed) || !toInt(locS, loc) || !toInt(movesS, moves) ||
        !toInt(hintsS, hints) || !toInt(intS, talks)) return false;
    if (elapsed < 0 || elapsed >= difficulty.minutes || !map.isValid(loc) || moves < 0 ||
        hints < 0 || hints > difficulty.hintsAllowed || talks < 0) return false;

    std::vector<int> hist, route;
    for (const std::string& t : list(histS)) { int v; if (!toInt(t, v) || !map.isValid(v)) return false; hist.push_back(v); }
    for (const std::string& t : list(routeS)) { int v; if (!toInt(t, v) || !map.isValid(v)) return false; route.push_back(v); }
    for (const std::string& t : list(cluesS)) {
        Clue* c = clueTable.find(t);
        if (!c || !player.addClue(c)) return false;          // unknown or repeated clue id
    }
    findLog.clear();
    for (const std::string& t : list(foundS)) {
        std::vector<std::string> f = split(t, ':');
        int when = 0;
        if (f.size() != 2 || !player.hasClue(f[0]) || !toInt(f[1], when)) return false;
        findLog.push_back({f[0], when});
    }
    std::fill(searched.begin(), searched.end(), false);
    for (const std::string& t : list(seenS)) { int v; if (!toInt(t, v) || !map.isValid(v)) return false; searched[v] = true; }
    std::vector<std::string> left = list(ivS);
    if (left.size() != interviews.size()) return false;
    for (std::size_t i = 0; i < left.size(); ++i) {           // drop the lines already given
        int remaining = 0;
        if (!toInt(left[i], remaining) || remaining < 0 || remaining > interviews[i].size()) return false;
        while (interviews[i].size() > remaining) interviews[i].dequeue();
    }
    for (int i = 0; i < map.size(); ++i) {                    // doors open for clues already held
        Location& l = map.getLocation(i);
        if (l.isLocked() && player.hasClue(l.getRequiredClueId())) l.unlock();
    }
    clock.spend(elapsed);
    player.restore(loc, moves, hist);
    routeLog = route;
    hintsUsed = hints;
    interrogationCount = talks;
    return true;
}
bool GameManager::loadDifficulty() {
    std::vector<std::string> lines;
    if (!readLines(dataDir + "/difficulty.txt", lines)) return false;
    for (const std::string& line : lines) {
        std::vector<std::string> f = split(line, '|');
        Difficulty d;
        if (f.size() != 4 || !toInt(f[1], d.minutes) || !toInt(f[2], d.proofsNeeded) ||
            !toInt(f[3], d.hintsAllowed) || d.minutes < 1) {
            std::cerr << "Error: bad line in difficulty.txt: " << line << "\n";
            return false;
        }
        d.name = toLower(f[0]);
        difficulties.push_back(d);
    }
    return !difficulties.empty();
}

// deductions.txt: "clueA|clueB|resultClueId". Stored in a hash table under the
// key "smallerId+largerId" so the order the player types them does not matter.
bool GameManager::loadDeductions() {
    std::vector<std::string> lines;
    if (!readLines(dataDir + "/deductions.txt", lines)) return false;
    for (const std::string& line : lines) {
        std::vector<std::string> f = split(line, '|');
        Clue* result = f.size() == 3 ? clueTable.find(f[2]) : nullptr;
        if (!result || !clueTable.find(f[0]) || !clueTable.find(f[1])) {
            std::cerr << "Error: bad line in deductions.txt: " << line << "\n";
            return false;
        }
        std::string a = f[0], b = f[1];
        if (b < a) std::swap(a, b);
        deductionTable.insert(a + "+" + b, result);
    }
    return true;
}

bool GameManager::loadCase() {
    std::vector<std::string> lines;
    if (!readLines(dataDir + "/case.txt", lines) || lines.empty()) return false;
    std::vector<std::string> f = split(lines[0], '|');
    int culprit = 0, needed = 0, chances = 1;
    if ((f.size() != 5 && f.size() != 6) || !toInt(f[2], culprit) || !toInt(f[3], needed) ||
        (f.size() == 6 && !toInt(f[5], chances)) || chances < 1) {
        std::cerr << "Error: case.txt is malformed\n";
        return false;
    }
    theCase = Case(f[0], f[1], f[4], culprit, needed, chances);
    return true;
}

bool GameManager::loadLocations() {
    std::vector<std::string> lines;
    if (!readLines(dataDir + "/locations.txt", lines)) return false;
    for (const std::string& line : lines) {
        std::vector<std::string> f = split(line, '|');
        int id = 0, locked = 0;
        if (f.size() != 5 || !toInt(f[0], id) || !toInt(f[3], locked) || id != map.size()) {
            std::cerr << "Error: bad line in locations.txt: " << line << "\n";
            return false;
        }
        map.addLocation(Location(id, f[1], f[2], locked == 1, f[4]));
    }
    return map.size() > 0;
}

bool GameManager::loadConnections() {
    std::vector<std::string> lines;
    if (!readLines(dataDir + "/connections.txt", lines)) return false;
    for (const std::string& line : lines) {
        std::istringstream in(line);
        int a = 0, b = 0, mins = 1;
        if (!(in >> a >> b)) mins = -1;
        else if (!(in >> mins)) mins = 1;            // minutes are optional
        if (mins < 1 || !map.addEdge(a, b, mins)) {
            std::cerr << "Error: bad line in connections.txt: " << line << "\n";
            return false;
        }
    }
    return true;
}
bool GameManager::loadSuspects() {
    std::vector<std::string> lines;
    if (!readLines(dataDir + "/suspects.txt", lines)) return false;
    for (const std::string& line : lines) {
        std::vector<std::string> f = split(line, '|');
        int id = 0, where = 0;
        if (f.size() != 7 || !toInt(f[0], id) || id != static_cast<int>(suspects.size()) ||
            !toInt(f[6], where) || !map.isValid(where)) {
            std::cerr << "Error: bad line in suspects.txt: " << line << "\n";
            return false;
        }
        suspects.push_back(Suspect(id, f[1], f[2], f[3], f[4], f[5], where));
    }
    return !suspects.empty();
}

bool GameManager::loadClues() {
    std::vector<std::string> lines;
    if (!readLines(dataDir + "/clues.txt", lines)) return false;
    for (const std::string& line : lines) {
        std::vector<std::string> f = split(line, '|');
        int loc = 0, suspect = 0, incr = 0, importance = 0;
        if (f.size() != 8 || !toInt(f[4], loc) || !toInt(f[5], suspect) ||
            !toInt(f[6], incr) || !toInt(f[7], importance) ||
            !(map.isValid(loc) || loc == -1) ||   // -1 = a deduced clue, never lying around
            suspect >= static_cast<int>(suspects.size())) {
            std::cerr << "Error: bad line in clues.txt: " << line << "\n";
            return false;
        }
        std::unique_ptr<Clue> clue =
            createClue(f[1], f[0], f[2], f[3], loc, suspect, incr == 1, importance);
        if (!clue) {
            std::cerr << "Error: unknown clue type in clues.txt: " << f[1] << "\n";
            return false;
        }
        clueTable.insert(clue->getId(), clue.get());
        clues.push_back(std::move(clue));
    }
    return !clues.empty();
}

bool GameManager::loadInterviews() {
    std::vector<std::string> lines;
    if (!readLines(dataDir + "/interviews.txt", lines)) return false;
    for (std::size_t i = 0; i < suspects.size(); ++i) interviews.emplace_back();
    for (const std::string& line : lines) {
        std::vector<std::string> f = split(line, '|');
        int id = 0;
        if (f.size() != 3 || !toInt(f[0], id) || id < 0 ||
            id >= static_cast<int>(suspects.size())) {
            std::cerr << "Error: bad line in interviews.txt: " << line << "\n";
            return false;
        }
        if (f[1] != "-" && !clueTable.find(f[1])) {
            std::cerr << "Error: interviews.txt names an unknown clue: " << f[1] << "\n";
            return false;
        }
        interviews[id].enqueue(InterviewLine{f[1], f[2]});
    }
    return true;
}

// ---------------------------------------------------------------- game loop

void GameManager::begin() {
    std::cout << "\n=== " << theCase.getTitle() << " ===\n"
              << theCase.getIntro() << "\n"
              << "Difficulty: " << difficulty.name << "  (" << difficulty.minutes
              << " minutes, " << difficulty.proofsNeeded << " proofs needed)\n";
    printHelp();
    cmdLook();
}

void GameManager::run() {
    begin();
    std::string line;
    while (running) {
        std::cout << "\n> ";
        if (!std::getline(std::cin, line)) break;   // end of input
        handleLine(line);
    }
    std::cout << "\nThanks for playing.\n";
}
// Runs one typed command. Used by the text loop above and by the SFML front end.
void GameManager::handleLine(const std::string& line) {
    std::istringstream in(line);
    std::string cmd, arg;
    in >> cmd;
    std::getline(in, arg);
    cmd = toLower(cmd);
    arg = trim(arg);

    if (cmd.empty()) return;
    else if (cmd == "help") printHelp();
    else if (cmd == "look") cmdLook();
    else if (cmd == "go") cmdGo(arg);
    else if (cmd == "back") cmdBack();
    else if (cmd == "search") cmdSearch();
    else if (cmd == "journal") cmdJournal();
    else if (cmd == "clue") cmdClue(arg);
    else if (cmd == "suspects") cmdSuspects();
    else if (cmd == "accuse") cmdAccuse(arg);
    else if (cmd == "route") cmdRoute(arg, false);
    else if (cmd == "fastest") cmdRoute(arg, true);
    else if (cmd == "interrogate") cmdInterrogate(arg);
    else if (cmd == "find") cmdFind(arg);
    else if (cmd == "hint") cmdHint();
    else if (cmd == "deduce") cmdDeduce(arg);
    else if (cmd == "time") cmdTime();
    else if (cmd == "quit" || cmd == "exit") running = false;
    else std::cout << "Unknown command. Type 'help'.\n";

    if (running && clock.isUp()) {
        std::cout << "\nThe clock strikes 10:00. The exam begins and the paper is already out. "
                  << "You ran out of time. GAME OVER.\n";
        revealCulprit();
        outcome = "lost_time";
        writeReport("Lost: time ran out", 0);
        running = false;
    }
}

void GameManager::printHelp() const {
    std::cout << "\nCommands:\n"
              << "  look              describe where you are and the exits\n"
              << "  go <number>       move to a connected location\n"
              << "  back              return to the previous location (stack)\n"
              << "  search            search this location for clues (10 min)\n"
              << "  journal           your clues, most important first (sorting)\n"
              << "  clue <id>         re-read a collected clue, e.g. clue C02 (hash table)\n"
              << "  suspects          list the suspects\n"
              << "  accuse <number>   name the culprit (ONE chance only)\n"
              << "  interrogate <n>   question a suspect who is in this location (15 min, queue)\n"
              << "  route <number>    fewest stops to a place (breadth-first search)\n"
              << "  fastest <number>  shortest walking time to a place (Dijkstra)\n"
              << "  find <word>       search your journal for a keyword\n"
              << "  deduce <A> <B>    combine two clues you hold, e.g. deduce C03 C10 (hash table)\n"
              << "  hint              nearest unsearched place with clues (15 min, -50 score)\n"
              << "  time              show the clock\n"
              << "  quit\n";
}

void GameManager::cmdLook() const {
    const Location& here = map.getLocation(player.getLocation());
    std::cout << "\n-- " << here.getName() << " --   " << clock.timeText() << " ("
              << clock.minutesLeft() << " min left)\n" << here.getDescription() << "\nExits:\n";
    for (int id : map.neighbours(here.getId())) {
        const Location& l = map.getLocation(id);
        std::cout << "  [" << id << "] " << l.getName() << "  (" << map.walkingMinutes(here.getId(), id)
                  << " min)" << (l.isLocked() ? "  (locked)" : "") << "\n";
    }
}

void GameManager::cmdGo(const std::string& arg) {
    int target = 0;
    if (!toInt(arg, target) || !map.isValid(target)) {
        std::cout << "Usage: go <number>. Use 'look' to see the exits.\n";
        return;
    }
    if (!map.areConnected(player.getLocation(), target)) {
        std::cout << "You can't get there directly from here.\n";
        return;
    }
    if (map.getLocation(target).isLocked()) {
        std::cout << "The " << map.getLocation(target).getName()
                  << " is locked. You need to find a way to open it.\n";
        return;
    }
    spend(map.walkingMinutes(player.getLocation(), target));
    player.moveTo(target);
    routeLog.push_back(target);
    cmdLook();
}

void GameManager::cmdBack() {
    int before = player.getLocation();
    if (!player.goBack()) {
        std::cout << "There is nowhere to go back to yet.\n";
        return;
    }
    spend(map.walkingMinutes(before, player.getLocation()));
    routeLog.push_back(player.getLocation());
    cmdLook();
}

void GameManager::collectClue(Clue* clue) {
    if (!player.addClue(clue)) return;
    findLog.push_back({clue->getId(), clock.getElapsed()});
    clue->examine();

    // A clue may be the key to a locked location.
    for (int i = 0; i < map.size(); ++i) {
        Location& loc = map.getLocation(i);
        if (loc.isLocked() && loc.getRequiredClueId() == clue->getId()) {
            loc.unlock();
            std::cout << "  This unlocks the " << loc.getName() << "!\n";
        }
    }
}
void GameManager::cmdSearch() {
    bool foundAny = false;
    spend(SEARCH_MINUTES);                         // searching takes time
    searched[player.getLocation()] = true;
    for (const std::unique_ptr<Clue>& c : clues) {
        if (c->getLocationId() == player.getLocation() && !player.hasClue(c->getId())) {
            std::cout << "\nYou found something!\n";
            collectClue(c.get());
            foundAny = true;
        }
    }
    if (!foundAny) std::cout << "You search carefully but find nothing new here.\n";
}

void GameManager::cmdJournal() const {
    if (player.getJournal().empty()) {
        std::cout << "Your journal is empty. Try 'search'.\n";
        return;
    }
    std::vector<Clue*> sorted = player.getJournal();   // copy, then sort the copy
    sortCluesByImportance(sorted);
    std::cout << "\nJournal (" << sorted.size() << " of " << clues.size() << " clues):\n";
    for (const Clue* c : sorted)
        std::cout << "  " << c->getId() << "  importance " << c->getImportance() << "  "
                  << c->getName() << " [" << c->getType() << "]\n";
}

void GameManager::cmdClue(const std::string& arg) const {
    if (arg.empty()) {
        std::cout << "Usage: clue <id>, for example: clue C02\n";
        return;
    }
    Clue* c = clueTable.find(toUpper(arg));      // hash table lookup
    if (!c) std::cout << "No clue has the id " << toUpper(arg) << ".\n";
    else if (!player.hasClue(c->getId())) std::cout << "You haven't found that clue yet.\n";
    else c->examine();                           // polymorphic call
}

void GameManager::cmdSuspects() const {
    std::cout << "\nSuspects:\n";
    for (const Suspect& s : suspects) {
        std::cout << "  [" << s.getId() << "] " << s.getName() << ", " << s.getRole() << "\n"
                  << "      Motive: " << s.getMotive() << "\n"
                  << "      Alibi:  " << s.getAlibi() << "\n"
                  << "      Found at: " << map.getLocation(s.getLocationId()).getName() << "\n";
    }
}

void GameManager::cmdAccuse(const std::string& arg) {
    int id = 0;
    if (!toInt(arg, id) || id < 0 || id >= static_cast<int>(suspects.size())) {
        std::cout << "Usage: accuse <number>. Use 'suspects' to see the numbers.\n";
        return;
    }
    const Suspect& s = suspects[id];

    // Only one chance: make the player confirm before it is spent.
    std::cout << "\nYou are about to accuse " << s.getName() << ". You have "
              << (theCase.getChances() - accusationsUsed) << " accusation left.\n"
              << "Type YES to confirm: ";
    std::string answer;
    if (!std::getline(std::cin, answer) || toUpper(trim(answer)) != "YES") {
        std::cout << "Accusation cancelled. Nothing was spent.\n";
        return;
    }

    ++accusationsUsed;
    accusedId = id;
    int have = player.countIncriminating(id), need = theCase.getRequiredEvidence();
    if (theCase.isCulprit(id) && have >= need) {
        won = true;
        outcome = "solved";
        std::cout << "\nCASE SOLVED! " << s.getName() << " " << theCase.getCrime()
                  << ". Your evidence leaves no room for doubt.\n";
        endWithScore();
        running = false;
        return;
    }

    // Wrong person, or the right person without enough proof: both end the game.
    if (theCase.isCulprit(id))
        std::cout << "\nYou named the right person, but with only " << have
                  << " piece(s) of incriminating evidence (" << need
                  << " needed) the case collapses. ";
    else
        std::cout << "\nYou accuse " << s.getName() << ", but the evidence doesn't hold up. ";
    if (accusationsUsed >= theCase.getChances()) {
        std::cout << "That was your only accusation. The real culprit walks free. GAME OVER.\n";
        revealCulprit();
        outcome = "lost_accusation";
        writeReport("Lost: wrong or unproven accusation of " + s.getName(), 0);
        running = false;
    }
}
void GameManager::endWithScore() {
    int score = computeScore(player.getMoves(), static_cast<int>(player.getJournal().size()),
                             interrogationCount, hintsUsed, clock.minutesLeft());
    std::cout << "Moves: " << player.getMoves() << "   Clues: " << player.getJournal().size()
              << "   Interrogations: " << interrogationCount << "   Hints: " << hintsUsed
              << "   Time left: " << clock.minutesLeft() << " min   Score: " << score << "\n";
    finalScore = score;
    writeReport("Solved", score);
    if (practice) { std::cout << "\nPractice case complete: no high score is saved.\n"; return; }
    std::cout << "Detective name (for the high-score table): ";
    std::string name;
    if (!std::getline(std::cin, name) || trim(name).empty()) name = "Anonymous";
    std::string path = dataDir + "/scores.txt";
    std::vector<ScoreEntry> table = loadScores(path);
    table.push_back({trim(name), score});
    sortScores(table);                           // insertion sort, best first
    if (table.size() > 5) table.resize(5);
    saveScores(path, table);
    std::cout << "\nHigh scores:\n";
    for (std::size_t i = 0; i < table.size(); ++i)
        std::cout << "  " << (i + 1) << ". " << table[i].name << "  " << table[i].score << "\n";
}

// route / fastest: print the path found by BFS or Dijkstra.
void GameManager::cmdRoute(const std::string& arg, bool fastest) const {
    int target = 0;
    if (!toInt(arg, target) || !map.isValid(target)) {
        std::cout << "Usage: " << (fastest ? "fastest" : "route") << " <number>\n";
        return;
    }
    int total = 0;
    std::vector<int> path = fastest ? map.fastestRoute(player.getLocation(), target, &total)
                                    : map.fewestStops(player.getLocation(), target);
    if (path.empty()) {
        std::cout << "No open route there right now (a locked place may be in the way).\n";
        return;
    }
    if (!fastest) {
        total = 0;
        for (std::size_t i = 1; i < path.size(); ++i)
            total += map.walkingMinutes(path[i - 1], path[i]);
    }
    std::cout << (fastest ? "Fastest route: " : "Fewest stops: ");
    for (std::size_t i = 0; i < path.size(); ++i)
        std::cout << (i ? " -> " : "") << map.getLocation(path[i]).getName();
    std::cout << "  (" << total << " min)\n";
}

// interrogate: each suspect has a queue of lines. The front line is only given
// if the player holds the clue it depends on; otherwise the suspect stonewalls
// and the line stays at the front of the queue.
void GameManager::cmdInterrogate(const std::string& arg) {
    int id = 0;
    if (!toInt(arg, id) || id < 0 || id >= static_cast<int>(suspects.size())) {
        std::cout << "Usage: interrogate <suspect number>. Use 'suspects' to see the numbers.\n";
        return;
    }
    const Suspect& s = suspects[id];
    if (s.getLocationId() != player.getLocation()) {
        std::cout << s.getName() << " is not here. You will find them at the "
                  << map.getLocation(s.getLocationId()).getName() << ".\n";
        return;
    }
    Queue<InterviewLine>& q = interviews[id];
    if (q.isEmpty()) {
        std::cout << s.getName() << " has nothing more to say.\n";
        return;
    }
    const InterviewLine& next = q.front();
    if (next.requiredClueId != "-" && !player.hasClue(next.requiredClueId)) {
        std::cout << s.getName() << " crosses their arms: \"I've told you everything.\"\n"
                  << "(Maybe you are missing a piece of evidence to confront them with.)\n";
        return;
    }
    std::cout << "\n" << s.getName() << ": " << next.text << "\n";
    spend(INTERROGATE_MINUTES);                    // a proper interrogation takes time
    q.dequeue();
    ++interrogationCount;
}

// find: linear keyword search through the journal (name and description).
void GameManager::cmdFind(const std::string& arg) const {
    if (arg.empty()) {
        std::cout << "Usage: find <word>, for example: find toner\n";
        return;
    }
    std::string word = toLower(arg);
    int hits = 0;
    for (const Clue* c : player.getJournal()) {
        if (toLower(c->getName()).find(word) != std::string::npos ||
            toLower(c->getDescription()).find(word) != std::string::npos) {
            std::cout << "  " << c->getId() << "  " << c->getName() << " [" << c->getType() << "]\n";
            ++hits;
        }
    }
    if (hits == 0) std::cout << "No clue in your journal mentions \"" << arg << "\".\n";
}
void GameManager::spend(int minutes) { clock.spend(minutes); }

void GameManager::revealCulprit() const {
    for (const Suspect& x : suspects)
        if (theCase.isCulprit(x.getId())) std::cout << "The culprit was " << x.getName() << ".\n";
}

void GameManager::cmdTime() const {
    std::cout << "It is " << clock.timeText() << ". The exam starts in " << clock.minutesLeft()
              << " minutes.\n";
}

// hint: breadth-first search (fewest stops) to every place that is unsearched and
// still holds clues; point at the nearest one. Costs 15 minutes and 50 points.
void GameManager::cmdHint() {
    if (hintsUsed >= difficulty.hintsAllowed) {
        std::cout << "No hints left on " << difficulty.name << " difficulty.\n";
        return;
    }
    std::vector<int> best;
    for (int loc = 0; loc < map.size(); ++loc) {
        if (searched[loc] || map.getLocation(loc).isLocked()) continue;
        bool hasClues = false;
        for (const std::unique_ptr<Clue>& c : clues)
            if (c->getLocationId() == loc) hasClues = true;
        if (!hasClues) continue;
        std::vector<int> path = map.fewestStops(player.getLocation(), loc);
        if (!path.empty() && (best.empty() || path.size() < best.size())) best = path;
    }
    ++hintsUsed;
    spend(HINT_MINUTES);
    if (best.empty()) {
        std::cout << "Nothing obvious is left to search. Think about who you can question, "
                  << "and whether two clues fit together ('deduce').\n";
        return;
    }
    if (best.size() == 1)
        std::cout << "You haven't searched here yet. Try 'search'.\n";
    else
        std::cout << "A nearby place you haven't searched yet: " << map.getLocation(best.back()).getName()
                  << ". Next step: " << map.getLocation(best[1]).getName() << ".\n"
              << "(Hints used: " << hintsUsed << " of " << difficulty.hintsAllowed << ")\n";
}

// deduce: look the pair of clue ids up in the hash table.
void GameManager::cmdDeduce(const std::string& arg) {
    std::istringstream in(arg);
    std::string a, b;
    if (!(in >> a >> b)) {
        std::cout << "Usage: deduce <clue> <clue>, for example: deduce C03 C10\n";
        return;
    }
    a = toUpper(a);
    b = toUpper(b);
    if (!player.hasClue(a) || !player.hasClue(b) || a == b) {
        std::cout << "You can only combine two different clues that are both in your journal.\n";
        return;
    }
    spend(DEDUCE_MINUTES);
    if (b < a) std::swap(a, b);
    Clue* result = deductionTable.find(a + "+" + b);
    if (!result) {
        std::cout << "You lay them side by side, but they don't tell you anything new together.\n";
    } else if (player.hasClue(result->getId())) {
        std::cout << "You have already worked that out.\n";
    } else {
        std::cout << "\nThe pieces click together!\n";
        collectClue(result);
    }
}

// Writes a plain-text case file: outcome, what was found and when (in the order
// found), the evidence ranked by importance (insertion sort), and the route.
void GameManager::writeReport(const std::string& outcome, int score) const {
    if (practice) return;
    std::ofstream out("case_report.txt");
    if (!out) return;
    out << "CASE REPORT - " << theCase.getTitle() << "\n"
        << "Outcome: " << outcome << "\n"
        << "Difficulty: " << difficulty.name << "   Score: " << score << "\n"
        << "Time used: " << clock.getElapsed() << " of " << difficulty.minutes << " minutes\n"
        << "Hints used: " << hintsUsed << "   Interrogations: " << interrogationCount << "\n\n"
        << "EVIDENCE TIMELINE (in the order found)\n";
    for (const auto& f : findLog) {
        const Clue* c = clueTable.find(f.first);
        out << "  " << GameClock::format(7 * 60 + f.second) << "  " << c->getId() << "  "
            << c->getName() << "\n";
    }
    std::vector<Clue*> ranked = player.getJournal();
    sortCluesByImportance(ranked);
    out << "\nEVIDENCE BY IMPORTANCE\n";
    for (const Clue* c : ranked)
        out << "  importance " << c->getImportance() << "  " << c->getId() << "  " << c->getName() << "\n";
    out << "\nROUTE WALKED\n  ";
    for (std::size_t i = 0; i < routeLog.size(); ++i)
        out << (i ? " -> " : "") << map.getLocation(routeLog[i]).getName();
    out << "\n";
}








