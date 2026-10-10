#ifndef STACK_H
#define STACK_H

#include <stdexcept>

// Stack (LIFO) built on a singly linked list.
// Game use: the player's movement history  so the "back" command can return
// to the previously visited location.
template <typename T>
class Stack {
private:
    struct Node {
        T data;
        Node* next;
        Node(const T& d, Node* n) : data(d), next(n) {}
    };
    Node* topNode;
    int count;

public:
    Stack() : topNode(nullptr), count(0) {}
    Stack(const Stack&) = delete;
    Stack& operator=(const Stack&) = delete;

    void push(const T& value) {           // O(1)
        topNode = new Node(value, topNode);
        ++count;
    }

    bool isEmpty() const { return topNode == nullptr; }
    int size() const { return count; }
};

#endif
