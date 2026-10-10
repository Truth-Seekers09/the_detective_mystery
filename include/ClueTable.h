#ifndef CLUETABLE_H
#define CLUETABLE_H

#include <string>
#include <vector>

class Clue;

// Hash table with separate chaining: maps a clue id such as "C03" to its Clue.
// Game use: the "clue <id>" command finds a clue in O(1) on average instead
// of scanning every clue.
class ClueTable {
private:
    struct Entry {
        std::string key;
        Clue* value;
        Entry* next;
    };
    std::vector<Entry*> buckets;   // each bucket is a linked list (a chain)
    int count;

    int hashFunction(const std::string& key) const;

public:
    explicit ClueTable(int bucketCount = 11);
    ClueTable(const ClueTable&) = delete;
    ClueTable& operator=(const ClueTable&) = delete;
    ~ClueTable();                  // frees the entries not the Clue objects

    void insert(const std::string& key, Clue* value);
    Clue* find(const std::string& key) const;   // nullptr if missing
    int size() const { return count; }
    int bucketCount() const { return static_cast<int>(buckets.size()); }
    int longestChain() const;      // handy for explaining collisions
};

#endif
