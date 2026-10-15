// Unit tests for the data structures and algorithms. Run with: make test
#include <cassert>
#include <iostream>
#include <string>
#include <vector>

#include "Clue.h"
#include "Sorting.h"

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
    testSorting();
    std::cout << "All tests passed.\n";
    return 0;
}
