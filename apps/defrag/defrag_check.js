/* node apps/defrag/defrag_check.js -- DEFRAG's disk (pure Node): real files are laid down in pieces, the plan puts every one back together, the bad blocks stay put,
   nothing is lost or duplicated, and a plan on a clean disk is empty. */
import { scatter, plan, fragmented, clustersOf, swapCells, wanted } from './model.js';

let bad = 0, n = 0;
const ok = (c, m) => { n++; if (!c) { bad++; console.log('FAIL ' + m); } };
const seeded = s => () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
const N = 560;

for (let seed = 1; seed <= 40; seed++) {
  const rnd = seeded(seed * 31);
  const raw = Array.from({ length: 6 + Math.floor(rnd() * 60) }, (_, i) => ({ name: '::/F' + i, bytes: 1 + Math.floor(rnd() * rnd() * 60000) }));
  const files = clustersOf(raw, N, 24);
  const want = files.reduce((a, f) => a + f.clusters, 0);
  ok(want <= N * 0.7, 'seed ' + seed + ': ' + want + ' clusters fit on the disk with room to move');
  const cells = scatter(files, N, rnd);
  const badAt = cells.map((c, i) => (c && c.bad ? i : -1)).filter(i => i >= 0);
  const have = cells.filter(c => c && !c.bad).length;
  ok(have === want, 'seed ' + seed + ': every cluster of every file is on the disk (' + have + '/' + want + ')');
  const before = fragmented(cells, files);
  ok(before > 0 || files.length < 4, 'seed ' + seed + ': a used disk is fragmented');
  const swaps = plan(cells, files);
  ok(swaps.length <= want, 'seed ' + seed + ': no more moves than clusters (' + swaps.length + '/' + want + ')');
  swaps.forEach(([a, b]) => swapCells(cells, a, b));
  ok(fragmented(cells, files) === 0, 'seed ' + seed + ': after the plan no file is in two pieces');
  ok(badAt.every(i => cells[i] && cells[i].bad), 'seed ' + seed + ': the bad blocks did not move');
  ok(cells.filter(c => c && !c.bad).length === want, 'seed ' + seed + ': nothing was lost or doubled');
  const w = wanted(files); let g = 0;
  cells.forEach(c => { if (c && !c.bad) { const x = w[g++]; if (!(x.f === c.f && x.k === c.k)) ok(false, 'seed ' + seed + ': cluster ' + (g - 1) + ' is out of order'); } });
  ok(plan(cells, files).length === 0, 'seed ' + seed + ': a defragmented disk needs no moves');
}
console.log(bad ? bad + ' of ' + n + ' checks FAILED' : 'all ' + n + ' checks pass');
process.exit(bad ? 1 : 0);
