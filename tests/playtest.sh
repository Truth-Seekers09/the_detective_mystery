#!/bin/sh
# Plays the real game with scripted input and checks the ending. Run: make playtest
set -e
cd "$(dirname "$0")/.."
run() { rm -f data/scores.txt case_report.txt; printf "$1" | ./hiddentruth data "$2"; }
check() { echo "$1" | grep -q "$2" || { echo "FAIL: $3"; exit 1; }; echo "ok: $3"; }

WIN='search\ngo 7\nsearch\nback\ngo 5\nsearch\ngo 2\nsearch\ngo 4\nsearch\ngo 11\nsearch\naccuse 0\nYES\nTester\n'
out=$(run "$WIN" normal);                          check "$out" "CASE SOLVED" "winning path solves the case"
test -f case_report.txt || { echo "FAIL: case report missing"; exit 1; }; echo "ok: case report written"
HARD='search\ngo 7\nsearch\nback\ngo 5\nsearch\ngo 2\nsearch\ndeduce C14 C22\ngo 4\nsearch\ngo 11\nsearch\naccuse 0\nYES\nTester\n'
out=$(run "$HARD" detective);                      check "$out" "CASE SOLVED" "detective mode can be won (7 proofs, one deduction)"
out=$(run 'accuse 1\nYES\n' normal);               check "$out" "GAME OVER" "wrong accusation ends the game"
out=$(run 'search\naccuse 0\nYES\n' normal);       check "$out" "collapses" "too little proof ends the game"
out=$(run 'accuse 1\nno\nquit\n' normal);          check "$out" "cancelled" "declining the confirmation keeps the chance"
out=$(run 'hint\nquit\n' detective);               check "$out" "No hints left" "detective mode has no hints"
WALK=$(for i in 1 2 3 4 5 6 7 8 9 10 11 12; do printf 'go 10\\ngo 11\\n'; done)   # 18 min per pair
out=$(run "$WALK" normal)
check "$out" "ran out of time" "the clock ends the game"
out=$(run 'go 10\ngo 9\nquit\n' normal);                  check "$out" "is locked" "Silver Jubilee is locked at the start"
rm -f data/scores.txt case_report.txt
echo "All playtests passed."
