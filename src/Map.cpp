#include "Map.h"

#include <algorithm>

void Map::addLocation(const Location& loc) {
    locations.push_back(loc);
    adj.push_back(std::vector<int>());
}
bool Map::addEdge(int a, int b) {
    if (!isValid(a) || !isValid(b) || a == b) return false;
    if (!areConnected(a, b)) {
        adj[a].push_back(b);
        adj[b].push_back(a);
    }
    return true;
}
bool Map::areConnected(int a, int b) const {
    if (!isValid(a) || !isValid(b)) return false;
    return std::find(adj[a].begin(), adj[a].end(), b) != adj[a].end();
}


