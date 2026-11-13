# Crunch Week

See your crunch weeks coming. Find your textbooks free.

## Inspiration
Every semester starts the same way: four or five syllabi, each a different format, thirty-some deadlines spread across them. No one adds them up, so you find out it's midterm week on the Monday it starts. The textbook list is the other surprise: you buy a $200 book and later learn it's on Open Library for free.

## What it does
Paste your syllabi (or click "Load sample" for four realistic ones) and click "Unpack my semester".
- Every deadline is pulled out with its course, type (exam, project, essay, lab, quiz, homework) and date, and listed week by week.
- A heatmap shows the whole semester at a glance, with your worst week called out: "Oct 12 to Oct 18: 7 deadlines in 5 days", followed by every item and a nudge like "Start CS 61B Proj 2: Gitlet checkpoint by Tue, Oct 6, 10 days early."
- It finds the "Required texts" list in each syllabus and checks each book live on Open Library. Each book gets a cover and a badge ("Public domain", "Free to borrow" or "No free copy"), plus a banner such as "5 of 7 textbooks free".
- "Add to calendar (.ics)" downloads every deadline as all-day events for Google, Apple or Outlook Calendar.

Nothing is uploaded or stored. It all runs in your browser.

## How we built it
A static site with plain HTML, CSS and JavaScript ES modules, no build step, deployed to GitHub Pages by a GitHub Action.
- **Parsing:** chrono-node 2.7.7 reads messy dates ("Fri Oct 16", "10/30", "Thursday, October 15"). The course name comes from each syllabus header and the year from its "Fall 2026" line. Keywords decide the deadline type.
- **Crunch score:** each week is scored by weight (exam 5, project 4, essay 3, lab and quiz 2, homework 1), so a week with three midterms outranks a week of four problem sets. The "start by" nudge counts back from the biggest essay or project that week.
- **Textbooks:** we find the required-texts list, turn each line into a title plus author search, and call the Open Library search API from the browser, one request per book in parallel with a 6-second timeout. Its `ebook_access` field drives the badges and `cover_i` the covers.
- **Calendar:** a small RFC 5545 writer: all-day events, CRLF line endings, long lines folded at 75 bytes.

Built by one student with a crew of Claude Code agents, each owning its own files, between 21:00 and 02:00.

## Challenges
- **Course names from the wrong line.** Grading lines like "Labs 20%" looked like course codes ("LABS 20") to our first parser. We now take the course only from each syllabus's header.
- **Picking the right book.** Searching with the author's full name ("N. Gregory Mankiw") matched a study guide instead of the textbook. Searching by title plus last name fixed it for every sample book.
- **The year.** "Sep 4" has no year, and parsing relative to today can push early-semester dates into the wrong year. We read the term ("Fall 2026") from the syllabus header instead.
- **What counts as a crunch.** Counting deadlines made a week of problem sets look as bad as midterm week, so we weight deadlines by type.

## What's next
- Drop in syllabus PDFs directly (pdf.js), not just pasted text.
- Use each course's grading percentages to weight deadlines, so a 35% final outweighs a 5% quiz.
- Check your campus library's holdings and course reserves alongside Open Library.
- Reminders before each "start by" date, not just on the due date.

## Prizes
- **Best overall:** a tool for a problem every student has each term. You go from four syllabi to one view of the semester in under two seconds.
- **Best use of a free public API:** Crunch Week calls the free, keyless Open Library search API live in the browser on every Unpack, labeled "via Open Library" on screen. The demo shows the requests firing and the covers and free badges loading in real time. If Open Library is down, the panel says so and the rest still works.
