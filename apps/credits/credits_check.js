/* node apps/credits/credits_check.js -- CREDITS.EXE's picture (pure Node: no window, no canvas).
   THE PICTURES   the four portraits that ship exist, are square, are a size the screen can place, and are pressed to the sixteen colours
   THE HANDS      the first look holds out four hands in turn, each out of its own portrait and back, each thing given the moment its hand has arrived, the whole of it a quarter of a minute
   THE TRAY       a cell for each thing given, inside the canvas, nowhere on another, found by the pointer
   THE SPRITES    the hand and the eight things are grids of the sixteen colours; a cookie can be any size
   THE LAYOUT     whatever the size of a portrait (64, 96, 128 or none at all), each is drawn at a whole multiple of its pixels, centred in its box, inside the
                  canvas, clear of its neighbours, with its name and its cross inside the canvas too */
import { readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';
import { W, H, CAST, FALLBACK, scaleFor, place, haloOf, crossOf, wordsOf, anchorsOf } from './layout.js';
import { plan, stateOf, poseOf, lengthOf, BEAT, START, STAGE, HAND_SCALE, ITEM_SCALE, SLEEVE } from './hands.js';
import { layout as trayLayout, shownOf, hit, CELL, ORDER, ROWS } from './tray.js';
import { HAND, cookie, sizeOf } from './sprites.js';
import { GIFTS, SETS } from '../../kernel/gifts_core.js';

let fails = 0, checks = 0;
const ok = (c, label, detail) => { checks++; if (c) { console.log('OK   ' + label.padEnd(76) + (detail || '')); return true; } fails++; console.log('FAIL ' + label + '   ' + (detail || '')); return false; };

/* a PNG's size, colour type, and (for an indexed one) whether every pixel is one of the sixteen the palette starts with */
function png(path) {
  const b = readFileSync(new URL(path, import.meta.url));
  let off = 8, w = 0, h = 0, type = 0, depth = 0; const idat = [];
  let plte = null;
  while (off < b.length) {
    const len = b.readUInt32BE(off), tag = b.toString('latin1', off + 4, off + 8), body = b.subarray(off + 8, off + 8 + len);
    if (tag === 'IHDR') { w = body.readUInt32BE(0); h = body.readUInt32BE(4); depth = body[8]; type = body[9]; }
    if (tag === 'PLTE') plte = body;
    if (tag === 'IDAT') idat.push(body);
    off += 12 + len;
  }
  return { w, h, type, depth, plte, raw: inflateSync(Buffer.concat(idat)) };
}
const VGA = [[0, 0, 0], [0, 0, 170], [0, 170, 0], [0, 170, 170], [170, 0, 0], [170, 0, 170], [170, 85, 0], [170, 170, 170], [85, 85, 85], [85, 85, 255], [85, 255, 85], [85, 255, 255], [255, 85, 85], [255, 85, 255], [255, 255, 85], [255, 255, 255]];
const isVga = ([r, g, b]) => VGA.some(c => c[0] === r && c[1] === g && c[2] === b);

console.log('-- the pictures --');
const sizes = {};
for (const c of CAST) {
  const p = png('../../assets/credits/' + c.id + '.png');
  sizes[c.id] = [p.w, p.h];
  ok(p.w === p.h && p.w >= 48 && p.w <= 160, c.id + ': square and a size the screen can place', p.w + 'x' + p.h);
  if (p.type === 3) {
    const pal = []; for (let i = 0; i < 16; i++) pal.push([p.plte[i * 3], p.plte[i * 3 + 1], p.plte[i * 3 + 2]]);
    ok(pal.every(isVga), c.id + ': an indexed picture whose first sixteen colours are the machine\'s');
  } else if (p.type === 6 && p.depth === 8) {
    const row = 1 + p.w * 4; let bad = 0, prev = Buffer.alloc(p.w * 4);
    for (let y = 0; y < p.h; y++) {
      const f = p.raw[y * row], cur = Buffer.from(p.raw.subarray(y * row + 1, (y + 1) * row));
      for (let i = 0; i < cur.length; i++) {
        const a = i >= 4 ? cur[i - 4] : 0, b = prev[i], c2 = i >= 4 ? prev[i - 4] : 0;
        if (f === 1) cur[i] = (cur[i] + a) & 255; else if (f === 2) cur[i] = (cur[i] + b) & 255; else if (f === 3) cur[i] = (cur[i] + ((a + b) >> 1)) & 255;
        else if (f === 4) { const pp = a + b - c2, pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c2); cur[i] = (cur[i] + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c2)) & 255; }
      }
      for (let x = 0; x < p.w; x++) if (cur[x * 4 + 3] === 255 && !isVga([cur[x * 4], cur[x * 4 + 1], cur[x * 4 + 2]])) bad++;
      prev = cur;
    }
    ok(bad === 0, c.id + ': every opaque pixel is one of the sixteen', bad ? bad + ' are not' : '');
  } else ok(false, c.id + ': a PNG the check can read', 'type ' + p.type + ' depth ' + p.depth);
}

console.log('\n-- the layout --');
const inside = (r, m = 0) => r.x >= m && r.y >= m && r.x + r.w <= W - m && r.y + r.h <= H - m;
const apart = (a, b) => a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y;
const cases = { 'as shipped': sizes, 'all 64': {}, 'all 96': {}, 'all 128': {}, 'a mix (96 creator, 128 the rest)': {}, 'none loaded': null };
CAST.forEach(c => { cases['all 64'][c.id] = [64, 64]; cases['all 96'][c.id] = [96, 96]; cases['all 128'][c.id] = [128, 128]; cases['a mix (96 creator, 128 the rest)'][c.id] = c.role ? [96, 96] : [128, 128]; });
for (const [label, sz] of Object.entries(cases)) {
  const at = place(sz), ps = CAST.map(c => at[c.id]);
  ok(ps.every(p => p.k >= 1 && Number.isInteger(p.k) && p.w === p.k * (sz ? sz[p.id][0] : FALLBACK) && p.h === p.k * (sz ? sz[p.id][1] : FALLBACK)), label + ': each at a whole multiple of its own pixels', ps.map(p => p.w + '').join(' '));
  ok(ps.every(p => p.w <= p.box + 64 && p.h <= p.box + 64 && p.x >= p.boxX - 64 && p.y >= p.boxY - 64), label + ': near its box');
  ok(ps.every(p => Math.abs((p.x + p.w / 2) - p.cx) <= 1 && Math.abs((p.y + p.h / 2) - p.cy) <= 1), label + ': centred in its box');
  ok(ps.every(p => inside(p, 4)), label + ': inside the canvas');
  let clear = true; for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) if (!apart(ps[i], ps[j])) clear = false;
  ok(clear, label + ': no two pictures touch');
  const words = ps.flatMap(wordsOf);
  ok(words.every(w => w.y > 0 && w.y < H - 2), label + ': every name is on the canvas', words.map(w => w.y).join(' '));
  const crosses = CAST.slice(1).map(c => crossOf(at[c.id]));
  ok(crosses.every(x => x.cx - x.armW / 2 >= 0 && x.cx + x.armW / 2 <= W && x.top >= 0), label + ': every cross is on the canvas');
  ok(crosses.every((x, i) => i === 0 || x.cx - x.armW / 2 > crosses[i - 1].cx + crosses[i - 1].armW / 2), label + ': the crosses of two playtesters do not meet');
  const hl = haloOf(at.teiteotei), c0 = at.teiteotei;
  ok(Math.abs(hl.x - W / 2) <= 1 && hl.x - hl.rx * 1.45 < 0 + 40 && hl.y + hl.ry * 1.45 < H, label + ': the halo is round the creator\'s head and on the canvas', JSON.stringify(hl));
  ok(c0.cy - c0.h / 2 >= 20, label + ': the creator is clear of the title');
}
ok(scaleFor(64, 192) === 3 && scaleFor(96, 192) === 2 && scaleFor(128, 192) === 1 && scaleFor(64, 128) === 2 && scaleFor(96, 128) === 1 && scaleFor(128, 128) === 1 && scaleFor(500, 128) === 1,
  'the multiples: 64 px is three in the big box and two in the small, 96 and 128 are two and one');

console.log('\n-- the hands --');
{
  const at = place(sizes), anchors = anchorsOf(at, STAGE), beats1 = plan(SETS[1]), beats2 = plan(SETS[2]);
  ok(beats1.length === 4 && beats1.every((b, i) => b.at === START + i * BEAT.step && b.from === SETS[1][i].from), 'four hands in turn, a step apart, each of its own giver: ' + beats1.map(b => b.from).join(', '));
  ok(lengthOf(beats1) > 12 && lengthOf(beats1) < 17, 'the whole of the first look is ' + lengthOf(beats1).toFixed(1) + ' seconds: a quarter of a minute, not a minute');
  ok(lengthOf([]) === 0, 'and no hands is no time at all');
  const b = beats1[0], ph = t => stateOf(b, t).phase;
  ok(ph(0) === 'wait' && ph(b.at + 0.1) === 'reach' && ph(b.at + BEAT.reach + 0.1) === 'hold' && ph(b.at + BEAT.reach + BEAT.hold + 0.1) === 'back' && ph(b.at + BEAT.reach + BEAT.hold + BEAT.back + 0.1) === 'done', 'a hand waits, reaches, holds it out, goes back, and is done, in that order');
  let flips = 0, last = false; for (let t = 0; t < lengthOf(beats1); t += 0.02) { const g = stateOf(b, t).given; if (g !== last) flips++; last = g; }
  ok(flips === 1 && !stateOf(b, b.at + BEAT.reach - 0.01).given && stateOf(b, b.at + BEAT.reach + 0.01).given, 'it is given once, the moment the hand has arrived, and stays given');
  const slot = { x: 300, y: 530, s: 2 };
  const p0 = poseOf({ phase: 'reach', u: 0.001, given: false }, anchors.biscu, slot), p1 = poseOf({ phase: 'hold', u: 0.5, given: true }, anchors.biscu, slot), p2 = poseOf({ phase: 'back', u: 0.999, given: true }, anchors.biscu, slot);
  ok(Math.hypot(p0.wrist.x - anchors.biscu.x, p0.wrist.y - anchors.biscu.y) < 12 && Math.abs(p0.hand.s - HAND_SCALE[0]) < 0.1, 'it starts at its portrait, small');
  ok(Math.abs(p1.wrist.x - STAGE.x) < 1 && Math.abs(p1.hand.s - HAND_SCALE[1]) < 1e-9 && p1.item.s === ITEM_SCALE, 'it holds the thing out in the middle of the picture, at its biggest');
  ok(Math.hypot(p2.item.x - slot.x, p2.item.y - slot.y) < 3 && Math.abs(p2.item.s - slot.s) < 0.1 && p2.hand.s < HAND_SCALE[0] + 0.1, 'the thing ends in its cell, the hand back in the portrait');
  ok(poseOf({ phase: 'wait', u: 0 }, anchors.biscu, slot) === null && poseOf({ phase: 'done', u: 1 }, anchors.biscu, slot) === null, 'before and after there is nothing to draw');
  ok(CAST.every(c => anchors[c.id] && Math.abs(anchors[c.id].x - at[c.id].cx) <= at[c.id].box / 2 && Math.abs(anchors[c.id].y - at[c.id].cy) <= at[c.id].box / 2), 'every arm starts inside its giver\'s box, on the side facing the middle');
  ok(anchors.biscu.x > at.biscu.cx && anchors.thea.x < at.thea.cx && anchors.gheghe.y < at.gheghe.cy && anchors.teiteotei.y > at.teiteotei.cy, 'Biscu\'s hand comes out of the right of him, Thea\'s of her left, Gheghe\'s over him, the creator\'s under him');
  ok(CAST.every(c => SLEEVE[c.id] && SLEEVE[c.id].length === 2 && SLEEVE[c.id].every(v => v >= 0 && v <= 15)) && new Set(Object.values(SLEEVE).map(v => v[0])).size === 4, 'each wears a sleeve of its own colour');
  ok(beats2.map(x => x.from).join() === 'thea,biscu,gheghe,teiteotei', 'the fifth look: Thea, Biscu, Gheghe and then the creator, as the list went');
}

console.log('\n-- the tray --');
{
  const none = shownOf(() => false), all = shownOf(() => true), some = shownOf(id => id === 'chips');
  ok(none.length === 4 && all.length === 8 && some.length === 5 && none.join() === ORDER.slice(0, 4).join(), 'four cells to begin with, one more for each of the second four that is yours');
  for (const [label, ids] of [['four', none], ['five', some], ['eight', all]]) {
    const cells = trayLayout(W, H, ids), cs = ids.map(id => cells[id]);
    ok(cs.every(c => c.x >= 0 && c.x + c.w <= W && c.y >= H - CELL - 8 && c.y + c.h <= H), label + ': every cell is on the canvas, along the bottom');
    ok(cs.every((c, i) => i === 0 || c.x === cs[i - 1].x + CELL) && Math.abs((cs[0].x + cs[cs.length - 1].x + CELL) / 2 - W / 2) <= 1, label + ': side by side, in the middle');
    ok(cs.every(c => hit(cells, c.cx, c.cy) === ids[cs.indexOf(c)]) && hit(cells, -5, -5) === null && hit(cells, W / 2, 10) === null, label + ': the pointer finds each cell and nothing else');
  }
}

console.log('\n-- the pictures --');
{
  ok(HAND.length === 24 && HAND.every(r => r.length === 20 && /^[0-9A-Fa-zS.]+$/.test(r)), 'the hand is twenty by twenty-four, in the sixteen colours and its sleeve');
  ok(Object.keys(ROWS).length === 8 && ORDER.every(id => ROWS[id].every(r => r.length === 16) && ROWS[id].length === 16 && ROWS[id].some(r => /[^.]/.test(r))), 'the eight things are sixteen by sixteen and not empty');
  for (const n of [16, 24, 32, 48, 64]) { const c = cookie(n); ok(c.length === n && c.every(r => r.length === n) && c.join('').split('').filter(ch => ch === '0').length > n && c.join('').includes('6') && /\./.test(c[Math.round(n * 0.2)]), 'a cookie of ' + n + ' is round, bitten, and has chips'); }
  ok(GIFTS.every(g => ROWS[g.id]), 'every gift has a picture');
}
console.log(fails ? '\n' + fails + ' FAILED of ' + checks : '\ncredits: all ' + checks + ' ok');
process.exit(fails ? 1 : 0);
