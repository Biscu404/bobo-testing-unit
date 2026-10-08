/* node apps/sweeper/hard_check.js [seeds] -- the late game is hard, and it is hard in a way a build answers (pure Node).
   A bot that plays the real room (createRun: S.mouse, S.key, the same masks, soul, hits and cold a person has) the way a careful player does: it reads the numbers
   (single-number and pair-of-numbers logic), clears spores, cuts brambles, opens webs from a neighbour, spends soul on SCRY when it has to guess (a flag or a
   safe tile, whichever it was), mends with FOCUS when it is low, and only when nothing is certain and no soul is left guesses the least dangerous tile.
   It plays each room twice over many boards: BARE (the shards and nothing worn) and BUILT (the charms a good build wears together: the iron ward, the lifeblood
   heart, the stalwart shell and the ember heart for the cold: seven notches, the bench's whole budget). What it holds:
     - the descent as it was is still beatable bare: the first rooms are won almost always;
     - the Underdeep is not: bare, an ordinary room is won by a minority and a guardian by hardly anyone; the Pale King by nobody;
     - a build changes that: the same bot with the same hands wins several times as often, and the king, which nobody wins bare, falls sometimes;
     - and it is still hard built: no room is a walk-over with a build either (the king under half).
   The numbers are the bot's, not a person's: a person guesses worse and reads better. They are held wide; what they must keep is the order. */
import { createRun } from './run.js';
import { NODES, START, maxMasks, SPELLS } from './data.js';
import { each } from './board.js';

const SEEDS = +process.argv[2] || 24;
let bad = 0, n = 0;
const ok = (c, m) => { n++; if (!c) { bad++; console.log('FAIL ' + m); } };
const seeded = s => () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
globalThis.window = { Sweeper: { st: { played: 0, streak: 0 }, save() {} } };
const snd = new Proxy({}, { get: () => () => {} });
const allCleared = () => { const c = {}; Object.keys(NODES).forEach(id => { c[id] = 10; }); return c; };

const BUILDS = {
  bare: { equipped: [], shards: 4 },
  built: { equipped: ['ward', 'lifeblood', 'stalwart', 'ember'], shards: 4, notches: 7 }
};
const camp = build => Object.assign(JSON.parse(JSON.stringify(START)), { cleared: allCleared(), soul: 40, notches: 7 }, { equipped: BUILDS[build].equipped.slice(), shards: BUILDS[build].shards });

function play(node, build, seed) {
  const rnd = seeded(seed * 7919 + node.c * 31 + node.m);
  Math.random = seeded(seed * 104729 + node.m);
  const c = camp(build); c.hp = maxMasks(c.shards);
  let won = false, lost = false;
  const S = createRun({ lv: node, node, camp: c, snd, onWin: () => { won = true; }, shadeGeo: () => 0 });
  const b = S.b, W = b.c;
  const at = i => [S.bx + (i % W) * S.tile + S.tile / 2, S.by + Math.floor(i / W) * S.tile + S.tile / 2];
  let t = performance.now();
  const click = (i, button) => { t += 450; S.tick(t); const [x, y] = at(i); S.mouse('down', { button: button || 0 }, x, y); S.mouse('up', { button: button || 0 }, x, y); };
  const known = i => b.flag[i] || b.def[i];                      /* a flag, or a larva already hatched: a mine we know of */
  click(Math.floor(b.n / 2), 0);
  let guard = 0;
  while (!S.over && guard++ < 6000) {
    /* mend when low and rich enough */
    if (S.hp <= Math.max(2, S.hpMax - 3) && S.hp < S.hpMax && S.soul >= S.focusCost()) { S.key({ key: 'f' }); }
    /* spores first: a fogged number reads as nothing */
    let acted = false;
    for (let i = 0; i < b.n && !S.over; i++) if (b.rev[i] && b.fog[i]) { click(i, 0); acted = true; }
    if (acted) continue;
    /* the certain moves: for each open number, flags vs the number vs the hidden neighbours */
    const sure = new Map();                                      /* index -> 'mine' | 'safe' */
    const front = [];
    for (let i = 0; i < b.n; i++) {
      if (!b.rev[i] || !b.cells[i]) continue;
      let flags = 0; const hid = [];
      each(b, i, j => { if (known(j)) flags++; else if (!b.rev[j]) hid.push(j); });
      if (!hid.length) continue;
      const need = b.cells[i] - flags;
      front.push({ i, need, hid });
      if (need === 0) hid.forEach(j => sure.set(j, 'safe'));
      else if (need === hid.length) hid.forEach(j => sure.set(j, 'mine'));
    }
    /* a pair of numbers: one's hidden set inside the other's */
    for (let a = 0; a < front.length && sure.size === 0; a++) {
      const A = front[a];
      for (let q = 0; q < front.length; q++) {
        if (q === a) continue;
        const B = front[q];
        if (A.hid.length >= B.hid.length || !A.hid.every(j => B.hid.indexOf(j) >= 0)) continue;
        const rest = B.hid.filter(j => A.hid.indexOf(j) < 0), dn = B.need - A.need;
        if (dn === 0) rest.forEach(j => sure.set(j, 'safe'));
        else if (dn === rest.length) rest.forEach(j => sure.set(j, 'mine'));
      }
    }
    if (sure.size) {
      for (const [j, what] of sure) {
        if (S.over) break;
        if (b.rev[j] || b.def[j]) continue;
        if (what === 'mine') { if (!b.flag[j]) click(j, 2); continue; }
        if (b.flag[j]) { click(j, 2); }
        if (b.web[j] && !b.rev[j]) {                              /* a web opens once a neighbour is open: leave it for a later pass */
          let nb = false; each(b, j, k => { if (b.rev[k]) nb = true; });
          if (!nb) continue;
        }
        if (b.thorn[j]) click(j, 0);                              /* cut the bramble */
        click(j, 0); acted = true;
      }
      if (acted || S.over) continue;
    }
    /* nothing is certain: soul for a SCRY, aimed at the least dangerous hidden tile; else the least dangerous tile */
    const hidden = []; let mines = b.m;
    for (let i = 0; i < b.n; i++) { if (known(i)) mines--; else if (!b.rev[i]) hidden.push(i); }
    if (!hidden.length) break;
    const risk = new Map();
    front.forEach(f => { const p = Math.max(0, f.need) / f.hid.length; f.hid.forEach(j => risk.set(j, Math.max(risk.get(j) || 0, p))); });
    const interior = hidden.filter(j => !risk.has(j)), dens = Math.max(0.02, mines / Math.max(1, hidden.length));
    let best = -1, bp = 2;
    hidden.forEach(j => {
      let nb = false; if (b.web[j]) each(b, j, k => { if (b.rev[k]) nb = true; }); if (b.web[j] && !nb) return;
      const p = risk.has(j) ? risk.get(j) : dens + 0.001 * rnd();
      if (p < bp) { bp = p; best = j; }
    });
    if (best < 0) { best = hidden.find(j => !b.web[j]); if (best == null) break; }
    void interior;
    if (S.learnt('scry') && S.soul >= S.cost('scry') && bp > 0.12) { S.key({ key: 'q' }); if (S.target === 'scry') { click(best, 0); continue; } }
    if (S.learnt('dive') && S.soul >= S.cost('dive') && bp > 0.3) { S.key({ key: 'e' }); if (S.target === 'dive') { click(best, 0); continue; } }
    if (b.thorn[best]) click(best, 0);
    click(best, 0);
  }
  lost = S.dead;
  return { won: won || (S.over && S.won), lost };
}

const rate = (id, build, seeds) => { let w = 0; for (let s = 1; s <= seeds; s++) if (play(NODES[id], build, s).won) w++; return w / seeds; };
const pct = x => Math.round(x * 100) + '%';
const rows = [];
const run = (id, seeds) => { const bare = rate(id, 'bare', seeds), built = rate(id, 'built', seeds); rows.push([id, pct(bare), pct(built)]); return { bare, built }; };

const R = {};
['stair', 'path', 'gate', 'warden', 'lamp', 'queen', 'descent', 'void', 'hollow'].forEach(id => { R[id] = run(id, SEEDS); });
['ossuary', 'groves', 'keeper', 'bellows', 'anvil', 'smith', 'vestibule', 'hall', 'king'].forEach(id => { R[id] = run(id, SEEDS); });

console.log('  room        bare   built   (' + SEEDS + ' boards each)');
rows.forEach(r => console.log('  ' + r[0].padEnd(11) + r[1].padStart(5) + r[2].padStart(7)));

/* the descent as it was is still a game a bare player can win, and its last rooms are the hardest of it */
ok(R.stair.bare >= 0.7 && R.path.bare >= 0.5, 'the early rooms are won bare (' + pct(R.stair.bare) + ', ' + pct(R.path.bare) + ')');
ok(R.hollow.bare <= R.stair.bare - 0.2 && R.hollow.bare >= 0.2, 'the Hollow One is a wall, but a bare player can still climb it (' + pct(R.hollow.bare) + ')');
ok(R.hollow.built >= R.hollow.bare, 'and a build helps there (' + pct(R.hollow.bare) + ' to ' + pct(R.hollow.built) + ')');
/* the Underdeep is not */
const ord = ['ossuary', 'groves', 'bellows', 'anvil', 'vestibule'], guard = ['keeper', 'smith', 'hall'];
const avg = (l, k) => l.reduce((a, id) => a + R[id][k], 0) / l.length;
ok(avg(ord, 'bare') <= 0.4, 'bare, an ordinary room of the Underdeep is won by a minority (' + pct(avg(ord, 'bare')) + ')');
ok(avg(guard, 'bare') <= 0.15, 'bare, a guardian of the Underdeep is won by hardly anyone (' + pct(avg(guard, 'bare')) + ')');
ok(R.king.bare <= 0.04, 'bare, the Pale King is won by nobody (' + pct(R.king.bare) + ')');
/* and a build is what changes it */
ok(avg(ord, 'built') >= avg(ord, 'bare') * 1.8 && avg(ord, 'built') >= 0.25, 'built, the same bot wins an ordinary room several times as often (' + pct(avg(ord, 'bare')) + ' to ' + pct(avg(ord, 'built')) + ')');
ok(avg(guard, 'built') >= avg(guard, 'bare') + 0.1, 'built, a guardian can be done (' + pct(avg(guard, 'bare')) + ' to ' + pct(avg(guard, 'built')) + ')');
ok(R.king.built <= 0.5, 'and it is still hard built: the Pale King is won less than half the time (' + pct(R.king.built) + ')');
ok(avg(ord, 'built') <= 0.96, 'no ordinary room of the Underdeep is a walk-over even with the build (' + pct(avg(ord, 'built')) + ')');

console.log(bad ? bad + ' FAILED of ' + n : 'sweeper hardness: all ' + n + ' ok');
process.exit(bad ? 1 : 0);
