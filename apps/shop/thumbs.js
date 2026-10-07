/* CRAZY DAVE — the picture on every card, and Dave himself. One canvas per card, 116 x 60, whole pixels. */
import { drawPlant } from '../garden/art.js';
import { thumbMini } from '../../kernel/pet_art.js';
import { sampleStroke } from '../crayon/brushes.js';
import { POTS, LOGOS } from '../../kernel/cos_data.js';

function dimCol(hex, k) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.round(((n >> 16) & 255) * k), g2 = Math.round(((n >> 8) & 255) * k), b = Math.round((n & 255) * k);
  return 'rgb(' + r + ',' + g2 + ',' + b + ')';
}

function cssFirstColor(str, fallback) {
  const m = String(str).match(/#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)/);
  return m ? m[0] : fallback;
}

export function drawDave(cv, t) {
  if (!cv) return;
  const g = cv.getContext('2d');
  if (!g) return;
  g.clearRect(0, 0, 48, 48);
  const y = Math.round(Math.sin(t) * 2);
  const arm = Math.round(Math.sin(t * 1.7) * 4);
  const R = (x, yy, w, h, c) => { g.fillStyle = c; g.fillRect(x, yy + y, w, h); };
  /* the pot */
  R(14, 2, 20, 4, '#7a3d20');
  R(15, 6, 18, 9, '#a35a34');
  R(15, 6, 18, 2, '#c4784c');
  /* head and face */
  R(17, 15, 14, 11, '#c99a68');
  R(17, 15, 14, 2, '#e0b483');
  R(20, 19, 3, 3, '#000000');
  R(26, 19, 3, 3, '#000000');
  R(21, 20, 1, 1, '#FFFFFF');
  R(27, 20, 1, 1, '#FFFFFF');
  R(20, 24, 9, 1, '#5c2f18');
  /* the grin opens and shuts */
  if (Math.sin(t * 2.3) > 0) R(21, 23, 7, 3, '#3a1c0e');
  /* body */
  R(15, 26, 18, 14, '#2f6f4f');
  R(15, 26, 18, 2, '#49a074');
  R(19, 29, 10, 6, '#e8d86a');
  /* arms: one waves, one holds a sign that says nothing */
  R(11, 28 + arm, 4, 10, '#c99a68');
  R(33, 28 - arm, 4, 10, '#c99a68');
  R(8, 24 + arm, 7, 6, '#FFFFFF');
  R(9, 25 + arm, 5, 1, '#AA0000');
  R(9, 27 + arm, 5, 1, '#AA0000');
  /* legs */
  R(17, 40, 5, 7, '#3a2a5a');
  R(26, 40, 5, 7, '#3a2a5a');
  R(16, 45, 7, 3, '#1a1a1a');
  R(25, 45, 7, 3, '#1a1a1a');
}

function drawPot(g, x, y, pot, s, k) {
  const c = (k == null || k >= 0.999) ? pot.c : pot.c.map(h => dimCol(h, k));
  const W = Math.round(44 * s), H = Math.round(30 * s), lip = Math.max(2, Math.round(5 * s));
  /* rim, then a body that tapers in whole-pixel steps */
  g.fillStyle = c[0];
  g.fillRect(x, y, W, lip);
  g.fillStyle = c[1];
  g.fillRect(x, y, W, Math.max(1, Math.round(2 * s)));
  const steps = Math.max(3, Math.round(6 * s));
  const bodyH = H - lip;
  for (let i = 0; i < steps; i++) {
    const inset = Math.round((i / steps) * (W * 0.16));
    const yy = y + lip + Math.round(bodyH * i / steps);
    const hh = Math.ceil(bodyH / steps);
    g.fillStyle = c[0];
    g.fillRect(x + inset, yy, W - inset * 2, hh);
    g.fillStyle = c[2];
    g.fillRect(x + W - inset - Math.round(4 * s), yy, Math.round(4 * s), hh);
    g.fillStyle = c[1];
    g.fillRect(x + inset, yy, Math.max(1, Math.round(2 * s)), hh);
  }
  /* soil */
  g.fillStyle = '#4a3320';
  g.fillRect(x + Math.round(3 * s), y + Math.round(2 * s), W - Math.round(6 * s), Math.round(4 * s));
  g.fillStyle = '#5c4028';
  g.fillRect(x + Math.round(5 * s), y + Math.round(2 * s), W - Math.round(14 * s), Math.round(2 * s));
}


const PAPER = '#e8e2d4';
const wearOf = it => it.slot && it.slot !== 'free' ? { [it.slot]: it.id } : {};

/* the shelves added after the first six: a backdrop is the picture, a brush is a stroke of it, a layer is a pile of sheets,
   a pack is its list, a drink is its bottle, and the elephant is the elephant */
function drawShelf(g, cv, cat, it) {
  if (cat === 'wall') {
    const img = new Image();
    img.onload = () => {
      try {
        const s = Math.max(116 / img.width, 60 / img.height), w = img.width * s, h = img.height * s;
        g.imageSmoothingEnabled = false;
        g.drawImage(img, Math.round((116 - w) / 2), Math.round((60 - h) / 2), Math.round(w), Math.round(h));
      } catch (e) {}
    };
    img.src = it.src;
    return true;
  }
  if (cat === 'crayon') {
    g.fillStyle = PAPER; g.fillRect(0, 0, 116, 60);
    if (it.kind === 'brush') { sampleStroke(g, it.id, 116, 60); return true; }
    const n = +it.id.slice(5) || 2;                          /* layer2 .. layer5: that many sheets, fanned */
    for (let i = n - 1; i >= 0; i--) {
      g.fillStyle = i === 0 ? PAPER : 'rgba(150,200,230,0.5)'; g.fillRect(10 + i * 8, 6 + i * 4, 78, 38);
      g.fillStyle = '#6b6357'; g.fillRect(10 + i * 8, 6 + i * 4, 78, 1); g.fillRect(10 + i * 8, 43 + i * 4, 78, 1);
      g.fillRect(10 + i * 8, 6 + i * 4, 1, 38); g.fillRect(87 + i * 8, 6 + i * 4, 1, 38);
    }
    g.fillStyle = '#b23a2a'; g.fillRect(18, 22, 26, 3); g.fillRect(30, 28, 3, 10);
    return true;
  }
  if (cat === 'garage') {
    g.fillStyle = '#0a1018'; g.fillRect(0, 0, 116, 60);
    g.font = '10px monospace'; g.fillStyle = '#55FFFF';
    g.fillText(it.inst.length + ' INSTRUMENTS', 6, 11);
    g.fillStyle = '#FFFFFF';
    it.inst.forEach((id, i) => g.fillText(id.toUpperCase().slice(0, 11), 6 + (i % 2) * 58, 24 + Math.floor(i / 2) * 11));
    return true;
  }
  if (cat === 'drink') {
    g.fillStyle = '#2a1a0c'; g.fillRect(0, 0, 116, 60);
    g.fillStyle = '#3a2415'; g.fillRect(0, 52, 116, 8);
    const x = 47, y = 6;
    g.fillStyle = '#000000'; g.fillRect(x - 1, y + 14, 26, 38); g.fillRect(x + 6, y, 12, 16);
    g.fillStyle = it.glass; g.fillRect(x, y + 15, 24, 36); g.fillRect(x + 7, y + 1, 10, 15);
    g.fillStyle = it.liquor; g.fillRect(x + 2, y + 18, 20, 31); g.fillRect(x + 9, y + 3, 6, 12);
    g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(x + 3, y + 17, 3, 32);
    g.fillStyle = it.label; g.fillRect(x + 3, y + 26, 18, 14);
    g.fillStyle = '#000000'; g.fillRect(x + 6, y + 29, 12, 2); g.fillRect(x + 8, y + 34, 8, 2);
    g.fillStyle = '#FFFF55'; g.font = '9px monospace'; g.fillText(it.abv + '%', 90, 52);
    return true;
  }
  if (cat === 'elephant') {
    thumbMini(g, 116, 60, wearOf(it), it.id === 'pet' ? 'walk' : 'stand', it.id === 'pet' ? 0.4 : 0);
    if (it.id === 'pet') {
      g.fillStyle = '#FFFF55'; g.fillRect(6, 6, 8, 8); g.fillStyle = '#FF5555'; g.fillRect(6, 24, 8, 8); g.fillStyle = '#55FFFF'; g.fillRect(104, 8, 8, 8);
    }
    return true;
  }
  return false;
}

export function drawThumb(cv, cat, it) {
  const g = cv.getContext('2d');
  if (!g) return;
  g.imageSmoothingEnabled = false;
  g.fillStyle = '#000000';
  g.fillRect(0, 0, 116, 60);
  if (drawShelf(g, cv, cat, it)) return;
  if (cat === 'frame') {
    /* a little monitor, in the frame's own plastic */
    const grad = (it.vars && it.vars['--case-bg']) || '#cfc7b1';
    const face = cssFirstColor(grad, '#cfc7b1');
    const well = cssFirstColor((it.vars && it.vars['--well-bg']) || '#8c836d', '#8c836d');
    g.fillStyle = face; g.fillRect(14, 6, 88, 48);
    g.fillStyle = 'rgba(255,255,255,0.35)'; g.fillRect(14, 6, 88, 2);
    g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(14, 52, 88, 2);
    g.fillStyle = well; g.fillRect(19, 10, 78, 32);
    g.fillStyle = '#000814'; g.fillRect(22, 12, 72, 28);
    g.fillStyle = '#0000AA'; g.fillRect(24, 14, 68, 24);
    g.fillStyle = '#AAAAAA'; g.fillRect(24, 14, 68, 3);
    g.fillStyle = cssFirstColor((it.vars && it.vars['--lamp-on']) || '#6dff6d', '#6dff6d');
    g.fillRect(94, 47, 4, 4);
    g.fillStyle = 'rgba(0,0,0,0.5)'; g.fillRect(20, 46, 40, 3);
    if (it.id === 'moss') { g.fillStyle = '#4a6e2d'; g.fillRect(14, 6, 16, 10); g.fillRect(88, 44, 14, 10); }
    if (it.id === 'crack') { g.strokeStyle = '#3a2f22'; g.beginPath(); g.moveTo(100, 8); g.lineTo(84, 20); g.lineTo(88, 26); g.stroke(); }
    if (it.id === 'gold') { g.fillStyle = '#FFFFFF'; g.fillRect(56, 2, 4, 5); g.fillRect(53, 3, 10, 2); }
    return;
  }
  if (cat === 'logo') {
    const svg = (it.id === 'temple') ? LOGOS[0].svg : it.svg;
    if (!svg) return;
    const img = new Image();
    img.onload = () => {
      try {
        g.fillStyle = '#000000'; g.fillRect(0, 0, 116, 60);
        g.drawImage(img, 18, 0, 80, 60);
      } catch (e) {}
    };
    img.src = 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
    return;
  }
  if (cat === 'cursor') {
    if (it.system || !it.mask) {
      g.fillStyle = '#AAAAAA';
      g.font = '15px monospace';
      g.fillText('SYSTEM', 34, 34);
      return;
    }
    const S = 4, w = it.mask[0].length, h = it.mask.length;
    const ox = Math.round((116 - w * S) / 2), oy = Math.round((60 - h * S) / 2);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const ch = it.mask[y].charAt(x);
        if (ch === '.' || ch === ' ') continue;
        g.fillStyle = (ch === 'X') ? it.o : it.f;
        g.fillRect(ox + x * S, oy + y * S, S, S);
      }
    }
    return;
  }
  if (cat === 'scheme') {
    const v = it.v;
    g.fillStyle = v.bg; g.fillRect(0, 0, 116, 60);
    g.fillStyle = v.dim; g.fillRect(0, 0, 116, 8);
    g.font = '11px monospace';
    const rows = [[v.ok, '::/> DIR'], [v.fg, 'AUTOEXEC.HC'], [v.hi, 'GOD.DD'], [v.err, 'DISK ERROR'], [v.acc, '::/> _']];
    rows.forEach((r, i) => { g.fillStyle = r[0]; g.fillText(r[1], 5, 20 + i * 9); });
    return;
  }
  if (cat === 'pot') {
    g.fillStyle = '#1d1a12'; g.fillRect(0, 0, 116, 60);
    drawPot(g, 25, 13, it, 1.5);
    return;
  }
  if (cat === 'seed') {
    g.fillStyle = '#1d1a12'; g.fillRect(0, 0, 116, 60);
    drawPot(g, 40, 34, POTS[0], 0.8);
    drawPlant(g, 57, 36, it, 3, 0, 0.9, 0, false);
    return;
  }
}

