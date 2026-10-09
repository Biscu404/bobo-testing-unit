/* node apps/bottle/shapes_check.js -- the bottles of THE BOTTLE (pure Node: no canvas).
   THE SHAPES   every bottle fits the 80 x 246 sprite with its cap, stands on a base, never widens again above the shoulder, and has an inside for the liquor
   THE CAPS     a cap is as wide as the lip it covers (or the neck it stops), stands over it and comes down over it, whatever the bottle: they all fit
   THE LABELS   the paper sits on the body, inside the glass
   THE POUR     each has its own lip to pour over, at the top and the width of its neck; the Jägermeister's is the one the game began with
   THE DRINKS   every drink Dave sells has a bottle that exists */
import { SHAPES, SHAPE_IDS, geometry, innerArea, WALL, MAX_TOP } from './shapes.js';
import { CAPS, capTop } from './caps.js';
import { BOT } from './art.js';
import { DRINKS } from '../../kernel/cos_data.js';
import { paletteOf } from './drinks.js';

let fails = 0, checks = 0;
const ok = (c, label, detail) => { checks++; if (c) { console.log('OK   ' + label.padEnd(78) + (detail || '')); return true; } fails++; console.log('FAIL ' + label + '   ' + (detail || '')); return false; };

console.log('-- the shapes --');
for (const id of SHAPE_IDS) {
  const g = geometry(id), rows = g.rows;
  ok(g.top <= MAX_TOP && g.top >= 120, id + ': stands between 120 and ' + MAX_TOP + ' high', g.top + '');
  ok(rows.every(r => r.hw >= 1 && r.hw <= 38), id + ': never wider than the sprite (76)', 'widest ' + g.bodyHW);
  ok(rows[0].kind === 'base' && rows[0].hw <= g.bodyHW, id + ': stands on a base');
  /* above the widest point the outline only narrows (a neck, then a lip flange: the one place it widens again) */
  const widest = rows.reduce((b, r, i) => r.hw >= rows[b].hw ? i : b, 0);
  let narrowing = true; for (let i = widest + 1; i < rows.length; i++) if (rows[i].hw > rows[i - 1].hw && rows[i].kind !== 'lip') narrowing = false;
  ok(narrowing, id + ': narrows from its widest point to its lip');
  ok(g.inner.length > 20 && g.inner.every(r => r.hw >= 1), id + ': has an inside to fill', innerArea(g) + ' px');
  ok(g.inner.every(r => r.hw <= rows.find(w => w.y === r.y).hw - WALL + 1), id + ': the glass is ' + WALL + ' pixels thick');
  ok(capTop(g) <= 240, id + ': the cap is inside the sprite (' + capTop(g) + ' high of 240)');
}

console.log('\n-- the caps --');
for (const id of SHAPE_IDS) for (const kind of Object.keys(CAPS)) {
  if (kind !== SHAPES[id].cap && !(id === 'tall' && kind === 'cork') && !(id === 'squat' && kind === 'screw')) continue;
  const g = geometry(id, kind), c = CAPS[kind];
  const wide = kind === 'pet' ? g.lipHW : g.lipHW + 2;
  if (kind === 'cork') ok(g.neckHW - 1 >= 5 && g.neckHW <= g.lipHW, id + ' + cork: a head one pixel in from the neck it stops, with the flange of the lip round it');
  else ok(wide >= g.lipHW && wide <= g.lipHW + 3, id + ' + ' + kind + ': as wide as the lip it covers (' + wide + ' to its ' + g.lipHW + ')');
  ok(c.up >= 3 && c.down >= 0, id + ' + ' + kind + ': stands ' + c.up + ' over the lip and comes ' + c.down + ' down');
  ok(kind === 'cork' ? g.neckHW <= g.lipHW : true, id + ' + ' + kind + ': the neck it stops is not wider than its lip');
}

console.log('\n-- the labels --');
for (const id of SHAPE_IDS) {
  const g = geometry(id), L = g.label, bottom = L.top - L.h;
  const at = y => g.rows.find(r => r.y === (y - y % 2)) || g.rows[g.rows.length - 1];
  const need = L.w / 2;
  ok(bottom >= 4, id + ': the paper does not hang below the base', 'from ' + L.top + ' down to ' + bottom);
  ok([bottom + 2, L.top - 2, (L.top + bottom) >> 1].every(y => at(y).hw >= need - 1) , id + ': and is no wider than the glass it is stuck on (' + L.w + ' of ' + 2 * at(L.top - 2).hw + ' at its top)');
  ok(L.top <= g.bodyTop + 8, id + ': it is on the body, not up the neck');
}

console.log('\n-- the pour --');
{
  const g = geometry('jag');
  ok(g.lip[0] === BOT.lip[0] && g.lip[1] === BOT.lip[1] && g.lipUp[0] === BOT.lipUp[0], 'the Jägermeister pours over the lip it always had', JSON.stringify(g.lip));
  ok(g.top === 224 && g.neckHW === 13 && g.lipHW === 16 && g.bodyHW === 38, 'and is the same bottle in size');
  for (const id of SHAPE_IDS) { const h = geometry(id); ok(h.lip[0] === h.neckHW && h.lip[1] === -h.top && h.lipUp[0] === -h.neckHW, id + ': pours over the top of its own neck'); }
  const a = innerArea(geometry('jag'));
  ok(SHAPE_IDS.every(id => innerArea(geometry(id)) > a * 0.3 && innerArea(geometry(id)) < a * 1.2), 'no bottle holds a third less than the Jägermeister or a fifth more');
}

console.log('\n-- the drinks --');
for (const d of DRINKS) {
  const p = paletteOf(d);
  ok(SHAPES[p.shape], d.id + ': comes in a bottle that exists', p.shape);
  ok(!p.capKind || CAPS[p.capKind], d.id + ': and its cap does', p.capKind || SHAPES[p.shape].cap);
}
console.log(fails ? '\n' + fails + ' FAILED of ' + checks : '\nthe bottles: all ' + checks + ' ok');
process.exit(fails ? 1 : 0);
