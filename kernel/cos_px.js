/* The small kit Dave's newer stock is drawn with (kernel/cos_more*.js): the sixteen colours by a letter, a picture as rows of letters, and a frame as a handful of colours.
   Pure: nothing here touches the window, so `node scripts/check-dave.mjs` can build every item. Nothing is anti-aliased and nothing leaves VGA16, except a frame's case,
   which has always been a photograph of plastic. */

/* VGA16 by one letter. '.' is nothing (the black the picture stands on). Lower case is the dark half, upper case the bright half. */
export const V = {
  k: '#000000', b: '#0000AA', g: '#00AA00', c: '#00AAAA', r: '#AA0000', m: '#AA00AA', n: '#AA5500', a: '#AAAAAA',
  d: '#555555', B: '#5555FF', G: '#55FF55', C: '#55FFFF', R: '#FF5555', M: '#FF55FF', y: '#FFFF55', w: '#FFFFFF'
};

/* A logo: rows of letters, every row the same length, drawn `s` screen pixels to a cell. A run of one colour in a row is one rect. */
export function bitmap(rows, s) {
  const w = rows[0].length, h = rows.length;
  let o = '<svg viewBox="0 0 160 120" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges"><rect width="160" height="120" fill="#000000"/>';
  const ox = Math.floor((160 - w * s) / 2), oy = Math.floor((120 - h * s) / 2);
  rows.forEach((row, y) => {
    for (let x = 0; x < w;) {
      const ch = row[x];
      let e = x + 1;
      while (e < w && row[e] === ch) e++;
      if (V[ch] && ch !== 'k') o += '<rect x="' + (ox + x * s) + '" y="' + (oy + y * s) + '" width="' + (e - x) * s + '" height="' + s + '" fill="' + V[ch] + '"/>';
      x = e;
    }
  });
  return o + '</svg>';
}

/* "#rrggbb" and an alpha -> rgba(...) */
export function rgba(hex, a) {
  const x = parseInt(hex.slice(1), 16);
  return 'rgba(' + ((x >> 16) & 255) + ',' + ((x >> 8) & 255) + ',' + (x & 255) + ',' + a + ')';
}

/* A frame from its colours. p: { c: [3 case colours, light to dark along 158 degrees] (or `pat`: a ready-made CSS background), w: [3 colours of the well], ink: the chin's text,
   k: [knob top, bottom], ki: the knob's ink, lamp: the lit lamp, tint: a wash over the glass, hi: the edge the light catches }. */
export function frameVars(p) {
  const c = p.c, w = p.w, hi = p.hi || '#ffffff', kh = p.kh || [lighten(p.k[0]), lighten(p.k[1])];
  return {
    '--case-bg': p.pat || 'linear-gradient(158deg, ' + c[0] + ' 0%, ' + c[1] + ' 45%, ' + c[2] + ' 100%)',
    '--well-bg': 'linear-gradient(160deg, ' + w[0] + ' 0%, ' + w[1] + ' 50%, ' + w[2] + ' 100%)',
    '--chin-ink': p.ink,
    '--knob-bg': 'linear-gradient(180deg, ' + p.k[0] + ' 0%, ' + p.k[1] + ' 100%)',
    '--knob-bg-hi': 'linear-gradient(180deg, ' + kh[0] + ' 0%, ' + kh[1] + ' 100%)',
    '--knob-ink': p.ki,
    '--lamp-on': p.lamp, '--lamp-off': mix(p.lamp, '#000000', 0.8), '--lamp-glow': rgba(p.lamp, 0.85),
    '--scr-tint': p.tint || 'transparent',
    '--case-shadow': 'inset 0 2px 0 ' + rgba(hi, 0.4) + ', inset 0 -3px 0 rgba(0,0,0,0.5), inset 3px 0 0 ' + rgba(hi, 0.15) + ', inset -3px 0 0 rgba(0,0,0,0.35)'
  };
}

const rgb = h => { const x = parseInt(h.slice(1), 16); return [(x >> 16) & 255, (x >> 8) & 255, x & 255]; };
const hex = a => '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
/* t of the way from a to b */
export function mix(a, b, t) { const x = rgb(a), y = rgb(b); return hex(x.map((v, i) => v + (y[i] - v) * t)); }
export const lighten = h => mix(h, '#ffffff', 0.18);

/* a plate on the case: a little label of pixel text-in-svg, at its own size, in the corner it is told (cos_deco.js says why they are small) */
export function plate(txt, bg, fg, w, edge) {
  const h = 16;
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h + '" shape-rendering="crispEdges">' +
    '<rect width="' + w + '" height="' + h + '" fill="' + (edge || fg) + '"/><rect x="1" y="1" width="' + (w - 2) + '" height="' + (h - 2) + '" fill="' + bg + '"/>' +
    '<text x="' + (w / 2) + '" y="12" font-family="monospace" font-size="10" fill="' + fg + '" text-anchor="middle">' + txt + '</text></svg>';
}

/* the relative luminance and contrast of two "#rrggbb": the check holds a frame's chin text to 4.5:1 */
export function lum(h) { return rgb(h).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }).reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0); }
export function ratio(a, b) { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }

/* A sheet of cells to draw a logo on: 24 x 24 by default, 'k' (black) everywhere until something is put on it. Every shape is whole cells; `stamp` puts down a little
   sprite written as rows of letters ('.' leaves what is under it, spaces are only there so a row can be counted in eights). */
export function grid(w, h) {
  w = w || 24; h = h || 24;
  const a = Array.from({ length: h }, () => Array(w).fill('k'));
  const g = {
    w, h,
    px(x, y, c) { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < w && y < h) a[y][x] = c; return g; },
    rect(x, y, ww, hh, c) { for (let j = 0; j < hh; j++) for (let i = 0; i < ww; i++) g.px(x + i, y + j, c); return g; },
    disc(cx, cy, r, c) { for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) if (i * i + j * j <= r * r + r * 0.5) g.px(cx + i, cy + j, c); return g; },
    ring(cx, cy, r, c, t) { t = t || 1; for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) { const d = i * i + j * j; if (d <= r * r + r * 0.5 && d > (r - t) * (r - t) + (r - t) * 0.5) g.px(cx + i, cy + j, c); } return g; },
    /* an ellipse, filled */
    oval(cx, cy, rx, ry, c) { for (let j = -ry; j <= ry; j++) for (let i = -rx; i <= rx; i++) if ((i * i) / (rx * rx + 0.3) + (j * j) / (ry * ry + 0.3) <= 1) g.px(cx + i, cy + j, c); return g; },
    line(x0, y0, x1, y1, c, t) {
      t = t || 1;
      const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1;
      for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n, y = y0 + (y1 - y0) * i / n; for (let j = 0; j < t; j++) for (let k = 0; k < t; k++) g.px(x + j, y + k, c); }
      return g;
    },
    stamp(x, y, rows) { rows.forEach((row, j) => { const r = row.replace(/ /g, ''); for (let i = 0; i < r.length; i++) if (r[i] !== '.') g.px(x + i, y + j, r[i]); }); return g; },
    rows() { return a.map(r => r.join('')); }
  };
  return g;
}
