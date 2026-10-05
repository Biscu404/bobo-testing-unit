/* The look of the place. Backdrops are painted once per region and size onto a
   cache canvas; only the motes and the fog move. Palettes come from data.js. */
import { makeGfx, rng, LW, LH } from './gfx.js';

const cache = {};
export function backdrop(G, region) {
  const key = region.id + ':' + G.W + 'x' + G.H;
  if (cache.key !== key) {
    const cv = document.createElement('canvas');
    cv.width = G.W; cv.height = G.H;
    const B = makeGfx(cv);
    paint(B, region);
    cache.key = key; cache.cv = cv;
  }
  G.g.drawImage(cache.cv, 0, 0);
}

function paint(B, rg) {
  const p = rg.pal, R = rng(rg.id.charCodeAt(0) * 977 + rg.id.length);
  /* the air: nine bands, dark at the top, a little lit at the horizon */
  B.fill(p.a);
  const band = LH / 9;
  for (let i = 0; i < 9; i++) {
    B.R(0, i * band, LW, band + 1, mix(p.a, p.b, i / 8));
  }
  B.R(0, 400, LW, 240, p.b);
  /* far ranks: pillars, drowned in the haze */
  for (let k = 0; k < 11; k++) {
    const x = k * 92 - 20 + R() * 40, h = 150 + R() * 190, w = 26 + R() * 30;
    B.a(0.45); B.R(x, 520 - h, w, h, mix(p.b, p.c, 0.5)); B.R(x - 5, 520 - h, w + 10, 8, mix(p.b, p.c, 0.7)); B.a(1);
  }
  motif(B, rg, R);
  /* the ceiling: teeth */
  for (let x = 0; x < LW; x += 14) {
    const h = 10 + R() * 70 * (R() < 0.3 ? 1.7 : 1);
    B.R(x, 0, 16, h, '#04050a'); B.R(x + 4, h, 8, 8 + R() * 14, '#04050a'); B.R(x + 6, h + 8, 4, 8, '#04050a');
  }
  /* the floor: black ground with a lit lip */
  B.R(0, 600, LW, 40, '#04050a');
  for (let x = 0; x < LW; x += 10) B.R(x, 596 - R() * 8, 12, 8, '#04050a');
  /* the vignette: rings of shadow closing in */
  for (let i = 0; i < 9; i++) {
    B.a(0.07);
    B.R(0, 0, LW, 8 + i * 6, '#000'); B.R(0, LH - 8 - i * 6, LW, 8 + i * 6, '#000');
    B.R(0, 0, 10 + i * 8, LH, '#000'); B.R(LW - 10 - i * 8, 0, 10 + i * 8, LH, '#000');
  }
  B.a(1);
}

/* the thing each region is known by */
function motif(B, rg, R) {
  const p = rg.pal;
  const dark = '#04050a';
  if (rg.id === 'cross') {
    for (let k = 0; k < 4; k++) {                     /* arches, and a lantern on a chain */
      const x = 60 + k * 240;
      B.R(x, 150, 14, 380, dark); B.R(x + 130, 150, 14, 380, dark); B.R(x + 14, 136, 116, 14, dark);
      B.R(x + 28, 122, 88, 14, dark); B.R(x + 46, 108, 52, 14, dark);
      B.R(x + 70, 0, 3, 90, p.c); B.R(x + 64, 90, 15, 20, p.glow); B.R(x + 67, 94, 9, 12, '#fff');
    }
  } else if (rg.id === 'green') {
    for (let k = 0; k < 20; k++) {                    /* vines from the roof, and leaves */
      const x = R() * LW, h = 60 + R() * 280;
      B.R(x, 0, 4, h, '#06150c');
      for (let y = 30; y < h; y += 34) { B.R(x - 12, y, 14, 7, '#0b2616'); B.R(x + 4, y + 14, 14, 7, '#0b2616'); }
    }
    for (let k = 0; k < 14; k++) B.R(R() * LW, 560 + R() * 30, 50 + R() * 90, 14, '#0d2a18');
  } else if (rg.id === 'fungal') {
    for (let k = 0; k < 9; k++) {                     /* mushrooms, with lit spots */
      const x = 30 + k * 108 + R() * 40, h = 140 + R() * 220, w = 90 + R() * 70;
      B.R(x + w / 2 - 10, 600 - h, 20, h, '#0a0614');
      B.R(x, 600 - h - 18, w, 22, '#0d0819'); B.R(x + 12, 600 - h - 32, w - 24, 16, '#0d0819');
      for (let s = 0; s < 4; s++) B.R(x + 14 + R() * (w - 34), 600 - h - 14 + R() * 6, 6, 6, p.glow);
    }
  } else if (rg.id === 'city') {
    for (let k = 0; k < 7; k++) {                     /* spires and lit windows */
      const x = k * 140 + R() * 30, h = 260 + R() * 220, w = 70 + R() * 30;
      B.R(x, 600 - h, w, h, '#060b12'); B.R(x + w / 2 - 4, 600 - h - 60, 8, 60, '#060b12');
      B.R(x + w / 2 - 14, 600 - h - 22, 28, 22, '#060b12');
      for (let y = 600 - h + 24; y < 580; y += 38) for (let xx = x + 12; xx < x + w - 14; xx += 24) if (R() < 0.3) B.R(xx, y, 9, 16, '#caa75c');
    }
  } else if (rg.id === 'deep') {
    for (let k = 0; k < 9; k++) {                     /* webs: spokes and rings */
      const cx = R() * LW, cy = R() * 360, rad = 60 + R() * 90;
      for (let s = 0; s < 8; s++) {
        const an = s * Math.PI / 4;
        B.line(cx, cy, cx + Math.cos(an) * rad, cy + Math.sin(an) * rad, '#2a1a16', 2);
      }
      for (let ring = 1; ring <= 3; ring++) for (let s = 0; s < 8; s++) {
        const a0 = s * Math.PI / 4, a1 = (s + 1) * Math.PI / 4, rr = rad * ring / 3.4;
        B.line(cx + Math.cos(a0) * rr, cy + Math.sin(a0) * rr, cx + Math.cos(a1) * rr, cy + Math.sin(a1) * rr, '#2a1a16', 2);
      }
    }
  } else {
    for (let k = 0; k < 8; k++) B.R(40 + k * 120 + R() * 30, 0, 16 + R() * 26, 610, '#020204');
  }
}

const mix = (a, b, t) => {
  const A = parseInt(a.slice(1), 16), Bc = parseInt(b.slice(1), 16);
  const ch = s => Math.round(((A >> s) & 255) * (1 - t) + ((Bc >> s) & 255) * t);
  return '#' + ((1 << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).slice(1);
};
export { mix };

/* the weather inside the room: motes rising (or, in the city, rain falling),
   and two slow banks of fog */
const moteSet = {};
export function weather(G, rg, t) {
  const rain = rg.id === 'city';
  let ms = moteSet[rg.id];
  if (!ms) { const R = rng(7 + rg.id.length * 31); ms = moteSet[rg.id] = Array.from({ length: rain ? 70 : 46 }, () => [R() * LW, R() * LH, 0.3 + R() * 0.9, R()]); }
  ms.forEach(m => {
    const y = rain ? (m[1] + t * 0.35 * (80 + m[2] * 90)) % LH : LH - ((LH - m[1] + t * 0.02 * (8 + m[2] * 22)) % LH);
    const x = rain ? (m[0] - y * 0.12 + LW * 2) % LW : (m[0] + Math.sin(t / 900 + m[3] * 6) * 14);
    G.a(rain ? 0.35 : 0.25 + 0.4 * Math.abs(Math.sin(t / 700 + m[3] * 9)));
    if (rain) G.R(x, y, 2, 10 * m[2], rg.pal.mote); else G.R(x, y, 2 + (m[2] > 0.9 ? 2 : 0), 2 + (m[2] > 0.9 ? 2 : 0), rg.pal.glow);
  });
  G.a(0.06);
  for (let k = 0; k < 2; k++) {
    const off = ((t * 0.01 * (k + 1)) % LW);
    for (let i = -1; i < 3; i++) G.R(i * LW / 2 + off * (k ? -1 : 1) + (k ? LW / 2 : 0), 380 + k * 90, LW * 0.6, 56, rg.pal.ink);
  }
  G.a(1);
}

/* ---- small things ---------------------------------------------------------- */
const MASK = ['.XXXXXXXX.', 'XXXXXXXXXX', 'XXXXXXXXXX', 'XXX.XX.XXX', 'XX..XX..XX', 'XXXXXXXXXX', '.XXXXXXXX.', '..XXXXXX..'];
const MASK_EYE = ['..........', '..........', '..........', '...x..x...', '..xx..xx..', '..........', '..........', '..........'];
export function mask(G, x, y, s, kind) {
  const col = kind === 'full' ? '#f2efe4' : kind === 'blue' ? '#7fc8ff' : '#2c3140';
  G.bmp(MASK, x, y, s, { X: col });
  if (kind !== 'empty') G.bmp(MASK_EYE, x, y, s, { x: '#0b0e16' });
  else G.R(x + 3 * s, y + 3 * s, s, s, '#4a5068');
}
/* the soul vessel: a round glass that fills from the bottom */
export function vessel(G, cx, cy, r, f, t) {
  const rows = r * 2;
  for (let j = 0; j < rows; j++) {
    const dy = j - r + 0.5, hw = Math.floor(Math.sqrt(Math.max(0, r * r - dy * dy)));
    const lit = j >= rows * (1 - f);
    const wob = lit && j < rows * (1 - f) + 2 ? Math.round(Math.sin(t / 220 + j)) : 0;
    G.R(cx - hw, cy - r + j, hw * 2, 1, '#1a1f2c');
    if (lit) G.R(cx - hw + 2 + wob, cy - r + j, Math.max(0, hw * 2 - 4), 1, f >= 1 ? '#fff' : '#cfe6ff');
    G.R(cx - hw, cy - r + j, 2, 1, '#8a96b4'); G.R(cx + hw - 2, cy - r + j, 2, 1, '#8a96b4');
  }
  G.R(cx - 3, cy - r + 3, 4, 3, '#fff');
}
const GEO = ['..XX..', '.XaaX.', 'XaaXaX', 'XaXXaX', '.XaaX.', '..XX..'];
export const geo = (G, x, y, s) => G.bmp(GEO, x, y, s, { X: '#c9b27a', a: '#f2e2b0' });
const BENCH = ['..XXXXXXXX..', '..X......X..', 'XXXXXXXXXXXX', 'X..........X', 'X..........X', 'XX........XX'];
export const bench = (G, x, y, s, c) => G.bmp(BENCH, x, y, s, { X: c || '#e6dcc0' });
const SKULL = ['.XXXXXX.', 'XXXXXXXX', 'X.XXXX.X', 'X.XXXX.X', 'XXXXXXXX', '.XX..XX.', '.X.XX.X.'];
export const skull = (G, x, y, s, c) => G.bmp(SKULL, x, y, s, { X: c || '#e6dcc0' });
const SHADE = ['..XXXX..', '.XXXXXX.', 'XX.XX.XX', 'XXXXXXXX', 'XXXXXXXX', 'X.XX.XXX', '.X..X.X.'];
export const shade = (G, x, y, s, c) => G.bmp(SHADE, x, y, s, { X: c || '#9bb0ff' });
const NOTCH = ['.XX.', 'XXXX', 'XXXX', '.XX.'];
export const notch = (G, x, y, s, on) => G.bmp(NOTCH, x, y, s, { X: on ? '#e8e2d4' : '#2c3140' });
export const charmIcon = (G, x, y, s, id, on) => {
  /* a charm is a ring with a mark in it; the mark is a little different for each */
  const h = id.split('').reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7), R = rng(h);
  G.R(x, y + s, s * 8, s * 6, on ? '#e8e2d4' : '#4a5068'); G.R(x + s, y, s * 6, s * 8, on ? '#e8e2d4' : '#4a5068');
  G.R(x + s * 2, y + s * 2, s * 4, s * 4, '#0b0e16');
  for (let k = 0; k < 4; k++) G.R(x + s * (2 + Math.floor(R() * 4)), y + s * (2 + Math.floor(R() * 4)), s, s, '#7fc8ff');
};
