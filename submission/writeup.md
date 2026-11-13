# Crunch Week

See your crunch weeks coming. Find your textbooks free.

## Inspiration
Every semester starts the same way: four or five syllabi, each a different format, thirty-some deadlines spread across them. No one adds them up, so you find out it's midterm week on the Monday it starts. The textbook list is the other surprise: you buy a $200 book and later learn a free copy was on Open Library all along.

## What it does
Paste your syllabi (or click "Load sample" for four realistic ones) and click "Unpack my semester".
- Every deadline is pulled out with its course, type (exam, project, essay, lab, quiz, homework) and date, and listed week by week. Real syllabus formats work: "Fri Oct 16", "10/30", "10.28", "Week 7" schedules counted from the first day of class, date ranges like "Oct 12-16", and Markdown-style tables.
- A heatmap shows the whole semester at a glance on a fixed scale, so a calm semester looks calm. Your worst week is tagged and called out: "Oct 12 to Oct 18: 7 deadlines in 5 days", every item in it, and a nudge like "Start CS 61B Proj 2: Gitlet checkpoint by Tue, Oct 6, 10 days early." If no week has 3 or more deadlines, it says "No crunch weeks. Nice." instead.
- It finds the required texts in each syllabus ("Required texts:", "Required:", "Textbook:", including "Recommended:" and "free alternative:" picks) and checks each book live on Open Library. Each card shows a cover, links to the book's Open Library page, and gets a badge: "Free to read", "Free to borrow", "Older edition free", "Print-disabled access" or "No free copy". A banner counts them: "4 of 7 textbooks free, 1 more in an older edition".
- "Add to calendar (.ics)" downloads every deadline as all-day events for Google, Apple or Outlook Calendar.

Nothing is uploaded or stored. It all runs in your browser, and it works on a phone.

## How we built it
A static site with plain HTML, CSS and JavaScript ES modules, no build step, deployed to GitHub Pages by a GitHub Action.
- **Parsing:** chrono-node 2.7.7 reads the dates. On top of it we handle what real syllabi do: table rows (keep the "Due" cell), date ranges (take the start), "Week N" schedules counted from "Instruction begins …", and "every Thursday" notes that aren't deadlines. The course name comes from each syllabus header and the year from its "Fall 2026" line.
- **Crunch score:** each week is scored by weight (exam 5, project 4, essay 3, lab and quiz 2, homework 1), so a week with three midterms outranks a week of four problem sets. The heatmap color is on a fixed scale, where 3 exams' worth of work is full red. The "start by" nudge counts back from the week's biggest essay or project.
- **Textbooks:** we turn each book line into a title plus author-last-name search and call the Open Library search API from the browser, one request per book in parallel with a 6-second timeout. When the syllabus gives an ISBN, we search by ISBN first to pin the exact edition, then use that edition's year and cover. `ebook_access` drives the badges. If that exact edition isn't free but another edition is, the card says "Older edition free" and the banner counts it separately, not as free.
- **Calendar:** a small RFC 5545 writer: all-day events, CRLF line endings, long lines folded at 75 bytes.
- **Testing:** each round a judge agent broke the app with messier syllabi (tables, ranges, dotted dates, ISBNs), and each one became a fixture in `node test/parse.mjs` and `node test/check.mjs`.

Built by one student with a crew of Claude Code agents, each owning its own files, between 21:00 and 02:00.

## Challenges
- **Messy real syllabi.** Our first parser was fine on clean samples and broke on real ones: table pipes in titles, "Oct 12-16" ranges dropped, "Quiz every Thursday" turned into a fake deadline, schedules by week number with no dates. We wrote deliberately messy syllabi and fixed the parser until each one came out right.
- **Course names from the wrong line.** Grading lines like "Labs 20%" looked like course codes ("LABS 20"). We now take the course only from each syllabus's header.
- **Finding and matching books.** "Required text: Psychology 2e (OpenStax). Recommended: Thinking, Fast and Slow by Daniel Kahneman" first came out as one garbled search. Searching with the author's full name matched a Mankiw study guide instead of the textbook. And Open Library's search returns a whole work, so a 2017 chemistry textbook showed up as its 1977 first edition. Splitting the clauses, searching title plus last name, and using the ISBN when given fixed all three.
- **Honest badges.** Open Library's `public` means full access, not public domain, so the badge says "Free to read". When only a decades-old edition is free, we say exactly that and leave it out of the free count.
- **What counts as a crunch.** Counting deadlines made a week of problem sets look as bad as midterm week, and a relative color scale made a calm semester look alarming. Weighted scores on a fixed scale fixed both.

## What's next
- Drop in syllabus PDFs directly (pdf.js), not just pasted text.
- Use each course's grading percentages to weight deadlines, so a 35% final outweighs a 5% quiz.
- Check your campus library's holdings and course reserves alongside Open Library.
- Reminders before each "start by" date, not just on the due date.

## Prizes
- **Best overall:** a tool for a problem every student has each term. You go from four syllabi to one view of the semester in under two seconds, on a laptop or a phone.
- **Best use of a free public API:** Crunch Week calls the free, keyless Open Library search API live in the browser on every Unpack, labeled "via Open Library" on screen. The demo shows the covers and free badges loading in real time, and each card links to the book on Open Library. If Open Library is down, the panel says so and the rest still works.
