// How much each kind of deadline weighs on a week.
export const WEIGHT = { exam: 5, project: 4, essay: 3, lab: 2, quiz: 2, homework: 1, other: 1 };
// Big items deserve a head start of this many days.
const LEAD_DAYS = { exam: 7, project: 10, essay: 7 };

const DAY = 864e5;
const monday = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7));
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

// items -> every week from the first deadline to the last, empty weeks included.
export function toWeeks(items) {
  if (!items.length) return [];
  const sorted = [...items].sort((a, b) => a.date - b.date);
  const weeks = [];
  const last = monday(sorted.at(-1).date);
  for (let start = monday(sorted[0].date); start <= last; start = addDays(start, 7)) {
    weeks.push({ start, end: addDays(start, 6), items: [], score: 0 });
  }
  const first = weeks[0].start;
  for (const it of sorted) {
    // Round: DST shifts make the day difference fractional.
    const w = weeks[Math.round((monday(it.date) - first) / DAY / 7)];
    w.items.push(it);
    w.score += WEIGHT[it.type] ?? 1;
  }
  return weeks;
}

export function worstWeek(weeks) {
  return weeks.reduce((a, w) => (!a || w.score > a.score ? w : a), null);
}

// What to start early: an essay or project first (work you can start now), else the earliest exam.
// Returns {item, date} or null.
export function startBy(week) {
  const picks = week.items.filter((it) => LEAD_DAYS[it.type]).map((item) => ({ item, date: addDays(item.date, -LEAD_DAYS[item.type]) }));
  const exam = (p) => (p.item.type === 'exam' ? 1 : 0);
  return picks.sort((a, b) => exam(a) - exam(b) || a.date - b.date)[0] ?? null;
}
