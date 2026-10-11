#ifndef GAMEMANAGER_H
#define GAMEMANAGER_H
#include <memory>
#include <string>
#include <vector>
#include "Case.h"
#include "Clue.h"
#include "ClueTable.h"
#include "Map.h"
#include "Player.h"
#include "Suspect.h"
// Owns all game objects, loads them from the files and runs the
// command loop. Game logic only: no drawing code so an SFML front end can
// be added later without changing it.
class GameManager {
private:
    std::string dataDir;
    Case theCase;
    Map map;
    std::vector<Suspect> suspects;
    std::vector<std::unique_ptr<Clue>> clues;   // owns every Clue object
    ClueTable clueTable;                        // id -> Clue*
    Player player;
    int wrongAccusations;
    bool running;
    bool loadCase();
    bool loadLocations();
    bool loadConnections();
    bool loadSuspects();
    bool loadClues();
    void printHelp() const;
    void cmdLook() const;
    void cmdGo(const std::string& arg);
    void cmdBack();
    void cmdSearch();
    void cmdJournal() const;
    void cmdClue(const std::string& arg) const;
    void cmdSuspects() const;
    void cmdAccuse(const std::string& arg);
    void collectClue(Clue* clue);

public:
    explicit GameManager(const std::string& dataDir);
    bool loadData();       // false (with a message) if a file is missing or malformed
    void run();            // main command loop
};
#endif
