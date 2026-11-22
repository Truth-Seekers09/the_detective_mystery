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




