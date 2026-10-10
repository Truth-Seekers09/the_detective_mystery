#include "Clue.h"

#include <iostream>

Clue::Clue(const std::string& id, const std::string& name, const std::string& description,
           int locationId, int suspectId, bool incriminating, int importance)
    : id(id), name(name), description(description), locationId(locationId),
      suspectId(suspectId), incriminating(incriminating), importance(importance) {}
std::string PhysicalClue::getType() const { return "Physical Evidence"; }
void PhysicalClue::examine() const {
    std::cout << "  [PHYSICAL EVIDENCE] " << name << " (" << id << ")\n"
              << "  You study the object closely: " << description << "\n";
}
