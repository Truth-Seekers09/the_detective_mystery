#ifndef SORTING_H
#define SORTING_H

#include <vector>

#include "Clue.h"

// Insertion sort, highest importance first. Stable, O(n^2) worst case which is
// fine for the small lists in this game (about 10 items).
void sortCluesByImportance(std::vector<Clue*>& clues);

#endif
