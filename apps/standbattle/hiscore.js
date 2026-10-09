/* The high-score table (spec 11.3): ten entries, three initials each, best first. Pure; the shell saves it through save.js. */
export const MAX_ENTRIES = 10;

export function sortTable(t) { return t.slice().sort((a, b) => b.score - a.score).slice(0, MAX_ENTRIES); }
export function rankOf(table, score) {
  const better = table.filter(e => e.score >= score).length;
  return better < MAX_ENTRIES ? better : -1;
}
export function qualifies(table, score) { return score > 0 && rankOf(table, score) >= 0; }
export function insert(table, entry) {
  const next = sortTable(table.concat([entry]));
  return { table: next, rank: next.indexOf(entry) };
}
export const cleanInitials = s => String(s || 'AAA').toUpperCase().replace(/[^A-Z0-9 ]/g, '').padEnd(3, 'A').slice(0, 3);
