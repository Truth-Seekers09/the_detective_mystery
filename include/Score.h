#ifndef SCORE_H
#define SCORE_H

#include <string>
#include <vector>

// One line of the high-score table.
struct ScoreEntry {
    std::string name;
    int score;
};

// Score for a solved case: fewer moves, fewer hints and more time left is better.
int computeScore(int moves, int cluesFound, int interrogations, int hintsUsed, int minutesLeft);

// Insertion sort, highest score first. Stable: equal scores keep their order.
void sortScores(std::vector<ScoreEntry>& scores);

// File handling: "name|score" per line. A missing file is an empty table.
std::vector<ScoreEntry> loadScores(const std::string& path);
bool saveScores(const std::string& path, const std::vector<ScoreEntry>& scores);

#endif
