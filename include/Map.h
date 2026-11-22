#ifndef MAP_H
#define MAP_H

#include <vector>

#include "Location.h"

// The campus is an undirected weighted graph stored as an adjacency list:
//   vertices = locations, edges = walkable routes, weight = walking minutes.
class Map {
private:
    std::vector<Location> locations;
    std::vector<std::vector<int>> adj;       // adj[i] = ids of locations next to i
    std::vector<std::vector<int>> minutes;   // minutes[i][k] = walking time to adj[i][k]

public:
    void addLocation(const Location& loc);
    bool addEdge(int a, int b, int walkMinutes = 1);   // false if an id is invalid
    int size() const { return static_cast<int>(locations.size()); }
    bool isValid(int id) const { return id >= 0 && id < size(); }
    Location& getLocation(int id) { return locations[id]; }
    const Location& getLocation(int id) const { return locations[id]; }
    const std::vector<int>& neighbours(int id) const { return adj[id]; }
    bool areConnected(int a, int b) const;
    int walkingMinutes(int a, int b) const;            // -1 if not directly connected

    // Fewest stops, found with breadth-first search and a Queue.
    // Locked locations are never walked through. Empty vector = no route.
    std::vector<int> fewestStops(int from, int to) const;
    // Shortest walking time found with Dijkstra's algorithm.
    std::vector<int> fastestRoute(int from, int to, int* totalMinutes = nullptr) const;
};

#endif
