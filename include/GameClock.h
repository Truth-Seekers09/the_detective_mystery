#ifndef GAMECLOCK_H
#define GAMECLOCK_H

#include <string>

// The exam clock. The story starts at 7:00 AM; walking, searching and
// questioning all use up minutes. When the limit is reached the exam begins
// and the game is lost.
class GameClock {
private:
    int startMinutes;    // minutes after midnight when the game starts (7:00 AM = 420)
    int limitMinutes;    // how many minutes the player has
    int elapsed;

public:
    GameClock(int startMinutes = 420, int limitMinutes = 180)
        : startMinutes(startMinutes), limitMinutes(limitMinutes), elapsed(0) {}

    void spend(int minutes) { elapsed += minutes; }
    int getElapsed() const { return elapsed; }
    int minutesLeft() const { return elapsed >= limitMinutes ? 0 : limitMinutes - elapsed; }
    bool isUp() const { return elapsed >= limitMinutes; }

    std::string timeText() const { return format(startMinutes + elapsed); }
    static std::string format(int minutesAfterMidnight) {
        int h = (minutesAfterMidnight / 60) % 24, m = minutesAfterMidnight % 60;
        int h12 = h % 12 == 0 ? 12 : h % 12;
        return std::to_string(h12) + ":" + (m < 10 ? "0" : "") + std::to_string(m) +
               (h < 12 ? " AM" : " PM");
    }
};

#endif
