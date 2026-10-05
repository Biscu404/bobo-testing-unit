/* A 960 x 640 sheet of logical paper, laid onto whatever size the canvas is.
   Everything lands on whole device pixels (a rect's edges are rounded, never
   blended), so a fullscreen window is a bigger drawing, not a blurrier one. */
export const LW = 960, LH = 640;
const FONT = '"VT323", monospace';

export function makeGfx(cv) {
  const g = cv.getContext('2d');
  const G = { g, cv, W: 0, H: 0, u: 1, ox: 0, oy: 0 };
  G.fit = () => {
    G.W = cv.width; G.H = cv.height;
    G.u = Math.min(G.W / LW, G.H / LH);
    G.ox = Math.round((G.W - LW * G.u) / 2);
    G.oy = Math.round((G.H - LH * G.u) / 2);
    g.imageSmoothingEnabled = false;
  };
  const X = x => Math.round(G.ox + x * G.u), Y = y => Math.round(G.oy + y * G.u);
  G.X = X; G.Y = Y;
  /* logical rect -> device rect */
  G.R = (x, y, w, h, c) => {
    g.fillStyle = c;
    const x0 = X(x), y0 = Y(y);
    g.fillRect(x0, y0, Math.max(1, X(x + w) - x0), Math.max(1, Y(y + h) - y0));
  };
  /* the whole canvas, margins and all */
  G.fill = c => { g.fillStyle = c; g.fillRect(0, 0, G.W, G.H); };
  G.a = a => { g.globalAlpha = a; };
  G.T = (s, x, y, c, size, align) => {
    g.fillStyle = c;
    g.font = Math.max(8, Math.round((size || 20) * G.u)) + 'px ' + FONT;
    g.textAlign = align || 'left';
    g.textBaseline = 'alphabetic';
    g.fillText(s, X(x), Y(y));
  };
  G.tw = (s, size) => { g.font = Math.max(8, Math.round((size || 20) * G.u)) + 'px ' + FONT; return g.measureText(s).width / G.u; };
  /* a stepped line: horizontal and vertical runs only, so it never needs blending */
  G.line = (x0, y0, x1, y1, c, th) => {
    th = th || 2;
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    const st = Math.max(1, Math.round(n / (G.u > 1 ? 1 : 1)));
    for (let i = 0; i <= st; i++) {
      const t = i / st;
      G.R(x0 + (x1 - x0) * t - th / 2, y0 + (y1 - y0) * t - th / 2, th, th, c);
    }
  };
  /* a bitmap out of strings: each char indexes `pal`, '.' is clear */
  G.bmp = (rows, x, y, s, pal) => {
    for (let j = 0; j < rows.length; j++) {
      const row = rows[j];
      for (let i = 0; i < row.length; i++) {
        const ch = row[i];
        if (ch !== '.' && pal[ch]) G.R(x + i * s, y + j * s, s, s, pal[ch]);
      }
    }
  };
  G.fit();
  return G;
}

export function rng(seed) {
  let a = seed >>> 0 || 1;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
