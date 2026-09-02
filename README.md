# 🔍 The Hidden Truth
### An Interactive 2D Detective Mystery Game

**The Hidden Truth** is a C++ based 2D detective mystery game developed as a Project-Based Learning (PBL) project. The game allows players to investigate a fictional mystery by exploring locations, collecting clues, examining evidence, interacting with suspects, and making a final deduction.

The project demonstrates the practical implementation of **Object-Oriented Programming (OOP)** and **Data Structures & Algorithms (DSA)** through an interactive game environment.

---

## 🎯 Project Objective

The main objectives of the project are:

- Develop an interactive 2D detective mystery game.
- Implement exploration, clue collection, suspect interaction, evidence analysis, and final deduction.
- Integrate OOP and DSA concepts using C++.
- Apply suitable data structures and algorithms to investigation mechanics.
- Demonstrate the practical application of programming concepts through gameplay.

---

## 🎮 Game Concept

The player takes the role of a detective investigating a fictional case.

During the investigation, the player will:

1. Start a mystery case.
2. Explore different locations.
3. Search for and collect clues.
4. Examine available evidence.
5. Interact with and interrogate suspects.
6. Connect relevant information.
7. Analyze possible suspects.
8. Make a final deduction.
9. Identify the culprit.
10. Receive a score/rating based on performance.

---

## ✨ Key Features

- 🔎 Interactive mystery investigation
- 🗺️ Location-based exploration
- 🔍 Clue searching and collection
- 📁 Evidence management
- 🗣️ Suspect interaction and interrogation
- 🧠 Evidence and suspect analysis
- ⚖️ Final deduction and verdict
- 🏆 Score and performance evaluation
- 🌳 DSA-based investigation mechanics
- 💻 Object-Oriented C++ architecture

---

## 🧩 OOP Concepts Used

The project uses Object-Oriented Programming to organize different game entities and their behavior.

### Major Classes

- `Player`
- `Suspect`
- `Clue`
- `Evidence`
- `Location`
- `Case`
- `GameManager`
- `InvestigationManager`

### OOP Principles

| OOP Concept | Application |
|-------------|-------------|
| Classes & Objects | Represent game entities |
| Encapsulation | Protect and manage entity data |
| Inheritance | Create related entity types |
| Polymorphism | Support different entity behaviors |
| Abstraction | Hide internal game implementation |

---

## 📊 Data Structures & Algorithms

DSA concepts are integrated directly into the investigation process.

| DSA Concept | Application in Game |
|-------------|---------------------|
| Graph | Location connections |
| Stack | Investigation history / backtracking |
| Queue | Tasks and game events |
| Hashing | Fast clue/evidence lookup |
| Tree | Case and investigation structure |
| Searching | Finding clues and information |
| Sorting | Evidence and suspect analysis/ranking |

---

## 🏗️ System Architecture

The high-level workflow of the system is:

```text
+------------------+
|      INPUT       |
|------------------|
| Player Actions   |
| Case Data        |
| Clues/Evidence   |
| Locations        |
+--------+---------+
         |
         v
+------------------+
| PROCESSING LAYER |
|------------------|
| Validate Input   |
| Update Game State|
| Manage Events    |
| Apply Rules      |
+--------+---------+
         |
         v
+------------------+
|    CORE LOGIC    |
|------------------|
| Investigation    |
| Clue Matching    |
| Suspect Analysis |
| DSA Processing   |
+--------+---------+
         |
         v
+------------------+
|   GAME DATA      |
|------------------|
| Cases            |
| Clues/Evidence   |
| Suspects         |
| Locations        |
| Game Progress    |
+--------+---------+
         |
         v
+------------------+
| OUTPUT / RESULT  |
|------------------|
| Case Progress    |
| Final Deduction  |
| Verdict          |
| Score / Rating   |
+------------------+
