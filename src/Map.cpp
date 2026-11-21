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
// Breadth-first search: visit places in rings (1 step away, 2 steps away, ...).
// The first time we reach "to" is by the fewest stops. parent[] remembers how
// we arrived so the path can be rebuilt backwards.
std::vector<int> Map::fewestStops(int from, int to) const {
    std::vector<int> path;
    if (!isValid(from) || !isValid(to)) return path;
    std::vector<int> parent(size(), -2);          // -2 = not visited yet
    Queue<int> q;
    parent[from] = -1;
    q.enqueue(from);
    while (!q.isEmpty()) {
        int cur = q.dequeue();
        if (cur == to) break;
        for (int next : adj[cur]) {
            if (parent[next] != -2 || locations[next].isLocked()) continue;
            parent[next] = cur;
            q.enqueue(next);
        }
    }
    if (parent[to] == -2) return path;
    for (int v = to; v != -1; v = parent[v]) path.push_back(v);
    std::reverse(path.begin(), path.end());
    return path;
}

// Dijkstra: repeatedly settle the unsettled place with the smallest known
// walking time, then relax its neighbours. With about 12 places a simple
// scan for the minimum is enough (O(V^2)).
std::vector<int> Map::fastestRoute(int from, int to, int* totalMinutes) const {
    std::vector<int> path;
    if (!isValid(from) || !isValid(to)) return path;
    std::vector<int> dist(size(), INT_MAX), parent(size(), -1);
    std::vector<bool> done(size(), false);
    dist[from] = 0;
    for (int round = 0; round < size(); ++round) {
        int u = -1;
        for (int i = 0; i < size(); ++i)
            if (!done[i] && dist[i] != INT_MAX && (u == -1 || dist[i] < dist[u])) u = i;
        if (u == -1) break;
        done[u] = true;
        for (std::size_t k = 0; k < adj[u].size(); ++k) {
            int v = adj[u][k];
            if (locations[v].isLocked()) continue;
            if (dist[u] + minutes[u][k] < dist[v]) {
                dist[v] = dist[u] + minutes[u][k];
                parent[v] = u;
            }
        }
    }
    if (dist[to] == INT_MAX) return path;
    if (totalMinutes) *totalMinutes = dist[to];
    for (int v = to; v != -1; v = parent[v]) path.push_back(v);
    std::reverse(path.begin(), path.end());
    return path;
}

