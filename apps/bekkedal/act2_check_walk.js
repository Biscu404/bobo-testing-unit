/* Bekkedal — the valley as distances, for the balance pass.
 *
 * A sibling of `act2_check.js` for the 300-line rule, the way
 * `mine_check_ore.js` is one of `mine_check.js` — one check, still one
 * command. What lives here is the half of the balance argument that is
 * geometry rather than price: how far it is to the wood, how far apart two
 * birches are once you have to walk between them, and how many minutes of a
 * 1200-minute day that costs.
 *
 * This is the part of the economy that changed without any number changing.
 * The nine outdoor maps went to three and four times the ground they used to
 * be, and a day is a fixed 06:00-to-02:00; so an activity's real price is its
 * energy *and* the walk it is spread over, and an energy budget that ignores
 * the walk is measuring a game that no longer exists. Every figure below is
 * derived from `BEK_MAPS`' own rows and `maps.js`'s own seams at `BEK_STEP_S`
 * * `BEK_CLOCK_MIN_PER_S` minutes a tile — nothing is authored here, and the
 * tile rate itself was checked against the real frame loop by walking it
 * (`scripts/bekkedal_playtest.mjs`).
 */
import { BEK_MAPS, BEK_SOLID, BEK_STEP_S, BEK_CLOCK_MIN_PER_S } from './data.js';
import { swingLen } from './fx.js';

/* in-game minutes per tile walked, and per swing of a tool */
export const TILE_MIN = BEK_STEP_S * BEK_CLOCK_MIN_PER_S;
export const swingMin = kind => swingLen(kind) * BEK_CLOCK_MIN_PER_S;

const rowsOf = m => (BEK_MAPS[m] && BEK_MAPS[m].rows) || null;
export function walkable(m, x, y) {
  const r = rowsOf(m);
  return !!r && y >= 0 && y < r.length && x >= 0 && x < r[y].length && BEK_SOLID.indexOf(r[y][x]) < 0;
}
const DIRS = [[0, 1], [0, -1], [-1, 0], [1, 0]];
const exitAt = (m, x, y) => (BEK_MAPS[m].exits || []).filter(e => e.x === x && e.y === y)[0];

/* ---- across the valley ----------------------------------------------------
   Breadth-first over squares *and* seams, so farm-to-mine is one distance
   rather than four legs added up by hand. Gates (`need`) are ignored on
   purpose: this answers "how far", and whether the player may go yet is the
   simulation's question, not the map's. */
export function tilesBetween(from, to) {
  const key = p => p.m + ':' + p.x + ',' + p.y;
  const seen = new Set([key(from)]);
  let front = [{ at: from, d: 0 }];
  for (let i = 0; i < 8000 && front.length; i++) {
    const next = [];
    for (const nd of front) {
      if (nd.at.m === to.m && nd.at.x === to.x && nd.at.y === to.y) return nd.d;
      for (const [dx, dy] of DIRS) {
        const nx = nd.at.x + dx, ny = nd.at.y + dy;
        const ex = exitAt(nd.at.m, nx, ny);
        const at = ex ? { m: ex.to, x: ex.tx, y: ex.ty } : { m: nd.at.m, x: nx, y: ny };
        if (!ex && !walkable(at.m, at.x, at.y)) continue;
        const k = key(at);
        if (seen.has(k)) continue;
        seen.add(k);
        next.push({ at: at, d: nd.d + 1 });
      }
    }
    front = next;
  }
  return null;
}
export const minsBetween = (a, b) => {
  const t = tilesBetween(a, b);
  return t == null ? null : t * TILE_MIN;
};

/* ---- around one map -------------------------------------------------------
   Every square you can stand on to work a `glyphs` tile, visited nearest
   first from where you came in. A greedy tour is not the shortest one, but it
   is what a player walking a field of birches actually does, and it is the
   same answer every run, which is what a check needs. */
function standSquares(m, glyphs) {
  const r = rowsOf(m), out = [];
  for (let y = 0; y < r.length; y++) for (let x = 0; x < r[y].length; x++) {
    if (glyphs.indexOf(r[y][x]) < 0) continue;
    for (const [dx, dy] of DIRS) if (walkable(m, x + dx, y + dy)) { out.push({ x: x + dx, y: y + dy }); break; }
  }
  return out;
}
function floodFrom(rows, from) {
  const W = rows[0].length, H = rows.length;
  const d = new Int32Array(W * H).fill(-1);
  d[from.y * W + from.x] = 0;
  let q = [from];
  while (q.length) {
    const n = [];
    for (const p of q) {
      const b = d[p.y * W + p.x];
      for (const [dx, dy] of DIRS) {
        const nx = p.x + dx, ny = p.y + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= rows.length) continue;
        if (BEK_SOLID.indexOf(rows[ny][nx]) >= 0 || d[ny * W + nx] >= 0) continue;
        d[ny * W + nx] = b + 1;
        n.push({ x: nx, y: ny });
      }
    }
    q = n;
  }
  return { d: d, W: W };
}
/* how many of a thing there are on a map, and how far apart they are in
   practice — `{ n, tiles, perTile }`, the last being the figure the rate
   table multiplies by TILE_MIN. `rows` may be handed in directly so a
   generated mine floor can be measured with the same function. */
export function tourOf(mapOrRows, glyphs, start) {
  const rows = Array.isArray(mapOrRows) ? mapOrRows : rowsOf(mapOrRows);
  const left = Array.isArray(mapOrRows)
    ? standSquaresIn(rows, glyphs)
    : standSquares(mapOrRows, glyphs);
  if (!left.length) return { n: 0, tiles: 0, perTile: 0 };
  let cur = start, total = 0, n = 0, rest = left.slice();
  while (rest.length) {
    const { d, W } = floodFrom(rows, cur);
    let best = -1, bd = Infinity;
    for (let i = 0; i < rest.length; i++) {
      const dd = d[rest[i].y * W + rest[i].x];
      if (dd >= 0 && dd < bd) { bd = dd; best = i; }
    }
    if (best < 0) break;                      /* walled off from here */
    total += bd; cur = rest[best]; rest.splice(best, 1); n++;
  }
  return { n: n, tiles: total, perTile: n ? total / n : 0 };
}
function standSquaresIn(rows, glyphs) {
  const out = [];
  for (let y = 0; y < rows.length; y++) for (let x = 0; x < rows[y].length; x++) {
    if (glyphs.indexOf(rows[y][x]) < 0) continue;
    for (const [dx, dy] of DIRS) {
      const nx = x + dx, ny = y + dy;
      if (ny < 0 || nx < 0 || ny >= rows.length || nx >= rows[ny].length) continue;
      if (BEK_SOLID.indexOf(rows[ny][nx]) < 0) { out.push({ x: nx, y: ny }); break; }
    }
  }
  return out;
}
