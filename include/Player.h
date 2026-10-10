#ifndef PLAYER_H
#define PLAYER_H

#include <string>
#include <vector>

#include "Clue.h"
#include "Stack.h"

class Player {
private:
    int currentLocation;
    int moves;
    std::vector<Clue*> journal;    // clues collected (not owned by the player)
    Stack<int> history;            // previous locations, most recent on top

public:
    explicit Player(int startLocation) : currentLocation(startLocation), moves(0) {}

    int getLocation() const { return currentLocation; }
    int getMoves() const { return moves; }

    void moveTo(int locationId);   // pushes the old location on the history stack
    bool goBack();                 // pops the history stack; false if empty
    int historySize() const { return history.size(); }

    bool addClue(Clue* clue);      // false if already in the journal
    bool hasClue(const std::string& clueId) const;
    const std::vector<Clue*>& getJournal() const { return journal; }
    int countIncriminating(int suspectId) const;
};

#endif
