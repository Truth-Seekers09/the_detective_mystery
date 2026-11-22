// Unit tests for the data structures and algorithms. Run with: make test
#include <cassert>
#include <iostream>
#include <string>
#include <vector>

#include "Clue.h"
#include "ClueTable.h"
#include "Map.h"
#include "Player.h"
#include "ConsoleCapture.h"
#include "GameClock.h"
#include "Typewriter.h"
#include "Walker.h"
#include "Queue.h"
#include "Score.h"
#include <cstdio>
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
static void testQueue() {
    Queue<int> q;
    assert(q.isEmpty());
    q.enqueue(1); q.enqueue(2); q.enqueue(3);
    assert(q.size() == 3 && q.front() == 1);
    assert(q.dequeue() == 1 && q.dequeue() == 2);
    q.enqueue(4);                                   // tail pointer still works after removals
    assert(q.dequeue() == 3 && q.dequeue() == 4 && q.isEmpty());
    bool threw = false;
    try { q.dequeue(); } catch (const std::exception&) { threw = true; }
    assert(threw);
    std::vector<Queue<int>> many;                   // movable, so it can live in a vector
    many.emplace_back(); many.emplace_back();
    many[1].enqueue(7);
    assert(many[0].isEmpty() && many[1].front() == 7);
    std::cout << "Queue: OK\n";
}

// The real Phase 3 campus: 12 places, with walking minutes.
static Map campus() {
    Map m;
    for (int i = 0; i < 12; ++i) m.addLocation(Location(i, "P" + std::to_string(i), "d", false, "-"));
    int e[][3] = {{0,5,1},{5,2,1},{5,4,1},{2,4,1},{0,7,1},{7,3,1},{0,8,1},{0,1,5},{0,10,3},
                  {10,1,2},{1,6,1},{10,9,1},{1,9,2},{2,11,2},{4,11,2},{11,10,10},{11,9,8}};
    for (auto& x : e) assert(m.addEdge(x[0], x[1], x[2]));
    return m;
}

static void testRouting() {
    Map m = campus();
    assert(m.walkingMinutes(0, 1) == 5 && m.walkingMinutes(1, 0) == 5 && m.walkingMinutes(0, 6) == -1);
    // BTECH(0) to CSIT(1): the tunnel is one stop, so BFS picks it.
    assert((m.fewestStops(0, 1) == std::vector<int>{0, 1}));
    // By time: Gate 1 route is 3 + 2 = 5 min, the same as the tunnel (5 min).
    int total = 0;
    std::vector<int> b = m.fastestRoute(0, 1, &total);
    assert(total == 5 && b.front() == 0 && b.back() == 1);
    // BTECH to Quick Bite goes through the Library: 1 + 1 = 2 min, two hops.
    std::vector<int> q = m.fastestRoute(0, 4, &total);
    assert((q == std::vector<int>{0, 5, 4}) && total == 2);
    assert((m.fewestStops(0, 4) == std::vector<int>{0, 5, 4}));
    // Gate 2 to Gate 1: one hop (10 min) for BFS, but Dijkstra goes round
    // Quick Bite, Library, BTECH, Gate 1 (2 + 1 + 1 + 3 = 7 min).
    assert((m.fewestStops(11, 10) == std::vector<int>{11, 10}));
    std::vector<int> c = m.fastestRoute(11, 10, &total);
    assert(total == 7 && c.front() == 11 && c.back() == 10 && c.size() > 2);
    // Gate 2 to Silver Jubilee: 8 min direct, or via Gate 1 (7 + 1 = 8): a tie, so just check the time.
    m.fastestRoute(11, 9, &total);
    assert(total == 8);
    // Locked places are never walked through.
    m.getLocation(1).lock();
    assert(m.fewestStops(0, 6).empty());
    m.getLocation(1).unlock();
    assert(m.fewestStops(0, 6).size() == 3);        // 0, 1, 6
    assert(m.fewestStops(3, 3) == std::vector<int>{3});
    std::cout << "Routing (BFS + Dijkstra): OK\n";
}

static void testScores() {
    assert(computeScore(10, 8, 2, 0, 0) == 1500 - 150 + 160 + 20);
    assert(computeScore(10, 8, 2, 1, 30) == 1500 - 150 + 160 + 20 - 50 + 60);
    assert(computeScore(500, 0, 0, 0, 0) == 0);           // never negative
    std::vector<ScoreEntry> t = {{"a", 100}, {"b", 300}, {"c", 100}, {"d", 200}};
    sortScores(t);
    assert(t[0].name == "b" && t[1].name == "d" && t[2].name == "a" && t[3].name == "c");
    const std::string path = "scores_test.tmp";
    assert(saveScores(path, t));
    std::vector<ScoreEntry> back = loadScores(path);
    assert(back.size() == 4 && back[0].name == "b" && back[0].score == 300);
    std::remove(path.c_str());
    assert(loadScores("no_such_file.tmp").empty());
    std::cout << "Scores (sort + file): OK\n";
}

static void testClock() {
    GameClock c(7 * 60, 180);
    assert(c.timeText() == "7:00 AM" && c.minutesLeft() == 180 && !c.isUp());
    c.spend(65);
    assert(c.timeText() == "8:05 AM" && c.minutesLeft() == 115);
    c.spend(115);
    assert(c.isUp() && c.minutesLeft() == 0 && c.timeText() == "10:00 AM");
    assert(GameClock::format(12 * 60) == "12:00 PM" && GameClock::format(13 * 60 + 9) == "1:09 PM");
    std::cout << "Game clock: OK\n";
}

static void testWalker() {
    Walker w(0, 0, 100);
    assert(!w.isMoving());
    w.walkTo(100, 0);
    w.walkTo(100, 50);                  // two waypoints in a row
    w.update(0.5f);
    assert(w.x() == 50 && w.y() == 0 && w.isMoving());
    w.update(0.75f);                    // crosses the first waypoint, turns the corner
    assert(w.x() == 100 && w.y() > 24.9f && w.y() < 25.1f);
    w.update(5.0f);
    assert(!w.isMoving() && w.x() == 100 && w.y() == 50);
    w.walkTo(0, 50);
    w.update(0.1f);
    assert(w.getFacing() == -1);        // walking left
    w.teleport(7, 8);
    assert(w.x() == 7 && w.y() == 8 && !w.isMoving());
    std::cout << "Walker (character movement): OK\n";
}


