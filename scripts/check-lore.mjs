#!/usr/bin/env node
/* LORE ACCURATE (pure Node, no browser): the faint that one sip brings on (kernel/faint.js) and the rules that earn the mode (kernel/lore.js).
   THE FAINT   it starts at rest, tips the room over and drops the lids in the order it says, thuds once, ends in the dark with the words on, and never moves back
   THE RULES   five blackouts and every bottle there is to find (the credits' gifts are not looked for), and not before; the count and the switch are kept, and a damaged store is a new one */
import { FAINT_SECS, AT, frame, starAt } from '../kernel/faint.js';
import { NEED_BLACKOUTS, status, load, save, counts, KEY } from '../kernel/lore.js';

let fails = 0, checks = 0;
const ok = (c, label, detail) => { checks++; if (c) { console.log('OK   ' + label.padEnd(84) + (detail || '')); return true; } fails++; console.log('FAIL ' + label + '   ' + (detail || '')); return false; };
const at = k => Array.from({ length: k + 1 }, (_, i) => frame(i / k));

console.log('-- the faint --');
{
  const a = frame(0), z = frame(1), fr = at(400);
  ok(FAINT_SECS >= 3 && FAINT_SECS <= 4, 'it takes ' + FAINT_SECS + ' seconds');
  ok(a.rot === 0 && a.ty === 0 && a.tx === 0 && a.lids === 0 && a.flash === 0 && a.stars === 0 && a.text === 0 && a.bright === 1 && a.zoom === 1, 'it begins with the room as it was');
  ok(z.done && z.lids === 50 && z.text === 0 && z.stars === 0 && z.bright < 0.5 && !frame(0.99).done, 'it ends in the dark, the lids shut, the words gone, and is done only at the end');
  let mono = true; for (let i = 1; i < fr.length; i++) { const p0 = i / 400 - 1 / 400; if (p0 >= AT.fall && fr[i].rot < fr[i - 1].rot - 1e-9) mono = false; if (p0 >= AT.thud && fr[i].lids < fr[i - 1].lids - 1e-9) mono = false; if (fr[i].ty < fr[i - 1].ty - 1e-9) mono = false; }
  ok(mono, 'once it falls it only falls: the tilt, the sinking and the lids never go back');
  ok(Math.max(...fr.map(f => f.rot)) <= 80 && Math.max(...fr.map(f => Math.abs(f.rot))) <= 80 && fr.some(f => f.rot < -2), 'it leans the wrong way a little first, and tips over to no more than eighty degrees');
  const shaking = fr.map((f, i) => [f.shake, i / 400]).filter(([s]) => s > 0), flashing = fr.map((f, i) => [f.flash, i / 400]).filter(([s]) => s > 0);
  ok(shaking.length > 0 && shaking.every(([, p]) => p >= AT.thud && p < AT.thud + 0.13), 'the shake is the thud and only the thud (' + shaking.length + ' frames)');
  ok(flashing.length > 0 && flashing.every(([, p]) => p >= AT.thud && p < AT.thud + 0.06), 'and so is the white flash');
  ok(fr.every((f, i) => f.stars === 0 || i / 400 > AT.thud) && fr.some(f => f.stars > 0.99), 'the stars come after the thud, all the way in and out');
  ok(fr.every((f, i) => f.text === 0 || (i / 400 >= 0.68 && i / 400 < 0.99)) && fr.some(f => f.text > 0.99), 'and so do the words, which are on for a good while');
  ok(fr.every(f => f.lids >= 0 && f.lids <= 50 && f.bright > 0.3 && f.blur >= 0), 'the lids never pass the middle and it never goes quite black until the lids are shut');
  ok(frame(-3).rot === 0 && frame(9).done && frame(NaN).lids !== undefined, 'a nonsense time is the start or the end, not an error');
  const s0 = starAt(0, 5, 0), s1 = starAt(1, 5, 0);
  ok(Math.abs(s0.x - s1.x) > 0.01 && [0, 1, 2, 3, 4].every(i => { const s = starAt(i, 5, 2.3); return s.x > 0.2 && s.x < 0.8 && s.y > 0.2 && s.y < 0.5; }), 'five stars go round in the upper half of the room, apart from each other');
}

console.log('\n-- the rules --');
{
  const drinks = [{ id: 'a' }, { id: 'b' }, { id: 'c', reward: 'x' }, { id: 'g', gift: 'biscu' }];
  const own = ids => id => ids.includes(id);
  ok(NEED_BLACKOUTS === 5, 'five blackouts');
  ok(!counts(drinks[3]) && counts(drinks[0]) && counts(drinks[2]), 'the credits\' gifts do not count as bottles to find, a reward from a trophy does');
  const s0 = status(0, drinks, own([]));
  ok(!s0.unlocked && s0.bottles === 0 && s0.of === 3, 'at the start it is locked: nothing owned of the three there are to find');
  ok(!status(5, drinks, own(['a', 'b'])).unlocked, 'five blackouts without every bottle is not enough');
  ok(!status(4, drinks, own(['a', 'b', 'c'])).unlocked, 'every bottle without five blackouts is not enough');
  ok(status(5, drinks, own(['a', 'b', 'c'])).unlocked, 'five blackouts and every bottle there is to find: unlocked, the gift not needed');
  ok(status(99, drinks, own(['a', 'b', 'c'])).blackouts === 5 && status(7, drinks, own(['a', 'b', 'c', 'g'])).unlocked, 'more blackouts than that read as five; owning the gift as well changes nothing');
  const mem = {}, store = { getItem: k => mem[k] == null ? null : mem[k], setItem: (k, v) => { mem[k] = v; } };
  save(store, { blackouts: 3, on: true });
  ok(JSON.stringify(load(store)) === '{"blackouts":3,"on":true}', 'the count and the switch are kept (' + KEY + ')');
  mem[KEY] = '{{{'; ok(JSON.stringify(load(store)) === '{"blackouts":0,"on":false}', 'a damaged store is a new one');
  mem[KEY] = JSON.stringify({ blackouts: -4, on: 'yes' }); ok(load(store).blackouts === 0 && load(store).on === true, 'a nonsense count is nothing');
  ok(JSON.stringify(load({ getItem: () => { throw new Error('no storage'); } })) === '{"blackouts":0,"on":false}', 'and no storage at all is a new one too');
}
console.log(fails ? '\n' + fails + ' FAILED of ' + checks : '\nlore accurate: all ' + checks + ' ok');
process.exit(fails ? 1 : 0);
