/* The bottle and the table. Everything is flat rects (the stag is a few of
   them); the bottle, which turns, is baked into layers once and turned by
   sampling (raster.js), so nothing on this table has a soft edge. Its
   coordinates are local: the origin is the middle of the base, y up is
   negative. The glass has its own file (glass3d.js), and nobody is drawn
   here: the person drinking is the one at the monitor. */
export const BW = 380, BH = 360;
export const C = {
  glass: '#1f5a28', glassHi: '#46a04e', glassLo: '#0f2f16', glassMid: '#2b7434', edge: '#0a1c0e',
  liquid: '#6e3a14', liquidHi: '#b26a24', liquidLo: '#44220a', foam: '#e9c98a',
  label: '#f08a14', labelHi: '#ffae3c', labelDk: '#b8620c', ink: '#14100a', glow: '#fff3b0',
  cap: '#195226', capHi: '#2f8a42', band: '#e07a10',
  wood: '#3a2415', woodHi: '#4d3020', shot: '#c9d4dc', shotHi: '#ffffff', white: '#f2f4f7', dim: '#9aa3ad'
};

/* the bottle: sprite 80 x 246, art origin at (40, 242), turns about its middle */
export const BOT = { w: 80, h: 246, ox: 40, oy: 242, cx: 40, cy: 121, lip: [13, -224], lipUp: [-13, -224], rest: [70, 246] };
/* the tumbler is an object, not a sprite (glass3d.js); this is where its base sits on the table */
export const GLS = { rest: [328, 292] };

const mk = (_w, _h, fn) => g => { g.save(); fn(g); g.restore(); };
const Rf = g => (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h))); };

export function makeArt(g) {
  const R = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h))); };
  const T = (t, x, y, c, sz, al, font) => { g.fillStyle = c; g.font = (sz || 9) + 'px ' + (font || 'monospace');
    g.textAlign = al || 'left'; g.fillText(String(t), Math.round(x), Math.round(y)); g.textAlign = 'left'; };

  /* ---- layers for raster.js, in art coordinates --------------------------- */
  const shape = f => {                                   /* f(x0, y0, w, h) fills one slab of the bottle */
    f(-38, -150, 76, 148);                               /* body */
    f(-36, -2, 72, 2);                                   /* the heavy base */
    for (let y = -150; y > -178; y -= 2) {               /* shoulder: stepped in */
      const k = (-150 - y) / 28, hw = 38 - 25 * Math.pow(k, 1.5);
      f(-hw, y - 2, hw * 2, 2);
    }
    f(-13, -218, 26, 42);                                /* neck */
    f(-16, -224, 32, 7);                                 /* lip */
  };
  const stag = (r, x, y, s) => {
    const q = (a, b, w2, h2) => r(x + a * s, y + b * s, Math.max(1, w2 * s), Math.max(1, h2 * s), C.ink);
    q(4, 5, 5, 5); q(5, 10, 3, 3); q(3, 7, 1, 2); q(9, 7, 1, 2);
    q(3, 1, 1, 5); q(9, 1, 1, 5); q(1, 2, 2, 1); q(10, 2, 2, 1); q(1, 2, 1, 2); q(11, 2, 1, 2);
    q(2, 0, 2, 1); q(9, 0, 2, 1); q(0, 4, 1, 2); q(12, 4, 1, 2);
    r(x + 6 * s, y - 5.2 * s, 1.2 * s, 5 * s, C.ink); r(x + 4.6 * s, y - 3.4 * s, 4 * s, 1.2 * s, C.ink);
    r(x + 6.2 * s, y - 5 * s, 0.8 * s, 4.6 * s, '#fffbe0'); r(x + 4.8 * s, y - 3.2 * s, 3.6 * s, 0.8 * s, '#fffbe0');
  };
  const bottleSpec = {
    w: BOT.w, h: BOT.h, cx: BOT.cx, cy: BOT.cy,
    base: mk(0, 0, g2 => {
      const r = Rf(g2); g2.translate(BOT.ox, BOT.oy);
      shape((x, y, w, h) => r(x, y, w, h, C.glass));
      r(-36, -146, 3, 140, C.glassMid); r(28, -146, 9, 144, C.glassLo);
      g2.fillStyle = C.glassMid; g2.font = '6px monospace'; g2.textAlign = 'center'; g2.fillText('JÄGERMEISTER', 0, -152);
    }),
    inner: mk(0, 0, g2 => {
      const r = Rf(g2); g2.translate(BOT.ox, BOT.oy);
      /* the liquor fills the body, the shoulder and the neck, not the flange of the lip */
      shape((x, y, w, h) => {
        if (h > 100) r(x + 4, y + 2, w - 8, h - 4, '#fff');                 /* body */
        else if (h === 2 && y > -224 && w > 30) r(x + 4, y, w - 8, 2, '#fff'); /* the shoulder, a step at a time */
        else if (w === 26) r(x + 4, y, w - 8, h, '#fff');                     /* the neck */
        else if (w === 32) r(x + 7, y + 2, w - 14, h - 2, '#fff');            /* the lip: no wider than the neck */
      });
    }),
    over: [true, false].map(capOn => mk(0, 0, g2 => {
      const r = Rf(g2); g2.translate(BOT.ox, BOT.oy);
      /* the light down the left of the glass, over whatever is behind it */
      g2.globalAlpha = 0.34; shape((x, y, w, h) => { if (w > 16) r(x + 3, y, Math.min(7, w / 4), h, '#d8f4d8'); }); g2.globalAlpha = 1;
      const lx = -30, ly = -126, lw = 60, lh = 94;
      r(lx, ly, lw, lh, C.label); r(lx, ly, lw, 3, C.labelHi); r(lx, ly + lh - 3, lw, 3, C.labelDk);
      r(lx + 3, ly + 3, lw - 6, 1, C.ink); r(lx + 3, ly + lh - 4, lw - 6, 1, C.ink);
      r(lx + 3, ly + 3, 1, lh - 6, C.ink); r(lx + lw - 4, ly + 3, 1, lh - 6, C.ink);
      g2.fillStyle = C.ink; g2.textAlign = 'center';
      g2.font = 'bold 9px serif'; g2.fillText('Jägermeister', 0, ly + 17);
      stag(r, -17, ly + 34, 2.6);
      g2.font = '6px monospace'; g2.fillText('KRÄUTERLIKÖR', 0, ly + lh - 14);
      g2.font = '5px monospace'; g2.fillText('35% vol · 56 herbs', 0, ly + lh - 7);
      r(-13, -206, 26, 7, C.band); r(-13, -206, 26, 1, C.labelHi);
      if (capOn) { r(-15, -238, 30, 15, C.cap); r(-15, -238, 30, 3, C.capHi); for (let x = -13; x < 14; x += 4) r(x, -234, 1, 9, C.glassLo); }
    })),
    /* seen through green glass, the liquor is nearly black */
    liquid: { base: '#2a180a', mid: '#3c2410', hi: '#8a5a24', edge: '#180e06', foam: '#e9c98a' }
  };

  /* ---- the room --------------------------------------------------------- */
  function table() {
    R(0, 0, BW, BH, C.wood);
    for (let y = 0; y < BH; y += 7) R(0, y, BW, 1, y % 14 ? C.woodHi : C.wood);
    R(0, 250, BW, 3, '#221407'); R(0, 253, BW, 107, '#2c1b0f');
    for (let y = 255; y < BH; y += 6) R(0, y, BW, 1, '#33200f');
  }
  const shadow = (x, y, w) => { g.globalAlpha = 0.35; R(x - w / 2, y, w, 4, '#000'); g.globalAlpha = 1; };
  function capOnBar() { R(104, 238, 18, 8, C.cap); R(104, 238, 18, 2, C.capHi); R(102, 246, 22, 2, '#150f08'); }

  return { R, T, table, shadow, capOnBar, bottleSpec };
}
