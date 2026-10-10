#include "Map.h"

#include <algorithm>

void Map::addLocation(const Location& loc) {
    locations.push_back(loc);
    adj.push_back(std::vector<int>());
}
