/* Bekkedal — a day in somebody's life, on top of where they are meant to be.
 *
 * Pure, the way `schedule.js` (which it stands on) and `scene.js` are: a function of `(npc, day, minute, ctx)`, nothing
 * seeded, nothing saved, nothing written. `index.js`'s npcsHere() asks `lifeFor()` where `positionFor()` used to be asked.
 *
 * What it adds, in the order it is decided:
 *
 *   1. A festival is a festival: everybody is where the festival has them, and about.
 *   2. Asleep (life_data.js's BED): indoors, on no map. An NPC who is asleep is simply not in the list `npcsHere()` makes.
 *   3. Walking between two posts is `schedule.js`'s and is left alone.
 *   4. An errand: some days, for two or three stretches together, somebody walks off the map by its nearest way out, is
 *      gone, and comes back the same way. The way out is a station like any other, so nobody is ever anywhere they did not
 *      walk to. Shopkeepers never go. It is the way an hour is *not* available, and it is most hours that are.
 *   5. Chores: through the working day, in stretches of SLOT_MIN minutes, somebody is either at their post or at one of
 *      the stations near it, doing something with their hands. Between two they *walk*, over the same breadth-first path
 *      a change of post does, at the same two minutes a tile. Which stretch is which is a hash of the day, the person and
 *      the stretch, so a reload (or the same day in another year) puts everybody where they were.
 *
 * Only a post with no condition on it (no weather, no season, no story flag) gets chores and errands. A rainy day keeps
 * Astrid at her own door, and Håkon's pen on the farm is where he works, all day: those are somebody being somewhere on
 * purpose, and a chore on top would only be in the way of the reason.
 *
 * The answer is `{ map, x, y, walking, dir, act, sit, away }`. `away` is null, or 'asleep' or 'errand', in which case
 * `map` is null and there is nobody to draw or to talk to. `act` is a verb for the drawing (life_data.js's ACT_TOOL).
 */
import { positionFor, activePost, walkable, bfsPath, clampMin, DAY_MIN, MIN_PER_TILE, MAX_WALK_MIN } from './schedule.js';
import { isFestivalDay } from './seasons.js';
import { BEK_MAPS } from './data.js';
import { CHORES, BED, ERRANDS, CHORE_ODDS, SLOT_MIN } from './life_data.js';

/* a small, stable hash of a few things: the same arguments always give the same number */
export function hash(...parts) {
  let h = 2166136261 >>> 0;
  const s = parts.join('|');
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  h ^= h >>> 15; h = Math.imul(h, 2246822519) >>> 0; h ^= h >>> 13;
  return h >>> 0;
}

const inWindow = (m, from, to) => from === to ? false : from < to ? (m >= from && m < to) : (m >= from || m < to);
const dirOf = (dx, dy) => dy < 0 ? 1 : dy > 0 ? 0 : dx < 0 ? 2 : dx > 0 ? 3 : 0;

const paths = new Map();
function pathTo(map, a, b) {
  const key = map + ':' + a.x + ',' + a.y + '>' + b.x + ',' + b.y;
  let p = paths.get(key);
  if (p === undefined) { p = bfsPath(map, a.x, a.y, b.x, b.y) || [[a.x, a.y], [b.x, b.y]]; paths.set(key, p); }
  return p;
}

/* how far along a path somebody is `elapsed` minutes after setting out: the tile, and which way they face; or null if
   they have arrived */
function along(path, elapsed) {
  const total = Math.min(MAX_WALK_MIN, (path.length - 1) * MIN_PER_TILE);
  if (path.length <= 1 || total <= 0 || elapsed >= total) return null;
  const idx = Math.min(path.length - 1, Math.floor((elapsed / total) * path.length));
  const [x, y] = path[idx], [nx, ny] = path[Math.min(path.length - 1, idx + 1)];
  return { x, y, dir: dirOf(nx - x, ny - y) };
}
const walkMinutes = path => path.length <= 1 ? 0 : Math.min(MAX_WALK_MIN, (path.length - 1) * MIN_PER_TILE);

/* the way off a map that is nearest a tile: an exit (a seam, a stair) that can be walked to, else the door */
export function wayOut(map, from) {
  const m = BEK_MAPS[map];
  if (!m) return null;
  const cand = (m.exits || []).filter(e => walkable(map, e.x, e.y)).map(e => ({ x: e.x, y: e.y }));
  if (m.door && walkable(map, m.door.x, m.door.y + 1)) cand.push({ x: m.door.x, y: m.door.y + 1 });
  if (!cand.length) return null;
  cand.sort((a, b) => (Math.abs(a.x - from.x) + Math.abs(a.y - from.y)) - (Math.abs(b.x - from.x) + Math.abs(b.y - from.y)));
  return cand[0];
}

/* The stretches of the working day, each person's a little out of step with the next so the square is not one body. */
const shiftOf = npc => hash(npc.id, 'shift') % 37;
const slotsIn = post => Math.floor(((post.to > post.from ? post.to - post.from : post.to + DAY_MIN - post.from)) / SLOT_MIN);

/* Today's errand for somebody, or null: { k0, n }, the first stretch they are away and how many there are. An errand is a
   station like any other (the way out of the map), so the walk out begins where the last stretch left them, the walk back
   begins at the way out, and nobody is ever anywhere they did not walk to. */
export function errandOf(npc, day, post) {
  const e = ERRANDS[npc.id];
  if (!e || !e.odds || !post) return null;
  if (hash(npc.id, 'errand', day) % 100 >= e.odds) return null;
  const n = e.len[0] >= 200 || hash(npc.id, 'len', day) % 2 ? Math.ceil(e.len[1] / SLOT_MIN) : Math.max(2, Math.ceil(e.len[0] / SLOT_MIN));
  const slots = slotsIn(post), shift = shiftOf(npc), fit = [];
  for (let k = 1; k + n < slots; k++) {
    const start = post.from + shift + k * SLOT_MIN;
    if (start >= e.between[0] && start + n * SLOT_MIN <= Math.min(e.between[1] + 180, post.to - 30)) fit.push(k);
  }
  if (!fit.length) return null;
  return { k0: fit[hash(npc.id, 'out', day) % fit.length], n: Math.min(n, 3) };
}

/* the station of a stretch, or null for "at the post"; the way out when the stretch is part of an errand */
function stationOf(npc, day, post, k, stations, errand, exit) {
  if (k <= 0) return null;
  if (errand && exit && k >= errand.k0 && k < errand.k0 + errand.n) return exit;
  if (!stations) return null;
  const h = hash(npc.id, post.id, 'slot', day, k);
  return h % 100 < CHORE_ODDS ? stations[(h >>> 8) % stations.length] : null;
}

export function lifeFor(npc, day, minute, ctx) {
  const min = clampMin(minute);
  const base = positionFor(npc, day, min, ctx);
  const out = { map: base.map, x: base.x, y: base.y, walking: base.walking, dir: base.dir, act: null, sit: false, away: null };
  if (!npc.posts) return out;
  const post = activePost(npc, day, min, ctx);
  if (post.festival || isFestivalDay(day)) return out;

  const bed = BED[npc.id] || BED.default;
  if (inWindow(min, bed[0], bed[1])) { out.map = null; out.away = 'asleep'; return out; }

  if (base.walking) return out;
  const ordinary = !post.weather && !post.season && !post.flag && !post.festival;
  if (!ordinary || post.id === 'home') return out;

  const stations = CHORES[npc.id] && CHORES[npc.id][post.id];
  const postTile = { x: post.x, y: post.y };
  const errand = errandOf(npc, day, post);
  const way = errand ? wayOut(post.map, postTile) : null;
  const exit = way ? { id: 'out', x: way.x, y: way.y, exit: true } : null;
  if (!stations && !(errand && exit)) return out;

  const t = clampMin(min - post.from) - shiftOf(npc);
  if (t < 0) return out;
  const k = Math.floor(t / SLOT_MIN), into = t - k * SLOT_MIN;
  const cur = stationOf(npc, day, post, k, stations, errand, exit), prev = stationOf(npc, day, post, k - 1, stations, errand, exit);
  const at = cur || postTile, from = prev || postTile;
  if (at.x !== from.x || at.y !== from.y) {
    const path = pathTo(post.map, from, at), w = along(path, into);
    if (w) { out.x = w.x; out.y = w.y; out.dir = w.dir; out.walking = true; return out; }
  }
  if (cur && cur.exit) { out.map = null; out.away = 'errand'; return out; }       /* arrived at the way out, and gone through it */
  out.x = at.x; out.y = at.y;
  if (cur) { out.dir = cur.face; out.act = cur.act; }
  return out;
}
