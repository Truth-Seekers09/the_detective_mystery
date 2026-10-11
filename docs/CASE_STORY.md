# The Case ( private: it contains the solution)

**The crime:** On the morning of the Data Structures semester exam, the sealed question paper is missing
from the Exam Cell in the CSIT basement. The exam starts at 10 AM.

**The culprit:** Anand Verma (suspect 0), a lab assistant at the CSIT Block. He is deep in debt. He used his
access card to enter the Exam Cell at 11:52 PM, copied the paper and passed it to students.

All characters are fictional. Only the places are real.

## Phase 2 campus map

| Id | Location | Direct routes to |
|---|---|---|
| 0 | BTECH Block | Old MCA Block, Ravi Canteen, Quick Bite Cafe, Library, CSIT Block |
| 1 | CSIT Block | BTECH Block, Exam Cell |
| 2 | Old MCA Block | BTECH Block, Quick Bite Cafe |
| 3 | Ravi Canteen | BTECH Block |
| 4 | Quick Bite Cafe | BTECH Block, Old MCA Block |
| 5 | Library | BTECH Block |
| 6 | Exam Cell (locked) | CSIT Block |

The CSIT Block stands apart from the rest. In Phase 2 it is one direct route from BTECH. In Phase 3 we
replace that with the Underground Tunnel and the Main Gate as real places so shortest-route search has
two ways to compare.

## Suspects

| Id | Name | Role | Part in the story |
|---|---|---|---|
| 0 | Anand Verma | Lab Assistant, CSIT | The culprit |
| 1 | Neha Kapoor | Final-year student | Worried about the exam but her Defence is true |
| 2 | Ms. Seema Joshi | Library assistant | Misdirection: stayed late with a bag of library books |

Planned for Phase 3: Mr. Rawat, the night security guard (a witness who forgot to log one late entry).

## Clues

| Id | Where | Points to | Role in the case |
|---|---|---|---|
| C01 Authorisation Letter | BTECH Block | nobody | Opens the Exam Cell |
| C02 Slit Paper Envelope | Exam Cell | nobody | No forced entry so a card was used |
| C03 Card Swipe Log | Exam Cell | Anand | His card was used at 11:52 PM |
| C04 Loan Reminder | CSIT Block | Anand | Motive: unpaid debt |
| C05 Crumpled Printout | Old MCA Block | Anand | Copied pages of the stolen paper |
| C06 Canteen Owner's Statement | Ravi Canteen | Neha | Clears Neha |
| C07 Late-Stay Slip | Library | Ms. Joshi | Misdirection |
| C08 Cafe Manager's Statement | Quick Bite Cafe | Anand | A man in a lab coat handed a sheet to students |

To convict, the player needs 3 incriminating clues against the culprit (C03, C04, C05 and C08 are
available). Two wrong accusations end the game.

