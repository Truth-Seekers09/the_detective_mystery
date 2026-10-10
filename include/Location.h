#ifndef LOCATION_H
#define LOCATION_H

#include <string>

class Location {
private:
    int id;
    std::string name;
    std::string description;
    bool locked;
    std::string requiredClueId;   // clue that opens this location ("-" = none)

public:
    Location(int id, const std::string& name, const std::string& description,
             bool locked, const std::string& requiredClueId)
        : id(id), name(name), description(description), locked(locked),
          requiredClueId(requiredClueId) {}

    int getId() const { return id; }
    const std::string& getName() const { return name; }
    const std::string& getDescription() const { return description; }
    bool isLocked() const { return locked; }
    const std::string& getRequiredClueId() const { return requiredClueId; }
    void unlock() { locked = false; }
};

#endif
