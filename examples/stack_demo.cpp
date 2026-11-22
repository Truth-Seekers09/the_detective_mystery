// Small demo of our Stack<T>. It shows the same idea the game uses for the
// "back" command. Build and run from the project folder:
//   g++ -std=c++17 -Iinclude examples/stack_demo.cpp -o stack_demo
//   ./stack_demo
#include <iostream>
#include <string>

#include "Stack.h"

int main() {
    // Places the player has visited, most recent on top.
    Stack<int> history;
    std::string names[] = {"BTECH Block", "CSIT Block", "Petroleum Block", "Quick Bite Cafe"};

    std::cout << "Walking: BTECH Block -> Petroleum Block -> Quick Bite Cafe\n";
    history.push(0);   // leaving BTECH Block
    history.push(2);   // leaving Petroleum Block
    std::cout << "Places remembered: " << history.size() << "\n";
    std::cout << "Most recent place (peek): " << names[history.peek()] << "\n\n";

    std::cout << "Going back twice:\n";
    while (!history.isEmpty()) {
        int place = history.pop();
        std::cout << "  back to " << names[place] << "\n";
    }

    std::cout << "\nTrying to go back again:\n";
    try {
        history.pop();
    } catch (const std::exception& e) {
        std::cout << "  caught error: " << e.what() << "\n";
    }

    // The same class works for other types because it is a template.
    Stack<std::string> words;
    words.push("first");
    words.push("second");
    std::cout << "\nStack<std::string> pops: " << words.pop() << ", " << words.pop() << "\n";
    return 0;
}
