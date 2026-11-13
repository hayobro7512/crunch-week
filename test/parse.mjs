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
assert.deepEqual(parseSyllabi(all + '\n\n' + all), parseSyllabi(all), 'samples pasted twice give the same 36 deadlines');
console.log('messy + samples ok');

// Real-world formats (test/fixtures): week-number schedules, due times, date tables, lab weeks.
const fixture = (f) => parseSyllabi(fs.readFileSync(new URL(`fixtures/${f}.txt`, import.meta.url), 'utf8'))
  .map((i) => `${i.date.getMonth() + 1}/${i.date.getDate()} ${i.course} ${i.type} ${i.title}`);
assert.deepEqual(fixture('week-rows'), [ // Week 1 = Mon Aug 24 (classes begin Wed Aug 26)
  '9/4 HIST 7B essay Response paper 1',
  '9/18 HIST 7B essay Response paper 2',
  '9/30 HIST 7B exam Midterm exam, in lecture',
  '10/23 HIST 7B essay Response paper 3', // no day given -> Friday
  '11/2 HIST 7B essay Final paper proposal',
  '12/3 HIST 7B essay Final paper',
]);
assert.deepEqual(fixture('due-times'), [ // "by 11:59pm" header line is not a deadline
  '9/8 STAT 20 homework Problem Set 1',
  '9/22 STAT 20 homework Problem Set 2',
  '10/1 STAT 20 quiz Quiz 1 in section',
  '10/13 STAT 20 homework Problem Set 3',
  '10/14 STAT 20 exam Midterm',
  '11/3 STAT 20 project Data project checkpoint',
  '11/17 STAT 20 homework Problem Set 4',
  '12/4 STAT 20 project Data project final report',
  '12/17 STAT 20 exam Final exam',
]);
assert.deepEqual(fixture('date-table'), [
  '9/2 DATA C8 lab Lab 1',
  '9/9 DATA C8 homework HW 1',
  '9/30 DATA C8 project Project 1',
  '10/14 DATA C8 exam Midterm (in lecture)',
  '10/16 DATA C8 homework HW 5',
  '11/20 DATA C8 project Project 2',
  '12/15 DATA C8 exam Final exam',
]);
assert.deepEqual(fixture('lab-weeks'), [
  '9/7 PHYSICS 7B lab Lab 1', '9/21 PHYSICS 7B lab Lab 2', '10/5 PHYSICS 7B lab Lab 3', '10/12 PHYSICS 7B lab Lab 4',
  '10/13 PHYSICS 7B exam Midterm 1', '11/2 PHYSICS 7B lab Lab 5', '11/17 PHYSICS 7B exam Midterm 2',
  '11/30 PHYSICS 7B lab Lab 6', '12/14 PHYSICS 7B exam Final',
]);
console.log('4 fixtures ok');

// Judge's second messy syllabus: dotted "10.28", weekday inside "Wk 5 (Sep 28 – Oct 2)", ISO dates, holidays.
assert.deepEqual(parseSyllabi(fs.readFileSync(new URL('../judge/messy-syllabus-2.txt', import.meta.url), 'utf8'))
  .map((i) => `${i.date.getMonth() + 1}/${i.date.getDate()} ${i.type} ${i.title}`), [
  '9/9 quiz Quiz 1',
  '10/1 homework Homework 4',
  '10/7 exam Midterm I',
  '10/21 project Project milestone',
  '10/28 exam Midterm II',
  '11/9 quiz Take-home quiz window',
  '12/7 project Final project',
  '12/18 exam Final',
]);
console.log('messy 2 ok');

// Judge's third messy syllabus: "HW 6/7 (combined) - due 11/12" must not become June 7; header split on " - ".
assert.deepEqual(parseSyllabi(fs.readFileSync(new URL('../judge/messy-syllabus-3.txt', import.meta.url), 'utf8'))
  .map((i) => `${i.date.getMonth() + 1}/${i.date.getDate()} ${i.course} ${i.type} ${i.title}`), [
  '9/10 PHYSICS 7A homework Pset 1',
  '10/1 PHYSICS 7A exam Exam 1 (in class)',
  '10/14 PHYSICS 7A lab Lab report 2',
  '10/30 PHYSICS 7A project Final project proposal',
  '11/12 PHYSICS 7A homework HW 6/7 (combined)',
  '11/18 PHYSICS 7A exam Exam 2 (cumulative)',
]);
console.log('messy 3 ok');
