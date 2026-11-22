#ifndef GAMEMANAGER_H
#define GAMEMANAGER_H

#include <memory>
#include <string>
#include <vector>

#include "Case.h"
#include "Clue.h"
#include "GameClock.h"
#include "ClueTable.h"
#include "Map.h"
#include "Player.h"
#include "Queue.h"
#include "Suspect.h"

// Owns all game objects, loads them from the data/ files and runs the
// command loop. Game logic only: no drawing code, so an SFML front end can
// be added later without changing it.
// One interrogation line. It is only given once the player holds requiredClueId
// ("-" = no condition).
struct InterviewLine {
    std::string requiredClueId;
    std::string text;
};

struct Difficulty {
    std::string name;
    int minutes;
    int proofsNeeded;
    int hintsAllowed;
};

