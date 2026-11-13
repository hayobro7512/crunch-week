# Video inputs: Crunch Week

The exact steps and what should be on screen for each beat of the `video` page script. Values were checked against the code at 391f6d1 (21:20). Recheck them on the live site at freeze.

## Before recording
- Chrome, fresh profile or guest window, no extensions bar. Window 1920x1080, page zoom 125% so text reads at 1080p.
- Open https://hayobro7512.github.io/crunch-week/ and reload once. There's no stored state, so a reload resets everything.
- Open DevTools > Network, filter `openlibrary`, then dock it to the bottom and close it. Reopen it in beat 4 if you want to show the live calls.
- For beat 1: open the four sample syllabi as raw text tabs, e.g. https://hayobro7512.github.io/crunch-week/samples/cs61b.txt, `econ1.txt`, `english-r1a.txt`, `chem1a.txt`.
- For beat 5: a calendar app ready to import (Apple Calendar: File > Import, or Google Calendar: Settings > Import & export). Use a throwaway calendar so the 36 events are easy to delete after.

## Beats
| # | Do exactly | Expect on screen |
|---|---|---|
| 1 | Flip through the 4 syllabus tabs | CS 61B, Econ 1, English R1A, Chem 1A, each with a "Deadlines" list |
| 2 | Go to the app tab. Click **Load sample**, then **Unpack my semester** | Textarea fills with the 4 syllabi; status "36 deadlines found." |
| 3 | Pause on the callout and heatmap. Point at the dark red Oct 12 cell | Callout "Your crunch week" / "Oct 12 to Oct 18: 7 deadlines in 5 days", 7 item chips (Chem 1A Midterm 1, CS 61B Midterm 1, English R1A Essay 2, Econ 1 Midterm exam, CS 61B Proj 2: Gitlet checkpoint, English R1A Reading response 3, Chem 1A Lab 6 report), nudge "Start CS 61B Proj 2: Gitlet checkpoint by Tue, Oct 6, 10 days early." |
| 4 | Scroll to **Textbooks via Open Library** | Banner "5 of 7 textbooks free". Public domain: Wealth of Nations, Frankenstein, Mrs. Dalloway, Chemistry (Brown). Free to borrow: Head First Java. No free copy: Carrano (Data Structures), Mankiw (Principles of Economics, shown as "Print-disabled access"). Loads in about 1 s. |
| 5 | Click **Add to calendar (.ics)**, then import `crunch-week.ics` | Download `crunch-week.ics`; 36 all-day events, titled like "CS 61B: Midterm 1" |
| 6 | Title card | "Crunch Week. See the crunch before it hits." + live URL + repo URL |

## Lines in the current script that don't match the product (for lead)
- Beat 3 says "two midterms, an essay and a lab" and "start the essay a week early". The product shows 3 midterms, an essay, a project, a reading response and a lab, and the nudge is about the Gitlet project, 10 days early. Suggested line: "This red one is October twelfth: three midterms, an essay, a project and a lab, in five days. It tells me to start my project ten days early."
- Beat 3 says "hover it, callout opens". The callout is always visible above the heatmap; there's nothing to hover.
- Beat 4 says "3 of 5 free" and "Three of my five textbooks". The product shows "5 of 7". Suggested line: "Five of my seven textbooks I can read or borrow free, right now."
