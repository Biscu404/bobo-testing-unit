/* LINES: how the machine stands against the Charter's 100,000 lines. The counts are assets/lines.json, written by scripts/make-lines.mjs (run it before a release);
   the words are here, shared by the terminal and by Doc/Charter.DD's button. */
const commas = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
export const CHARTER = 100000;

/* rows of text for the report, or null when the counts cannot be read */
export async function lineReport() {
  let j = null;
  try { const r = await fetch('assets/lines.json'); if (r.ok) j = await r.json(); } catch (e) { j = null; }
  if (!j || !j.total) return null;
  const rows = ['THE CHARTER SAID 100,000 LINES FOR THE WHOLE SYSTEM.', '', '  WHAT THIS MACHINE IS MADE OF (JS, CSS, HTML; NOT ITS CHECKS)', ''];
  const top = j.areas.slice(0, 9);
  top.forEach(a => rows.push('  ' + a.name.toUpperCase().slice(0, 28).padEnd(29) + commas(a.lines).padStart(9) + ' lines  ' + commas(a.files).padStart(4) + ' files'));
  const rest = j.areas.slice(9);
  if (rest.length) rows.push('  ' + ('AND ' + rest.length + ' SMALLER ONES').padEnd(29) + commas(rest.reduce((a, x) => a + x.lines, 0)).padStart(9) + ' lines');
  rows.push('');
  rows.push('  THE MACHINE   ' + commas(j.total).padStart(11) + ' lines in ' + commas(j.files) + ' files');
  rows.push('  THE CHARTER   ' + commas(CHARTER).padStart(11) + ' lines');
  const over = j.total - CHARTER;
  rows.push(over > 0 ? '  OVER BY       ' + commas(over).padStart(11) + ' lines  (' + (j.total / CHARTER * 100).toFixed(0) + '% OF THE BUDGET)' : '  LEFT          ' + commas(-over).padStart(11) + ' lines');
  rows.push('');
  rows.push(over > 0 ? 'THE CHARTER WAS A DECISION ABOUT WHAT IS ALLOWED TO BE COMPLICATED.' : 'STILL INSIDE THE LIMIT.');
  rows.push(over > 0 ? 'THIS MACHINE HAS DECIDED OTHERWISE, REPEATEDLY.' : '');
  rows.push('FOR SCALE, ONE MODERN KERNEL IS ABOUT 30,000,000.');
  return rows;
}
