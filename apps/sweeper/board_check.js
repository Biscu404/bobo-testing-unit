/* node apps/sweeper/board_check.js -- the rules, without a window */
import { mk, lay, open, each, around, chordTargets, hiddenSafe, won, blocked } from './board.js';

let bad = 0;
const ok = (c, m) => { if (!c) { bad++; console.log('FAIL', m); } };
const seeded = s => () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };

for (const [c, r, m, mod] of [[9, 9, 10, null], [16, 16, 40, 'bramble'], [30, 16, 99, 'web'], [24, 14, 70, 'spore']]) {
  for (let seed = 1; seed <= 40; seed++) {
    const b = mk(c, r, m), first = (seed * 7) % b.n;
    lay(b, first, mod, seeded(seed));
    ok(b.mine.filter(Boolean).length === m, c + 'x' + r + ' lays exactly ' + m + ' mines');
    ok(!b.mine[first], 'first click is never a mine');
    let nb = true; each(b, first, j => { if (b.mine[j]) nb = false; });
    ok(nb && b.cells[first] === 0, 'first click opens a zero');
    for (let i = 0; i < b.n; i++) {
      let k = 0; each(b, i, j => { if (b.mine[j]) k++; });
      if (b.cells[i] !== k) { ok(false, 'count at ' + i); break; }
    }
    open(b, first, 1, 15);
    ok(b.rev[first] > 0, 'first click opens');
    /* the first click's neighbours are never webbed: the board must be playable */
    each(b, first, j => ok(!b.web[j] && !b.thorn[j], 'the first ring is clear of bramble and web'));
    /* playing it out by hand: open every safe tile; it must read as won, with no mine opened */
    for (let i = 0; i < b.n; i++) if (!b.mine[i]) open(b, i, 1, 0);
    ok(won(b) && hiddenSafe(b) === 0, 'opening every safe tile wins');
    ok(!b.mine.some((x, i) => x && b.rev[i]), 'no mine was opened by open()');
  }
}
/* a webbed tile with no open neighbour is blocked; with one it is not */
{
  const b = mk(5, 5, 0); b.web[12] = true;
  ok(blocked(b, 12) === 'web', 'webbed and alone is blocked');
  b.rev[13] = 1; ok(blocked(b, 12) === null, 'webbed beside an open tile is free');
}
/* chord needs the exact flag count, defused larvae count as flags, and fog blocks it */
{
  const b = mk(5, 5, 0); b.cells[12] = 2; b.rev[12] = 1; b.flag[6] = true;
  ok(chordTargets(b, 12) === null, 'one flag of two does not chord');
  b.def[7] = true; ok(chordTargets(b, 12) && chordTargets(b, 12).length === 6, 'a flag and a defused larva chord the other six');
  b.fog[12] = true; ok(chordTargets(b, 12) === null, 'fog blocks a chord');
}
ok(around(mk(9, 9, 0), 0, 1).length === 4 && around(mk(9, 9, 0), 40, 2).length === 25, 'around() clips at the edge');
console.log(bad ? bad + ' FAILED' : 'sweeper board: all ok');
process.exit(bad ? 1 : 0);
