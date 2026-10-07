/* DRAW.EXE — the eight brushes Dave sells. Each is one function that lays one segment of a stroke on a 2D context.
 *
 *   brush(g, a)      a = { x0, y0, x1, y1, dist, fast, base, col, s }
 *     fast   0 for a slow, careful line up to 1 for a flick (the crayon's own scale: pixels a millisecond over 2.4)
 *     base   the nib in pixels (the size button: 4, 9 or 17)
 *     col    the colour as '#rrggbb'
 *     s      an object kept for the length of one stroke (reset on every press): where a rainbow has got to, which hairs a brush has
 *
 * The paper has a tooth, and `tooth(x, y)` is the same grain wherever you draw: so chalk skips the same places twice.
 * Nothing here knows about layers, undo or the eraser; the sheet decides what it is drawing on. */

const tooth = (x, y) => (((Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263)) ^ Math.imul(x | 0, 1274126177)) >>> 0) % 997 / 997;
const rnd = Math.random;
const hex = c => [parseInt(c.substr(1, 2), 16), parseInt(c.substr(3, 2), 16), parseInt(c.substr(5, 2), 16)];
const rgb = (r, g, b, a) => 'rgba(' + Math.round(r) + ',' + Math.round(g) + ',' + Math.round(b) + ',' + (a == null ? 1 : a) + ')';
const mix = (c, k) => { const [r, g, b] = hex(c); return k >= 0 ? rgb(r + (255 - r) * k, g + (255 - g) * k, b + (255 - b) * k) : rgb(r * (1 + k), g * (1 + k), b * (1 + k)); };
const steps = (a, gap) => Math.max(1, Math.ceil(a.dist / Math.max(1, gap)));
const at = (a, i, n) => { const t = i / n; return [a.x0 + (a.x1 - a.x0) * t, a.y0 + (a.y1 - a.y0) * t]; };

export const BRUSHES = {
  /* dry and broken: a pixel is laid only where the paper's tooth lets it */
  chalk(g, a) {
    const w = Math.max(5, a.base * 1.3), n = steps(a, w * 0.25);
    g.fillStyle = a.col;
    for (let i = 0; i <= n; i++) {
      const [x, y] = at(a, i, n);
      for (let k = 0; k < Math.round(w * 2.2); k++) {
        const ang = rnd() * 6.283, r = Math.sqrt(rnd()) * w / 2, px = (x + Math.cos(ang) * r) | 0, py = (y + Math.sin(ang) * r) | 0;
        if (tooth(px, py) < 0.46 + a.fast * 0.2) continue;
        g.globalAlpha = 0.65 + rnd() * 0.3;
        g.fillRect(px, py, 2, 1 + (tooth(py, px) > 0.8 ? 1 : 0));
      }
    }
    g.globalAlpha = 1;
  },
  /* soft, smudged, darker where you press and slow */
  charcoal(g, a) {
    const w = Math.max(6, a.base * 1.5), n = steps(a, w * 0.2), press = 0.1 + (1 - a.fast) * 0.2;
    for (let i = 0; i <= n; i++) {
      const [x, y] = at(a, i, n);
      g.fillStyle = a.col;
      for (let k = 0; k < 7; k++) {
        const ang = rnd() * 6.283, r = Math.sqrt(rnd()) * w / 2;
        g.globalAlpha = press * (0.4 + rnd() * 0.6);
        const s = 2 + (rnd() * 3 | 0);
        g.fillRect((x + Math.cos(ang) * r) | 0, (y + Math.sin(ang) * r) | 0, s, s);
      }
      for (let k = 0; k < 3; k++) { g.globalAlpha = 0.5; g.fillRect((x + (rnd() - 0.5) * w * 1.4) | 0, (y + (rnd() - 0.5) * w * 1.4) | 0, 1, 1); }
    }
    g.globalAlpha = 1;
  },
  /* a broad nib held at forty-five degrees: thick across one diagonal, a hair across the other */
  ink(g, a) {
    const L = Math.max(5, a.base * 1.3) * (1 - a.fast * 0.35), ang = -0.8, nx = Math.cos(ang) * L / 2, ny = Math.sin(ang) * L / 2;
    g.fillStyle = a.col;
    g.beginPath();
    g.moveTo(a.x0 - nx, a.y0 - ny); g.lineTo(a.x0 + nx, a.y0 + ny); g.lineTo(a.x1 + nx, a.y1 + ny); g.lineTo(a.x1 - nx, a.y1 - ny); g.closePath();
    g.fill();
  },
  /* stars, one every so often along the line */
  stars(g, a) {
    a.s.acc = (a.s.acc || 0) + a.dist;
    const gap = Math.max(10, a.base * 1.6);
    while (a.s.acc >= gap) {
      a.s.acc -= gap;
      const t = a.s.acc / Math.max(1, a.dist), x = (a.x1 - (a.x1 - a.x0) * t) | 0, y = (a.y1 - (a.y1 - a.y0) * t) | 0;
      const r = Math.max(2, Math.round(a.base * (0.35 + rnd() * 0.4)));
      g.fillStyle = a.col; g.fillRect(x - r, y, r * 2 + 1, 1); g.fillRect(x, y - r, 1, r * 2 + 1);
      const d = Math.max(1, r >> 1); g.fillRect(x - d, y - d, 1, 1); g.fillRect(x + d, y - d, 1, 1); g.fillRect(x - d, y + d, 1, 1); g.fillRect(x + d, y + d, 1, 1);
      g.fillStyle = mix(a.col, 0.7); g.fillRect(x, y, 1, 1);
    }
  },
  /* wet: see-through washes that build up, and pool a little darker at the rim */
  wash(g, a) {
    const r = Math.max(6, a.base * 1.7), n = steps(a, r * 0.25);
    for (let i = 0; i <= n; i++) {
      const [x, y] = at(a, i, n);
      g.fillStyle = a.col; g.globalAlpha = 0.045;
      g.beginPath(); g.arc(x, y, r, 0, 6.283); g.fill();
      if (i % 3) continue;
      g.strokeStyle = mix(a.col, -0.25); g.globalAlpha = 0.03; g.lineWidth = 1.5;
      g.beginPath(); g.arc(x, y, r, 0, 6.283); g.stroke();
    }
    g.globalAlpha = 1;
  },
  /* a dozen hairs, each with its own shade, dragged: the streaks are the brush */
  bristle(g, a) {
    const n = a.base < 6 ? 5 : a.base < 12 ? 9 : 13, sp = Math.max(1.4, a.base / 6);
    if (!a.s.hair) a.s.hair = Array.from({ length: n }, () => ({ shade: (rnd() - 0.5) * 0.5, lag: rnd() * 0.3, a: 0.65 + rnd() * 0.3 }));
    const dx = a.x1 - a.x0, dy = a.y1 - a.y0, len = Math.hypot(dx, dy);
    if (len < 0.01) return;
    const px = -dy / len, py = dx / len;
    g.lineCap = 'butt'; g.lineWidth = Math.max(1, sp * 0.9);
    a.s.hair.forEach((h, k) => {
      const o = (k - (n - 1) / 2) * sp;
      g.strokeStyle = mix(a.col, h.shade); g.globalAlpha = h.a * (1 - a.fast * 0.3);
      g.beginPath(); g.moveTo(a.x0 + px * o, a.y0 + py * o); g.lineTo(a.x1 + px * o * (1 + h.lag), a.y1 + py * o * (1 + h.lag)); g.stroke();
    });
    g.globalAlpha = 1;
  },
  /* waxy, and the colour moves on as it goes */
  rainbow(g, a) {
    const w = Math.max(3, a.base * (1 - a.fast * 0.4)), n = steps(a, w * 0.3);
    a.s.len = (a.s.len || 0) + a.dist;
    if (a.s.hue == null) a.s.hue = rnd() * 360;
    for (let i = 0; i <= n; i++) {
      const [x, y] = at(a, i, n), hue = (a.s.hue + (a.s.len - a.dist + a.dist * i / n) * 0.7) % 360;
      g.fillStyle = 'hsl(' + hue.toFixed(0) + ',85%,52%)';
      for (let k = 0; k < Math.max(5, Math.round(w * 2.2)); k++) {
        if (rnd() < 0.11) continue;
        const ang = rnd() * 6.283, r = Math.sqrt(rnd()) * w / 2;
        g.globalAlpha = 0.5 + rnd() * 0.5;
        g.fillRect((x + Math.cos(ang) * r) | 0, (y + Math.sin(ang) * r) | 0, 1 + (rnd() < 0.3 ? 1 : 0), 1 + (rnd() < 0.3 ? 1 : 0));
      }
    }
    g.globalAlpha = 1;
  },
  /* a lit tube: a wide faint halo, a bright core, and a white heart */
  neon(g, a) {
    const w = Math.max(3, a.base * 0.7);
    g.lineCap = 'round'; g.lineJoin = 'round';
    g.shadowColor = a.col; g.shadowBlur = w * 3;
    g.strokeStyle = a.col; g.globalAlpha = 0.5; g.lineWidth = w * 1.6;
    g.beginPath(); g.moveTo(a.x0, a.y0); g.lineTo(a.x1, a.y1); g.stroke();
    g.shadowBlur = 0; g.globalAlpha = 1;
    g.strokeStyle = mix(a.col, 0.35); g.lineWidth = w;
    g.beginPath(); g.moveTo(a.x0, a.y0); g.lineTo(a.x1, a.y1); g.stroke();
    g.strokeStyle = '#ffffff'; g.globalAlpha = 0.85; g.lineWidth = Math.max(1, w * 0.35);
    g.beginPath(); g.moveTo(a.x0, a.y0); g.lineTo(a.x1, a.y1); g.stroke();
    g.globalAlpha = 1; g.shadowColor = 'transparent';
  }
};

/* a stroke of one brush across a card, for the shop */
export function sampleStroke(g, id, w, h) {
  const brush = BRUSHES[id];
  if (!brush) return;
  if (id === 'neon') { g.fillStyle = '#14141c'; g.fillRect(0, 0, w, h); }
  const col = id === 'neon' ? '#55ffff' : id === 'wash' ? '#2a6ab8' : id === 'stars' ? '#b23a2a' : '#8b1a1a';
  const s = {}, base = id === 'stars' ? 11 : 9;
  let px = 8, py = h / 2;
  for (let x = 10; x <= w - 8; x += 2) {
    const y = h / 2 + Math.sin(x * 0.1) * 14;
    brush(g, { x0: px, y0: py, x1: x, y1: y, dist: Math.hypot(x - px, y - py), fast: 0.15, base, col, s });
    px = x; py = y;
  }
  g.globalAlpha = 1;
}
