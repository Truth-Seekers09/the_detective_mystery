#ifndef TYPEWRITER_H
#define TYPEWRITER_H

#include <string>

// Reveals a text one character at a time, like a typewriter.
// Pure logic so it can be unit tested; the front end draws text().
class Typewriter {
private:
    std::string full;
    float shown;             // number of characters revealed so far
    float charsPerSecond;

public:
    explicit Typewriter(float charsPerSecond = 70) : shown(0), charsPerSecond(charsPerSecond) {}

    void start(const std::string& text) { full = text; shown = 0; }
    void update(float dt) {
        if (shown < static_cast<float>(full.size())) shown += charsPerSecond * dt;
    }
    void skip() { shown = static_cast<float>(full.size()); }
    bool isDone() const { return shown >= static_cast<float>(full.size()); }
    std::string text() const {
        std::size_t n = static_cast<std::size_t>(shown);
        return n >= full.size() ? full : full.substr(0, n);
    }
};

#endif
