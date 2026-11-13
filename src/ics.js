// Items {date: Date, course, type, title} -> RFC 5545 calendar with one all-day event per item.

const pad = (n) => String(n).padStart(2, '0');
const ymd = (d) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
const esc = (s) => String(s ?? '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

// Fold lines longer than 75 octets (UTF-8), continuation lines start with a space.
function fold(line) {
  const enc = new TextEncoder();
  const parts = [];
  let cur = '';
  for (const ch of line) {
    if (enc.encode(cur + ch).length > (parts.length ? 74 : 75)) { parts.push(cur); cur = ''; }
    cur += ch;
  }
  parts.push(cur);
  return parts.join('\r\n ');
}

export function toICS(items) {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Crunch Week//EN', 'CALSCALE:GREGORIAN', 'X-WR-CALNAME:Crunch Week'];
  items.forEach((it, i) => {
    const d = new Date(it.date);
    const next = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
    const summary = [it.course, it.title].filter(Boolean).join(': ');
    lines.push(
      'BEGIN:VEVENT',
      `UID:${ymd(d)}-${i}-${summary.replace(/[^A-Za-z0-9]/g, '').slice(0, 24)}@crunch-week`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${ymd(d)}`,
      `DTEND;VALUE=DATE:${ymd(next)}`,
      `SUMMARY:${esc(summary)}`,
      ...(it.type ? [`CATEGORIES:${esc(it.type)}`] : []),
      'TRANSP:TRANSPARENT',
      'END:VEVENT',
    );
  });
  lines.push('END:VCALENDAR');
  return lines.map(fold).join('\r\n') + '\r\n';
}
