#include "ClueTable.h"
ClueTable::ClueTable(int bucketCount)
    : buckets(bucketCount > 0 ? bucketCount : 1, nullptr), count(0) {}
ClueTable::~ClueTable() {
    for (Entry* head : buckets) {
        while (head) {
            Entry* next = head->next;
            delete head;
            head = next;
        }
    }
}
int ClueTable::hashFunction(const std::string& key) const {
    unsigned long long h = 0;
    for (unsigned char c : key) h = h * 31 + c;
    return static_cast<int>(h % buckets.size());
}
void ClueTable::insert(const std::string& key, Clue* value) {
    int index = hashFunction(key);
    for (Entry* e = buckets[index]; e; e = e->next) {
        if (e->key == key) {           // same key: replace the value
            e->value = value;
            return;
        }
    }
    buckets[index] = new Entry{key, value, buckets[index]};   // insert at chain head
    ++count;
}
Clue* ClueTable::find(const std::string& key) const {
    for (Entry* e = buckets[hashFunction(key)]; e; e = e->next)
        if (e->key == key) return e->value;
    return nullptr;
}
int ClueTable::longestChain() const {
    int longest = 0;
    for (Entry* head : buckets) {
        int len = 0;
        for (Entry* e = head; e; e = e->next) ++len;
        if (len > longest) longest = len;
    }
    return longest;
}
