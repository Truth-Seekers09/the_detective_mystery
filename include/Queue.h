#ifndef QUEUE_H
#define QUEUE_H

#include <stdexcept>
#include <utility>

// Queue (FIFO) built on a singly linked list with head and tail pointers.
// Game use: (1) breadth-first search of the campus map, (2) each suspect's
// interrogation lines, answered in the order they were written.
template <typename T>
class Queue {
private:
    struct Node {
        T data;
        Node* next;
        explicit Node(const T& d) : data(d), next(nullptr) {}
    };
    Node* head;
    Node* tail;
    int count;

public:
    Queue() : head(nullptr), tail(nullptr), count(0) {}
    Queue(const Queue&) = delete;
    Queue& operator=(const Queue&) = delete;
    Queue(Queue&& o) noexcept : head(o.head), tail(o.tail), count(o.count) {
        o.head = o.tail = nullptr;
        o.count = 0;
    }
    ~Queue() { while (!isEmpty()) dequeue(); }

    void enqueue(const T& value) {          // O(1): add at the tail
        Node* n = new Node(value);
        if (tail) tail->next = n; else head = n;
        tail = n;
        ++count;
    }
    T dequeue() {                            // O(1): remove from the head
        if (isEmpty()) throw std::runtime_error("Queue underflow");
        Node* old = head;
        T value = old->data;
        head = old->next;
        if (!head) tail = nullptr;
        delete old;
        --count;
        return value;
    }
    const T& front() const {                 // O(1)
        if (isEmpty()) throw std::runtime_error("Queue is empty");
        return head->data;
    }
    bool isEmpty() const { return head == nullptr; }
    int size() const { return count; }
};

#endif
