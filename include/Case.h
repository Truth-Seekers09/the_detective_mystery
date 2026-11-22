#ifndef CASE_H
#define CASE_H

#include <string>

// Holds the facts of the mystery. The culprit is private: the rest of the
// program can only ask isCulprit(id), never read who it is (encapsulation).
class Case {
private:
    std::string title;
    std::string crime;      // what happened, e.g. "stole the sealed exam paper"
    std::string intro;
    int culpritId;
    int requiredEvidence;   // incriminating clues needed to convict
    int chances;            // accusations allowed (Phase 3: 1)

public:
    Case() : culpritId(-1), requiredEvidence(0), chances(1) {}
    Case(const std::string& title, const std::string& crime, const std::string& intro,
         int culpritId, int requiredEvidence, int chances = 1)
        : title(title), crime(crime), intro(intro), culpritId(culpritId),
          requiredEvidence(requiredEvidence), chances(chances) {}

    const std::string& getTitle() const { return title; }
    const std::string& getCrime() const { return crime; }
    const std::string& getIntro() const { return intro; }
    int getRequiredEvidence() const { return requiredEvidence; }
    void setRequiredEvidence(int n) { requiredEvidence = n; }
    int getChances() const { return chances; }
    bool isCulprit(int suspectId) const { return suspectId == culpritId; }
};

#endif
