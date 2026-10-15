#include "Sorting.h"

void sortCluesByImportance(std::vector<Clue*>& clues) {
    for (std::size_t i = 1; i < clues.size(); ++i) {
        Clue* key = clues[i];
        int j = static_cast<int>(i) - 1;
        while (j >= 0 && clues[j]->getImportance() < key->getImportance()) {
            clues[j + 1] = clues[j];
            --j;
        }
        clues[j + 1] = key;
    }
}
