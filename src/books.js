// Find required texts in syllabus text and look them up live on Open Library (keyless, CORS *).

// A heading line like "Required texts:", "Required:", "Textbook: X by Y", "Readings".
const HEADING = /^\s*(?:required(?:\s+(?:texts?|textbooks?|books|readings?|materials))?|(?:course|assigned)\s+(?:texts?|textbooks?|books|readings?|materials)|texts?|textbooks?|books|readings?|reading list)\s*(?::\s*(.*))?$/i;
const BULLET = /^\s*(?:[-*•]|\d+[.)])\s+/;
const ISBN = /ISBN(?:-1[03])?[\s:]*([\dXx][\d\s-]{8,16}[\dXx])/i;
const FREE = new Set(['public', 'borrowable']);

// "Calculus, 8th ed. by James Stewart isbn:9781285741550" -> "Calculus Stewart isbn:9781285741550"
function toQuery(line) {
  const isbn = line.match(/isbn:(\S+)/)?.[1] || line.match(ISBN)?.[1].replace(/[\s-]/g, '');
  const s = line
    .replace(BULLET, '')
    .replace(/isbn:\S+/g, '')
    .replace(new RegExp(ISBN.source, 'gi'), '')
    .replace(/,?\s*\b\d+(?:st|nd|rd|th)\s+ed(?:ition)?\b\.?/gi, '')
    .replace(/[*_"“”]/g, '')
    .trim();
  const [title, author = ''] = s.split(/\s+by\s+/i);
  const lastName = author.split(/,|;|\s+and\s+|&/)[0].trim().split(/\s+/).at(-1) || '';
  const q = `${title.replace(/[,;:.\s]+$/, '')} ${lastName}`.replace(/\s+/g, ' ').trim();
  return isbn && q ? `${q} isbn:${isbn}` : q;
}

// "Psychology 2e (OpenStax). Recommended: Thinking, Fast and Slow by Daniel Kahneman" -> two queries.
// Parentheticals go first so a ';' inside "(any edition; chapters 1-3)" doesn't split a book; an ISBN inside one is kept.
const splitBooks = (line) =>
  line
    .replace(/\(([^)]*)\)|\[([^\]]*)\]/g, (p) => (ISBN.test(p) ? ` isbn:${p.match(ISBN)[1].replace(/[\s-]/g, '')} ` : ''))
    .split(/;|\b(?:recommended|optional|also|(?:free\s+)?alternatives?)\s*:/i)
    .map(toQuery);

export function findTexts(text) {
  const out = [];
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(HEADING);
    if (!m) continue;
    if (m[1]?.trim()) out.push(...splitBooks(m[1]));
    // Collect the list under the heading until a blank line or the next heading.
    for (let j = i + 1; j < lines.length && lines[j].trim() && !/:\s*$/.test(lines[j]); j++) {
      out.push(...splitBooks(lines[j]));
    }
  }
  return [...new Set(out.filter((q) => q.length > 2))];
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
  const text = query.replace(/\s*isbn:\S+/, '');
  // ISBN first: it pins the exact edition the syllabus asks for. Fall back to title + author.
  const doc = (isbn && (await search(`isbn:${isbn}`))) || (await search(text));
  if (!doc) return { query: text, access: 'not_found', free: false, url: `https://openlibrary.org/search?q=${encodeURIComponent(text)}` };
  // Only an ISBN search returns the matched edition here; a title search would give an arbitrary one.
  const ed = isbn ? doc.editions?.docs?.[0] : undefined;
  const workAccess = doc.ebook_access || 'no_ebook';
  const edAccess = ed?.ebook_access;
  const access = edAccess && FREE.has(edAccess) ? edAccess : workAccess;
  const cover = ed?.cover_i || doc.cover_i;
  return {
    query: text,
    title: doc.title,
    author: doc.author_name?.[0],
    year: Number(ed?.publish_date?.[0]?.match(/\d{4}/)?.[0]) || doc.first_publish_year,
    access, // public | borrowable | printdisabled | no_ebook | not_found
    free: FREE.has(access),
    // The exact edition isn't free but another edition of the same book is: say so instead of overclaiming.
    label: edAccess && !FREE.has(edAccess) && FREE.has(workAccess) ? 'Older edition free' : undefined,
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
  return results.map((r, i) => (r.status === 'fulfilled' ? r.value : { query: titles[i].replace(/\s*isbn:\S+/, ''), access: 'error', free: false }));
}
