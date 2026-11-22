#ifndef SUSPECT_H
#define SUSPECT_H

#include <string>

class Suspect {
private:
    int id;
    std::string name;
    std::string role;
    std::string motive;
    std::string alibi;
    std::string statement;
    int locationId;           // where the suspect can be questioned

public:
    Suspect(int id, const std::string& name, const std::string& role,
            const std::string& motive, const std::string& alibi,
            const std::string& statement, int locationId)
        : id(id), name(name), role(role), motive(motive), alibi(alibi),
          statement(statement), locationId(locationId) {}

    int getId() const { return id; }
    const std::string& getName() const { return name; }
    const std::string& getRole() const { return role; }
    const std::string& getMotive() const { return motive; }
    const std::string& getAlibi() const { return alibi; }
    const std::string& getStatement() const { return statement; }
    int getLocationId() const { return locationId; }
};

#endif
