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
