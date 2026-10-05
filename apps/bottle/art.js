/* The bottle, the glass, the stream. Flat rects wherever it can be: the only
   things that are not are the tilted bottle and the tilted glass, which turn
   as a whole. Local coordinates for the bottle: origin at the middle of its
   base, y up is negative. */
export const BW = 380, BH = 360;
export const C = {
  glass: '#1f5a28', glassHi: '#46a04e', glassLo: '#0f2f16', glassMid: '#2b7434', edge: '#0a1c0e',
  liquid: '#6e3a14', liquidHi: '#b26a24', liquidLo: '#44220a', foam: '#e9c98a',
  label: '#f08a14', labelHi: '#ffae3c', labelDk: '#b8620c', ink: '#14100a', glow: '#fff3b0',
  cap: '#195226', capHi: '#2f8a42', band: '#e07a10',
  wood: '#3a2415', woodHi: '#4d3020', shot: '#c9d4dc', shotHi: '#ffffff', white: '#f2f4f7', dim: '#9aa3ad'
};
export const GEOM = { base: [70, 246], glass: { x: 296, y: 222, w: 64, h: 70 } };

export function makeArt(g) {
  const R = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h))); };
  const T = (t, x, y, c, sz, al, font) => { g.fillStyle = c; g.font = (sz || 9) + 'px ' + (font || 'monospace');
    g.textAlign = al || 'left'; g.fillText(String(t), Math.round(x), Math.round(y)); g.textAlign = 'left'; };

  /* the stag, in as few rectangles as will still read as a stag, with the
     cross between its antlers lit */
  function stag(x, y, s) {
    const q = (a, b, w2, h2) => R(x + a * s, y + b * s, Math.max(1, w2 * s), Math.max(1, h2 * s), C.ink);
    q(4, 5, 5, 5); q(5, 10, 3, 3); q(3, 7, 1, 2); q(9, 7, 1, 2);
    q(3, 1, 1, 5); q(9, 1, 1, 5); q(1, 2, 2, 1); q(10, 2, 2, 1); q(1, 2, 1, 2); q(11, 2, 1, 2);
    q(2, 0, 2, 1); q(9, 0, 2, 1); q(0, 4, 1, 2); q(12, 4, 1, 2);
    g.globalAlpha = 0.5; R(x + 4.4 * s, y - 6.2 * s, 4.4 * s, 7 * s, C.glow); g.globalAlpha = 1;
    R(x + 6 * s, y - 5.2 * s, 1.2 * s, 5 * s, C.ink);
    R(x + 4.6 * s, y - 3.4 * s, 4 * s, 1.2 * s, C.ink);
    R(x + 6.2 * s, y - 5 * s, 0.8 * s, 4.6 * s, '#fffbe0'); R(x + 4.8 * s, y - 3.2 * s, 3.6 * s, 0.8 * s, '#fffbe0');
  }

  /* the body of a Jägermeister bottle: a square-shouldered green slab, a stepped
     shoulder, a long neck, a lip, and (when it is on) the cap */
  function shape(f) { /* f(x0, y0, w, h) fills one slab */
    f(-38, -150, 76, 148);                                  /* body */
    f(-36, -2, 72, 2);                                      /* the heavy base */
    for (let y = -150; y > -178; y -= 2) {                  /* shoulder: stepped in */
      const k = (-150 - y) / 28, hw = 38 - 25 * Math.pow(k, 1.5);
      f(-hw, y - 2, hw * 2, 2);
    }
    f(-13, -218, 26, 42);                                   /* neck */
    f(-16, -224, 32, 7);                                    /* lip */
  }

  /* what is in it: clipped to the inside of the glass, kept level with the
     room however far the bottle has turned */
  function liquid(f, tilt, wob, ts) {
    g.save();
    g.beginPath();
    shape((x, y, w, h) => g.rect(x + 4, y + 2, Math.max(0, w - 8), Math.max(0, h - 2)));
    g.clip();
    g.translate(0, -80); g.rotate(-tilt);
    const topY = -4 - f * 166 + 80;                        /* level, relative to the turning point */
    const s = topY - 20 * Math.sin(tilt) * (1 - f * 0.3);
    R(-120, s, 240, 300, C.liquid);
    R(-120, s, 240, 2, C.liquidHi);
    for (let x = -50; x < 50; x += 6) R(x, s + Math.sin(ts * 7 + x * 0.3) * wob, 5, 1, C.liquidHi);
    R(-120, s + 6, 240, 1, C.liquidLo);
    g.restore();
  }

  function bottle(S, ts) {
    const { tilt, tx, ty, level, wob, capOn } = S.pose;
    g.save();
    g.translate(GEOM.base[0] + tx, GEOM.base[1] + ty);
    g.rotate(tilt);
    shape((x, y, w, h) => R(x, y, w, h, C.glass));
    shape((x, y, w, h) => { if (w > 16) R(x + 3, y, Math.min(7, w / 4), h, C.glassHi); });
    R(-36, -146, 3, 140, C.glassMid); R(28, -146, 9, 144, C.glassLo);
    /* embossed lettering round the shoulder */
    T('JÄGERMEISTER', 0, -152, C.glassMid, 6, 'center');
    liquid(level, tilt, wob, ts);
    /* the label: orange, square, ruled in black */
    const lx = -30, ly = -126, lw = 60, lh = 94;
    R(lx, ly, lw, lh, C.label); R(lx, ly, lw, 3, C.labelHi); R(lx, ly + lh - 3, lw, 3, C.labelDk);
    R(lx + 3, ly + 3, lw - 6, 1, C.ink); R(lx + 3, ly + lh - 4, lw - 6, 1, C.ink);
    R(lx + 3, ly + 3, 1, lh - 6, C.ink); R(lx + lw - 4, ly + 3, 1, lh - 6, C.ink);
    T('Jägermeister', 0, ly + 17, C.ink, 9, 'center', 'bold 9px serif');
    stag(-17, ly + 34, 2.6);
    T('KRÄUTERLIKÖR', 0, ly + lh - 14, C.ink, 6, 'center');
    T('35% vol · 56 herbs', 0, ly + lh - 7, C.ink, 5, 'center');
    /* the neck label, and the green foil round the lip */
    R(-13, -206, 26, 7, C.band); R(-13, -206, 26, 1, C.labelHi);
    if (capOn) { R(-15, -238, 30, 15, C.cap); R(-15, -238, 30, 3, C.capHi); for (let x = -13; x < 14; x += 4) R(x, -234, 1, 9, C.glassLo); }
    /* air going in as the liquor comes out */
    S.bubbles.forEach(b => { g.globalAlpha = 0.7; R(b.x, b.y, b.r, b.r, '#d8f0d0'); });
    g.globalAlpha = 1;
    g.restore();
  }

  function table() {
    R(0, 0, BW, BH, C.wood);
    for (let y = 0; y < BH; y += 7) R(0, y, BW, 1, y % 14 ? C.woodHi : C.wood);
    R(0, 250, BW, 3, '#221407'); R(0, 253, BW, 107, '#2c1b0f');
    for (let y = 255; y < BH; y += 6) R(0, y, BW, 1, '#33200f');
  }
  function capOnBar() {
    R(104, 238, 18, 8, C.cap); R(104, 238, 18, 2, C.capHi); R(102, 246, 22, 2, '#150f08');
  }

  /* the glass: a heavy-based tumbler. tilt/lift are for drinking from it */
  function glass(S, ts) {
    const G = GEOM.glass, f = S.glassFill, d = S.drinkPose;
    g.save();
    if (d) { g.translate(G.x + G.w / 2 + d.x, G.y + G.h + d.y); g.rotate(d.r); g.translate(-(G.x + G.w / 2), -(G.y + G.h)); }
    R(G.x - 8, G.y + G.h + 6, G.w + 16, 5, '#1a1008');
    R(G.x + 2, G.y, G.w - 4, G.h, '#5c4a38'); R(G.x + 4, G.y + 2, G.w - 8, G.h - 6, '#6b5642');
    if (f > 0.01) {
      const fh = Math.round((G.h - 10) * f), top = G.y + G.h - 5 - fh;
      g.save(); g.beginPath(); g.rect(G.x + 4, G.y + 2, G.w - 8, G.h - 6); g.clip();
      if (d) { g.translate(G.x + G.w / 2, G.y + G.h); g.rotate(-d.r); g.translate(-(G.x + G.w / 2), -(G.y + G.h)); }
      const t2 = d ? G.y + G.h - 5 - fh + 6 * Math.abs(d.r) : top;
      R(G.x, t2, G.w, G.h, C.liquid);
      R(G.x + 4, t2, G.w - 8, 3, C.liquidHi);
      /* the surface moves where the stream lands */
      for (let x = G.x + 4; x < G.x + G.w - 4; x += 4) {
        const near = Math.max(0, 1 - Math.abs(x - S.landX) / 22);
        R(x, t2 - Math.round(Math.sin(ts * 14 + x * 0.5) * (S.stream * 1.3 * near + S.slosh * 1.2)), 4, 2, C.liquidHi);
      }
      R(G.x + 6, t2 + 3, 3, Math.max(1, fh - 6), C.liquidHi);
      S.fizz.forEach(p => R(p.x, p.y, p.r, p.r, p.y < t2 + 3 ? C.foam : '#c58a44'));
      S.rings.forEach(r => { g.globalAlpha = 1 - r.t / r.life; R(r.x - r.r, t2 - 1, r.r * 2, 1, C.foam); });
      g.globalAlpha = 1;
      g.restore();
    }
    R(G.x, G.y, 4, G.h, C.shot); R(G.x + G.w - 4, G.y, 4, G.h, C.shot);
    R(G.x, G.y + G.h - 5, G.w, 5, C.shot); R(G.x - 6, G.y + G.h, G.w + 12, 5, C.shot);
    R(G.x + 5, G.y + 3, 2, G.h - 10, C.shotHi); R(G.x, G.y, G.w, 2, C.shotHi);
    g.restore();
  }

  /* the stream: a real arc from the lip to the surface, aimed at the middle of
     the glass, thick and thin with each glug */
  function stream(S, ts) {
    if (S.stream < 0.02) return;
    const G = GEOM.glass, m = S.mouth, surf = S.surfY;
    const tHit = Math.sqrt(2 * Math.max(8, surf - m.y) / 520);
    const vx = (G.x + G.w / 2 - m.x) / tHit;
    const w0 = (3.2 + 3.8 * (0.55 + 0.45 * Math.sin(S.glugPh))) * S.stream;
    S.landX = m.x + vx * tHit;
    for (let t = 0; t < tHit; t += 0.012) {
      const x = m.x + vx * t + Math.sin(ts * 31 + t * 40) * 0.5, y = m.y + 260 * t * t, p = t / tHit;
      const w = Math.max(1, w0 * (1 - 0.4 * p));
      R(x - w / 2, y, w, 3, C.liquid);
      R(x - w / 2, y, 1, 3, C.liquidHi);
      if (w > 3) R(x + w / 2 - 1, y, 1, 3, C.liquidLo);
    }
    R(S.landX - w0 / 2 - 2, surf - 1, w0 + 4, 2, C.liquidHi);
  }

  return { R, T, table, bottle, capOnBar, glass, stream };
}
