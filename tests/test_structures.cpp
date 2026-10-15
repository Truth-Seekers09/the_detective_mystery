// Unit tests for the data structures and algorithms. Run with: make test
#include <cassert>
#include <iostream>
#include <string>
#include <vector>

#include "Clue.h"
#include "Map.h"
#include "Sorting.h"

static void testGraph() {
    Map m;
    for (int i = 0; i < 4; ++i) m.addLocation(Location(i, "L" + std::to_string(i), "d", false, "-"));
    m.addEdge(0, 1); m.addEdge(1, 2);
    assert(m.areConnected(0, 1) && m.areConnected(1, 0));   // edges go both ways
    assert(!m.areConnected(0, 2));                          // not directly connected
    assert(!m.addEdge(0, 9));                               // invalid id
    assert(m.neighbours(1).size() == 2);
    assert(m.neighbours(3).empty());                        // isolated location

    std::cout << "Graph (adjacency list): OK\n";
}

static void testSorting() {
    PhysicalClue a("C01", "Whiskey Glass", "bitter residue", 0, -1, false, 2);
    PhysicalClue b("C02", "Brass Key", "tagged safe room", 0, -1, false, 5);
    PhysicalClue c("C03", "Note", "mentions DM Holdings", 0, -1, false, 3);
    std::vector<Clue*> v = {&a, &b, &c};
    sortCluesByImportance(v);
    assert(v[0] == &b && v[1] == &c && v[2] == &a);
    std::cout << "Sorting: OK\n";
}

int main() {
    testGraph();
    testSorting();
    std::cout << "All tests passed.\n";
    return 0;
}
