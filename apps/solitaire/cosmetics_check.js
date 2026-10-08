/* Solitaire's trophy gifts: node apps/solitaire/cosmetics_check.js (pure Node) -- every Solitaire trophy gives exactly one thing, every gift is earned by a real trophy,
   every back/table/win draws and every win ends. */
import { ITEMS, bySub, drawBackArt, drawTable, WIN_FX, BACK_BASE } from './cosmetics.js';
import { TROPHIES } from './trophies.js';
let bad = 0;
const ok = (c, m) => { if (!c) { bad++; console.log('FAIL ' + m); } };
const ids = new Set(TROPHIES.map(t => t.id));
ok(ITEMS.length === TROPHIES.length, 'one gift per trophy (' + ITEMS.length + ' / ' + TROPHIES.length + ')');
TROPHIES.forEach(t => ok(ITEMS.filter(i => i.earn === t.id).length === 1, t.id + ' gives exactly one thing'));
ITEMS.forEach(i => ok(ids.has(i.earn), i.id + ' is earned by a real trophy'));
ok(new Set(ITEMS.map(i => i.id)).size === ITEMS.length, 'ids are unique');
ok(bySub('back').length >= 4 && bySub('table').length >= 5 && bySub('win').length >= 5, 'backs, tables and wins');
const calls = [];
const G = new Proxy({}, { get: (_, k) => k === 'canvas' ? {} : (...a) => { calls.push(k); }, set: () => true });
ITEMS.filter(i => i.sub === 'back').forEach(i => { ok(!!BACK_BASE[i.id], i.id + ' has a base colour'); drawBackArt(G, i.id, 0, 0, 80, 112); });
ITEMS.filter(i => i.sub === 'table').forEach(i => ok(drawTable(G, i.id, 960, 600, 3) === true, i.id + ' draws a table'));
ITEMS.filter(i => i.sub === 'win').forEach(i => {
  const fx = WIN_FX[i.id]; ok(!!fx, i.id + ' has an effect');
  let alive = 0;
  for (let n = 0; n < 52; n++) {
    const b = { x: 434, y: 14, vx: 0, vy: 0, age: 0, slot: n % 8 }; fx.launch(b, n, 52, 880, 600);
    let f = 0; while (f < 3000 && fx.step(b, 880, 600)) { f++; b.age++; }
    if (f < 3000) alive++;
  }
  ok(alive === 52, i.id + ': every card leaves the glass or comes to rest (' + alive + ' of 52)');
});
console.log(bad ? bad + ' FAILED' : 'solitaire gifts ok (' + ITEMS.length + ' of them)');
process.exit(bad ? 1 : 0);
