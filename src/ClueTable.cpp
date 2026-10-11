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
