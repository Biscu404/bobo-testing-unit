/* Bekkedal rooms check — `node apps/bekkedal/rooms_check.js`
 *
 * The two houses are made rooms (rooms.js): every floor is a named zone with a periodic floor and a paper, every piece of furniture is a prop standing on a solid glyph
 * that nothing else covers, everything on a wall is on a wall that has a face, every window is a window in an outer wall, and every pattern *repeats*. A piece with no
 * glyph under it is a thing you can walk through; a glyph with no piece on it is an invisible block. This is the check that finds both, and the one that holds the
 * textures to being textures: a floor is the same tile every few tiles, whatever the hash.
 *   node apps/bekkedal/rooms_check.js */
import { BEK_MAPS, BEK_DECOR, BEK_SOLID } from './data.js';
import { BEK_ROOMS, zoneAt, windowAt } from './rooms.js';
import { PROP, FOOT } from './decor.js';
import { SOLID_KINDS, WALL_KINDS } from './decor_home.js';
import { FLOORS, wallFace, wallCap, rug, windowOn, doorIn, PAPERS } from './interior_floors.js';
import { FURN, furnitureAct } from './furniture_act.js';

let fails = 0, checks = 0;
const ok = (c, label, detail) => { checks++; if (c) console.log('OK   ' + label); else { fails++; console.log('FAIL ' + label + '   ' + (detail || '')); } };
const FURNITURE = 'nuJcb';

for (const id of Object.keys(BEK_ROOMS)) {
  const rows = BEK_MAPS[id].rows, decor = BEK_DECOR[id] || [];
  const g = (x, y) => (rows[y] && rows[y].charAt(x)) || ' ';
  const walkable = (x, y) => { const c = g(x, y); return c !== ' ' && BEK_SOLID.indexOf(c) < 0; };
  const room = (x, y) => { const c = g(x, y); return c !== ' ' && c !== 'H' && c !== 'D'; };      /* floor, or a piece standing on it */
  console.log('\n-- ' + id + ' --');

  /* every floor square is named */
  const unnamed = [];
  for (let y = 0; y < rows.length; y++) for (let x = 0; x < rows[y].length; x++) {
    const c = g(x, y);
    if (c === ' ' || c === 'H' || c === 'D') continue;
    if (zoneAt(id, x, y).name === '?') unnamed.push(x + ',' + y);
  }
  ok(unnamed.length === 0, id + ': every floor square belongs to a named zone', unnamed.slice(0, 6).join(' '));

  /* the pieces */
  const kinds = decor.filter(d => !PROP[d.kind]).map(d => d.kind);
  ok(kinds.length === 0, id + ': every prop kind exists', kinds.join(', '));
  const covered = new Map(), bad = [];
  decor.filter(d => SOLID_KINDS.indexOf(d.kind) >= 0).forEach(d => {
    const [w, h] = FOOT[d.kind] || [1, 1];
    for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) {
      const k = (d.x + dx) + ',' + (d.y + dy);
      if (FURNITURE.indexOf(g(d.x + dx, d.y + dy)) < 0 && g(d.x + dx, d.y + dy) !== 'v') bad.push(d.kind + ' at ' + k + ' has no solid glyph under it (' + g(d.x + dx, d.y + dy) + ')');
      if (covered.has(k)) bad.push(k + ' is under two pieces: ' + covered.get(k) + ' and ' + d.kind);
      covered.set(k, d.kind);
    }
  });
  ok(bad.length === 0, id + ': every piece stands on the solid squares it covers, none on top of another', bad.slice(0, 4).join('; '));
  const empty = [];
  for (let y = 0; y < rows.length; y++) for (let x = 0; x < rows[y].length; x++) {
    const c = g(x, y);
    if ((FURNITURE.indexOf(c) >= 0 || c === 'v') && !covered.has(x + ',' + y)) empty.push(c + ' at ' + x + ',' + y);
  }
  ok(empty.length === 0, id + ': no solid square is an invisible block (a piece draws on every one)', empty.slice(0, 6).join('; '));

  const wallBad = decor.filter(d => WALL_KINDS.indexOf(d.kind) >= 0).filter(d => g(d.x, d.y) !== 'H' || !room(d.x, d.y + 1)).map(d => d.kind + ' at ' + d.x + ',' + d.y);
  ok(wallBad.length === 0, id + ': everything on a wall hangs on a wall with floor in front of it', wallBad.join('; '));
  const floorBad = decor.filter(d => SOLID_KINDS.indexOf(d.kind) < 0 && WALL_KINDS.indexOf(d.kind) < 0).filter(d => !walkable(d.x, d.y) && ['net', 'rod'].indexOf(d.kind) < 0).map(d => d.kind + ' at ' + d.x + ',' + d.y);
  ok(floorBad.length === 0, id + ': what lies on the floor lies on floor', floorBad.join('; '));

  /* windows */
  const wins = BEK_ROOMS[id].windows;
  const winBad = wins.filter(w => g(w.x, w.y) !== 'H' || g(w.x, w.y - 1) !== ' ' || !room(w.x, w.y + 1)).map(w => w.x + ',' + w.y);
  ok(wins.length >= 1 && winBad.length === 0, id + ': ' + wins.length + ' windows, each in an outer wall with floor in front', winBad.join(' '));

  /* the door: nothing stands on the square you arrive on, and the way in is clear */
  const ex = BEK_MAPS[id].exits[0];
  ok(walkable(ex.x, ex.y - 1) && !covered.has(ex.x + ',' + (ex.y - 1)), id + ': the square inside the door is clear');
}

/* the patterns repeat: the same tile every few tiles, in both directions */
const rec = () => { const ops = []; return { ops, A: { fill: (c, x, y, w, h) => ops.push([c, x, y, w, h]), tileAt: (x, y) => ((x + y) & 3) ? 'i' : 'H', zone: () => ({ paper: 'stripe' }), win: () => null, map: () => 'farmhouse', paper: () => 'stripe' } }; };
const norm = (ops, x, y) => JSON.stringify(ops.map(o => [o[0], o[1] - x * 40, o[2] - y * 40, o[3], o[4]]));
const draw = (fn, x, y) => { const r = rec(); fn(r.A, x, y); return norm(r.ops, x, y); };
console.log('\n-- the patterns repeat --');
for (const k of Object.keys(FLOORS)) {
  const base = draw(FLOORS[k], 3, 3);
  ok(draw(FLOORS[k], 9, 3) === base && draw(FLOORS[k], 3, 9) === base && draw(FLOORS[k], 9, 9) === base, 'the ' + k + ' floor is the same tile every six squares, across and down');
  const seen = new Set();
  for (let y = 0; y < 12; y++) for (let x = 0; x < 12; x++) seen.add(draw(FLOORS[k], x, y));
  ok(seen.size <= 9, 'the ' + k + ' floor is ' + seen.size + ' different tiles over a twelve-by-twelve room, not a new one every square');
}
ok(draw((A, x, y) => rug(A, x, y, 'blue', () => true), 2, 2) === draw((A, x, y) => rug(A, x, y, 'blue', () => true), 5, 7), 'the rug\'s diamond is the same on every square of it');
for (const p of Object.keys(PAPERS)) {
  const f = (A, x, y) => wallFace(A, x, y, p, true);
  ok(draw(f, 4, 1) === draw(f, 8, 1) && draw(f, 4, 1) === draw(f, 4, 6), 'the ' + p + ' paper is the same every two squares of wall');
}

/* and the things that answer, answer */
console.log('\n-- the things that answer --');
const lines = [];
const S = { day: 4, min: 600, weather: 'klar', water: 3, met: {}, en: 10, enMax: 100, map: 'farmhouse' };
const env = { S, say: l => lines.push(Array.isArray(l) ? l[0] : l), TX: (a, b) => b, light: () => 0, sfx: { pick() {}, sleep() {}, water() {}, deny() {} } };
const heard = Object.keys(FURN).filter(k => k !== 'window').map(k => { lines.length = 0; const r = furnitureAct({ kind: k, x: 2, y: 3, p: 1 }, env, false); const l = lines[0]; return r && l && (typeof l === 'string' ? l : l.no && l.en) ? null : k; }).filter(Boolean);
ok(heard.length === 0, 'every piece that answers says something in both languages', heard.join(', '));
lines.length = 0; ok(furnitureAct(null, env, true) && lines.length === 1, 'a window answers');
ok(!furnitureAct({ kind: 'sofa', x: 1, y: 1 }, env, false), 'a sofa is not claimed (the seat is the bench\'s own SPACE)');
const t0 = S.en; S.met = {};
furnitureAct({ kind: 'stove', x: 20, y: 2 }, env, false);
const t1 = S.en; furnitureAct({ kind: 'stove', x: 20, y: 2 }, env, false);
ok(t1 - t0 === 6 && S.en === t1, 'tea is +6 energy once a day and no more');
S.met = {}; const w0 = S.water; furnitureAct({ kind: 'plant', x: 3, y: 8 }, env, false); furnitureAct({ kind: 'plant', x: 3, y: 8 }, env, false);
ok(S.water === w0 - 1, 'a plant is watered once a day, from the can');
ok(Object.keys(FURN).every(k => k === 'window' || PROP[k]), 'every answering kind is a real prop');

console.log(fails ? '\n' + fails + ' of ' + checks + ' failed' : '\nAll ' + checks + ' room checks pass.');
process.exit(fails ? 1 : 0);
