# Video inputs: Crunch Week (matches `video` draft 3)

The exact inputs and what should be on screen for each beat of the draft 3 script. Every value below was checked on the live site at 26bc533 (around 22:25).

## Before recording
- **Hard reload.** GitHub Pages caches old code for up to 10 minutes. Press cmd+shift+R on the app tab before every take. There's no stored state, so a reload also resets the page.
- Use Chrome with a fresh profile or a guest window, and hide the extensions bar. Set the window to 1920x1080. Use 125% page zoom so the text reads clearly, or 110% if you want all 7 book cards on one row in beat 4.
- App tab: https://hayobro7512.github.io/crunch-week/
- Beat 1 tabs: open the four sample syllabi as raw text:
  - https://hayobro7512.github.io/crunch-week/samples/cs61b.txt
  - https://hayobro7512.github.io/crunch-week/samples/econ1.txt
  - https://hayobro7512.github.io/crunch-week/samples/english-r1a.txt
  - https://hayobro7512.github.io/crunch-week/samples/chem1a.txt
- Beat 5: have a calendar ready to import into. Use a throwaway calendar, because the import adds 36 events.
  - Apple Calendar: File > Import.
  - Google Calendar: Settings > Import & export.
- Beat 6: keep the messy syllabus text below on your clipboard, or open it in a text editor.
- Beat 7: have `submission/title-card.png` (1920x1080) open full screen. Alternatively, drop it into the editor as the last 10 s.

## Beats
| # | Time | Do exactly | Expect on screen |
|---|---|---|---|
| 1 | 0:00-0:10 | Flick through the 4 syllabus tabs | CS 61B, Econ 1, English R1A and Chem 1A. Each has a "Deadlines" list and a "Required texts:" section. |
| 2 | 0:10-0:25 | Go to the app tab. Click **Load sample**, then **Unpack my semester** | The textarea fills with the 4 syllabi at once. The page scrolls to the results and the status says "36 deadlines found." |
| 3 | 0:25-0:45 | Wait about 1 s for the reveal: cells pop in, the callout rises, and Oct 12 starts to glow. Point at the Oct 12 cell with the **Crunch** tag | The callout reads "YOUR CRUNCH WEEK" / "Oct 12 to Oct 18: 7 deadlines in 5 days" / "3 exams, 1 essay, 1 project, 1 homework, 1 lab." Below that are 7 chips: Mon Chem 1A Midterm 1 · Tue CS 61B Midterm 1 · Wed English R1A Essay 2 (Frankenstein and science, 6-7 pp) · Thu Econ 1 Midterm exam · Fri CS 61B Proj 2: Gitlet checkpoint · Fri English R1A Reading response 3 · Fri Chem 1A Lab 6 report. The nudge says "→ Start CS 61B Proj 2: Gitlet checkpoint by Tue, Oct 6, 10 days early." Oct 12 and Dec 14 (finals) are both full red, but only Oct 12 glows and has the tag. |
| 4 | 0:45-1:10 | Scroll to **Textbooks via Open Library**. Point at "via Open Library". Click the **Frankenstein** card | The banner says "5 of 7 textbooks free via Open Library", about 1 s after Unpack. The cards show **Free to read** for The Wealth of Nations, Frankenstein, Mrs. Dalloway and Chemistry (Brown); **Free to borrow** for Head First Java; **No free copy** for Data Structures and Abstractions with Java; and **Print-disabled access** for Principles of Economics. The card opens openlibrary.org/works/OL450063W in a new tab. |
| 5 | 1:10-1:22 | Back on the app tab, click **Add to calendar (.ics)**, then import `crunch-week.ics` | `crunch-week.ics` downloads. The import adds 36 all-day events, titled like "CS 61B: Lab 1" and "Chem 1A: Midterm 1". |
| 6 | 1:22-1:37 | Click in the textarea, cmd+A, Delete. Paste the messy syllabus below. Click **Unpack my semester** | The status says "5 deadlines found." The list shows Fri Sep 18 Reading response 1 · **Mon Oct 12 Midterm 1** (from the "Oct 12-16" range in a table row) · Tue Nov 3 Problem set 3 · Fri Nov 20 Paper #2 (5pp) · Tue Dec 15 Final Exam. The callout turns green: "No crunch weeks. Nice." The books banner says "2 of 2 textbooks free": Psychology (OpenStax) is **Free to read** and Thinking, Fast and Slow is **Free to borrow**. |
| 7 | 1:37-1:47 | Title card | `submission/title-card.png`: "Crunch Week", "See your crunch weeks coming.", a heatmap strip with the Oct 12 week glowing, the live URL and the repo URL. |

## Beat 6 paste text (exactly this, from `judge/messy-syllabus.txt`)
```
PSYCH 101 — Intro to Psychology — Fall 2026
Required text: Psychology 2e (OpenStax). Recommended: Thinking, Fast and Slow by Daniel Kahneman

| Week | Topic | Due |
|------|-------|-----|
| Wk 1 | Intro | — |
| Wk 3 | Memory | Reading response 1 due 9/18 |
| Wk 7 | Review | Midterm 1: Oct 12-16 (take-home window) |
| Wk 9 | Learning | Problem set 3 due 11/3 by 11:59pm |
| Wk 12 | Social | Group project presentation TBA |

Final Exam — Tues., Dec. 15, 8-11AM, Room TBA
Paper #2 (5pp) — due Friday Nov 20th @ noon via bCourses
Quiz every Thursday
```
Note that "Quiz every Thursday" correctly produces no deadline. If the narration says "every deadline", that's still true: the 5 dated deliverables all show.

## If something looks wrong
- Old wording (for example "Public domain", or a red callout on the messy paste) means you're seeing cached code. Hard reload.
- Books say "Open Library is unreachable right now" means the API is down or the network is blocked. Wait a minute and retake. The rest of the page still works.
