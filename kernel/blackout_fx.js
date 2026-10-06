/* How a hallucination is altered: the picture in the canvas is bent after it is
   drawn. Palette turned a few places round the sixteen, inverted, cut into
   bands that slide, the colours pulled apart, rolled, mirrored, snowed on,
   shuffled in blocks. Each is applied to the pixels, a fresh roll every frame. */
import { W, H, PAL } from './blackout_draw.js';

const LUT = new Map();
PAL.forEach((c, i) => { const m = c.match(/\d+/g); LUT.set((m[0] << 16) | (m[1] << 8) | m[2], i); });
const RGB = PAL.map(c => c.match(/\d+/g).map(Number));

const get = g => g.getImageData(0, 0, W, H);
const mapIdx = (g, fn) => {
  const id = get(g), d = id.data;
  for (let i = 0; i < d.length; i += 4) {
    const k = LUT.get((d[i] << 16) | (d[i + 1] << 8) | d[i + 2]);
    if (k === undefined) continue;
    const c = RGB[fn(k) & 15];
    d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2];
  }
  g.putImageData(id, 0, 0);
};

export const FX = {
  /* the same picture in the wrong colours */
  shift(g, r, st) { st.k = st.k || 1 + (r() * 14 | 0); mapIdx(g, k => k + st.k); },
  invert(g) { mapIdx(g, k => 15 - k); },
  /* bands that slide sideways */
  slices(g, r) {
    const id = get(g), src = new Uint32Array(id.data.buffer.slice(0)), dst = new Uint32Array(id.data.buffer);
    let y = 0;
    while (y < H) {
      const h = 3 + (r() * 14 | 0), sh = r() < 0.5 ? 0 : ((r() - 0.5) * 60) | 0;
      for (let yy = y; yy < Math.min(H, y + h); yy++) for (let x = 0; x < W; x++) dst[yy * W + x] = src[yy * W + (((x - sh) % W) + W) % W];
      y += h;
    }
    g.putImageData(id, 0, 0);
  },
  /* the red and the blue come apart */
  split(g, r) {
    const id = get(g), d = id.data, c = new Uint8ClampedArray(d), s = 2 + (r() * 5 | 0);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4, a = (y * W + Math.max(0, x - s)) * 4, b = (y * W + Math.min(W - 1, x + s)) * 4;
      d[i] = c[a]; d[i + 2] = c[b + 2];
    }
    g.putImageData(id, 0, 0);
  },
  /* the picture rolls, as it does on a set with the hold turned off centre */
  roll(g, r, st, t) { const o = (t * 90 + (st.o = st.o || r() * H)) % H; g.drawImage(g.canvas, 0, 0, W, H - o, 0, o, W, H - o); g.drawImage(g.canvas, 0, H - o, W, o, 0, 0, W, o); },
  mirror(g) { g.save(); g.translate(W, 0); g.scale(-1, 1); g.drawImage(g.canvas, 0, 0, W / 2, H, 0, 0, W / 2, H); g.restore(); },
  /* snow on the glass */
  static(g, r) {
    const dens = 0.04 + r() * 0.1;
    for (let i = 0; i < W * H * dens; i++) { g.fillStyle = r() < 0.5 ? '#ffffff' : '#aaaaaa'; g.fillRect(r() * W | 0, r() * H | 0, 1 + (r() < 0.3), 1); }
  },
  blocks(g, r) {
    for (let i = 0; i < 14; i++) {
      const bw = 12 + (r() * 30 | 0), bh = 8 + (r() * 20 | 0), sx = r() * (W - bw) | 0, sy = r() * (H - bh) | 0, dx = r() * (W - bw) | 0, dy = r() * (H - bh) | 0;
      g.drawImage(g.canvas, sx, sy, bw, bh, dx, dy, bw, bh);
    }
  },
  zoom(g, r, st, t) { const z = 1 + 0.12 * Math.abs(Math.sin(t * 6)); g.drawImage(g.canvas, 0, 0, W, H, -(W * (z - 1)) / 2, -(H * (z - 1)) / 2, W * z, H * z); }
};
/* the ones that flash hard: left out when the person has asked for less motion */
export const HARSH = new Set(['invert', 'static', 'slices', 'blocks']);
export const NAMES = Object.keys(FX);

/* full-frame static, for between pictures */
export function snowScreen(g, r) {
  const id = g.createImageData(W, H), d = id.data;
  for (let i = 0; i < d.length; i += 4) { const v = r() < 0.5 ? 255 : r() * 140 | 0; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
  g.putImageData(id, 0, 0);
}
