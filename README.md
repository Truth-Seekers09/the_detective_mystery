# 🔍 The Hidden Truth

### An Interactive 2D Detective Mystery Game

**The Hidden Truth** is a 2D detective mystery game created in C++ as a Project-Based Learning (PBL) project.

The game is based on a fictional investigation. The player takes the role of a detective, visits different locations, searches for clues, checks evidence and interacts with suspects. The information collected during the investigation helps the player reach a final conclusion.

The project brings together **Object-Oriented Programming (OOP)** and **Data Structures & Algorithms (DSA)** within a single playable application.

---

## 🎯 Project Objective

The project focuses on building a simple and playable detective game while applying the programming concepts covered during the course.

The main objectives are:

- Build a 2D detective mystery game using C++.
- Create a complete fictional investigation.
- Allow the player to explore locations and collect information.
- Include clues, evidence and suspect interactions.
- Use OOP to organize different parts of the game.
- Apply suitable data structures to different investigation tasks.
- Provide a final deduction and result at the end of the case.

---

## 🎮 Game Concept

The player begins with a mystery that needs to be solved.

Instead of receiving the answer directly, the player has to investigate the case and collect useful information.

A typical investigation follows this flow:

1. Start the case.
2. Read the available case information.
3. Visit connected locations.
4. Search the locations for clues.
5. Collect and review evidence.
6. Interact with suspects.
7. Compare the information collected during the investigation.
8. Review possible suspects.
9. Make the final deduction.
10. Receive the final verdict and score.

The correct conclusion depends on how the player understands and connects the information found during the case.

---

## ✨ Key Features

- 🔎 Mystery-based investigation
- 🗺️ Multiple connected locations
- 🔍 Clue collection
- 📁 Evidence handling
- 🗣️ Suspect interactions
- 🧠 Investigation and analysis
- ⚖️ Final deduction
- 🏆 Result and scoring
- 🌳 Use of DSA in game operations
- 💻 C++ OOP-based structure

---

## 🧩 Object-Oriented Programming

OOP is used to divide the game into manageable components.

Instead of keeping the entire game inside one part of the program, different responsibilities are handled through separate classes.

### Major Classes

- `Player`
- `Suspect`
- `Clue`
- `Evidence`
- `Location`
- `Case`
- `GameManager`
- `InvestigationManager`

### OOP Concepts

| Concept | Use in the Project |
|---|---|
| Classes & Objects | Represent the main game entities |
| Encapsulation | Keep related data and functions together |
| Inheritance | Support related types of game entities |
| Polymorphism | Allow related entities to behave differently |
| Abstraction | Keep internal implementation separate from game interaction |

---

## 📊 Data Structures & Algorithms

Different DSA concepts are connected with different parts of the investigation.

They are used where they provide a useful operation rather than being added as separate demonstrations.

| DSA Concept | Use in the Game |
|---|---|
| Graph | Connect different game locations |
| Stack | Store investigation history and support backtracking |
| Queue | Maintain pending tasks and events |
| Hashing | Find stored clues or evidence efficiently |
| Tree | Organize case or investigation information |
| Searching | Locate clues and other records |
| Sorting | Arrange evidence or suspect information |

---

## 🏗️ System Architecture

The game follows a simple flow from player input to the final result.

```text
+------------------+
|      INPUT       |
|------------------|
| Player Actions   |
| Case Data        |
| Clues / Evidence |
| Locations        |
+--------+---------+
         |
         v
+------------------+
|    PROCESSING    |
|------------------|
| Check Input      |
| Update Game      |
| Handle Events    |
| Apply Game Rules |
+--------+---------+
         |
         v
+------------------+
|    CORE LOGIC    |
|------------------|
| Investigation    |
| Clue Matching    |
| Suspect Analysis |
| DSA Operations   |
+--------+---------+
         |
         v
+------------------+
|    GAME DATA     |
|------------------|
| Case Information |
| Clues / Evidence |
| Suspects         |
| Locations        |
| Game Progress    |
+--------+---------+
         |
         v
+------------------+
|      OUTPUT      |
|------------------|
| Case Progress    |
| Final Deduction  |
| Verdict          |
| Score            |
+------------------+
```

---

## 🔄 Investigation Flow

The investigation begins when a case is loaded.

The player explores the available locations and performs actions according to the current stage of the case. Information discovered during exploration is added to the investigation records.

Clues, evidence and suspect information are then reviewed as the case progresses. The game logic checks the player's actions and updates the current state of the investigation.

Once the required information has been collected, the player can move to the final deduction and select the suspected culprit.

---

## 🛠️ Technology Stack

| Technology | Purpose |
|---|---|
| C++ | Main programming language |
| SFML | 2D game interface and interaction |
| File Handling | Store and load game-related information |
| Visual Studio Code | Development environment |
| Git & GitHub | Version control and project management |

---

## 📂 Planned Game Modules

The project is divided into smaller parts so that each feature can be developed and tested separately.

```text
The Hidden Truth
│
├── Game Management
├── Player
├── Case
├── Locations
├── Suspects
├── Clues
├── Evidence
├── Investigation
├── DSA Operations
└── Final Deduction
```

Each module has a specific responsibility while remaining connected to the overall investigation.

---

## 🚀 Development Plan

The project is being developed in stages:

**Phase 1: Planning and Design**
- Prepare the mystery storyline.
- Identify suspects, clues and locations.
- Design the class structure.
- Decide where each data structure will be used.

**Phase 2: Core Development**
- Create the main C++ classes.
- Implement player movement.
- Add locations, clues and suspects.
- Implement the required DSA operations.

**Phase 3: Integration**
- Connect the individual modules.
- Complete the investigation flow.
- Add evidence analysis and final deduction.

**Phase 4: Testing**
- Test player movement and interactions.
- Check clue and evidence handling.
- Test different investigation paths.
- Correct logical and gameplay issues.

---

## 🎯 Expected Outcome

The expected result is a working 2D prototype of **The Hidden Truth** in which a player can complete a fictional detective investigation from beginning to end.

The final version is intended to demonstrate how C++ OOP and DSA concepts can work together inside the logic of a playable game.

---

## 👥 Team

**Team Name:** Truth Seekers  
**Team ID:** T152

| Team Member | Role |
|---|---|
| Karan Badhani | Team Lead |
| Khushi Singal | Team Member |
| Suraj Giri Goswami | Team Member |
| Tanmay Arora | Team Member |

---

## 📚 References

- SFML Official Documentation
- C++ Reference
- GeeksforGeeks - Data Structures
- Microsoft Learn - C++ Documentation

---

## 📌 Project Status

**Current Stage:** Phase-I - Proposal and Design

The project structure and investigation flow have been planned. Development of the main game modules will follow the finalized design.

---

### 🔍 The Hidden Truth

**Investigate the case. Examine the evidence. Make the deduction.**
