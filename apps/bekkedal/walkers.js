/* Bekkedal — somebody crossing the ground in real time.
 *
 * `schedule.js` and `life.js` walk people by the *game* clock, which is the right clock for an NPC going about the day and
 * the wrong one for one who has seen you and is coming over: that has to take as long as it takes to cross the ground,
 * whatever the hour. This is that. Pure, like those two: a walker is plain data, `stepWalker()` moves it by `dt` seconds,
 * and nothing here knows about the canvas or `S`.
 *
 * A heart event used to begin by standing the player on a square of its own choosing and the cast on theirs, which is to
 * say that you were somewhere, and then you were somewhere else, and so was everyone. Now whoever has something to say
 * calls out from where they are if they are a long way off (the bubble is index.js's), and *walks* to you, at a run; when
 * they are beside you the box opens where you stand. When it is over they walk away again, to the place they were meant
 * to be, or off the map by the nearest way out if that is somewhere else.
 */
import { walkable, bfsPath } from './schedule.js';
import { BEK_MAPS } from './data.js';

export const RUN = 3.6;                    /* tiles a second: a brisk walk, quicker than the player's own gait */
export const MEET_R = 1.45;                /* close enough to talk, in tiles */

const dirOf = (dx, dy) => Math.abs(dx) >= Math.abs(dy) ? (dx < 0 ? 2 : 3) : (dy < 0 ? 1 : 0);

export function makeWalker(id, map, x, y) {
  return { id, map, x, y, tx: x, ty: y, path: [], i: 0, dir: 0, moving: false, done: true };
}

/* set off for a tile; false if there is no way there */
export function sendTo(w, tx, ty) {
  const fx = Math.round(w.x), fy = Math.round(w.y);
  const p = bfsPath(w.map, fx, fy, tx, ty);
  if (!p) return false;
  w.tx = tx; w.ty = ty; w.path = p; w.i = 0; w.done = p.length <= 1; w.moving = !w.done;
  return true;
}

/* move along the path by `dt` seconds at `speed` tiles a second */
export function stepWalker(w, dt, speed) {
  if (w.done) { w.moving = false; return w; }
  let left = (speed || RUN) * dt;
  while (left > 1e-6 && w.i < w.path.length - 1) {
    const [nx, ny] = w.path[w.i + 1];
    const dx = nx - w.x, dy = ny - w.y, d = Math.hypot(dx, dy);
    if (d < 1e-6) { w.i++; continue; }
    w.dir = dirOf(dx, dy);
    if (d <= left) { w.x = nx; w.y = ny; w.i++; left -= d; }
    else { w.x += dx / d * left; w.y += dy / d * left; left = 0; }
  }
  if (w.i >= w.path.length - 1) { w.done = true; w.moving = false; w.x = w.tx; w.y = w.ty; }
  return w;
}

export const distance = (w, x, y) => Math.hypot(w.x - x, w.y - y);

/* the free square beside a tile that is nearest `from`: where somebody stops to talk. `taken` is a set of 'x,y' not to use. */
export function beside(map, tx, ty, from, taken) {
  let best = null, bd = 1e9;
  for (const [dx, dy] of [[0, 1], [0, -1], [-1, 0], [1, 0], [1, 1], [-1, 1], [1, -1], [-1, -1]]) {
    const x = tx + dx, y = ty + dy;
    if (!walkable(map, x, y) || (taken && taken.has(x + ',' + y))) continue;
    const d = Math.abs(x - from.x) + Math.abs(y - from.y) + (dx && dy ? 2 : 0);
    if (d < bd) { bd = d; best = { x, y }; }
  }
  return best;
}

/* where somebody who is not on this map comes in from: their own front door if it stands here, else the way on to this map
   that is furthest from the player (so they are seen arriving), else any */
export function comesIn(map, home, player) {
  const m = BEK_MAPS[map];
  if (!m) return null;
  if (home && home.map === map && walkable(map, home.x, home.y)) return { x: home.x, y: home.y };
  const cand = (m.exits || []).filter(e => walkable(map, e.x, e.y)).map(e => ({ x: e.x, y: e.y }));
  if (m.door && walkable(map, m.door.x, m.door.y + 1)) cand.push({ x: m.door.x, y: m.door.y + 1 });
  if (!cand.length) return null;
  cand.sort((a, b) => (Math.abs(b.x - player.x) + Math.abs(b.y - player.y)) - (Math.abs(a.x - player.x) + Math.abs(a.y - player.y)));
  return cand[0];
}

/* the way off a map nearest a tile (for somebody who is going home to somewhere that is not here) */
export function nearestOut(map, from) {
  const m = BEK_MAPS[map];
  if (!m) return null;
  const cand = (m.exits || []).filter(e => walkable(map, e.x, e.y)).map(e => ({ x: e.x, y: e.y }));
  if (m.door && walkable(map, m.door.x, m.door.y + 1)) cand.push({ x: m.door.x, y: m.door.y + 1 });
  if (!cand.length) return null;
  cand.sort((a, b) => (Math.abs(a.x - from.x) + Math.abs(a.y - from.y)) - (Math.abs(b.x - from.x) + Math.abs(b.y - from.y)));
  return cand[0];
}

/* a call for a scene: deterministic, so a reload shouts the same thing */
export const callFor = (calls, id) => {
  let h = 0; for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return calls[h % calls.length];
};

/* how far is "a long way off", in tiles: past it somebody calls out before they come */
export const FAR = 5;
