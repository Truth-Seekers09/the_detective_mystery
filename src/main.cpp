#include <iostream>
#include <string>

#include "GameManager.h"

int main(int argc, char* argv[]) {
    std::string dataDir = (argc > 1) ? argv[1] : "data";
    GameManager game(dataDir);
    if (!game.loadData()) {
        std::cerr << "Could not load the game data from '" << dataDir
                  << "'. Run the program from the project folder or pass the data folder path.\n";
        return 1;
    }
    game.run();
    return 0;
}
