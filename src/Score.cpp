#include "Score.h"

#include <fstream>

int computeScore(int moves, int cluesFound, int interrogations, int hintsUsed, int minutesLeft) {
    int score = 1500 - 15 * moves + 20 * cluesFound + 10 * interrogations - 50 * hintsUsed +
                2 * minutesLeft;
    return score < 0 ? 0 : score;
}

void sortScores(std::vector<ScoreEntry>& scores) {
    for (std::size_t i = 1; i < scores.size(); ++i) {
        ScoreEntry key = scores[i];
        std::size_t j = i;
        while (j > 0 && scores[j - 1].score < key.score) {   // strict < keeps it stable
            scores[j] = scores[j - 1];
            --j;
        }
        scores[j] = key;
    }
}

std::vector<ScoreEntry> loadScores(const std::string& path) {
    std::vector<ScoreEntry> scores;
    std::ifstream in(path);
    std::string line;
    while (std::getline(in, line)) {
        std::size_t bar = line.rfind('|');
        if (bar == std::string::npos) continue;
        try {
            scores.push_back({line.substr(0, bar), std::stoi(line.substr(bar + 1))});
        } catch (...) {
            // skip a damaged line
        }
    }
    return scores;
}

bool saveScores(const std::string& path, const std::vector<ScoreEntry>& scores) {
    std::ofstream out(path);
    if (!out) return false;
    for (const ScoreEntry& s : scores) out << s.name << "|" << s.score << "\n";
    return static_cast<bool>(out);
}
