// Find required texts in syllabus text and look them up live on Open Library (keyless, CORS *).

// A heading line like "Required texts:", "Required:", "Textbook: X by Y", "Readings".
const HEADING = /^\s*(?:required(?:\s+(?:texts?|textbooks?|books|readings?|materials))?|(?:course|assigned)\s+(?:texts?|textbooks?|books|readings?|materials)|texts?|textbooks?|books|readings?|reading list)\s*(?::\s*(.*))?$/i;
const BULLET = /^\s*(?:[-*•]|\d+[.)])\s+/;
const ISBN = /ISBN(?:-1[03])?[\s:]*([\dXx][\d\s-]{8,16}[\dXx])/i;
const FREE = new Set(['public', 'borrowable']);

const EDITION = /\b(\d+)(?:st|nd|rd|th)\s+ed(?:ition)?\b\.?/i;

// "Calculus, 8th ed. by James Stewart isbn:9781285741550" -> "Calculus by:Stewart ed:8 isbn:9781285741550"
// by: is the author's last name (the match must have it), ed: the edition the syllabus asks for.
function toQuery(line) {
  const isbn = line.match(/isbn:(\S+)/)?.[1] || line.match(ISBN)?.[1].replace(/[\s-]/g, '');
  const ed = line.match(/ed:(\d+)/)?.[1] || line.match(EDITION)?.[1];
  const s = line
    .replace(BULLET, '')
    .replace(/(isbn|ed):\S+/g, '')
    .replace(new RegExp(ISBN.source, 'gi'), '')
    .replace(new RegExp(',?\\s*' + EDITION.source, 'gi'), '')
    .replace(/[*_"“”]/g, '')
    .trim();
  const [title, author = ''] = s.split(/\s+by\s+/i);
  const lastName = author.split(/,|;|\s+and\s+|&/)[0].trim().split(/\s+/).at(-1) || '';
  const q = title.replace(/[,;:.\s]+$/, '').replace(/\s+/g, ' ').trim();
  return [q, lastName && `by:${lastName}`, ed && `ed:${ed}`, isbn && `isbn:${isbn}`].filter(Boolean).join(' ');
}

// "Psychology 2e (OpenStax). Recommended: Thinking, Fast and Slow by Daniel Kahneman" -> two queries.
// Parentheticals go first so a ';' inside "(any edition; chapters 1-3)" doesn't split a book; an ISBN or edition inside one is kept.
// "Readings: Ch. 1-3 for week one. Practice problems 2.4" is homework, not a book.
// ponytail: a book titled "Problems in Physics" is skipped too.
const splitBooks = (line) =>
  line
    .replace(/\(([^)]*)\)|\[([^\]]*)\]/g, (p) => [ISBN.test(p) && `isbn:${p.match(ISBN)[1].replace(/[\s-]/g, '')}`, EDITION.test(p) && `ed:${p.match(EDITION)[1]}`].filter(Boolean).map((t) => ` ${t} `).join(''))
    .split(/;|\b(?:recommended|optional|also(?:\s+useful)?|(?:free\s+)?alternatives?)\s*:/i)
    .filter((b) => !/\bch\.|\bchapters?\b|\bproblems?\b/i.test(b))
    .map(toQuery);

export function findTexts(text) {
  const out = [];
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(HEADING);
    if (!m) continue;
    const inline = m[1]?.trim();
    if (inline) out.push(...splitBooks(inline));
    // Collect the list under the heading until a blank line or the next heading.
    // After an inline "Required: X" only bullets count, so the deadline lines that follow aren't read as books.
    for (let j = i + 1; j < lines.length && lines[j].trim() && !/:\s*$/.test(lines[j]); j++) {
      if (inline && !BULLET.test(lines[j])) break;
      out.push(...splitBooks(lines[j]));
    }
  }
  return [...new Set(out.filter((q) => q.replace(/\s*\w+:\S+/g, '').length > 2))];
}

const FIELDS = 'title,author_name,first_publish_year,ebook_access,key,cover_i,editions,editions.publish_date,editions.ebook_access,editions.cover_i';

async function search(q) {
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&fields=${FIELDS}&limit=1`;
  const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
  if (!res.ok) throw new Error(`Open Library HTTP ${res.status}`);
  return (await res.json()).docs?.[0];
}

async function lookupOne(query) {
  const isbn = query.match(/isbn:(\S+)/)?.[1];
  const last = query.match(/by:(\S+)/)?.[1];
  const edition = Number(query.match(/ed:(\d+)/)?.[1]);
  const text = query.replace(/\s*(isbn|ed):\S+/g, '').replace('by:', '');
  // ISBN first: it pins the exact edition the syllabus asks for. Fall back to title + author.
  const doc = (isbn && (await search(`isbn:${isbn}`))) || (await search(text));
  // A match by someone else is a different book ("by Giancoli" matching Serway): say Not found instead.
  const fold = (s) => s.normalize('NFD').replace(/[^a-z]/gi, '').toLowerCase();
  if (!doc || (last && !doc.author_name?.some((a) => fold(a).includes(fold(last))))) {
    return { query: text, access: 'not_found', free: false, url: `https://openlibrary.org/search?q=${encodeURIComponent(text)}` };
  }
  // Only an ISBN search returns the matched edition here; a title search would give an arbitrary one.
  const ed = isbn ? doc.editions?.docs?.[0] : undefined;
  const workAccess = doc.ebook_access || 'no_ebook';
  const edAccess = ed?.ebook_access;
  const access = edAccess && FREE.has(edAccess) ? edAccess : workAccess;
  // The syllabus wants a much later edition (3rd+) but only the work as a whole is free here, i.e. an old library scan:
  // say "Older edition free" and don't count it. A 2nd edition is close enough to its 1st to count.
  // ponytail: edition number stands in for age; compare edition years if a 3rd edition turns out to be free.
  const older = FREE.has(access) && !(edAccess && FREE.has(edAccess)) && (edition >= 3 || (edAccess && !FREE.has(edAccess)));
  const cover = ed?.cover_i || doc.cover_i;
  return {
    query: text,
    title: doc.title,
    author: doc.author_name?.[0],
    year: Number(ed?.publish_date?.[0]?.match(/\d{4}/)?.[0]) || doc.first_publish_year,
    access, // public | borrowable | printdisabled | no_ebook | not_found
    free: FREE.has(access) && !older,
    label: older ? 'Older edition free' : undefined,
    coverUrl: cover ? `https://covers.openlibrary.org/b/id/${cover}-M.jpg` : undefined,
    url: `https://openlibrary.org${doc.key}`,
  };
}

// Parallel lookups. Throws only if every lookup failed (API down); single misses become access 'error'.
export async function lookupBooks(titles) {
  const results = await Promise.allSettled(titles.map(lookupOne));
  if (titles.length && results.every((r) => r.status === 'rejected')) {
    throw new Error(`Open Library unreachable: ${results[0].reason?.message || 'network error'}`);
  }
  return results.map((r, i) => (r.status === 'fulfilled' ? r.value : { query: titles[i].replace(/\s*(isbn|ed):\S+/g, '').replace('by:', ''), access: 'error', free: false }));
}
