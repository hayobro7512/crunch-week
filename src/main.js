import { parseSyllabi } from './parse.js';
import { toWeeks, worstWeek, startBy, WEIGHT } from './crunch.js';

// books.js and ics.js are built in parallel; until they land the page says so instead of breaking.
const books = import('./books.js').catch(() => null);
const ics = import('./ics.js').catch(() => null);

// Fixed color scale, so a calm semester looks calm: about 3 exams' worth of work in a week is full red.
const FULL_RED = 3 * WEIGHT.exam;

const SAMPLES = ['cs61b', 'econ1', 'english-r1a', 'chem1a'];
const ACCESS_LABEL = { public: 'Free to read', borrowable: 'Free to borrow', printdisabled: 'Print-disabled access', no_ebook: 'No free copy' };

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
    // Digits but no dates usually means another language's dates ("15 octobre", "15.10.").
    $('status').textContent = /\d/.test(text)
      ? 'Crunch Week reads English dates for now. Lines like "Midterm 1: Oct 15" work best.'
      : 'No dated deadlines found. Lines like "Midterm 1: Oct 15" work best.';
    $('results').hidden = true;
    return;
  }
  $('status').textContent = `${plural(items.length, 'deadline')} found.`;
  const res = $('results');
  res.hidden = false;
  renderWeeks(toWeeks(items));
  renderBooks(text);
  // Replay the reveal on every Unpack: drop the class, force a reflow, add it back.
  res.classList.remove('reveal');
  void res.offsetWidth;
  res.classList.add('reveal');
  res.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
  const heaviest = worstWeek(weeks);
  const c = $('callout');
  c.classList.toggle('calm', heaviest.items.length < 3);
  // Under 3 deadlines in any week there's no crunch to warn about.
  const worst = heaviest.items.length >= 3 ? heaviest : null;
  if (!worst) {
    c.replaceChildren(el('p', 'kicker', 'Crunch check'), el('p', 'headline', 'No crunch weeks. Nice.'), el('p', 'what', 'No week has more than 2 deadlines.'));
  } else {
    // Callout: the crunch week, every item in it, and what to start early.
    const counts = {};
    for (const it of worst.items) counts[it.type] = (counts[it.type] || 0) + 1;
    const what = Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([t, n]) => plural(n, t)).join(', ');
    const span = Math.round((worst.items.at(-1).date - worst.items[0].date) / 864e5) + 1;
    const chips = el('ul', 'chips');
    for (const it of worst.items) {
      const chip = el('li', it.type);
      chip.append(el('b', null, fmt(it.date, { weekday: 'short' })), ` ${it.course} ${it.title}`);
      chips.append(chip);
    }
    c.replaceChildren(
      el('p', 'kicker', 'Your crunch week'),
      el('p', 'headline', `${fmt(worst.start)} to ${fmt(worst.end)}: ${plural(worst.items.length, 'deadline')} in ${plural(span, 'day')}`),
      el('p', 'what', `${what}.`),
      chips,
    );
    const head = startBy(worst);
    if (head) {
      const early = Math.round((head.item.date - head.date) / 864e5);
      const verb = head.item.type === 'exam' ? 'Start studying for' : 'Start';
      c.append(el('p', 'nudge', `${verb} ${head.item.course} ${head.item.title} by ${fmt(head.date, { weekday: 'short', month: 'short', day: 'numeric' })}, ${early === 7 ? 'a week' : plural(early, 'day')} early.`));
    }
  }

  // Heatmap: one cell per week, darker = heavier. --i staggers the reveal.
  $('heatmap').replaceChildren(...weeks.map((w, i) => {
    const cell = el('a', 'cell' + (w === worst ? ' worst' : ''));
    cell.href = `#week-${i}`;
    cell.style.setProperty('--heat', Math.min(1, w.score / FULL_RED).toFixed(2));
    cell.style.setProperty('--i', i);
    cell.title = `${fmt(w.start)}: ${plural(w.items.length, 'deadline')}`;
    cell.append(el('span', 'wk', fmt(w.start)), el('span', 'n', w.items.length || ''));
    if (w === worst) cell.append(el('span', 'tag', 'Crunch'));
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
  // Loading state: a status line plus one placeholder card per book, so the panel doesn't jump when covers land.
  const placeholders = el('div', 'grid');
  for (const _ of titles) placeholders.append(el('div', 'book placeholder'));
  box.setAttribute('aria-busy', 'true');
  box.replaceChildren(el('p', 'muted loading', `Looking up ${plural(titles.length, 'book')} on Open Library…`), placeholders);
  let found;
  try {
    found = await mod.lookupBooks(titles);
  } catch {
    box.removeAttribute('aria-busy');
    return box.replaceChildren(el('p', 'error', 'Open Library is unreachable right now. Your deadlines above still work.'));
  }
  const free = found.filter((b) => b.free).length;
  const older = found.filter((b) => b.label).length;
  const grid = el('div', 'grid');
  for (const b of found) {
    const card = el(b.url ? 'a' : 'div', 'book' + (b.free ? ' free' : ''));
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
      el('span', 'badge', b.title ? b.label || ACCESS_LABEL[b.access] || 'No free copy' : 'Not found'),
    );
    grid.append(card);
  }
  const banner = el('p', 'banner', `${free} of ${found.length} textbooks free${older ? `, ${older} more in an older edition` : ''} `);
  banner.append(el('small', null, 'via Open Library'));
  box.removeAttribute('aria-busy');
  box.replaceChildren(banner, grid);
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
