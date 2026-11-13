import * as chrono from 'chrono-node';

// A course header: "CS 61B: Data Structures", "Econ 1 - Intro", "ENGLISH R1A". The code must end the line
// or be followed by a colon/dash, so "Labs 20%, quizzes 10%" isn't taken for a course.
const COURSE = /^\s*([A-Za-z]{2,10}\s?[A-Z]?\d{1,3}[A-Z]{0,2})\s*(?:[:\-–—]\s*(.*))?$/;

// First match wins: "Final project" is a project and "Essay 3 final" is an essay, not an exam.
const TYPES = [
  ['project', /\b(project|proj)\b/i],
  ['essay', /\b(essay|paper|draft|memo)\b/i],
  ['exam', /\b(midterm|exam|final)\b/i],
  ['lab', /\blab\b/i],
  ['quiz', /\bquiz\b/i],
  ['homework', /\b(hw\d*|homework|problem set|pset|assignment|response)\b/i],
];

export function typeOf(line) {
  for (const [t, re] of TYPES) if (re.test(line)) return t;
  return 'other';
}

// "Fall 2026" anywhere in the text pins the year, so the sample parses the same on any day.
const TERM = /\b(spring|summer|fall|autumn)\s+(20\d\d)\b/i;
const TERM_MID = { spring: 2, summer: 6, fall: 9, autumn: 9 };

const WEEK = /\b(?:week|wk)\.?\s*(\d{1,2})\b/i;
// "Instruction begins Wednesday, August 26": the date Week 1 is counted from.
const TERM_START = /\b(class(es)?|instruction|term|semester|quarter|week 1)\b.*\b(begins?|starts?)\b/i;
const NOT_COURSE = /^(week|wk|unit|chapter|ch|part|lecture|section|room|module)\b/i;
const MONTH_AFTER_NUM = /\b(\d+)\s+(?=(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d)/i;

const monday = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7));
const cleanTitle = (t) => t
  .replace(/\(\s*\)/g, '')
  .replace(/\s+,/g, ',')
  .replace(/(.)\s+due\b.*$/i, '$1') // "Final paper due on bCourses"
  .replace(/,?\s*\d{1,2}(:\d\d)?\s*(-\s*\d{1,2}(:\d\d)?)?\s*(am|pm)\b.*$/i, '') // "Final exam, 8-11am"
  .replace(/\(?\s*week of\s*$/i, '') // "Lab 4 (week of Oct 5)"
  .replace(/[\s,–—-]+(mon|tue|wed|thu|fri|sat|sun)[a-z]*\.?$/i, '') // "Final Exam — Tues."
  .replace(/\b(due|on|by|in)\b\s*[:\-]?\s*$/i, '')
  .replace(/^[\s\-–—:*•·,.]+|[\s\-–—:*•·,(.]+$/g, '')
  .replace(/\s{2,}/g, ' ');

// Table row -> one line. "| Wk 7 | Review | Midterm 1: Oct 12-16 |" keeps the Due cell;
// "| Oct 16 | Testing | HW 5 |" becomes "HW 5 — Oct 16" so the date isn't lost.
function tableRow(line) {
  const cells = line.split('|').map((c) => c.trim()).filter((c) => c && !/^[-–—:]+$/.test(c));
  const due = cells.at(-1) ?? '';
  if (cells.length < 2 || chrono.parse(due).some((r) => r.start.isCertain('day')) || WEEK.test(due)) return due;
  return `${due} — ${cells[0]}`;
}

// text: one or more syllabi pasted together. refDate: used to pick the year when no term is named;
// chrono picks the year that puts each date closest to it.
export function parseSyllabi(text, refDate = new Date()) {
  const term = text.match(TERM);
  if (term) refDate = new Date(+term[2], TERM_MID[term[1].toLowerCase()], 15);
  const items = [];
  let course = 'Course';
  let week1 = null; // Monday of Week 1, once a syllabus states when classes begin
  for (const raw of text.split(/\r?\n/)) {
    let line = raw.trim();
    if (line.startsWith('|')) line = tableRow(line);
    if (!line) continue;

    const type = typeOf(line);
    const head = line.match(COURSE);
    if (head && type === 'other' && line.length < 70 && !raw.trim().startsWith('|') && !NOT_COURSE.test(line)) {
      course = head[1].replace(/\s+/g, ' ');
      week1 = null;
      continue;
    }
    // "Quiz every Thursday" is a recurring note, not one deadline.
    if (/\bevery\s+(mon|tue|wed|thu|fri|sat|sun)/i.test(line)) continue;

    // "Quiz 3 Nov 6": keep chrono from reading "3 Nov" as the date.
    const clean = line.replace(MONTH_AFTER_NUM, '$1 · ');
    // Prefer a real date over a time ("Final exam, 8-11am — Dec 15").
    const hits = chrono.parse(clean, refDate);
    const hit = hits.find((r) => r.start.isCertain('day')) ?? hits[0];
    if (hit && TERM_START.test(line) && hit.start.isCertain('day')) {
      week1 = monday(hit.start.date());
      continue;
    }
    if (type === 'other' && !/\bdue\b/i.test(line)) continue;
    if (/\b(review|no class|no lecture|holiday|office hours)\b/i.test(line)) continue;

    let date, title;
    const wk = week1 && clean.match(WEEK);
    if (hit && hit.start.isCertain('day')) {
      date = hit.start.date();
      // Title = the words before the date ("Midterm 1: Thu Oct 15"), or after it ("Oct 20: Lab 5 due").
      const before = clean.slice(0, hit.index).replace(/[\s\-–—:*•·,(]+$/, '');
      title = before.replace(/^[\s\-–—:*•·]+/, '') ? before : clean.slice(hit.index + hit.text.length);
    } else if (wk) {
      // "Week 6: Midterm exam (Wed)": that weekday of week 6, or its Friday when no day is given.
      const wd = hit?.start.get('weekday');
      date = new Date(week1.getFullYear(), week1.getMonth(), week1.getDate() + 7 * (wk[1] - 1) + (wd != null ? (wd + 6) % 7 : 4));
      title = (hit ? clean.slice(0, hit.index) + clean.slice(hit.index + hit.text.length) : clean).replace(WEEK, '');
      // Drop the week's topic ("Empire. Midterm exam") when the deliverable follows it.
      title = title.split(/\.\s+/).find((part) => typeOf(part) !== 'other') ?? title;
    } else continue; // no usable date: time only ("by 11:59pm"), or a bare weekday
    items.push({ date: new Date(date.getFullYear(), date.getMonth(), date.getDate()), course, type, title: cleanTitle(title) || type });
  }
  return items.sort((a, b) => a.date - b.date);
}
