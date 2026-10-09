/* The colours of a label, and the face that wears them (pure: Node runs it in palette_check.js).
   `paletteOf(rgba)` reads a picture's pixels and answers the two colours it is about and the plain average: the most vivid hue is the accent, a second hue at least
   forty degrees away is the accent's partner (or, in a picture with only one colour, the neighbour on the colour wheel), and a picture with no colour in it gives a pale
   neutral rather than a muddy one. `themeFrom(pal)` turns that into the inks of the hi-fi's face: the knobs' lights, the LCD, the scrubber, the glow, a tint in the
   metal. Every ink stays bright enough to read on the dark panels, whatever the picture was. */
export const hex = (r, g, b) => '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
export const rgb = h => { const m = /^#?([0-9a-f]{6})$/i.exec(h || ''); const n = m ? parseInt(m[1], 16) : 0; return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
export const mix = (a, b, t) => { const x = rgb(a), y = rgb(b); return hex(x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t); };
export const lum = h => { const c = rgb(h).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
export const contrast = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };

export function hsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let h = 0;
  if (d) h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [((h * 60) + 360) % 360, mx ? d / mx : 0, mx];
}
export function fromHsv(h, s, v) {
  h = ((h % 360) + 360) % 360; const c = v * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = v - c;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return hex((r + m) * 255, (g + m) * 255, (b + m) * 255);
}
/* an ink that glows on a dark panel: vivid enough, bright enough */
const glow = (h, s, v) => fromHsv(h, Math.max(s, 0.5), Math.max(v, 0.86));

const BINS = 24, W = 360 / BINS;
export function paletteOf(px) {
  const bin = Array.from({ length: BINS }, () => ({ w: 0, r: 0, g: 0, b: 0 }));
  let n = 0, R = 0, G = 0, B = 0;
  for (let i = 0; i + 3 < px.length; i += 4) {
    if (px[i + 3] < 128) continue;
    const r = px[i], g = px[i + 1], b = px[i + 2];
    n++; R += r; G += g; B += b;
    const [h, s, v] = hsv(r, g, b);
    if (v < 0.16 || s < 0.2) continue;
    const w = s * s * v, k = Math.floor(h / W) % BINS;
    bin[k].w += w; bin[k].r += r * w; bin[k].g += g * w; bin[k].b += b * w;
  }
  const avg = n ? hex(R / n, G / n, B / n) : '#202020';
  /* a bin counts with its neighbours, so a hue that sits on the edge of two is still one hue */
  const near = k => { const o = { w: 0, r: 0, g: 0, b: 0 }; [-1, 0, 1].forEach(d => { const q = bin[(k + d + BINS) % BINS]; o.w += q.w; o.r += q.r; o.g += q.g; o.b += q.b; }); return o; };
  const sc = bin.map((_, k) => ({ k, o: near(k) })).sort((a, b) => b.o.w - a.o.w);
  const top = sc[0];
  if (!n || !top || top.o.w < n * 0.012) {
    const [h] = hsv(...rgb(avg));
    return { a: fromHsv(h, 0.1, 0.93), a2: fromHsv(h, 0.08, 0.72), avg, gray: true };
  }
  const col = o => hsv(o.r / o.w, o.g / o.w, o.b / o.w);
  const [h1, s1, v1] = col(top.o);
  const far = sc.find(q => { const d = Math.abs(q.k - top.k); return Math.min(d, BINS - d) >= 3 && q.o.w >= top.o.w * 0.22; });
  const [h2, s2, v2] = far ? col(far.o) : [h1 + 36, s1 * 0.85, v1];
  return { a: glow(h1, s1, v1), a2: glow(h2, s2, v2), avg, gray: false };
}

/* the named tints the discs had before they had pictures */
export const NAMED = { green: '#5bff6e', cyan: '#4fe3ff', amber: '#ffb43c', white: '#e8ecf2', red: '#ff4a3c' };
export const palOfNamed = name => { const a = NAMED[name] || NAMED.amber; const [h, s, v] = hsv(...rgb(a)); return { a, a2: fromHsv(h + 36, s * 0.7, v), avg: mix('#101010', a, 0.3), gray: false }; };

/* an ink brought up toward white until it reads on the lightest panel it will sit on (a deep blue becomes a pale blue; it stays that blue) */
const REF = '#50535c';
const bright = (c, min) => { let k = 0; while (contrast(c, REF) < (min || 4.6) && k++ < 24) c = mix(c, '#ffffff', 0.07); return c; };

/* the face's inks for a palette, over the hi-fi's own metal (`base`, the HFP object) */
export function themeFrom(pal, base) {
  const a = bright(pal.a), a2 = bright(pal.a2);
  return {
    amber: a, amberDim: mix('#000000', a, 0.42), cyan: a2, green: mix(a2, base.green, 0.35),
    lcd: mix('#04070a', a, 0.09), lcdOn: mix(a2, '#ffffff', 0.28), lcdDim: mix('#04070a', a2, 0.5), lcdOff: mix('#04070a', a2, 0.24), digOff: mix('#04070a', a2, 0.16),
    brush: mix(base.brush, a, 0.22), brushHi: mix(base.brushHi, a, 0.08), panel: mix(base.panel, a, 0.03), panelHi: mix(base.panelHi, a, 0.035), case_: mix(base.case_, a, 0.05), white: mix(base.white, a, 0.05)
  };
}
export function lerpTheme(cur, tgt, k) { const o = {}; Object.keys(tgt).forEach(key => { o[key] = cur && cur[key] ? mix(cur[key], tgt[key], k) : tgt[key]; }); return o; }
