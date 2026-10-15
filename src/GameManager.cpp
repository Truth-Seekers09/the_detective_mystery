#include "GameManager.h"

#include <algorithm>
#include <cctype>
#include <fstream>
#include <iostream>
#include <sstream>

#include "Sorting.h"

namespace {

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

// Reads a data file skipping blank lines and lines that start with '#'.
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
    : dataDir(dataDir), player(0), wrongAccusations(0), running(true) {}

// ---------------------------------------------------------------- loading

bool GameManager::loadData() {
    return loadCase() && loadLocations() && loadConnections() && loadSuspects() && loadClues();
}

bool GameManager::loadCase() {
    std::vector<std::string> lines;
    if (!readLines(dataDir + "/case.txt", lines) || lines.empty()) return false;
    std::vector<std::string> f = split(lines[0], '|');
    int culprit = 0, needed = 0;
    if (f.size() != 5 || !toInt(f[2], culprit) || !toInt(f[3], needed)) {
        std::cerr << "Error: case.txt is malformed\n";
        return false;
    }
    theCase = Case(f[0], f[1], f[4], culprit, needed);
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
        int a = 0, b = 0;
        if (!(in >> a >> b) || !map.addEdge(a, b)) {
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
        int id = 0;
        if (f.size() != 6 || !toInt(f[0], id) || id != static_cast<int>(suspects.size())) {
            std::cerr << "Error: bad line in suspects.txt: " << line << "\n";
            return false;
        }
        suspects.push_back(Suspect(id, f[1], f[2], f[3], f[4], f[5]));
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
            !toInt(f[6], incr) || !toInt(f[7], importance) || !map.isValid(loc) ||
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

// ---------------------------------------------------------------- game loop

void GameManager::run() {
    std::cout << "\n=== " << theCase.getTitle() << " ===\n"
              << theCase.getIntro() << "\n";
    printHelp();
    cmdLook();

    std::string line;
    while (running) {
        std::cout << "\n> ";
        if (!std::getline(std::cin, line)) break;   // end of input
        std::istringstream in(line);
        std::string cmd, arg;
        in >> cmd;
        std::getline(in, arg);
        cmd = toLower(cmd);
        arg = trim(arg);

        if (cmd.empty()) continue;
        else if (cmd == "help") printHelp();
        else if (cmd == "look") cmdLook();
        else if (cmd == "go") cmdGo(arg);
        else if (cmd == "back") cmdBack();
        else if (cmd == "search") cmdSearch();
        else if (cmd == "journal") cmdJournal();
        else if (cmd == "clue") cmdClue(arg);
        else if (cmd == "suspects") cmdSuspects();
        else if (cmd == "accuse") cmdAccuse(arg);
        else if (cmd == "quit" || cmd == "exit") running = false;
        else std::cout << "Unknown command. Type 'help'.\n";
    }
    std::cout << "\nThanks for playing.\n";
}

void GameManager::printHelp() const {
    std::cout << "\nCommands:\n"
              << "  look              describe where you are and the exits\n"
              << "  go <number>       move to a connected location\n"
              << "  back              return to the previous location (stack)\n"
              << "  search            search this location for clues\n"
              << "  journal           your clues, most important first (sorting)\n"
              << "  clue <id>         re-read a collected clue, e.g. clue C02 (hash table)\n"
              << "  suspects          list the suspects\n"
              << "  accuse <number>   name the culprit\n"
              << "  quit\n";
}

void GameManager::cmdLook() const {
    const Location& here = map.getLocation(player.getLocation());
    std::cout << "\n-- " << here.getName() << " --\n" << here.getDescription() << "\nExits:\n";
    for (int id : map.neighbours(here.getId())) {
        const Location& l = map.getLocation(id);
        std::cout << "  [" << id << "] " << l.getName() << (l.isLocked() ? "  (locked)" : "") << "\n";
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
    player.moveTo(target);
    cmdLook();
}

void GameManager::cmdBack() {
    if (!player.goBack()) {
        std::cout << "There is nowhere to go back to yet.\n";
        return;
    }
    cmdLook();
}

void GameManager::collectClue(Clue* clue) {
    if (!player.addClue(clue)) return;
    clue->examine();

   
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
    std::vector<Clue*> sorted = player.getJournal();  
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
    else c->examine();                           
}

void GameManager::cmdSuspects() const {
    std::cout << "\nSuspects:\n";
    for (const Suspect& s : suspects) {
        std::cout << "  [" << s.getId() << "] " << s.getName() << ", " << s.getRole() << "\n"
                  << "      Motive: " << s.getMotive() << "\n"
                  << "      Alibi:  " << s.getAlibi() << "\n";
    }
}

void GameManager::cmdAccuse(const std::string& arg) {
    int id = 0;
    if (!toInt(arg, id) || id < 0 || id >= static_cast<int>(suspects.size())) {
        std::cout << "Usage: accuse <number>. Use 'suspects' to see the numbers.\n";
        return;
    }
    const Suspect& s = suspects[id];

    if (!theCase.isCulprit(id)) {
        ++wrongAccusations;
        std::cout << "\nYou accuse " << s.getName() << ", but the evidence doesn't hold up. "
                  << "You have made " << wrongAccusations << " wrong accusation(s).\n";
        if (wrongAccusations >= 2) {
            std::cout << "Two wrong accusations. The real culprit walks free. GAME OVER.\n";
            running = false;
        }
        return;
    }

    int have = player.countIncriminating(id), need = theCase.getRequiredEvidence();
    if (have < need) {
        std::cout << "\nYou suspect the right person, but you only have " << have
                  << " piece(s) of incriminating evidence and need " << need
                  << ". Keep investigating.\n";
        return;
    }
    std::cout << "\nCASE SOLVED! " << s.getName() << " " << theCase.getCrime()
              << ". Your evidence leaves no room for doubt.\n"
              << "Moves: " << player.getMoves() << "   Clues: " << player.getJournal().size()
              << "   Wrong accusations: " << wrongAccusations << "\n";
    running = false;
}
