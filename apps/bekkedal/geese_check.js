/* node apps/bekkedal/geese_check.js — the geese on Bekkedal's waters (Thea's present), pure Node: they float only where the whole of them is over deep water, are first seen near the player and not
   across the map, keep out of the way, never stand on a pier or the shore, are drawn in the valley's ramps only, and a map with no deep water has none. */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { BEK_MAPS } from './data.js';
import { waterOf, floats, placesFor, MAX_GEESE, NEAR, SHY, VMAX, COLOUR, FRAME } from './geese.js';
import { swimmer, stepSwimmer } from '../goose_life.js';
import { FRAMES } from '../goose_art.js';

let fails = 0;
const ok = (c, m) => { if (!c) { fails++; console.log('FAIL - ' + m); } else console.log('PASS - ' + m); };
const dice = seed => { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const WATER = ['lake', 'fjord', 'vidda'];

/* which maps have water at all: three, and every other map has none */
{
  const have = Object.keys(BEK_MAPS).filter(id => waterOf(id).length).sort();
  ok(have.join() === WATER.slice().sort().join(), 'deep water is on the lake, the fjord and the vidda, and nowhere else (' + have.join() + ')');
  WATER.forEach(id => ok(waterOf(id).length >= 40, id + ' has water enough for a goose (' + waterOf(id).length + ' squares)'));
}

/* a goose floats on W only: never the shore (~), never a pier (P), never land, wherever it is put on the grid */
WATER.forEach(id => {
  const rows = BEK_MAPS[id].rows;
  const bad = [];
  rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) { const g = r[x]; for (const [fx, fy] of [[0.5, 0.5], [0.2, 0.5], [0.8, 0.5]]) if (g !== 'W' && floats(id, x + fx, y + fy)) bad.push(id + ' ' + x + ',' + y + ' ' + g); } });
  ok(!bad.length, id + ': nothing but deep water holds a goose' + (bad.length ? ' (' + bad.slice(0, 3).join('; ') + ')' : ''));
  let nearShore = 0, shoreFloats = 0;
  waterOf(id).forEach(([x, y]) => { nearShore++; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const r = rows[Math.floor(y + dy * 1)]; const ch = r && r[Math.floor(x + dx * 1)]; if (ch === 'P' || ch === '~') shoreFloats++; } });
  ok(nearShore > 0, id + ': ' + nearShore + ' places, ' + shoreFloats + ' of them with the shore or a pier a square off (a goose may be near them; it is never on them)');
});

/* first seen near the player: up to three, none closer than NEAR[0] nor further than NEAR[1], a goose's length apart, all on water; none if the player is far from any */
{
  const rng = dice(41);
  WATER.forEach(id => {
    const rows = BEK_MAPS[id].rows, land = [];
    rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) if (r[x] !== 'W' && r[x] !== 'T' && r[x] !== 'M') land.push([x, y]); });
    let max = 0, bad = 0, none = 0, tried = 0;
    for (let i = 0; i < 300; i++) {
      const [px, py] = land[Math.floor(rng() * land.length)], got = placesFor(id, px, py, rng);
      tried++;
      if (!got.length) { none++; continue; }
      max = Math.max(max, got.length);
      got.forEach((g, k) => {
        const d = Math.hypot(g[0] - px, g[1] - py);
        if (d < NEAR[0] - 1e-9 || d > NEAR[1] + 1e-9 || !floats(id, g[0], g[1])) bad++;
        got.forEach((h, j) => { if (j < k && Math.hypot(g[0] - h[0], g[1] - h[1]) < 2.6 - 1e-9) bad++; });
      });
    }
    ok(bad === 0 && max <= MAX_GEESE, id + ': ' + (tried - none) + ' of ' + tried + ' places on land see geese start within ' + NEAR.join('..') + ' squares, on water, apart, at most ' + MAX_GEESE + ' (most seen ' + max + ')');
  });
  ok(placesFor('farm', 10, 10).length === 0 && placesFor('lakehouse', 5, 5).length === 0, 'a map with no deep water starts none');
}

/* twenty minutes at thirty frames a second, on each water: always afloat, they move about, they put their heads under, and a player standing on the shore is left alone */
WATER.forEach(id => {
  const rng = dice(7 + id.length), rows = BEK_MAPS[id].rows;
  let px = 0, py = 0;
  outer: for (let y = 0; y < rows.length; y++) for (let x = 0; x < rows[y].length; x++) if (rows[y][x] === '~' || rows[y][x] === 'P') { const g = placesFor(id, x, y, rng); if (g.length >= 2) { px = x; py = y; break outer; } }
  const start = placesFor(id, px, py, rng);
  const birds = start.map(([x, y]) => { const w = swimmer(rng, x, y, { vmax: VMAX }); w.inside = (nx, ny) => floats(id, nx, ny); return w; });
  let off = 0, dabs = 0, was = birds.map(() => 0), travelled = birds.map(() => 0), lastPos = birds.map(b => [b.x, b.y]), closest = Infinity, jumped = 0;
  const fear = { x: px + 0.5, y: py + 0.5, r: SHY };
  for (let f = 0; f < 20 * 60 * 30; f++) {
    birds.forEach((b, i) => {
      stepSwimmer(b, 1 / 30, b.inside, rng, fear);
      if (!floats(id, b.x, b.y)) off++;
      if (b.dab > 0 && !was[i]) dabs++;
      was[i] = b.dab > 0 ? 1 : 0;
      const d = Math.hypot(b.x - lastPos[i][0], b.y - lastPos[i][1]); travelled[i] += d; if (d > VMAX * 1.6 / 30 + 1e-6) jumped++; lastPos[i] = [b.x, b.y];
      if (f > 30 * 8) closest = Math.min(closest, Math.hypot(b.x - fear.x, b.y - fear.y));
    });
  }
  ok(birds.length >= 2 && off === 0, id + ': ' + birds.length + ' geese, afloat on every one of 36,000 frames (' + off + ' off the water)');
  ok(dabs >= 10, id + ': they put their heads under (' + dabs + ' times in twenty minutes)');
  ok(travelled.every(d => d > 20), id + ': every one of them gets about (' + travelled.map(d => d.toFixed(0)).join(', ') + ' squares)');
  ok(jumped === 0, id + ': nobody jumps: no step is quicker than a goose in a hurry');
  ok(closest > 1.2, id + ': a player on the shore is left some room (the closest one came was ' + closest.toFixed(2) + ' squares)');
});

/* drawn in the valley's ramps: every digit of every small frame has a colour, and the file asks for no alpha and no literal colour */
{
  const used = new Set();
  Object.values(FRAME).forEach(n => FRAMES[n].forEach(r => r.split('').forEach(ch => { if (ch !== '.') used.add(parseInt(ch, 16)); })));
  ok([...used].every(d => COLOUR[d] != null), 'every digit of the small frames has a colour out of palette.js (' + [...used].sort((a, b) => a - b).join(',') + ')');
  const here = path.dirname(fileURLToPath(import.meta.url)), src = readFileSync(path.join(here, 'geese.js'), 'utf8');
  ok(!/globalAlpha|rgba\(|ctx\.filter|#[0-9a-fA-F]{3,6}\b|rgb\(/.test(src.replace(/\/\*[\s\S]*?\*\//g, '')), 'the geese use no alpha and name no colour but the ramps');
  ok(src.split('\n').length < 300, 'the file stays under 300 lines');
}
console.log(fails ? fails + ' failed' : 'All checks pass.');
process.exit(fails ? 1 : 0);
