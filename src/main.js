import { parseSyllabi } from './parse.js';
import { toWeeks, worstWeek, startBy } from './crunch.js';

// books.js and ics.js are built in parallel; until they land the page says so instead of breaking.
const books = import('./books.js').catch(() => null);
const ics = import('./ics.js').catch(() => null);

const SAMPLES = ['cs61b', 'econ1', 'english-r1a', 'chem1a'];
const FREE = new Set(['public', 'borrowable']);
const ACCESS_LABEL = { public: 'Public domain', borrowable: 'Free to borrow', printdisabled: 'Print-disabled access', no_ebook: 'No free copy' };

const $ = (id) => document.getElementById(id);
const fmt = (d, o = { month: 'short', day: 'numeric' }) => d.toLocaleDateString('en-US', o);
function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}
const PLURAL = { quiz: 'quizzes', homework: 'homework', other: 'other' };
const plural = (n, w) => `${n} ${n === 1 ? w : PLURAL[w] || w + 's'}`;

let items = [];

$('sample').onclick = async () => {
  const texts = await Promise.all(SAMPLES.map((s) => fetch(`samples/${s}.txt`).then((r) => (r.ok ? r.text() : ''))));
  $('syllabi').value = texts.filter(Boolean).join('\n\n') || FALLBACK;
};

$('unpack').onclick = () => {
  const text = $('syllabi').value;
  items = parseSyllabi(text);
  if (!items.length) {
    $('status').textContent = 'No dated deadlines found. Lines like "Midterm 1: Oct 15" work best.';
    $('results').hidden = true;
    return;
  }
  $('status').textContent = `${plural(items.length, 'deadline')} found.`;
  $('results').hidden = false;
  renderWeeks(toWeeks(items));
  renderBooks(text);
  $('results').scrollIntoView({ behavior: 'smooth', block: 'start' });
};

$('ics').onclick = async () => {
  const mod = await ics;
  if (!mod) return ($('status').textContent = 'Calendar export is coming soon.');
  const url = URL.createObjectURL(new Blob([mod.toICS(items)], { type: 'text/calendar' }));
  const a = el('a');
  a.href = url;
  a.download = 'crunch-week.ics';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

function renderWeeks(weeks) {
  const worst = worstWeek(weeks);
  const max = worst.score || 1;

  // Callout: the crunch week, what's in it, and when to start.
  const counts = {};
  for (const it of worst.items) counts[it.type] = (counts[it.type] || 0) + 1;
  const what = Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([t, n]) => plural(n, t)).join(', ');
  const head = startBy(worst);
  const c = $('callout');
  c.replaceChildren(
    el('strong', null, `Crunch week ${fmt(worst.start)} to ${fmt(worst.end)}`),
    el('span', null, `: ${what}.`),
  );
  if (head) c.append(el('span', 'nudge', ` Start ${head.item.title} (${head.item.course}) by ${fmt(head.date, { weekday: 'short', month: 'short', day: 'numeric' })}.`));

  // Heatmap: one cell per week, darker = heavier.
  $('heatmap').replaceChildren(...weeks.map((w, i) => {
    const cell = el('a', 'cell' + (w === worst ? ' worst' : ''));
    cell.href = `#week-${i}`;
    cell.style.setProperty('--heat', (w.score / max).toFixed(2));
    cell.title = `${fmt(w.start)}: ${plural(w.items.length, 'deadline')}`;
    cell.append(el('span', 'wk', fmt(w.start)), el('span', 'n', w.items.length || ''));
    return cell;
  }));

  // List: only weeks with something due.
  $('weeks').replaceChildren(...weeks.flatMap((w, i) => {
    if (!w.items.length) return [];
    const li = el('li', w === worst ? 'worst' : '');
    li.id = `week-${i}`;
    li.append(el('h3', null, `Week of ${fmt(w.start)}`));
    const ul = el('ul');
    for (const it of w.items) {
      const row = el('li', `item ${it.type}`);
      row.append(
        el('time', null, fmt(it.date, { weekday: 'short', month: 'short', day: 'numeric' })),
        el('span', 'course', it.course),
        el('span', 'type', it.type),
        el('span', 'title', it.title),
      );
      ul.append(row);
    }
    li.append(ul);
    return [li];
  }));
}

async function renderBooks(text) {
  const box = $('books');
  const mod = await books;
  if (!mod) return box.replaceChildren(el('p', 'muted', 'Textbook lookup is coming soon.'));
  const titles = mod.findTexts(text);
  if (!titles.length) return box.replaceChildren(el('p', 'muted', 'No required texts found. Add a "Required texts" section to a syllabus.'));
  box.replaceChildren(el('p', 'muted', `Looking up ${plural(titles.length, 'book')} on Open Library…`));
  let found;
  try {
    found = await mod.lookupBooks(titles);
  } catch {
    return box.replaceChildren(el('p', 'error', 'Open Library is unreachable right now. Your deadlines above still work.'));
  }
  const free = found.filter((b) => FREE.has(b.access)).length;
  const grid = el('div', 'grid');
  for (const b of found) {
    const card = el(b.url ? 'a' : 'div', 'book' + (FREE.has(b.access) ? ' free' : ''));
    if (b.url) { card.href = b.url; card.target = '_blank'; card.rel = 'noopener'; }
    if (b.coverUrl) {
      const img = el('img');
      img.src = b.coverUrl;
      img.alt = '';
      img.loading = 'lazy';
      card.append(img);
    }
    card.append(
      el('strong', null, b.title || b.query),
      el('span', 'muted', [b.author, b.year].filter(Boolean).join(', ')),
      el('span', 'badge', b.title ? ACCESS_LABEL[b.access] || 'No free copy' : 'Not found'),
    );
    grid.append(card);
  }
  box.replaceChildren(el('p', 'banner', `${free} of ${found.length} textbooks free`), grid);
}

// Used only if samples/ hasn't been published yet.
const FALLBACK = `CS 61B: Data Structures, Fall 2026
Lab 4 due Friday Oct 9
Midterm 1: Thursday, Oct 15, in class
Project 2 due 10/16 at 11:59pm
HW 5 due Dec 4

ECON 1: Introduction to Economics, Fall 2026
Problem Set 3 due Oct 14
Essay: Adam Smith reflection, due October 12
Final exam Dec 15`;
