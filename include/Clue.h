#ifndef CLUE_H
#define CLUE_H

#include <memory>
#include <string>

// Abstract base class for everything the player can find.
// Encapsulation: data members are protected and exposed through getters.
// Abstraction + polymorphism: every clue type must implement examine() and
// getType(); the game calls them through a Clue pointer.
class Clue {
protected:
    std::string id;          // e.g. "C01"
    std::string name;
    std::string description;
    int locationId;          // where it is found
    int suspectId;           // suspect it concerns (-1 = none)
    bool incriminating;      
    int importance;           

public:
    Clue(const std::string& id, const std::string& name, const std::string& description,
         int locationId, int suspectId, bool incriminating, int importance);
    virtual ~Clue() {}

    const std::string& getId() const { return id; }
    const std::string& getName() const { return name; }
    const std::string& getDescription() const { return description; }
    int getLocationId() const { return locationId; }
    int getSuspectId() const { return suspectId; }
    bool isIncriminating() const { return incriminating; }
    int getImportance() const { return importance; }

    virtual std::string getType() const = 0;   // pure virtual
    virtual void examine() const = 0;          // pure virtual
};

#endif
