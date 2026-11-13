// node test/parse.mjs  (needs chrono-node in node_modules; the browser gets it from the import map)
import assert from 'node:assert/strict';
import { parseSyllabi } from '../src/parse.js';
import { toWeeks, worstWeek, startBy } from '../src/crunch.js';

const text = `CS 61B: Data Structures, Fall 2026
Week 3: Sep 14 - Lists
Lab 4 due Friday Oct 9
Midterm 1: Thursday, Oct 15, in class
Oct 13: Midterm review
Project 2 due 10/16 at 11:59pm
HW 5 due Dec 4

ECON 1 - Intro to Economics
Problem Set 3 due Oct 14
Essay: Adam Smith reflection, due October 12
Final exam Dec 15
Office hours: Mondays 3pm
Oct 20: Lab 5 due`;

const items = parseSyllabi(text, new Date(2027, 4, 1)); // ref date far off: "Fall 2026" must win
const show = items.map((i) => `${i.date.toDateString()} | ${i.course} | ${i.type} | ${i.title}`);
console.log(show.join('\n'));
assert.equal(items.length, 8, 'deadline count');
assert.ok(items.every((i) => i.date.getFullYear() === 2026), 'year');
assert.deepEqual([...new Set(items.map((i) => i.course))], ['CS 61B', 'ECON 1']);
assert.equal(items.find((i) => i.type === 'exam' && i.course === 'CS 61B').date.getDate(), 15);

const weeks = toWeeks(items);
const worst = worstWeek(weeks);
console.log('worst', worst.start.toDateString(), worst.score, 'start by', startBy(worst).date.toDateString(), startBy(worst).item.title);
assert.equal(worst.start.toDateString(), new Date(2026, 9, 12).toDateString(), 'worst week is Oct 12');
assert.equal(worst.items.length, 4);
assert.equal(weeks.reduce((n, w) => n + w.items.length, 0), items.length);
console.log('ok');

// Judge's messy syllabus (judge/messy-syllabus.txt): tables, ranges, recurring notes, weekday stubs.
import fs from 'node:fs';
const messy = parseSyllabi(fs.readFileSync(new URL('../judge/messy-syllabus.txt', import.meta.url), 'utf8'));
assert.deepEqual(messy.map((i) => `${i.date.getMonth() + 1}/${i.date.getDate()} ${i.type} ${i.title}`), [
  '9/18 homework Reading response 1',
  '10/12 exam Midterm 1',
  '11/3 homework Problem set 3',
  '11/20 essay Paper #2 (5pp)',
  '12/15 exam Final Exam',
]);
const all = ['cs61b', 'econ1', 'english-r1a', 'chem1a'].map((f) => fs.readFileSync(new URL(`../samples/${f}.txt`, import.meta.url), 'utf8')).join('\n\n');
assert.equal(parseSyllabi(all).length, 36, 'samples still give 36 deadlines');
console.log('messy + samples ok');
