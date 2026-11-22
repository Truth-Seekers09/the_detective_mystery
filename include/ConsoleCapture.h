#ifndef CONSOLECAPTURE_H
#define CONSOLECAPTURE_H

#include <iostream>
#include <sstream>
#include <string>

#include "GameManager.h"

// Lets a graphical front end reuse the text game unchanged: it runs one command,
// feeds it any extra typed answers (such as YES) and returns what the game printed.
inline std::string runCommand(GameManager& game, const std::string& line,
                              const std::string& extraInput = "") {
    std::ostringstream out;
    std::istringstream in(extraInput);
    std::streambuf* oldOut = std::cout.rdbuf(out.rdbuf());
    std::streambuf* oldIn = std::cin.rdbuf(in.rdbuf());
    game.handleLine(line);
    std::cout.rdbuf(oldOut);
    std::cin.rdbuf(oldIn);
    return out.str();
}

#endif
