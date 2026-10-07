/* Bekkedal — getting from a post on one map to a post on another, on foot.
 *
 * `schedule.js` answers "where is somebody at this hour" and, when two posts are on different maps (a festival on the square, Håkon's
 * pen on the farm, Sigrid's winter shop), answers it with a jump: at the very minute the second post opens they are standing at it.
 * That is two maps' worth of road with nobody on it. This is the road.
 *
 * A trip is the route between two posts as a list of tiles, each on its own map: the walk to the nearest way off the map towards the
 * destination, the tile it arrives on across the seam, the walk to the next way off, and so on, and the last walk to the post. A seam
 * is one step like any other, which is what makes it look right to whoever is standing on either side of it: the walker goes up to the
 * edge, is gone, and is already walking on the other map.
 *
 * When it happens is decided by what the posts are. A trip *into* a post with a condition on it (a festival, a story flag, a season, a
 * weather) is made to arrive on the minute that post opens, so it begins earlier; a trip *out of* one begins on the minute it closes,
 * so a festival is not cut short for the people who live far off. Either is squeezed, never stretched past a walk, to fit inside the
 * hours somebody is up (never within `WAKE_MARGIN` of waking, or `BED_MARGIN` of bed).
 *
 * Pure: `tripPlan(from, to)` is a function of two posts, and `tripAt(...)` of a day and a minute. Nothing is saved.
 */
import { BEK_MAPS } from './data.js';
import { activePost, kindOf, bfsPath, walkable, clampMin, MIN_PER_TILE } from './schedule.js';

export const WAKE_MARGIN = 55, BED_MARGIN = 55;
/* no trip is longer than this on the clock: past it a walk is squeezed to a brisker pace (and never past FASTEST) */
export const LONGEST = 85;
/* the fastest a trip may be squeezed to, in minutes a tile: past this somebody would be running */
export const FASTEST = MIN_PER_TILE / 2;

/* the way off `map` that leads towards `goal` (a map id): breadth-first over the seams, not over the tiles */
export function routeMaps(from, goal) {
  if (from === goal) return [];
  const prev = new Map([[from, null]]);
  let front = [from];
  while (front.length) {
    const next = [];
    for (const m of front) {
      for (const e of (BEK_MAPS[m].exits || [])) {
        if (prev.has(e.to) || !BEK_MAPS[e.to] || !walkable(m, e.x, e.y)) continue;
        prev.set(e.to, { from: m, exit: e }); next.push(e.to);
        if (e.to === goal) {
          const hops = []; let cur = goal;
          while (prev.get(cur)) { const h = prev.get(cur); hops.unshift({ map: h.from, exit: h.exit }); cur = h.from; }
          return hops;
        }
      }
    }
    front = next;
  }
  return null;
}

const plans = new Map();
/* every tile of the walk, `{ map, x, y }` in order, from a tile `{ map, x, y }` to a post; null when no road joins the two maps */
export function tripPlan(from, to) {
  const key = from.map + ':' + from.x + ',' + from.y + '>' + to.map + ':' + to.x + ',' + to.y;
  if (plans.has(key)) return plans.get(key);
  const hops = routeMaps(from.map, to.map);
  let tiles = null;
  if (hops && hops.length) {
    tiles = []; let at = { x: from.x, y: from.y };
    for (const h of hops) {
      const p = bfsPath(h.map, at.x, at.y, h.exit.x, h.exit.y) || [[at.x, at.y], [h.exit.x, h.exit.y]];
      p.forEach(([x, y]) => tiles.push({ map: h.map, x: x, y: y }));
      at = { x: h.exit.tx, y: h.exit.ty };
    }
    const p = bfsPath(to.map, at.x, at.y, to.x, to.y) || [[at.x, at.y], [to.x, to.y]];
    p.forEach(([x, y]) => tiles.push({ map: to.map, x: x, y: y }));
  }
  plans.set(key, tiles);
  return tiles;
}

/* the minutes at which each of a person's posts opens or closes: the only moments the active post can change */
const edgesCache = new Map();
export function edgesOf(npc) {
  let e = edgesCache.get(npc.id);
  if (!e) { const s = new Set(); npc.posts.forEach(p => { s.add(clampMin(p.from)); s.add(clampMin(p.to)); }); e = [...s].sort((a, b) => a - b); edgesCache.set(npc.id, e); }
  return e;
}

/* The trip somebody is on at `min`, or null: `{ map, x, y, dir, walking }`. `bed` is their [from, to] sleeping hours, and
   `startAt(minute)` where they would be at that minute if there were no trip (a tile on some map, or null): a trip into a post
   begins from wherever they happen to be standing when it does, so nobody jumps back to their post to set out. */
export function tripAt(npc, day, min, ctx, bed, startAt) {
  if (!npc.posts) return null;
  const awakeFrom = (bed[1] % 1440) + WAKE_MARGIN, awakeTo = (bed[0] > bed[1] ? bed[0] : 1440) - BED_MARGIN;
  for (const b of edgesOf(npc)) {
    const P = activePost(npc, day, clampMin(b - 1), ctx), Q = activePost(npc, day, b, ctx);
    if (P === Q || P.map === Q.map) continue;
    let tiles = tripPlan(P, Q);
    if (!tiles) continue;
    const out = !!kindOf(P);                                  /* out of an override: begin as it closes */
    const approx = tiles.length - 1;
    const want = Math.min(LONGEST, approx * MIN_PER_TILE), least = approx * FASTEST;
    let t0, t1;
    if (out) {                                                  /* ...and somebody who lives too far to be home by bed leaves early */
      const room = awakeTo - b, dur = room >= want ? want : Math.max(least, room);
      t0 = Math.min(b, awakeTo - dur); t1 = t0 + dur;
    }
    else { t1 = b; t0 = Math.min(t1 - least, Math.max(b - want, awakeFrom)); }
    /* somebody who set out early is home before the post that sends them there has even closed: they wait there */
    if (out && min >= t1 && min < b) { const e = tiles[tiles.length - 1]; return { map: e.map, x: e.x, y: e.y, dir: 0, walking: false }; }
    if (min < t0 || min >= t1) continue;
    if (!out && startAt) { const s = startAt(clampMin(t0)); if (s && s.map === P.map && (s.x !== P.x || s.y !== P.y)) tiles = tripPlan(s, Q) || tiles; }
    const steps = tiles.length - 1;
    const i = Math.min(steps, Math.floor(((min - t0) / (t1 - t0)) * (steps + 1)));
    const t = tiles[i], n = tiles[Math.min(steps, i + 1)];
    const dx = n.map === t.map ? n.x - t.x : 0, dy = n.map === t.map ? n.y - t.y : 0;
    let dir = dy < 0 ? 1 : dy > 0 ? 0 : dx < 0 ? 2 : dx > 0 ? 3 : null;
    if (dir == null) { const o = tiles[Math.max(0, i - 1)]; dir = o.map === t.map ? (t.y < o.y ? 1 : t.y > o.y ? 0 : t.x < o.x ? 2 : 3) : 0; }
    return { map: t.map, x: t.x, y: t.y, dir: dir, walking: true };
  }
  return null;
}
