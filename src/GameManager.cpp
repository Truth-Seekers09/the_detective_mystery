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

