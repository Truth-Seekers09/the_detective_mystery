#include "Clue.h"

#include <iostream>

Clue::Clue(const std::string& id, const std::string& name, const std::string& description,
           int locationId, int suspectId, bool incriminating, int importance)
    : id(id), name(name), description(description), locationId(locationId),
      suspectId(suspectId), incriminating(incriminating), importance(importance) {}
