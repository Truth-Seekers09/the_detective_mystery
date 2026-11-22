#ifndef WALKER_H
#define WALKER_H

#include <cmath>
#include <vector>

// Moves a point along a list of waypoints at a fixed speed (pixels per second).
// Pure logic with no drawing, so it can be unit tested. The SFML front end calls
// update(dt) every frame and draws the character at x() / y().
class Walker {
private:
    struct Point { float x, y; };
    std::vector<Point> path;
    std::size_t next;        // index of the waypoint we are walking towards
    float px, py;
    float speed;
    float facing;            // +1 facing right, -1 facing left
    float distanceWalked;    // drives the step animation

public:
    explicit Walker(float x = 0, float y = 0, float speed = 200)
        : next(0), px(x), py(y), speed(speed), facing(1), distanceWalked(0) {}

    void setSpeed(float s) { speed = s; }
    void teleport(float x, float y) { px = x; py = y; path.clear(); next = 0; }
    void walkTo(float x, float y) { path.push_back({x, y}); }   // queue a waypoint
    void clearPath() { path.clear(); next = 0; }
    bool isMoving() const { return next < path.size(); }

    void update(float dt) {
        float budget = speed * dt;
        while (budget > 0 && next < path.size()) {
            float dx = path[next].x - px, dy = path[next].y - py;
            float dist = std::sqrt(dx * dx + dy * dy);
            if (dist <= budget) {                  // reach this waypoint, carry on to the next
                px = path[next].x;
                py = path[next].y;
                budget -= dist;
                distanceWalked += dist;
                ++next;
            } else {                               // walk part of the way
                px += dx / dist * budget;
                py += dy / dist * budget;
                distanceWalked += budget;
                budget = 0;
            }
            if (dx > 0.01f) facing = 1;
            else if (dx < -0.01f) facing = -1;
        }
        if (next >= path.size()) { path.clear(); next = 0; }
    }

    float x() const { return px; }
    float y() const { return py; }
    float getFacing() const { return facing; }
    // 0..1..0 wave used to swing the legs and bob the body while walking.
    float stepPhase() const { return std::sin(distanceWalked * 0.09f); }
};

#endif
