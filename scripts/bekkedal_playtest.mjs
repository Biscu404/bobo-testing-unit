#!/usr/bin/env node
/* Bekkedal — what a day actually costs, and how long Act I really is.
 *
 * The economy is tuned against an energy budget, and an energy budget is only
 * meaningful next to a *time* budget: the clock runs at four in-game minutes a
 * real second (`tickClock`, index.js) and a day is 06:00 to 02:00, so a day
 * the player fills is exactly five real minutes and a day they go to bed
 * halfway through is two and a half. Which of the two — the bar or the 02:00
 * wall — stops them, and therefore what a day is worth in real minutes, is the
 * figure every other balance number hangs off, and since the valley's maps
 * went to three and four times their old size it can no longer be reasoned
 * about from the tables. So it is walked.
 *
 * Nothing here plays the game for itself. Every action is a real keydown or
 * keyup on the real canvas through the real frame loop, exactly the way
 * `scripts/smoke.mjs` drives everything else, and state is read back out of
 * the save blob the SAVE button writes, which is a thing a player can do. The
 * one thing it reads that a save does not carry is which panel is open, off
 * `__bekDebug` — that is what a player sees by looking at the screen, and it
 * is used only to *know*, never to act: nothing here teleports, grants an
 * item, skips a walk or opens a panel by hand. What comes out is a
 * measurement of the game, not of a model of it.
 *
 *   node scripts/bekkedal_playtest.mjs             everything
 *   node scripts/bekkedal_playtest.mjs rates       the tile and the swing
 *   node scripts/bekkedal_playtest.mjs commutes    how far it is to everywhere
 *   node scripts/bekkedal_playtest.mjs act1        a fresh save, played
 */
import { setupGlobalEnv, importApp, mountApp, findCanvas } from './bek_headless.mjs';

setupGlobalEnv();
const { data, app } = await importApp();
const { BEK_SAVE, BEK_MAPS, BEK_SOLID, BEK_TOOLS, BEK_NPCS, BEK_LOT_COST,
        BEK_STEP_S, BEK_CLOCK_MIN_PER_S, BEK_DAY_START, BEK_DAY_END } = data;
const { positionFor } = await import('../apps/bekkedal/schedule.js');
const { swingLen } = await import('../apps/bekkedal/fx.js');

/* half of move()'s own BEK_STEP_S gate a frame, so a tile costs the in-game
   minutes it really costs rather than whatever a coarser step rounds it to */
const DT = BEK_STEP_S / 2;
const STEP_FRAMES = 2;
const DAY_MIN = BEK_DAY_END - BEK_DAY_START;
const realMin = igm => igm / BEK_CLOCK_MIN_PER_S / 60;
const argv = process.argv.slice(2);
const want = k => argv.length === 0 || argv.indexOf(k) >= 0;

/* ---- the valley as a graph, read off the real rows and the real seams ---- */
const walkable = (m, x, y) => {
  const r = BEK_MAPS[m] && BEK_MAPS[m].rows;
  return !!r && y >= 0 && y < r.length && x >= 0 && x < r[y].length && BEK_SOLID.indexOf(r[y][x]) < 0;
};
const exitAt = (m, x, y) => (BEK_MAPS[m].exits || []).filter(e => e.x === x && e.y === y)[0];
/* a door is not an exits entry: it is a solid 'D' you press SPACE at
   (doorTravel(), index.js), so the route graph carries it as its own edge and
   walkTo() spends a keypress rather than a step on it */
const doorAt = (m, x, y) => {
  const d = BEK_MAPS[m].door;
  return d && d.x === x && d.y === y && !d.need ? d : null;
};
const DIRS = [[0, 1, 's'], [0, -1, 'w'], [-1, 0, 'a'], [1, 0, 'd']];

/* Breadth-first over squares *and* seams, so a route from the farm to the mine
   is one path rather than four legs stitched together by hand. */
function route(from, to) {
  const key = p => p.m + ':' + p.x + ',' + p.y;
  const seen = new Set([key(from)]);
  let front = [{ at: { m: from.m, x: from.x, y: from.y }, path: [] }];
  for (let d = 0; d < 5000 && front.length; d++) {
    const next = [];
    for (const node of front) {
      if (node.at.m === to.m && node.at.x === to.x && node.at.y === to.y) return node.path;
      for (const [dx, dy, k] of DIRS) {
        const nx = node.at.x + dx, ny = node.at.y + dy;
        const ex = exitAt(node.at.m, nx, ny), dr = doorAt(node.at.m, nx, ny);
        const at = ex ? { m: ex.to, x: ex.tx, y: ex.ty }
                 : dr ? { m: dr.to, x: dr.tx, y: dr.ty } : { m: node.at.m, x: nx, y: ny };
        if (!ex && !dr && !walkable(at.m, at.x, at.y)) continue;
        const kk = key(at);
        if (seen.has(kk)) continue;
        seen.add(kk);
        next.push({ at: at, path: node.path.concat(dr ? [k + '!'] : [k]) });
      }
    }
    front = next;
  }
  return null;
}

/* ---- driving the real app ------------------------------------------------ */
function boot() {
  globalThis.localStorage.removeItem(BEK_SAVE);
  const h = mountApp(app);
  const cv = findCanvas();
  if (!cv) throw new Error('no canvas after mount');
  let ts = 0;
  const frames = n => { for (let i = 0; i < n; i++) { ts += DT * 1000; h.tick()(ts); } };
  frames(2);
  const read = () => { h.bSave.click(); return JSON.parse(globalThis.localStorage.getItem(BEK_SAVE)); };
  /* which panel is up. Observation, not action — the equivalent of a player
     looking at the screen before deciding which key to press next. */
  const mode = () => (globalThis.window.__bekDebug ? globalThis.window.__bekDebug.mine().mode : '');
  const hold = (k, n) => { cv.keydown({ key: k, preventDefault: () => {} }); frames(n); cv.keyup({ key: k }); };
  const tap = k => { cv.keydown({ key: k, preventDefault: () => {} }); frames(1); cv.keyup({ key: k }); frames(1); };
  return { frames, read, hold, tap, mode };
}

/* Walk a route, one key press per tile, re-planning whenever a step does not
   land — which is what a body in the way looks like from here. */
function walkTo(g, to, budget) {
  const s0 = g.read();
  let s = s0, stalls = 0, steps = 0;
  const cap = budget || 900;
  while (!(s.map === to.m && s.px === to.x && s.py === to.y)) {
    if (steps++ > cap) return null;
    if (s.day !== s0.day) return null;
    const path = route({ m: s.map, x: s.px, y: s.py }, to);
    if (!path || !path.length) return null;
    for (const k of path) {
      if (k.length > 1) { g.hold(k[0], 2); g.tap(' '); g.frames(4); }   /* a door */
      else g.hold(k, STEP_FRAMES);
      const now = g.read();
      if (now.day !== s0.day) return null;
      const moved = now.map !== s.map || now.px !== s.px || now.py !== s.py;
      s = now;
      if (!moved) {
        if (++stalls > 4) return null;
        g.hold(['w', 'a', 's', 'd'][stalls % 4], STEP_FRAMES * 2);
        s = g.read();
        break;
      }
      stalls = 0;
      if (s.map === to.m && s.px === to.x && s.py === to.y) break;
    }
  }
  return g.read().min - s0.min;
}

/* every square you can stand on to work a tile the predicate likes, nearest
   first — the same two squares a player lines up */
function faceFrom(m, pred, from) {
  const rows = BEK_MAPS[m].rows, out = [];
  for (let y = 0; y < rows.length; y++) for (let x = 0; x < rows[y].length; x++) {
    if (!pred(rows[y][x], x, y)) continue;
    for (const [dx, dy, k] of DIRS) {
      const sx = x - dx, sy = y - dy;
      if (walkable(m, sx, sy)) out.push({ m: m, x: sx, y: sy, face: k, tx: x, ty: y });
    }
  }
  if (from) out.sort((a, b) => (Math.abs(a.x - from.x) + Math.abs(a.y - from.y)) -
                               (Math.abs(b.x - from.x) + Math.abs(b.y - from.y)));
  return out;
}
/* whatever panel the last thing left open, closed — a player does this
   without thinking and a harness has to be told */
const clear = g => {
  for (let i = 0; i < 8 && g.mode(); i++) { g.tap('Escape'); g.frames(2); }
  return !g.mode();
};
const equip = (g, id) => {
  for (let i = 0; i < BEK_TOOLS.length * 2; i++) {
    if (BEK_TOOLS[g.read().tool].id === id) return true;
    g.tap('e');
  }
  return false;
};

/* ---- 1. the two rates every other figure is built on --------------------- */
function rates() {
  console.log('\n-- the two rates every other figure is built on --');
  const g = boot();
  const a = g.read();
  let n = 16;
  while (n > 4 && !walkable('farm', a.px + n, a.py)) n--;
  const before = g.read();
  g.hold('d', STEP_FRAMES * n);
  const after = g.read();
  const tiles = Math.abs(after.px - before.px);
  const perTile = tiles ? (after.min - before.min) / tiles : 0;
  console.log('   a tile walked   ' + perTile.toFixed(3) + ' in-game minutes  (' +
              (perTile / BEK_CLOCK_MIN_PER_S).toFixed(3) + ' real seconds), over ' + tiles + ' tiles');
  console.log('   a swing         ' + (swingLen('oks') * BEK_CLOCK_MIN_PER_S).toFixed(2) +
              ' in-game minutes with the axe, ' + (swingLen('hand') * BEK_CLOCK_MIN_PER_S).toFixed(2) + ' by hand');
  console.log('   a whole day     ' + DAY_MIN + ' in-game minutes = ' + realMin(DAY_MIN).toFixed(1) +
              ' real minutes, if you are still standing at 02:00');
  return perTile;
}

/* ---- 2. the commute ------------------------------------------------------ */
const LANDMARKS = {
  'farm door':  { m: 'farm', x: 8, y: 8 },
  'the square': { m: 'town', x: 23, y: 15 },
  'the wood':   { m: 'forest', x: 22, y: 15 },
  'the water':  { m: 'lake', x: 10, y: 13 },
  'the meadow': { m: 'enga', x: 22, y: 13 },
  'the setra':  { m: 'setra', x: 20, y: 13 },
  'the adit':   { m: 'gruva', x: 12, y: 22 }
};
function commutes() {
  console.log('\n-- the commute, from the farm door --');
  const home = LANDMARKS['farm door'];
  Object.keys(LANDMARKS).forEach(name => {
    if (name === 'farm door') return;
    const tiles = (route(home, LANDMARKS[name]) || []).length;
    const min = tiles * BEK_STEP_S * BEK_CLOCK_MIN_PER_S;
    console.log('   ' + name.padEnd(12) + String(tiles).padStart(4) + ' tiles   ' +
      min.toFixed(0).padStart(4) + ' in-game min out, ' + (2 * min).toFixed(0).padStart(4) +
      ' there and back  (' + ((2 * min) / DAY_MIN * 100).toFixed(0) + '% of a day)');
  });
}

/* ---- 3. Act I, played ----------------------------------------------------
   Fresh save, no debug hook, nothing granted: the same keys a player presses,
   until the house by the water is standing. */
const npcCtx = s => ({ weather: s.weather, flag: s.flag, act2Unlocked: s.act2Unlocked });
function npcAt(id, s) {
  const n = BEK_NPCS.filter(q => q.id === id)[0];
  if (!n) return null;
  return n.posts ? positionFor(n, s.day, s.min, npcCtx(s)) : { map: n.map, x: n.x, y: n.y };
}
/* Walk to whoever it is, turn to them, and press SPACE until the box is done
   with you — which advances lines, takes the first answer to a question,
   accepts an offer, and lands in the shop panel when there is one. They keep
   hours, so where they were when the walk started is not where they are when
   it ends: the position is asked for again on arrival. */
function talkTo(g, id) {
  let s = g.read();
  const p0 = npcAt(id, s);
  if (!p0) return false;
  /* the long leg first, to a square beside where they are *now* — and then
     short corrections, because by the time you have crossed the valley they
     have moved on to the next of their posts and may still be walking to it */
  const first = faceFrom(p0.map, (c, x, y) => x === p0.x && y === p0.y, { x: s.px, y: s.py })[0];
  if (!first) return false;
  if (walkTo(g, first, 400) == null && g.read().map !== p0.map) return false;
  for (let nudge = 0; nudge < 14; nudge++) {
    s = g.read();
    if (s.min > 23 * 60) return false;
    const now = npcAt(id, s);
    if (!now || now.map !== s.map) return false;
    const d = DIRS.filter(([dx, dy]) => s.px + dx === now.x && s.py + dy === now.y)[0];
    if (d) {
      g.hold(d[2], 2);
      /* Keep pressing while the box is still saying something. A shopkeeper's
         `nodes` come first and are one-shot; the counter only opens off a
         `chat` line (talkTo(), index.js), so a first visit is several
         conversations deep before the shop is reachable at all — and they
         keep hours, so between two of those conversations they will have
         stepped away and the next SPACE lands on an empty square. That is
         what the outer loop is for: turn, press, and when the box stops
         answering, go and stand beside them again. */
      let spoke = false;
      for (let i = 0; i < 40; i++) {
        g.tap(' '); g.frames(2);
        const m = g.mode();
        if (m === 'shop' || m === 'craft') return true;
        if (m) spoke = true;
        else if (spoke) break;
      }
      if (spoke) continue;
    }
    const spot = faceFrom(s.map, (c, x, y) => x === now.x && y === now.y, { x: s.px, y: s.py })[0];
    if (!spot || walkTo(g, spot, 60) == null) continue;
  }
  return g.mode() === 'shop';
}
/* the shop panel opens straight out of a conversation with a shopkeeper:
   right for the sell column, then SPACE until the bag is empty */
/* the sell column of the shop panel, emptied. Reported honestly: if the
   conversation did not end in a shop the bag will not have shrunk, and the
   caller wants to know that rather than assume it. */
function sellEverything(g) {
  if (g.mode() !== 'shop') return 0;
  const before = Object.values(g.read().bag).reduce((a, b) => a + b, 0);
  g.tap('ArrowRight');
  for (let i = 0; i < 200 && g.mode() === 'shop'; i++) g.tap(' ');
  clear(g);
  return before - Object.values(g.read().bag).reduce((a, b) => a + b, 0);
}
function work(g, t) {
  if (walkTo(g, t, 400) == null) return false;
  g.hold(t.face, 2);
  const before = g.read();
  g.tap(' ');
  g.frames(8);
  return g.read().en < before.en;
}

function playAct1(maxDays) {
  console.log('\n-- Act I, played on a fresh save --');
  const g = boot();
  const log = [];
  for (let d = 0; d < maxDays; d++) {
    let s = g.read();
    const day = s.day, stop = {};
    equip(g, 'oks');
    /* the morning: fell what is standing, the farm's own birches first and
       then the wood next door */
    /* One stand square per tree, and never a stump: `S.felled` is in the save
       (`rkey` -> the day it comes back), so the harness skips what it cut the
       day before rather than walking to it and swinging at nothing. A player
       can see a stump; before this the harness could not, and half its
       mornings went on twelve wasted swings. */
    let misses = 0, sold = 0;
    const trees = (s2, mp) => {
      const seen = new Set(), out = [];
      faceFrom(mp, c => c === 'Y', { x: s2.map === mp ? s2.px : 8, y: s2.map === mp ? s2.py : 8 })
        .forEach(t => {
          const k = mp + ':' + t.tx + ',' + t.ty;
          if (seen.has(k) || (s2.felled[k] || 0) > s2.day) return;
          seen.add(k); out.push(t);
        });
      return out;
    };
    while (misses < 6) {
      s = g.read();
      if (s.day !== day) { stop.clock = 1; break; }
      if (s.en < 10) { stop.bar = 1; break; }
      if (s.min > 19 * 60) { stop.late = 1; break; }
      if (Object.values(s.bag).reduce((a, b) => a + b, 0) >= s.bagCap - 3) { stop.bag = 1; break; }
      const t = trees(s, s.map === 'forest' ? 'forest' : 'farm')[0] ||
                trees(s, s.map === 'forest' ? 'farm' : 'forest')[0];
      if (!t) { stop.empty = 1; break; }
      if (!work(g, t)) misses++;
    }
    /* Fifty-nine birches over two days is not a day's worth of stamina, which
       is the "no single loop dominates" rule showing up as a fact about the
       afternoon rather than as a number in a table: run out of trees with
       half a bar left and there is nothing for it but to go and do something
       else. Here that is the meadow's flowers, and only when the day is young
       enough that the walk out and back is not the whole of it. */
    s = g.read();
    if (!stop.clock && s.en > 60 && s.min < 13 * 60) {
      const picked = new Set();
      for (let i = 0; i < 40; i++) {
        s = g.read();
        if (s.day !== day || s.en < 10 || s.min > 17 * 60) break;
        if (Object.values(s.bag).reduce((a, b) => a + b, 0) >= s.bagCap - 3) break;
        const f = faceFrom('enga', c => c === 'p', { x: s.map === 'enga' ? s.px : 22, y: s.map === 'enga' ? s.py : 13 })
          .filter(t => !picked.has(t.tx + ',' + t.ty) && (s.picked['enga:' + t.tx + ',' + t.ty] || 0) <= s.day)[0];
        if (!f) break;
        picked.add(f.tx + ',' + f.ty);
        work(g, f);
      }
    }
    /* the afternoon: the square. Sell, and let Astrid and Håkon say whatever
       they have — which is where the quest, the lot and the house all come
       from, and none of it is skipped */
    s = g.read();
    /* into town only when there is a load worth carrying — a walk across the
       valley to sell six mushrooms is a day thrown away, and the harness was
       throwing away every other one */
    clear(g);
    s = g.read();
    const load = Object.values(s.bag).reduce((a, b) => a + b, 0);
    if (s.day === day && s.min < 21 * 60 && (load >= 20 || s.kr < 200)) {
      if (talkTo(g, 'astrid')) sold += sellEverything(g);
      clear(g);
      talkTo(g, 'hakon');
      clear(g);
      s = g.read();
      if (!s.flag.lot && s.q.tommer === 'done' && s.kr >= BEK_LOT_COST) {
        const sign = faceFrom('lake', c => c === 'S', { x: s.px, y: s.py })[0];
        if (sign && walkTo(g, sign, 900) != null) {
          g.hold(sign.face, 2);
          for (let i = 0; i < 8; i++) { g.tap(' '); g.frames(3); }
          clear(g);
        }
      }
    }
    /* and to bed */
    clear(g);
    s = g.read();
    const bed = faceFrom('farmhouse', c => c === 'b', { x: 9, y: 7 })[0];
    for (let tries = 0; tries < 2 && g.read().day === day; tries++) {
      if (walkTo(g, bed, 900) == null) continue;
      g.hold(bed.face, 2);
      g.tap(' '); g.frames(4); g.tap(' '); g.frames(8);
    }
    /* still up at 02:00? Then the clock puts you to bed, which is a thing the
       game does on purpose and not a thing the harness failed at */
    while (g.read().day === day && g.read().min < BEK_DAY_END - 5) g.frames(120);
    if (g.read().day === day) g.frames(200);
    const end = g.read();
    const used = (end.day !== day ? BEK_DAY_END : end.min) - BEK_DAY_START;
    const why = stop.bar ? 'the bar' : stop.clock ? '02:00' : stop.bag ? 'a full sekk'
              : stop.empty ? 'nothing left to fell' : stop.late ? 'the hour' : 'chose to';
    log.push({ day: day, min: used, kr: end.kr, built: !!end.built, stop: why, sold: sold });
    console.log('   day ' + String(day).padStart(2) + '  ' + String(Math.round(used)).padStart(4) +
      ' in-game min = ' + realMin(used).toFixed(2) + ' real min   ' + String(end.kr).padStart(6) +
      ' kr   sold ' + String(sold).padStart(3) + '   work stopped by: ' + why);
    if (end.built) break;
    if (end.day === day) { console.log('   (could not get to bed — stopping)'); break; }
  }
  const total = log.reduce((a, l) => a + l.min, 0);
  const built = log.filter(l => l.built)[0];
  console.log('   ' + log.length + ' days played, ' + Math.round(total) + ' in-game minutes = ' +
    realMin(total).toFixed(1) + ' real minutes — ' + (realMin(total) / log.length).toFixed(2) +
    ' real minutes a day, ' + Math.round(total / log.length) + ' in-game minutes a day (' +
    Math.round(100 * total / log.length / DAY_MIN) + '% of the clock)');
  console.log('   ' + (built ? 'the house went up on day ' + built.day
                             : 'no house yet: ' + log[log.length - 1].kr + ' kr on day ' + log[log.length - 1].day));
  return log;
}

if (want('rates')) rates();
if (want('commutes')) commutes();
if (want('act1')) playAct1(40);
console.log('');
/* the app keeps its own frame loop and autosave watchdog alive, and nothing
   here unmounts it — the measurement is over, so say so and go */
process.exit(0);
