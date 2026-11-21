#include "Map.h"

#include <algorithm>
#include <climits>

#include "Queue.h"

void Map::addLocation(const Location& loc) {
    locations.push_back(loc);
    adj.push_back(std::vector<int>());
    minutes.push_back(std::vector<int>());
}

bool Map::addEdge(int a, int b, int walkMinutes) {
    if (!isValid(a) || !isValid(b) || a == b || walkMinutes < 1) return false;
    if (!areConnected(a, b)) {
        adj[a].push_back(b);
        minutes[a].push_back(walkMinutes);
        adj[b].push_back(a);
        minutes[b].push_back(walkMinutes);
    }
    return true;
}

bool Map::areConnected(int a, int b) const {
    if (!isValid(a) || !isValid(b)) return false;
    return std::find(adj[a].begin(), adj[a].end(), b) != adj[a].end();
}

int Map::walkingMinutes(int a, int b) const {
    if (!isValid(a) || !isValid(b)) return -1;
    for (std::size_t k = 0; k < adj[a].size(); ++k)
        if (adj[a][k] == b) return minutes[a][k];
    return -1;
}

