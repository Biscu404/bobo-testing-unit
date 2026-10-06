/* The bottle, the glass, the table, the person. Everything is flat rects (the
   stag is a few of them); the things that turn -- the bottle and the glass --
   are baked into layers once and turned by sampling (raster.js), so nothing on
   this table has a soft edge. Coordinates for the bottle and the glass are
   local: the origin is the middle of the base, y up is negative. */
export const BW = 380, BH = 360;
export const C = {
  glass: '#1f5a28', glassHi: '#46a04e', glassLo: '#0f2f16', glassMid: '#2b7434', edge: '#0a1c0e',
  liquid: '#6e3a14', liquidHi: '#b26a24', liquidLo: '#44220a', foam: '#e9c98a',
  label: '#f08a14', labelHi: '#ffae3c', labelDk: '#b8620c', ink: '#14100a', glow: '#fff3b0',
  cap: '#195226', capHi: '#2f8a42', band: '#e07a10',
  wood: '#3a2415', woodHi: '#4d3020', shot: '#c9d4dc', shotHi: '#ffffff', white: '#f2f4f7', dim: '#9aa3ad',
  skin: '#d9a47c', skinLo: '#b57d5a', skinHi: '#f0c4a0', hair: '#2a1a12', hairHi: '#4a3020', lip: '#b8544a', shirt: '#3a4a7a'
};

/* the bottle: sprite 80 x 246, art origin at (40, 242), turns about its middle */
export const BOT = { w: 80, h: 246, ox: 40, oy: 242, cx: 40, cy: 121, lip: [13, -224], lipUp: [-13, -224], rest: [70, 246] };
/* the tumbler: sprite 72 x 74, art origin at (36, 72), turns about its middle */
export const GLS = { w: 72, h: 74, ox: 36, oy: 72, cx: 36, cy: 37, rim: [[-32, -70], [32, -70]], rest: [328, 292], hw: 28 };
/* where the stream should land, and where the person's lips are */
export const LIPS = { x: 258, y: 150 };

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

  const glassSpec = {
    w: GLS.w, h: GLS.h, cx: GLS.cx, cy: GLS.cy,
    base: mk(0, 0, g2 => {
      const r = Rf(g2); g2.translate(GLS.ox, GLS.oy);
      r(-32, -70, 4, 70, C.shot); r(28, -70, 4, 70, C.shot); r(-32, -6, 64, 6, C.shot);
      r(-28, -8, 56, 2, '#8fa0ac');                                  /* the thick floor, seen from the side */
    }),
    inner: mk(0, 0, g2 => { const r = Rf(g2); g2.translate(GLS.ox, GLS.oy); r(-28, -68, 56, 62, '#fff'); }),
    over: [mk(0, 0, g2 => {
      const r = Rf(g2); g2.translate(GLS.ox, GLS.oy);
      g2.globalAlpha = 0.55; r(-26, -64, 2, 52, '#ffffff'); g2.globalAlpha = 0.25; r(-22, -64, 1, 50, '#ffffff');
      g2.globalAlpha = 1; r(-32, -70, 64, 2, C.shotHi);
    })],
    liquid: { base: '#7a3f12', mid: '#a2581c', hi: '#e0903a', edge: '#5c2e0c', foam: '#f0d9a0' }
  };
  /* the hand round the tumbler: fingers across the front, thumb on the near side */
  const handSpec = {
    w: GLS.w, h: GLS.h, cx: GLS.cx, cy: GLS.cy,
    base: mk(0, 0, g2 => {
      const r = Rf(g2); g2.translate(GLS.ox, GLS.oy);
      [-30, -21, -12].forEach((y, i) => {
        r(-4 + i, y, 38 - i, 7, C.skin); r(-4 + i, y + 5, 38 - i, 2, C.skinLo); r(-4 + i, y, 38 - i, 1, C.skinHi);
        r(-6 + i, y + 1, 3, 5, C.skin);
      });
      r(-34, -27, 13, 6, C.skin); r(-34, -23, 13, 2, C.skinLo);        /* the thumb */
    }),
    inner: null, over: [], liquid: { base: '#000', mid: '#000', hi: '#000', edge: '#000' }
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

  /* ---- the person: a profile, facing right. (hx, hy) is the top-left of the
     head's box; mouth 0..1 opens, eyes 0 open .. 1 shut, gulp is how far down
     the neck a swallow has got (-1 for none). */
  const lerpTab = (tab, y) => {
    for (let i = 1; i < tab.length; i++) if (y <= tab[i][0]) { const a = tab[i - 1], b = tab[i]; return a[1] + (b[1] - a[1]) * (y - a[0]) / (b[0] - a[0]); }
    return tab[tab.length - 1][1];
  };
  const FRONT = [[0, 30], [6, 41], [14, 47], [24, 50], [32, 49], [36, 52], [40, 49], [46, 52], [51, 58], [56, 62], [59, 58], [62, 56], [65, 57], [68, 54], [71, 54], [74, 56], [77, 53], [82, 54], [88, 52], [93, 47], [97, 40], [102, 36], [140, 36]];
  const backX = y => y < 98 ? 24 - 24 * Math.sqrt(Math.max(0, 1 - Math.pow((y - 40) / 46, 2))) : 14 + (y - 98) * 0.1;
  function face(hx, hy, st) {
    const H = 140;
    for (let y = 0; y < H; y++) {
      const xf = lerpTab(FRONT, y), xb = backX(y);
      R(hx + xb, hy + y, xf - xb, 1, y > 84 ? C.skinLo : C.skin);
    }
    for (let y = 98; y < H; y++) R(hx + 14 + (y - 98) * 0.1, hy + y, 8, 1, '#8c5a40');                /* the neck's shadow */
    R(hx + 18, hy + 128, 40, 12, C.shirt); R(hx + 10, hy + 132, 56, 8, C.shirt);                          /* collar */
    /* hair: over the top, back along the temple, and down the back of the head */
    for (let y = 0; y < 72; y++) {
      const xf = lerpTab(FRONT, y), xb = backX(y);
      const to = y < 12 ? xf - 1 : y < 46 ? Math.max(xb + 7, xf - 1 - (y - 12) * 1.1) : xb + 4;
      R(hx + xb - 1, hy + y, Math.max(2, to - xb + 1), 1, y % 5 === 0 ? C.hairHi : C.hair);
    }
    R(hx + 24, hy + 48, 8, 14, C.skinLo); R(hx + 26, hy + 51, 4, 8, '#8c5a40');                            /* the ear */
    /* the face itself */
    R(hx + 38, hy + 34, 12, 2, C.hair);                                                                /* brow */
    const eye = st.eyes || 0;
    if (eye > 0.5) R(hx + 40, hy + 42, 7, 1, C.hair); else { R(hx + 41, hy + 40, 5, 4, '#f2f2f2'); R(hx + 44, hy + 41, 2, 3, '#2a2a3a'); }
    R(hx + 56, hy + 58, 5, 2, C.skinLo);                                                               /* under the nose */
    const m = st.mouth || 0;
    R(hx + 51, hy + 65, 5, 3, C.lip); R(hx + 51, hy + 72 + m * 2, 5, 3, C.lip);                        /* the lips */
    if (m > 0.05) R(hx + 52, hy + 68, 3 + m * 2, 4 + m * 2, '#3a1010');                                /* open */
    else R(hx + 51, hy + 69, 5, 1, '#6a2a24');
    R(hx + 50, hy + 83, 3, 2, C.skinHi);
    /* a swallow, travelling down the throat */
    if (st.gulp >= 0) R(hx + 40, hy + 92 + st.gulp * 16, 6, 4, '#8c5a40');
  }

  /* an arm, from the hand to somewhere off the bottom right */
  function arm(x, y) {
    g.fillStyle = C.skin;
    g.beginPath(); g.moveTo(x - 6, y - 4); g.lineTo(x + 22, y - 8); g.lineTo(x + 140, y + 120); g.lineTo(x + 90, y + 140); g.closePath(); g.fill();
    g.fillStyle = C.skinLo;
    g.beginPath(); g.moveTo(x + 22, y - 8); g.lineTo(x + 28, y - 4); g.lineTo(x + 140, y + 130); g.lineTo(x + 130, y + 120); g.closePath(); g.fill();
  }

  return { R, T, table, shadow, capOnBar, face, arm, bottleSpec, glassSpec, handSpec };
}
