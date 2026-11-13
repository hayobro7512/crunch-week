// node test/check.mjs [--live]   (--live also calls Open Library for the sample texts)
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { findTexts, lookupBooks } from '../src/books.js';
import { toICS } from '../src/ics.js';

const names = ['cs61b', 'econ1', 'english-r1a', 'chem1a'];
const all = names.map((n) => readFileSync(new URL(`../samples/${n}.txt`, import.meta.url), 'utf8')).join('\n\n');

const texts = findTexts(all);
assert.deepEqual(texts, [
  'Head First Java Sierra',
  'Data Structures and Abstractions with Java Carrano',
  'Principles of Economics Mankiw',
  'The Wealth of Nations Smith',
  'Frankenstein Shelley',
  'Mrs Dalloway Woolf',
  'Chemistry: The Central Science Brown',
]);
assert.deepEqual(findTexts('Textbook: Calculus by James Stewart\n\nHW 1 due 9/4'), ['Calculus Stewart']);
assert.deepEqual(findTexts('no books here\nHW 1 due 9/4'), []);
assert.deepEqual(
  findTexts(readFileSync(new URL('../judge/messy-syllabus.txt', import.meta.url), 'utf8')),
  ['Psychology 2e', 'Thinking, Fast and Slow Kahneman'],
);
assert.deepEqual(findTexts('Required texts: Calculus by Stewart; Linear Algebra by Strang'), ['Calculus Stewart', 'Linear Algebra Strang']);
const messy2 = findTexts(readFileSync(new URL('../judge/messy-syllabus-2.txt', import.meta.url), 'utf8'));
assert.deepEqual(messy2, ['Calculus: Early Transcendentals Stewart isbn:9781285741550', 'Calculus Volume 2 Strang']);
assert.deepEqual(findTexts('Course: CS 61B\nInstructor: Dana Okafor'), []);
assert.deepEqual(findTexts('Required: Chemistry by Brown (ISBN 978-0134414232)\nMidterm 1 Mon Oct 12\nLab 2 due Oct 14'), ['Chemistry Brown isbn:9780134414232']);
assert.deepEqual(findTexts('Textbook: Calculus by Stewart\n- Linear Algebra by Strang\nHW 1 due 9/4'), ['Calculus Stewart', 'Linear Algebra Strang']);
console.log(`findTexts ok: ${texts.length} texts`);

const ics = toICS([
  { date: new Date(2026, 9, 13), course: 'CS 61B', type: 'exam', title: 'Midterm 1, Pimentel 1; bring ID' },
  { date: new Date(2026, 11, 31), course: 'Econ 1', type: 'hw', title: 'A very long title '.repeat(6) + '— end' },
]);
const lines = ics.split('\r\n');
assert.equal(lines[0], 'BEGIN:VCALENDAR');
assert.equal(lines.at(-2), 'END:VCALENDAR');
assert.equal(lines.filter((l) => l === 'BEGIN:VEVENT').length, 2);
assert.ok(ics.includes('DTSTART;VALUE=DATE:20261013\r\nDTEND;VALUE=DATE:20261014'));
assert.ok(ics.includes('DTSTART;VALUE=DATE:20261231\r\nDTEND;VALUE=DATE:20270101'));
assert.ok(ics.includes('SUMMARY:CS 61B: Midterm 1\\, Pimentel 1\\; bring ID'));
assert.ok(!/[^\r]\n/.test(ics), 'bare LF');
assert.ok(lines.every((l) => new TextEncoder().encode(l).length <= 75), 'line over 75 octets');
console.log('toICS ok: 2 events, CRLF, folded');

if (process.argv.includes('--live')) {
  const t0 = Date.now();
  const books = await lookupBooks(texts);
  for (const b of books) console.log(`  ${b.access.padEnd(13)} ${b.title} (${b.author ?? '?'}, ${b.year ?? '?'})`);
  assert.equal(books.filter((b) => b.free).length, 5);
  assert.ok(books.every((b) => b.url?.startsWith('https://openlibrary.org/works/')), 'every card links to its work');
  console.log(`lookupBooks ok: ${books.filter((b) => b.free).length} of ${books.length} free, ${Date.now() - t0} ms`);
  const psych = await lookupBooks(['Psychology 2e', 'Thinking, Fast and Slow Kahneman']);
  for (const b of psych) console.log(`  ${b.access.padEnd(13)} ${b.title} (${b.author ?? '?'}) ${b.url}`);
  assert.ok(psych[0].free, 'Psychology 2e free');
  const calc = await lookupBooks(messy2);
  for (const b of calc) console.log(`  ${b.access.padEnd(13)} ${b.title} (${b.author ?? '?'}, ${b.year ?? '?'}) ${b.label ?? ''}`);
  assert.match(calc[0].author, /Stewart/);
  assert.ok(calc[1].free && /Strang/.test(calc[1].author), 'Strang free');
  const chem = (await lookupBooks(['Chemistry Brown isbn:9780134414232']))[0];
  console.log(`  ${chem.access.padEnd(13)} ${chem.title} (${chem.author}, ${chem.year}) ${chem.label ?? ''}`);
}
