#include "Player.h"

void Player::moveTo(int locationId) {
    history.push(currentLocation);
    currentLocation = locationId;
    ++moves;
}

bool Player::goBack() {
    if (history.isEmpty()) return false;
    currentLocation = history.pop();
    ++moves;
    return true;
}
bool Player::addClue(Clue* clue) {
    if (!clue || hasClue(clue->getId())) return false;
    journal.push_back(clue);
    return true;
}
bool Player::hasClue(const std::string& clueId) const {
    for (const Clue* c : journal)
        if (c->getId() == clueId) return true;
    return false;
}
int Player::countIncriminating(int suspectId) const {
    int n = 0;
    for (const Clue* c : journal)
        if (c->getSuspectId() == suspectId && c->isIncriminating()) ++n;
    return n;
}
