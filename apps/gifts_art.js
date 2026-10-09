/* Pictures that more than one app draws, made rather than drawn so they come at any size: the cookie Biscu gives (the credits tray, Magen's star when it is a cookie, the head of the
   Garden's COOKIEBLOOM). Grids of hex digits, the machine's sixteen colours: 0 black 6 brown E yellow, '.' clear. */
const memo = {};
/* a cookie of n x n pixels, bitten: a round of dough with a darker rim, a lighter top, five chips, and a bite out of the top right */
export function cookie(n) {
  if (memo[n]) return memo[n];
  const rows = [], c = n / 2, R = c - 0.5, inb = (x, y) => Math.hypot(x + 0.5 - n * 0.80, y + 0.5 - n * 0.22) < n * 0.2 || Math.hypot(x + 0.5 - n * 0.93, y + 0.5 - n * 0.45) < n * 0.11 || Math.hypot(x + 0.5 - n * 0.64, y + 0.5 - n * 0.06) < n * 0.1;
  const inside = (x, y) => x >= 0 && y >= 0 && x < n && y < n && Math.hypot(x + 0.5 - c, y + 0.5 - c) <= R && !inb(x, y);
  const chips = [[0.34, 0.34], [0.58, 0.55], [0.3, 0.64], [0.7, 0.72], [0.5, 0.2], [0.44, 0.82]].map(p => [Math.round(p[0] * n), Math.round(p[1] * n)]);
  const cs = n >= 16 ? 2 : 1;
  for (let y = 0; y < n; y++) {
    let r = '';
    for (let x = 0; x < n; x++) {
      if (!inside(x, y)) { r += '.'; continue; }
      const edge = !inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1) || !inside(x, y + 1);
      if (edge) { r += '0'; continue; }
      if (chips.some(p => x >= p[0] && x < p[0] + cs && y >= p[1] && y < p[1] + cs)) { r += '0'; continue; }
      const d = Math.hypot(x + 0.5 - c * 0.85, y + 0.5 - c * 0.8);
      const rim = !inside(x - 2, y) || !inside(x + 2, y) || !inside(x, y - 2) || !inside(x, y + 2);
      r += rim ? '6' : (d < R * 0.55 && (x + y) % 2 === 0) ? 'E' : '6';
    }
    rows.push(r);
  }
  return (memo[n] = rows);
}


/* the runs of one colour along each row of a grid, as [x, y, length, digit]: what a drawing routine that can only fill rectangles wants */
export function runsOf(rows) {
  const out = [];
  rows.forEach((row, j) => { let i = 0; while (i < row.length) { const ch = row[i]; if (ch === '.') { i++; continue; } let k = i + 1; while (k < row.length && row[k] === ch) k++; out.push([i, j, k - i, parseInt(ch, 16)]); i = k; } });
  return out;
}
