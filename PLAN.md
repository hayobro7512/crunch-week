Mirror of the room's plan page. Updated by the lead.

# PLAN: Crunch Week

- **Event**: Campus Tools Mini-Hack (mock), deadline 2026-11-13 02:00 PST. Mode: sprint (T = 5 h).
- **Pitch**: Paste your syllabi, see your crunch weeks coming, and find your textbooks free.
- **Prizes targeted**: Best overall; Best use of a free public API (Open Library search, keyless, called live in the browser, labeled "via Open Library" on screen).
- **Stack**: static site, plain HTML/CSS/JS ES modules, no build step. chrono-node 2.7.7 from `https://cdn.jsdelivr.net/npm/chrono-node@2.7.7/+esm` for dates. Open Library `https://openlibrary.org/search.json?q=...&fields=title,author_name,first_publish_year,ebook_access,key,cover_i&limit=1` (CORS *, `ebook_access` = public | borrowable | printdisabled | no_ebook). Deploy: GitHub Pages via Actions on push to main. Repo: github.com/hayobro7512/crunch-week (public). Local: mock-1/crunch-week.

## Idea scores (sprint, scored by lead)
| Idea | Impact | Tech | Creat. | Pres. | Demo | Build | Tracks |
|---|---|---|---|---|---|---|---|
| **Crunch Week: syllabi -> crunch heatmap + free textbooks** | 5 | 4 | 4 | 4 | 5 | 4 | both |
| Syllabus deadline calendar only | 5 | 4 | 3 | 4 | 5 | 4 | overall |
| Reading list free-copy finder only | 4 | 3 | 4 | 4 | 4 | 5 | both |
| Wikipedia flashcards from topic list | 3 | 3 | 3 | 4 | 4 | 5 | both |
| Weather-aware week planner (Open-Meteo) | 3 | 3 | 3 | 3 | 3 | 3 | both |
Spike (20:50): chrono-node parsed 5/6 messy lines ("due Fri Oct 9", "10/22", "next Monday"); Open Library returns CORS * and ebook_access. PASS.

## Demo story (video <= 1:48, 90% of 2:00)
1. 0:00-0:12 Problem: a student with 4 syllabi open in tabs. "Four syllabi, thirty-some deadlines, and you find out it's midterm week on the Monday it starts."
2. 0:12-0:35 Product on screen, click "Load sample" (4 real-looking syllabi), click "Unpack my semester". Timeline of weeks appears.
3. 0:35-0:55 WOW: weeks as a heatmap, worst week glowing red with a callout "Crunch week Oct 12-18: 2 midterms, 1 essay, 1 lab. Start the essay by Oct 5."
4. 0:55-1:20 Books panel: required texts pulled from the syllabi, looked up live via Open Library: covers, "Free to borrow" / "Public domain" badges, banner "3 of 5 textbooks free". (free-API track)
5. 1:20-1:35 Click "Add to calendar (.ics)", file downloads; show it in a calendar app.
6. 1:35-1:48 Pitch line + URL on screen.

## Golden path
| Step | Check anyone can run |
|------|----------------------|
| 1 Load | Open the live URL, click "Load sample": 4 syllabi fill the textarea in < 1 s. Pasting your own text works too. |
| 2 Unpack | Click "Unpack my semester": deadlines listed by week, each with course + type + date, in < 2 s. No item with a wrong year. |
| 3 Crunch | Heaviest week is highlighted with a callout naming its items and a "start by" date. |
| 4 Books | Required texts appear with Open Library results (title, cover, free badge) in < 5 s; "X of Y free" banner. Network tab shows openlibrary.org calls. API down -> panel says so, rest still works. |
| 5 Export | "Add to calendar" downloads a valid .ics that imports into Google/Apple Calendar with all deadlines. |

## Milestones
| Milestone | Due | State | Judge result |
|-----------|-----|-------|--------------|
| M1 walking skeleton | 22:15 | live 21:04 | judge checking |
| M2 golden path real | 23:30 | books + .ics live 21:04, no stubs | judge checking |
| M3 wow and polish | 00:45 | | unchecked |
| Freeze | 01:00 | | |
| Draft submission in `submission/` | 01:30 | | |
| Deadline | 02:00 | | |

## Human schedule
Human is unavailable for the whole mock (written yes in EVENT.md). Lead decides with defaults. Human records the video later from page `video`.

## Cut list (drop in this order)
1. Covers in the books panel (text only)
2. "Start by" nudges in the callout
3. .ics export (step 5) -> video beat 5 becomes a closer look at the week list
Never cut: crunch heatmap (wow) and live Open Library lookup (track).

## File map
| Path | Owner |
|------|-------|
| index.html, style.css, src/main.js, .github/ | skeleton |
| src/parse.js (text -> items {date, course, type, title}), src/crunch.js (weeks + score) | skeleton |
| src/books.js (find texts in syllabi + Open Library lookup), src/ics.js, samples/ | builder |
| judge/ | judge |
| README.md, PLAN.md, submission/ | lead |
Interfaces: parse.js exports `parseSyllabi(text, refDate) -> Item[]`; crunch.js exports `toWeeks(items) -> Week[]` and `worstWeek(weeks)`; books.js exports `findTexts(text) -> string[]` and `lookupBooks(titles) -> Promise<Book[]>`; ics.js exports `toICS(items) -> string`. main.js wires them.

## Git flow
`main` deploys. Room agents claim, commit only their paths to `main`, `git pull --rebase`, push. No teammates, no PRs. After freeze, fixes only.
