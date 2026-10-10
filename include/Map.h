#ifndef MAP_H
#define MAP_H

#include <vector>

#include "Location.h"

// The investigation map is an undirected graph stored as an adjacency list:
//   vertices = locations, edges = walkable routes between them.
class Map {
private:
    std::vector<Location> locations;
    std::vector<std::vector<int>> adj;   // adj[i] = ids of locations next to i

public:
    void addLocation(const Location& loc);
    bool addEdge(int a, int b);            // false if an id is invalid

    int size() const { return static_cast<int>(locations.size()); }
    bool isValid(int id) const { return id >= 0 && id < size(); }
    Location& getLocation(int id) { return locations[id]; }
    const Location& getLocation(int id) const { return locations[id]; }
    const std::vector<int>& neighbours(int id) const { return adj[id]; }
    bool areConnected(int a, int b) const;
};

#endif
