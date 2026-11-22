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
class GameManager {
private:
    std::string dataDir;
    Case theCase;
    Map map;
    std::vector<Suspect> suspects;
    std::vector<std::unique_ptr<Clue>> clues;   // owns every Clue object
    ClueTable clueTable;                        // id -> Clue*
    Player player;
    std::vector<Queue<InterviewLine>> interviews;   // one queue per suspect
    std::vector<Difficulty> difficulties;
    Difficulty difficulty;
    GameClock clock;
    ClueTable deductionTable;                       // "C03+C10" -> deduced Clue*
    std::vector<bool> searched;                     // searched[location]
    std::vector<std::pair<std::string, int>> findLog;   // (clue id, minutes elapsed when found)
    std::vector<int> routeLog;                      // every location visited, in order
    int hintsUsed;
    int accusationsUsed;
    int interrogationCount;
    bool won;
    std::string outcome = "playing";     // playing | solved | lost_accusation | lost_time
    int finalScore = 0;
    bool running;
    bool practice = false;               // tutorial case: no high score, no report file
    int accusedId = -1;

    bool loadCase();
    bool loadLocations();
    bool loadConnections();
    bool loadSuspects();
    bool loadClues();
    bool loadInterviews();
    bool loadDifficulty();
    bool loadDeductions();

    void printHelp() const;
    void cmdLook() const;
    void cmdGo(const std::string& arg);
    void cmdBack();
    void cmdSearch();
    void cmdJournal() const;
    void cmdClue(const std::string& arg) const;
    void cmdSuspects() const;
    void cmdAccuse(const std::string& arg);
    void cmdRoute(const std::string& arg, bool fastest) const;
    void cmdInterrogate(const std::string& arg);
    void cmdFind(const std::string& arg) const;
    void endWithScore();
    void cmdHint();
    void cmdDeduce(const std::string& arg);
    void cmdTime() const;
    void spend(int minutes);                        // advances the clock
    void revealCulprit() const;
    void writeReport(const std::string& outcome, int score) const;

    void collectClue(Clue* clue);

public:
    explicit GameManager(const std::string& dataDir);
    bool loadData();       // false (with a message) if a file is missing or malformed
    bool setDifficulty(const std::string& name);   // call after loadData; false if unknown
    bool saveGame(const std::string& path);        // writes the current game to a text file
    bool loadGame(const std::string& path);        // call after loadData; false (game unusable) if the file is bad
    void begin();                     // prints the intro and the first look
    void handleLine(const std::string& line);   // runs one command
    void run();            // main command loop (text mode)

    // Read-only views for the graphical front end.
    bool isRunning() const { return running; }
    bool isSolved() const { return won; }
    const Map& getMap() const { return map; }
    const std::vector<Suspect>& getSuspects() const { return suspects; }
    const Player& getPlayer() const { return player; }
    int currentLocation() const { return player.getLocation(); }
    std::string clockText() const { return clock.timeText(); }
    int minutesLeft() const { return clock.minutesLeft(); }
    int minutesTotal() const { return difficulty.minutes; }
    const std::string& difficultyName() const { return difficulty.name; }
    const std::string& title() const { return theCase.getTitle(); }
    const std::string& intro() const { return theCase.getIntro(); }
    int proofsNeeded() const { return difficulty.proofsNeeded; }
    int hintsLeft() const { return difficulty.hintsAllowed - hintsUsed; }
    int interrogations() const { return interrogationCount; }
    int elapsedMinutes() const { return clock.getElapsed(); }
    int score() const { return finalScore; }
    void setPractice(bool on) { practice = on; }
    bool isPractice() const { return practice; }
    int totalClues() const { return static_cast<int>(clues.size()); }
    int hintsTaken() const { return hintsUsed; }
    int accusedSuspect() const { return accusedId; }
    const std::vector<std::pair<std::string, int>>& foundLog() const { return findLog; }   // (clue id, minutes elapsed)
    const std::vector<int>& visited() const { return routeLog; }
    int culpritId() const {                          // only revealed once the case is over
        if (running) return -1;
        for (std::size_t i = 0; i < suspects.size(); ++i) if (theCase.isCulprit(static_cast<int>(i))) return static_cast<int>(i);
        return -1;
    }
    const std::string& getOutcome() const { return outcome; }
    bool wasSearched(int loc) const { return loc >= 0 && loc < static_cast<int>(searched.size()) && searched[loc]; }
    std::vector<int> planRoute(int target, int* minutes) const {   // fastest open route from here
        return map.fastestRoute(player.getLocation(), target, minutes);
    }
};

#endif

