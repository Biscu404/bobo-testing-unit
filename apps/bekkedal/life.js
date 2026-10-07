/* Bekkedal — a day in somebody's life, on top of where they are meant to be.
 *
 * Pure, the way `schedule.js` (which it stands on) and `scene.js` are: a function of `(npc, day, minute, ctx)`, nothing
 * seeded, nothing saved, nothing written. `index.js`'s npcsHere() asks `lifeFor()` where `positionFor()` used to be asked.
 *
 * What it adds, in the order it is decided:
 *
 *   1. A festival is a festival: everybody is where the festival has them, and about.
 *   2. Asleep (life_data.js's BED): indoors, on no map. An NPC who is asleep is simply not in the list `npcsHere()` makes.
 *      Nobody pops out of the world to get there: for the half hour before, they walk to their door and go in by it (`enter`, 0 to
 *      1, is how far through the doorway they are; somebody with no building on their map goes the way a trip off the map goes),
 *      and in the morning they come out of it and walk to wherever the clock has them. See `bedWalk()`.
 *   2b. A post on another map (a festival, a pen, a winter shop) is a walk there and back through the seams: `trips.js`.
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
import { BEK_MAPS, BEK_NPCS } from './data.js';
import { CHORES, BED, ERRANDS, CHORE_ODDS, SLOT_MIN, WANDER_ODDS, WANDER_REACH, HOMES, DOOR_MIN, TRIP_CAP_MIN } from './life_data.js';
import { tripAt, edgesOf } from './trips.js';

/* a small, stable hash of a few things: the same arguments always give the same number */
export function hash(...parts) {
  let h = 2166136261 >>> 0;
  const s = parts.join('|');
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  h ^= h >>> 15; h = Math.imul(h, 2246822519) >>> 0; h ^= h >>> 13;
  return h >>> 0;
}

const inWindow = (m, from, to) => from === to ? false : from < to ? (m >= from && m < to) : (m >= from || m < to);
export const dirOf = (dx, dy) => dy < 0 ? 1 : dy > 0 ? 0 : dx < 0 ? 2 : dx > 0 ? 3 : 0;

const paths = new Map();
function pathTo(map, a, b) {
  const key = map + ':' + a.x + ',' + a.y + '>' + b.x + ',' + b.y;
  let p = paths.get(key);
  if (p === undefined) { p = bfsPath(map, a.x, a.y, b.x, b.y) || [[a.x, a.y], [b.x, b.y]]; paths.set(key, p); }
  return p;
}

/* how far along a path somebody is `elapsed` minutes after setting out: the tile, and which way they face; or null if
   they have arrived */
function along(path, elapsed, cap) {
  const total = Math.min(cap || MAX_WALK_MIN, (path.length - 1) * MIN_PER_TILE);
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

/* the latest moment in the last WALK_WINDOW minutes at which the active post changed to another post on the same map: `{ b, d }`, d minutes ago */
const WALK_WINDOW = TRIP_CAP_MIN + 1;
function recentChange(npc, day, min, ctx) {
  let best = null;
  for (const b of edgesOf(npc)) {
    const d = clampMin(min - b);
    if (d >= WALK_WINDOW || (best && d >= best.d)) continue;
    const P = activePost(npc, day, clampMin(b - 1), ctx), Q = activePost(npc, day, b, ctx);
    if (P !== Q && P.map === Q.map) best = { b: b, d: d };
  }
  return best;
}

/* the station of a stretch, or null for "at the post"; the way out when the stretch is part of an errand */
function stationOf(npc, day, post, k, stations, errand, exit) {
  if (k <= 0) return null;
  if (errand && exit && k >= errand.k0 && k < errand.k0 + errand.n) return exit;
  const h = hash(npc.id, post.id, 'slot', day, k);
  if (stations && stations.length && h % 100 < CHORE_ODDS) return stations[(h >>> 8) % stations.length];
  /* not at a chore: some stretches they stroll a little way off and look about, and the rest they are where their post is */
  if (hash(npc.id, post.id, 'wander', day, k) % 100 < WANDER_ODDS) {
    const w = wanderTiles(npc.id, post.map, post);
    if (w.length) return w[hash(npc.id, post.id, 'where', day, k) % w.length];
  }
  return null;
}


/* when somebody goes to bed: their own hour, and on the night of a festival (which ends at 22:00 in the square, a long walk from most of
   the valley) no earlier than the walk home takes. The hour they get up is their own. */
export const FESTIVAL_BED = 23 * 60 + 20;
export const bedOf = (npc, day) => { const b = BED[npc.id] || BED.default; return isFestivalDay(day) && b[0] > b[1] ? [Math.max(b[0], FESTIVAL_BED), b[1]] : b; };

/* ---- the door ------------------------------------------------------------------------------------------------------------
   Where somebody goes in to sleep: the tile in front of their door and the door's own tile, or (no building on this map) the nearest
   way off it. Worked out from the map's own `D` glyphs and the walk to the tile in front, so it can never be a tile nobody can reach. */
const doors = new Map();
export function bedDoor(npc, map, from) {
  const key = npc.id + ':' + map;
  let d = doors.get(key);
  if (d === undefined) {
    const h = HOMES[npc.id] && HOMES[npc.id][map];
    if (h && walkable(map, h.x, h.y + 1)) d = { kind: 'door', x: h.x, y: h.y + 1, door: { x: h.x, y: h.y } };
    else { const w = wayOut(map, from); d = w ? { kind: 'way', x: w.x, y: w.y } : null; }
    doors.set(key, d);
  }
  return d;
}

/* The walk to bed and the walk out of it, as { start, end, path, door, ... }: the in-walk is [bed0 - walk - DOOR_MIN, bed0), the walk
   out [bed1, bed1 + DOOR_MIN + walk). Both are the same walk (the way out is the way in, reversed) between the tile they were
   standing on (or will be) and the door. */
function bedWalk(npc, day, ctx, bed) {
  const near = positionFor(npc, day, clampMin(bed[0] - 1), ctx), dawn = positionFor(npc, day, clampMin(bed[1] + 60), ctx);
  if (!near.map || near.map !== dawn.map) return null;
  const door = bedDoor(npc, near.map, near);
  if (!door) return null;
  const to = pathTo(near.map, near, door), fro = pathTo(near.map, door, dawn);
  const cap = p => p.length <= 1 ? 0 : Math.min(TRIP_CAP_MIN, (p.length - 1) * MIN_PER_TILE);
  const fade = door.kind === 'door' ? DOOR_MIN : 0;
  return { map: near.map, door: door, to: to, fro: fro, inMin: cap(to), outMin: cap(fro), fade: fade, bed: bed };
}
const bedWalks = new Map();
const bedWalkOf = (npc, day, ctx, bed) => {
  const k = npc.id + '|' + day + '|' + (ctx && ctx.weather) + '|' + (ctx && ctx.flag && ctx.flag.barn ? 1 : 0) + (ctx && ctx.act2Unlocked ? 1 : 0);
  let w = bedWalks.get(k);
  if (w === undefined) { w = bedWalk(npc, day, ctx, bed); if (bedWalks.size > 4000) bedWalks.clear(); bedWalks.set(k, w); }
  return w;
};
/* where the walk to bed or out of it has somebody at `min` (a minute of the day), or null if it is not on */
function atBed(npc, day, min, ctx, bed, out) {
  const w = bedWalkOf(npc, day, ctx, bed);
  if (!w) return null;
  const mapOf = (x, y, dir, enter) => { out.map = w.map; out.x = x; out.y = y; out.dir = dir; out.walking = enter == null; if (enter != null) { out.enter = enter; out.doorAt = w.door.door; } return out; };
  /* going in */
  const t0 = bed[0] - w.inMin - w.fade, e = min - t0;
  if (min < bed[0] && e >= 0) {
    if (e < w.inMin) { const i = Math.min(w.to.length - 1, Math.floor((e / w.inMin) * w.to.length)), [x, y] = w.to[i], [nx, ny] = w.to[Math.min(w.to.length - 1, i + 1)]; return mapOf(x, y, dirOf(nx - x, ny - y), null); }
    if (w.fade) return mapOf(w.door.x, w.door.y, 1, Math.min(1, (e - w.inMin) / w.fade));
    return null;
  }
  /* coming out */
  const m = clampMin(min), f = m - clampMin(bed[1]);
  if (f >= 0 && f < w.fade + w.outMin) {
    if (f < w.fade) return mapOf(w.door.x, w.door.y, 1, 1 - f / w.fade);
    const g = f - w.fade, i = Math.min(w.fro.length - 1, Math.floor((g / Math.max(1, w.outMin)) * w.fro.length)), [x, y] = w.fro[i], [nx, ny] = w.fro[Math.min(w.fro.length - 1, i + 1)];
    return mapOf(x, y, dirOf(nx - x, ny - y), null);
  }
  return null;
}

/* ---- wandering -----------------------------------------------------------------------------------------------------------
   The tiles a person might stroll to from their post: reachable in a few steps, not the post itself, and not a station. */
const wanders = new Map();
/* Every tile somebody stands on by right on this map (a post, a station), and who is nearest to a tile: a stroll never goes to a square
   another person keeps, nor to one that is nearer to another person's post than to the stroller's own. Which is why two people never
   walk to the same place by chance. */
function claims(map) {
  const out = [];
  BEK_NPCS.forEach(n => { if (!n.posts) return;
    n.posts.forEach(p => { if (p.map === map) out.push({ id: n.id, x: p.x, y: p.y, st: false }); });
    const c = CHORES[n.id]; if (c) Object.keys(c).forEach(pid => c[pid].forEach(st => { const p = n.posts.find(q => q.id === pid); if (p && p.map === map) out.push({ id: n.id, x: st.x, y: st.y, st: true }); }));
  });
  return out;
}
function wanderTiles(npcId, map, post) {
  const key = npcId + ':' + map + ':' + post.id + ':' + post.x + ',' + post.y;
  let w = wanders.get(key);
  if (w) return w;
  const cl = claims(map), held = new Set(cl.map(c => c.x + ',' + c.y));
  const seen = new Map([[post.x + ',' + post.y, 0]]);
  let front = [[post.x, post.y]]; w = [];
  for (let d = 1; d <= WANDER_REACH; d++) {
    const next = [];
    for (const [x, y] of front) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, k = nx + ',' + ny;
      if (seen.has(k) || !walkable(map, nx, ny)) continue;
      seen.set(k, d); next.push([nx, ny]);
      if (d < 2 || held.has(k)) continue;
      /* mine, and not nearer to anybody else's claim than to my own post */
      const mine = Math.abs(nx - post.x) + Math.abs(ny - post.y);
      if (cl.some(c => c.id !== npcId && Math.abs(nx - c.x) + Math.abs(ny - c.y) <= mine + 2)) continue;
      w.push({ id: 'wander', x: nx, y: ny, face: (nx * 7 + ny * 3) % 4, act: null });
    }
    front = next;
  }
  wanders.set(key, w);
  return w;
}

export function lifeFor(npc, day, minute, ctx) {
  const min = clampMin(minute);
  if (npc.posts) {
    /* on the road to a post on another map, or home from one: it is a walk, through the seams (trips.js) */
    const trip = tripAt(npc, day, min, ctx, bedOf(npc, day), t => { const o = lifeAt(npc, day, t, ctx); return o.map ? o : null; });
    if (trip) return { map: trip.map, x: trip.x, y: trip.y, walking: trip.walking, dir: trip.dir, act: null, sit: false, away: null };
  }
  return lifeAt(npc, day, min, ctx);
}

/* everything but a trip: a day at the post, its chores and its strolls, an errand, the walk to bed and the night */
function lifeAt(npc, day, minute, ctx) {
  const min = clampMin(minute);
  const base = positionFor(npc, day, min, ctx);
  const out = { map: base.map, x: base.x, y: base.y, walking: base.walking, dir: base.dir, act: null, sit: false, away: null };
  if (!npc.posts) return out;
  const post = activePost(npc, day, min, ctx);
  const bed = bedOf(npc, day);
  if (inWindow(min, bed[0], bed[1])) { out.map = null; out.away = 'asleep'; return out; }
  /* the last stretch before bed and the first after it: the walk to the door and in, or out of it and on */
  { const b = atBed(npc, day, min, ctx, bed, out); if (b) return b; }
  /* A change of post on this map (the shop closing, a festival ending, the barn opening) is a walk from wherever they were standing, at the
     hour it happens: not from the tile the old post names, which is where somebody who was away at a chore has not been for an hour. */
  const ch = recentChange(npc, day, min, ctx);
  { if (ch) {
      const s = lifeAt(npc, day, clampMin(ch.b - 1), ctx);
      if (s.map === post.map) {
        out.x = post.x; out.y = post.y; out.walking = false; out.dir = 0; ch.mine = true;
        const w = along(pathTo(post.map, s, { x: post.x, y: post.y }), ch.d, TRIP_CAP_MIN);
        if (w) { out.map = post.map; out.x = w.x; out.y = w.y; out.dir = w.dir; out.walking = true; return out; }
      }
    } }
  /* a festival is a festival: no chores, no errands, everybody about */
  if (post.festival || isFestivalDay(day)) return out;

  if (base.walking && !(ch && ch.mine)) return out;
  const ordinary = !post.weather && !post.season && !post.flag && !post.festival;
  if (!ordinary || post.id === 'home') return out;

  const stations = CHORES[npc.id] && CHORES[npc.id][post.id];
  const postTile = { x: post.x, y: post.y };
  const errand = errandOf(npc, day, post);
  const way = errand ? wayOut(post.map, postTile) : null;
  const exit = way ? { id: 'out', x: way.x, y: way.y, exit: true } : null;
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
