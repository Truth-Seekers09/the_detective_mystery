// Unit tests for the data structures and algorithms. Run with: make test
#include <cassert>
#include <iostream>
#include <string>
#include <vector>

#include "Clue.h"
#include "ClueTable.h"
#include "Map.h"
#include "Player.h"
#include "Sorting.h"
#include "Stack.h"

static void testStack() {
    Stack<int> s;
    assert(s.isEmpty());
    s.push(1); s.push(2); s.push(3);
    assert(s.size() == 3 && s.peek() == 3);
    assert(s.pop() == 3 && s.pop() == 2 && s.pop() == 1);
    assert(s.isEmpty());
    bool threw = false;
    try { s.pop(); } catch (const std::exception&) { threw = true; }
    assert(threw);
    std::cout << "Stack: OK\n";
}

static void testHashTable() {
    PhysicalClue a("C01", "Glass", "d", 0, -1, false, 1);
    PhysicalClue b("C02", "Key", "d", 0, -1, false, 1);
    PhysicalClue c("C03", "Note", "d", 0, -1, false, 1);
    ClueTable t(1);                       // one bucket forces every key to collide
    t.insert("C01", &a); t.insert("C02", &b); t.insert("C03", &c);
    assert(t.size() == 3 && t.longestChain() == 3);
    assert(t.find("C02") == &b && t.find("C99") == nullptr);
    t.insert("C02", &c);                  // same key replaces the value
    assert(t.size() == 3 && t.find("C02") == &c);
    std::cout << "Hash table: OK\n";
}

static void testGraph() {
    Map m;
    for (int i = 0; i < 4; ++i) m.addLocation(Location(i, "L" + std::to_string(i), "d", false, "-"));
    m.addEdge(0, 1); m.addEdge(1, 2);
    assert(m.areConnected(0, 1) && m.areConnected(1, 0));   // edges go both ways
    assert(!m.areConnected(0, 2));                          // not directly connected
    assert(!m.addEdge(0, 9));                               // invalid id
    assert(m.neighbours(1).size() == 2);
    assert(m.neighbours(3).empty());                        // isolated location

    m.addLocation(Location(4, "Locked room", "d", true, "C01"));
    assert(m.getLocation(4).isLocked());
    m.getLocation(4).unlock();
    assert(!m.getLocation(4).isLocked());
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

static void testPlayer() {
    Player p(0);
    PhysicalClue a("C01", "Glass", "d", 0, 1, true, 3);
    p.moveTo(2); p.moveTo(5);
    assert(p.getLocation() == 5 && p.getMoves() == 2);
    assert(p.goBack() && p.getLocation() == 2);
    assert(p.goBack() && p.getLocation() == 0 && !p.goBack());
    assert(p.addClue(&a) && !p.addClue(&a));
    assert(p.countIncriminating(1) == 1 && p.countIncriminating(0) == 0);
    std::cout << "Player + history stack: OK\n";
}

int main() {
    testStack();
    testHashTable();
    testGraph();
    testSorting();
    testPlayer();
    std::cout << "All tests passed.\n";
    return 0;
}
