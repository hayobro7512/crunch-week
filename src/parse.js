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

// text: one or more syllabi pasted together. refDate: used to pick the year when no term is named;
// chrono picks the year that puts each date closest to it.
export function parseSyllabi(text, refDate = new Date()) {
  const term = text.match(TERM);
  if (term) refDate = new Date(+term[2], TERM_MID[term[1].toLowerCase()], 15);
  const items = [];
  let course = 'Course';
  for (const raw of text.split(/\r?\n/)) {
    let line = raw.trim();
    // Table row "| Wk 7 | Review | Midterm 1: Oct 12-16 |": keep only the last real cell (the "Due" column).
    if (line.startsWith('|')) line = line.split('|').map((c) => c.trim()).filter((c) => c && !/^[-–—:]+$/.test(c)).at(-1) ?? '';
    if (!line) continue;
    // "Quiz every Thursday" is a recurring note, not one deadline.
    if (/\bevery\s+(mon|tue|wed|thu|fri|sat|sun)/i.test(line)) continue;
    // "Quiz 3 Nov 6": keep chrono from reading "3 Nov" as the date.
    const clean = line.replace(/\b(\d+)\s+(?=(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d)/i, '$1 · ');
    const hit = chrono.parse(clean, refDate)[0];
    if (!hit) {
      const m = line.match(COURSE);
      // Only short header-like lines count as a new course.
      if (m && line.length < 70) course = m[1].replace(/\s+/g, ' ');
      continue;
    }
    const type = typeOf(line);
    // A dated line with no deliverable word ("Week 3: Sep 14") is a schedule row, skip it.
    if (type === 'other' && !/\bdue\b/i.test(line)) continue;
    if (/\b(review|no class|holiday|office hours)\b/i.test(line)) continue;
    // Title = the words before the date ("Midterm 1: Thu Oct 15"), or after it ("Oct 20: Lab 5 due").
    const before = clean.slice(0, hit.index).replace(/[\s\-–—:*•·,(]+$/, '');
    const title = (before.replace(/^[\s\-–—:*•·]+/, '') ? before : clean.slice(hit.index + hit.text.length))
      .replace(/[\s,–—-]+(mon|tue|wed|thu|fri|sat|sun)[a-z]*\.?$/i, '') // "Final Exam — Tues."
      .replace(/\b(due|on|by)\b\s*[:\-]?\s*$/i, '')
      .replace(/^[\s\-–—:*•·,]+|[\s\-–—:*•·,(]+$/g, '')
      .replace(/\s{2,}/g, ' ') || type;
    const d = hit.start.date();
    items.push({ date: new Date(d.getFullYear(), d.getMonth(), d.getDate()), course, type, title });
  }
  return items.sort((a, b) => a.date - b.date);
}
