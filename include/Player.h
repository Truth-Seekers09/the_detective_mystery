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
    // Used by Save / Resume. historyList pops everything into a vector (newest first),
    // then pushes it back, so the stack ends up unchanged. Returns oldest first.
    std::vector<int> historyList() {
        std::vector<int> newestFirst, oldestFirst;
        while (!history.isEmpty()) newestFirst.push_back(history.pop());
        for (int i = static_cast<int>(newestFirst.size()) - 1; i >= 0; --i) {
            history.push(newestFirst[i]);
            oldestFirst.push_back(newestFirst[i]);
        }
        return oldestFirst;
    }
    void restore(int location, int moveCount, const std::vector<int>& oldestFirst) {
        while (!history.isEmpty()) history.pop();
        for (int loc : oldestFirst) history.push(loc);
        currentLocation = location;
        moves = moveCount;
    }

    bool addClue(Clue* clue);      // false if already in the journal
    bool hasClue(const std::string& clueId) const;
    const std::vector<Clue*>& getJournal() const { return journal; }
    int countIncriminating(int suspectId) const;
};

#endif
