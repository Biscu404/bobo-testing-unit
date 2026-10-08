/* The board, and nothing else: no drawing, no window, no clock.

   A board is flat arrays over c*r cells. On top of the plain rules there are
   four things the campaign's regions add, and they live here because they
   change what a legal move is, not just how it looks:
     thorn  a bramble: the first click only cuts it, the second opens the tile
     web    a webbed tile cannot be opened until a neighbour is
     fog    a spore cloud sits on an opened number; click it to clear it
     def    a larva that was stepped on and is gone: it hurt once and is spent
   `rev` holds the time a tile finishes opening (0 = hidden), so a cascade can
   open outward over a few frames. */
export function mk(c, r, m) {
  const n = c * r, a = v => new Array(n).fill(v);
  return { c, r, m, n, cells: a(0), mine: a(false), flag: a(false), rev: a(0),
           thorn: a(0), web: a(false), fog: a(false), def: a(false) };
}

export function each(b, i, fn) {
  const x = i % b.c, y = (i - x) / b.c;
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue;
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= b.c || ny >= b.r) continue;
      fn(ny * b.c + nx);
    }
  }
}

/* every cell within `rad` (1 = the 3x3, 2 = the 5x5) of i, i included */
export function around(b, i, rad) {
  const x = i % b.c, y = (i - x) / b.c, out = [];
  for (let dy = -rad; dy <= rad; dy++) {
    for (let dx = -rad; dx <= rad; dx++) {
      const nx = x + dx, ny = y + dy;
      if (nx >= 0 && ny >= 0 && nx < b.c && ny < b.r) out.push(ny * b.c + nx);
    }
  }
  return out;
}

/* mines go anywhere but under the first click and the ring round it; the
   region's modifier then decorates the rest. `rnd` is injectable so the
   check can replay a board. */
export function lay(b, safe, mod, rnd) {
  rnd = rnd || Math.random;
  const banned = {};
  banned[safe] = 1;
  each(b, safe, j => { banned[j] = 1; });
  let placed = 0, guard = 0;
  while (placed < b.m && guard++ < 200000) {
    const i = Math.floor(rnd() * b.n);
    if (b.mine[i] || banned[i]) continue;
    b.mine[i] = true; placed++;
  }
  for (let i = 0; i < b.n; i++) {
    let k = 0;
    each(b, i, j => { if (b.mine[j]) k++; });
    b.cells[i] = k;
  }
  /* `mod` is one rule or several ('web+cold', or the list): a tile is webbed (one in ten), else brambled (eleven in a hundred), never both */
  const ms = Array.isArray(mod) ? mod : typeof mod === 'string' ? mod.split('+') : [];
  const pW = ms.indexOf('web') >= 0 ? 0.1 : 0, pB = ms.indexOf('bramble') >= 0 ? 0.11 : 0;
  if (pW || pB) {
    for (let i = 0; i < b.n; i++) {
      if (banned[i]) continue;
      const r = rnd();
      if (r < pW) b.web[i] = true; else if (r < pW + pB) b.thorn[i] = 1;
    }
    if (pW) unweb(b);
  }
}

/* A webbed tile cannot be opened until a neighbour is, so a webbed safe tile that is walled in (by mines, or by other webbed tiles
   that are themselves walled in) could never be opened at all, and the room could never be won: the one real softlock of the
   board. Walk outward from every safe tile that is not webbed, taking in each webbed safe tile that touches one already taken,
   and cut the web off any that is never reached. A webbed mine is left as it is: nothing needs to open it. */
export function unweb(b) {
  const ok = new Array(b.n).fill(false), q = [];
  for (let i = 0; i < b.n; i++) if (!b.mine[i] && !b.web[i]) { ok[i] = true; q.push(i); }
  while (q.length) {
    const i = q.pop();
    each(b, i, j => { if (!ok[j] && !b.mine[j] && b.web[j]) { ok[j] = true; q.push(j); } });
  }
  for (let i = 0; i < b.n; i++) if (!b.mine[i] && b.web[i] && !ok[i]) b.web[i] = false;
}
/* the safe tiles that are hidden: how many, and whether every one of them is under a flag (a wrong one) */
export const underFlags = b => {
  let n = 0, f = 0;
  for (let i = 0; i < b.n; i++) if (!b.rev[i] && !b.mine[i]) { n++; if (b.flag[i]) f++; }
  return n > 0 && n === f;
};

export const hasOpenNeighbour = (b, i) => {
  let o = false;
  each(b, i, j => { if (b.rev[j]) o = true; });
  return o;
};
/* why a click on a hidden tile would do nothing: 'flag' | 'web' | null */
export function blocked(b, i) {
  if (b.rev[i]) return 'open';
  if (b.flag[i]) return 'flag';
  if (b.web[i] && !hasOpenNeighbour(b, i)) return 'web';
  return null;
}

/* the cascade: breadth-first from i, one ring per `step` ms. Mines are not
   opened here (the caller decides what a mine costs); returns what opened,
   in order. A tile that is a brambled or webbed target of a plain click is
   handled by the caller before this is reached. */
export function open(b, i, now, step) {
  const out = [];
  if (b.rev[i] || b.mine[i]) return out;
  const q = [i], depth = { [i]: 0 };
  let head = 0;
  while (head < q.length) {
    const cur = q[head++], d = depth[cur];
    b.rev[cur] = now + d * step;
    b.flag[cur] = false;
    b.thorn[cur] = 0;
    out.push(cur);
    if (b.cells[cur] !== 0) continue;
    each(b, cur, j => {
      if (b.rev[j] || b.mine[j] || depth[j] !== undefined) return;
      depth[j] = d + 1;
      q.push(j);
    });
  }
  return out;
}

/* a number that has exactly as many flags round it as it says opens the rest */
export function chordTargets(b, i) {
  if (!b.rev[i] || !b.cells[i] || b.fog[i]) return null;
  let f = 0;
  each(b, i, j => { if (b.flag[j] || b.def[j]) f++; });
  if (f !== b.cells[i]) return null;
  const t = [];
  each(b, i, j => { if (!b.flag[j] && !b.def[j] && !b.rev[j]) t.push(j); });
  return t;
}

export const hiddenSafe = b => {
  let n = 0;
  for (let i = 0; i < b.n; i++) if (!b.rev[i] && !b.mine[i]) n++;
  return n;
};
export const flagsUsed = b => b.flag.reduce((s, f) => s + (f ? 1 : 0), 0);
export const won = b => hiddenSafe(b) === 0;
