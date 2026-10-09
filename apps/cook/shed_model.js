/* THE BACKYARD PROJECT, the little puzzle in the Cook's shed (the owner's blueprint opens it), as pure data: no canvas, no clock, no dice, so Node can play every board to the end
   (node apps/cook/shed_check.js).

   You are somebody in a garden with a shed at the bottom of it, and the shed wants parts. The parts are lying about the street, or have to be bought off a van with the money you can scrape
   together, and the neighbours are at their windows and the tax man is on his rounds. One tile at a time:
     # hedge or fence   (nobody walks through it, nobody sees through it)         ~ the pond (nobody walks on it; everybody sees across it)
     . lawn             S the shed (safe: nobody sees you in it; a part is handed over there)
     p a part           $ a coin               V the van: a part for the price, if your hands are free      L the lemonade stall: wait there once and it pays a coin
     g a gnome          push it by walking into it; it only goes onto bare lawn; it stops a look
     N a neighbour      looks along a row or a column, as far as `range` and never through a hedge, a gnome or the shed, and turns by its own pattern (one letter a turn:
                        N E S W for the way it looks, - for not looking)
     the tax man        walks his round to the end and back, a step a turn, and mind the tiles next to him
   One rule, and it is the whole game: **you may not end a turn on a red tile.** Red is what a neighbour is looking along right now and the tiles next to the tax man where he stands. After
   you have moved (or waited) the world takes its turn: the neighbours turn to the next letter of their pattern, the tax man steps, and you go again. Nothing hides what is going to happen:
   `next(...)` says what will be red after this turn. Hands hold `carry` parts (one, to begin with): you pick a part up by walking on it, and you hand it over by walking onto the shed. */

export const DIRS = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] };
export const ACTIONS = ['N', 'E', 'S', 'W', 'wait'];
const gcd = (a, b) => (b ? gcd(b, a % b) : a), lcm = (a, b) => (a / gcd(a, b)) * b;

/* a board from its rows and the lists beside them (shed_levels.js) */
export function parse(level) {
  const rows = level.rows, h = rows.length, w = rows[0].length;
  const wd = { w, h, tiles: [], start: null, shed: null, van: null, stall: null, parts: [], coins: [], gnomes: [], neighbours: [], tax: level.tax || null,
               carry: level.carry || 1, price: level.price || 0, stock: level.stock || 0, level };
  const ns = level.neighbours || [];
  for (let y = 0; y < h; y++) {
    let line = '';
    for (let x = 0; x < w; x++) {
      const c = rows[y][x];
      if (c === '@') { wd.start = [x, y]; line += '.'; }
      else if (c === 'p') { wd.parts.push([x, y]); line += '.'; }
      else if (c === '$') { wd.coins.push([x, y]); line += '.'; }
      else if (c === 'g') { wd.gnomes.push([x, y]); line += '.'; }
      else if (c === 'N') { const n = ns[wd.neighbours.length] || { dirs: 'E' }; wd.neighbours.push({ x, y, dirs: n.dirs || 'E', range: n.range || 6, who: n.who || 0 }); line += '.'; }
      else { if (c === 'S') wd.shed = [x, y]; if (c === 'V') wd.van = [x, y]; if (c === 'L') wd.stall = [x, y]; line += c; }
    }
    wd.tiles.push(line);
  }
  /* the period of the whole street: everything is back where it was after this many turns */
  let P = 1;
  wd.neighbours.forEach(n => { P = lcm(P, n.dirs.length); });
  if (wd.tax && wd.tax.length > 1) P = lcm(P, 2 * (wd.tax.length - 1));
  wd.period = P;
  wd.need = wd.parts.length + wd.stock;                    /* every part on the ground and every one the van has */
  return wd;
}

export function fresh(wd) {
  return { x: wd.start[0], y: wd.start[1], held: 0, delivered: 0, coins: 0, parts: wd.parts.map(() => 1), cn: wd.coins.map(() => 1), van: wd.stock, stall: wd.stall ? 1 : 0,
           gn: wd.gnomes.map(g => g.slice()), t: 0, moves: 0 };
}
export const copy = s => ({ x: s.x, y: s.y, held: s.held, delivered: s.delivered, coins: s.coins, parts: s.parts.slice(), cn: s.cn.slice(), van: s.van, stall: s.stall, gn: s.gn.map(g => g.slice()), t: s.t, moves: s.moves });

export const inside = (wd, x, y) => x >= 0 && y >= 0 && x < wd.w && y < wd.h;
const tile = (wd, x, y) => (inside(wd, x, y) ? wd.tiles[y][x] : '#');
const sameXY = (a, b) => a[0] === b[0] && a[1] === b[1];
const gnomeAt = (s, x, y) => s.gn.findIndex(g => g[0] === x && g[1] === y);
const neighbourAt = (wd, x, y) => wd.neighbours.find(n => n.x === x && n.y === y) || null;

/* where the tax man is at turn t (he goes along the round and back again) */
export function taxAt(wd, t) {
  const p = wd.tax;
  if (!p || !p.length) return null;
  if (p.length === 1) return p[0];
  const n = p.length - 1, k = ((t % (2 * n)) + 2 * n) % (2 * n);
  return p[k <= n ? k : 2 * n - k];
}
/* which way neighbour `n` looks at turn t: 'N', 'E', 'S', 'W', or '-' */
export const facing = (n, t) => n.dirs[((t % n.dirs.length) + n.dirs.length) % n.dirs.length];

/* the tiles that are red at this moment, as a Set of 'x,y': what the neighbours are looking along (stopped by a hedge, a gnome, the shed or another neighbour) and the tiles about the tax man */
export function red(wd, s, t = s.t) {
  const out = new Set();
  wd.neighbours.forEach(n => {
    const f = facing(n, t);
    if (f === '-') return;
    const [dx, dy] = DIRS[f];
    for (let k = 1; k <= n.range; k++) {
      const x = n.x + dx * k, y = n.y + dy * k;
      if (!inside(wd, x, y)) break;
      const c = tile(wd, x, y);
      if (c === '#' || c === 'S' || gnomeAt(s, x, y) >= 0 || neighbourAt(wd, x, y)) break;
      out.add(x + ',' + y);
    }
  });
  const tx = taxAt(wd, t);
  if (tx) [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { const x = tx[0] + dx, y = tx[1] + dy; if (inside(wd, x, y) && tile(wd, x, y) !== 'S') out.add(x + ',' + y); });
  return out;
}
/* what will be red after the world's next turn, if nothing here changes it (the gnomes are where they are now) */
export const next = (wd, s) => red(wd, s, s.t + 1);

/* what is in the way of walking onto (x, y): the hedge, the pond, a neighbour, the tax man himself, the edge of the street */
const blockedFor = (wd, s, x, y) => {
  const c = tile(wd, x, y);
  if (c === '#' || c === '~') return true;
  if (neighbourAt(wd, x, y)) return true;
  const tx = taxAt(wd, s.t);
  return !!(tx && tx[0] === x && tx[1] === y);
};
/* a gnome may be pushed onto bare lawn: not onto a part, a coin, the van, the stall, the shed, a neighbour, the tax man's round or another gnome */
function gnomeCanGo(wd, s, x, y) {
  if (tile(wd, x, y) !== '.') return false;
  if (neighbourAt(wd, x, y) || gnomeAt(s, x, y) >= 0) return false;
  if (wd.parts.some((p, i) => s.parts[i] && sameXY(p, [x, y])) || wd.coins.some((c, i) => s.cn[i] && sameXY(c, [x, y]))) return false;
  if (wd.tax && wd.tax.some(p => sameXY(p, [x, y]))) return false;
  return !sameXY([s.x, s.y], [x, y]);
}

/* One turn. Returns { s: the new state, ev: what happened } or { s, ev: { blocked: true } } if nothing could happen (a hedge, a gnome that will not go: no turn is spent).
   ev: { moved, pushed, part, coin, bought, sold, delivered, won, dead: 'seen' | 'taxed' | null } */
export function step(wd, s0, action) {
  const s = copy(s0), ev = { moved: false, pushed: false, part: false, coin: false, bought: false, sold: false, delivered: 0, won: false, dead: null };
  if (action !== 'wait') {
    const [dx, dy] = DIRS[action], nx = s.x + dx, ny = s.y + dy;
    if (blockedFor(wd, s, nx, ny)) return { s: s0, ev: { blocked: true } };
    const gi = gnomeAt(s, nx, ny);
    if (gi >= 0) {
      const gx = nx + dx, gy = ny + dy;
      if (!gnomeCanGo(wd, s, gx, gy)) return { s: s0, ev: { blocked: true } };
      s.gn[gi] = [gx, gy]; ev.pushed = true;
    }
    s.x = nx; s.y = ny; ev.moved = true;
  }
  /* what is where you stand */
  const c = tile(wd, s.x, s.y);
  wd.coins.forEach((p, i) => { if (s.cn[i] && sameXY(p, [s.x, s.y])) { s.cn[i] = 0; s.coins++; ev.coin = true; } });
  wd.parts.forEach((p, i) => { if (s.parts[i] && s.held < wd.carry && sameXY(p, [s.x, s.y])) { s.parts[i] = 0; s.held++; ev.part = true; } });
  if (c === 'S' && s.held > 0) { s.delivered += s.held; ev.delivered = s.held; s.held = 0; }
  if (c === 'V' && s.van > 0 && s.held < wd.carry && s.coins >= wd.price) { s.coins -= wd.price; s.van--; s.held++; ev.bought = true; }
  if (c === 'L' && action === 'wait' && s.stall > 0) { s.stall = 0; s.coins++; ev.sold = true; }
  s.moves++;
  if (wd.need > 0 && s.delivered >= wd.need) { ev.won = true; return { s, ev }; }
  /* may you stand here? */
  if (c !== 'S') {
    const r = red(wd, s);
    if (r.has(s.x + ',' + s.y)) {
      const tx = taxAt(wd, s.t);
      ev.dead = tx && Math.abs(tx[0] - s.x) + Math.abs(tx[1] - s.y) <= 1 ? 'taxed' : 'seen';
      return { s, ev };
    }
  }
  s.t = (s.t + 1) % wd.period;
  return { s, ev };
}

/* a key for a state, for the solver (the turn counter is already modulo the period) */
export const keyOf = s => s.x + ',' + s.y + '|' + s.held + s.delivered + '|' + s.coins + s.van + s.stall + '|' + s.parts.join('') + s.cn.join('') + '|' + s.gn.map(g => g[0] + ',' + g[1]).join(';') + '|' + s.t;

/* The shortest way to win: breadth-first over the turns. Returns { moves, path: [actions] } or null if it cannot be done. `limit` caps the states looked at (a board that big is a bug). */
export function solve(wd, limit = 2000000) {
  const s0 = fresh(wd), seen = new Map(), q = [s0], par = new Map();
  seen.set(keyOf(s0), 0); par.set(keyOf(s0), null);
  let head = 0;
  while (head < q.length) {
    if (q.length > limit) return null;
    const s = q[head++], k0 = keyOf(s);
    for (const a of ACTIONS) {
      const { s: n, ev } = step(wd, s, a);
      if (ev.blocked || ev.dead) continue;
      if (ev.won) { const path = [a]; let k = k0; while (par.get(k)) { path.push(par.get(k)[1]); k = par.get(k)[0]; } return { moves: path.length, path: path.reverse(), states: q.length }; }
      const k = keyOf(n);
      if (seen.has(k)) continue;
      seen.set(k, 1); par.set(k, [k0, a]); q.push(n);
    }
  }
  return null;
}
/* how many states a board really has (to be sure a board is small enough for a person to be able to see through it) */
export function reachable(wd, limit = 2000000) {
  const s0 = fresh(wd), seen = new Set([keyOf(s0)]), q = [s0];
  let head = 0;
  while (head < q.length && q.length < limit) {
    const s = q[head++];
    for (const a of ACTIONS) { const { s: n, ev } = step(wd, s, a); if (ev.blocked || ev.dead || ev.won) continue; const k = keyOf(n); if (!seen.has(k)) { seen.add(k); q.push(n); } }
  }
  return q.length;
}
