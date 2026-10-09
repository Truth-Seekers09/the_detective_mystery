# The Hidden Truth

A Detective Mystery Game written in C++ set on our own college campus.

An important document has gone missing. You play the detective: walk around the campus, search for clues, question the people who had a reason to take it and decide who did it. Get it right and you solve the case. Get it wrong twice and the culprit walks free.

All characters in the story are fictional. Only the places are real.

## Why we built it

We made this for our Project-Based Learning course (Data Structures and OOP with C++). Most of what we practice in class lives in small separate programs so we wanted to see what it feels like when everything has to work together in one application.

A detective game turned out to be a good fit. Locations are connected, clues pile up, suspects wait to be questioned and sometimes you need to retrace your steps.

## How the game works

1. Read the case and start at one location on the campus.
2. Walk between connected places and search each one for clues.
3. Read about the suspects and what each of them says.
4. Compare what you have found and see who the evidence points to.
5. Make your accusation.

Some places are locked until you find the right item. You need enough evidence against the right person to win and two wrong accusations end the game.

## Where OOP and DSA come in

We use each concept only where the game needs it. The rest arrive in the final phase as the progress list below shows.

**Data Structures (built in Phase 2)**

| Concept | What it does in the game |
|---|---|
| Graph | Models the campus map and its locked places |
| Stack | Remembers where you have been so you can go back |
| Hash table | Finds a clue by its ID quickly |
| Sorting | Orders your clues by importance |

**Object-Oriented Programming (built in Phase 2)**

| Concept | What it does in the game |
|---|---|
| Classes and objects | Players, suspects, locations, clues and the case itself |
| Encapsulation | Keeps the culprit hidden inside the case so the rest of the game cannot read it |
| Inheritance | Physical clues, witness statements and documents all build on one clue type |
| Polymorphism | Each kind of clue is described differently when you examine it |
| Abstraction | The general clue type defines what every clue must do and each kind fills in the details |

**Planned for Phase 3:** Shortest routes between places (BFS), a queue for questioning suspects, searching,ranking and scoring.

## Our approach

We are building the investigation logic first and keeping it separate from the graphics. That way the game can be played and tested early and the 2D SFML interface can be added on top without rewriting the game. The story is loaded from files so changing the case does not mean changing the code.

## Team

Team Truth Seekers (T152), Department of Computer Science & Engineering, Graphic Era (Deemed to be University). Our mentor is Prof. Dr. Jyoti Agarwal.

| Team member | Role |
|---|---|
| Karan Badhani | Team Lead |
| Khushi Singal | Team Member |
| Suraj Giri Goswami | Team Member |
| Tanmay Arora | Team Member |

## Progress

- [x] Phase 1: Idea, Design and Proposal 
- [ ] Phase 2: A First Basic working model: campus map, clues, going back, clue lookup, journal and the final accusation
- [ ] Phase 3 (Final): the Advanced version with shortest routes, questioning suspects, ranking suspects, searching clues, scoring, more places,2D SFML interface and final testing

## Tools

C++, SFML, Visual Studio Code, Git and GitHub.
