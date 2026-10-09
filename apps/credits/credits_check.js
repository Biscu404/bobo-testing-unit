/* node apps/credits/credits_check.js -- CREDITS.EXE's picture (pure Node: no window, no canvas).
   THE PICTURES   the four portraits that ship exist, are square, are a size the screen can place, and are pressed to the sixteen colours
   THE LAYOUT     whatever the size of a portrait (64, 96, 128 or none at all), each is drawn at a whole multiple of its pixels, centred in its box, inside the
                  canvas, clear of its neighbours, with its name and its cross inside the canvas too */
import { readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';
import { W, H, CAST, FALLBACK, scaleFor, place, haloOf, crossOf, wordsOf } from './layout.js';

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
console.log(fails ? '\n' + fails + ' FAILED of ' + checks : '\ncredits: all ' + checks + ' ok');
process.exit(fails ? 1 : 0);
