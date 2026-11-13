// Find required texts in syllabus text and look them up live on Open Library (keyless, CORS *).

// A heading line like "Required texts:", "Textbook: X by Y", "Readings".
const HEADING = /^\s*(?:required|course|assigned)?\s*(?:texts?|textbooks?|books|readings?|reading list)\s*(?::\s*(.*))?$/i;
const BULLET = /^\s*(?:[-*•]|\d+[.)])\s+/;

// "Head First Java by Kathy Sierra and Bert Bates (2nd ed.)" -> "Head First Java Sierra"
function toQuery(line) {
  const s = line
    .replace(BULLET, '')
    .replace(/\([^)]*\)|\[[^\]]*\]/g, '')
    .replace(/ISBN[\s:-]*[\dXx-]+/g, '')
    .replace(/[*_"“”]/g, '')
    .trim();
  const [title, author = ''] = s.split(/\s+by\s+/i);
  const lastName = author.split(/,|;|\s+and\s+|&/)[0].trim().split(/\s+/).at(-1) || '';
  return `${title.replace(/[,;:.\s]+$/, '')} ${lastName}`.replace(/\s+/g, ' ').trim();
}

// "Psychology 2e (OpenStax). Recommended: Thinking, Fast and Slow by Daniel Kahneman" -> two queries.
// Parentheticals go first so a ';' inside "(any edition; chapters 1-3)" doesn't split a book.
const splitBooks = (line) =>
  line.replace(/\([^)]*\)|\[[^\]]*\]/g, '').split(/;|\b(?:recommended|optional|also)\s*:/i).map(toQuery);

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

const FIELDS = 'title,author_name,first_publish_year,ebook_access,key,cover_i';

async function lookupOne(query) {
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&fields=${FIELDS}&limit=1`;
  const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
  if (!res.ok) throw new Error(`Open Library HTTP ${res.status}`);
  const doc = (await res.json()).docs?.[0];
  if (!doc) return { query, access: 'not_found', free: false, url: `https://openlibrary.org/search?q=${encodeURIComponent(query)}` };
  const access = doc.ebook_access || 'no_ebook';
  return {
    query,
    title: doc.title,
    author: doc.author_name?.[0],
    year: doc.first_publish_year,
    access, // public | borrowable | printdisabled | no_ebook | not_found
    free: access === 'public' || access === 'borrowable',
    coverUrl: doc.cover_i ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg` : undefined,
    url: `https://openlibrary.org${doc.key}`,
  };
}

// Parallel lookups. Throws only if every lookup failed (API down); single misses become access 'error'.
export async function lookupBooks(titles) {
  const results = await Promise.allSettled(titles.map(lookupOne));
  if (titles.length && results.every((r) => r.status === 'rejected')) {
    throw new Error(`Open Library unreachable: ${results[0].reason?.message || 'network error'}`);
  }
  return results.map((r, i) => (r.status === 'fulfilled' ? r.value : { query: titles[i], access: 'error', free: false }));
}
