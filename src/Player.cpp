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
