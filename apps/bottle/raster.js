/* A rigid container with liquid in it, drawn the way everything on this machine
   is drawn: pixel by pixel, nothing antialiased.

   The container is baked once, upright, into layers (the glass, the things
   painted over the liquid such as the label, and a mask of where liquid can
   be). Every frame it is turned by sampling: each pixel of the screen asks
   which pixel of the upright sprite lies under it, so the edges stay hard at
   any angle. The liquid is then poured into the *turned* interior: its
   surface is a straight line (level with the room, give or take a slosh) and
   the line is moved until exactly the right number of interior pixels lie
   below it. So the level rises and falls with the real shape of the vessel,
   pools in the neck when the bottle tips, and runs to the lip of a tilted
   tumbler -- none of it is drawn by hand. */

const pack = (hex, a) => {
  const n = parseInt(hex.slice(1), 16);
  return (((a == null ? 255 : a) << 24) | ((n & 255) << 16) | (n & 0xff00) | (n >> 16)) >>> 0;
};
const A = c => c >>> 24;

/* o over d, both ABGR */
function over(d, o) {
  const a = o >>> 24;
  if (a === 255) return o;
  if (!a) return d;
  const ia = 255 - a;
  const r = ((o & 255) * a + (d & 255) * ia) / 255 | 0;
  const g = (((o >> 8) & 255) * a + ((d >> 8) & 255) * ia) / 255 | 0;
  const b = (((o >> 16) & 255) * a + ((d >> 16) & 255) * ia) / 255 | 0;
  return (255 << 24 | b << 16 | g << 8 | r) >>> 0;
}

/* spec: { w, h, cx, cy,           sprite size, and the point it turns about (sprite pixels)
           base(g), inner(g),      draw the glass / draw where liquid may be (any opaque fill)
           over: [fn, ...],        layers painted above the liquid; one is chosen per frame
           liquid: { base, mid, hi, edge, foam } hex colours }               */
export function makeContainer(spec) {
  const { w, h, cx, cy } = spec;
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const g = cv.getContext('2d', { willReadFrequently: true });
  g.imageSmoothingEnabled = false;
  const grab = fn => {
    g.clearRect(0, 0, w, h);
    if (fn) fn(g);
    return new Uint32Array(g.getImageData(0, 0, w, h).data.buffer.slice(0));
  };
  const base = grab(spec.base), inner0 = grab(spec.inner);
  const overs = (spec.over || []).map(grab);
  const inner = new Uint8Array(w * h), edge = new Uint8Array(w * h);
  let n0 = 0;
  for (let i = 0; i < w * h; i++) if (A(inner0[i]) > 127) { inner[i] = 1; n0++; }
  /* liquid against the wall is darker: interior pixels within two of the outside */
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x;
    if (!inner[i]) continue;
    const out = (xx, yy) => xx < 0 || yy < 0 || xx >= w || yy >= h || !inner[yy * w + xx];
    if (out(x - 1, y) || out(x + 1, y) || out(x, y - 1) || out(x, y + 1) || out(x - 2, y) || out(x + 2, y)) edge[i] = 1;
  }
  const L = spec.liquid;
  const col = { base: pack(L.base), mid: pack(L.mid), hi: pack(L.hi), edge: pack(L.edge), foam: pack(L.foam || L.hi) };

  const R = Math.ceil(Math.max(Math.hypot(cx, cy), Math.hypot(w - cx, cy), Math.hypot(cx, h - cy), Math.hypot(w - cx, h - cy))) + 1;
  const D = 2 * R + 1;
  const out = document.createElement('canvas');
  out.width = D; out.height = D;
  const og = out.getContext('2d');
  og.imageSmoothingEnabled = false;
  const img = og.createImageData(D, D);
  const px = new Uint32Array(img.data.buffer);
  const wxs = new Int16Array(D * D), wys = new Int16Array(D * D), sis = new Int32Array(D * D);

  /* pose: { x, y, a }  where (x, y) is where the turning point is on the canvas, a the angle (clockwise, radians)
     fill: { frac, slope, wave, phase, rim, foam, layer }
       frac   how full, as a share of the interior;  slope  tilt of the surface line (a slosh)
       rim    [[x, y], ...] canvas points the liquid cannot rise above (the lowest edge of the opening)
     returns { c, cDraw, n, k, spilled, surfY(x) }  all in screen pixels                          */
  function render(dst, pose, fill) {
    const co = Math.cos(pose.a), si = Math.sin(pose.a);
    const ox = Math.round(pose.x) - R, oy = Math.round(pose.y) - R;
    const fx = pose.x - Math.round(pose.x), fy = pose.y - Math.round(pose.y);
    px.fill(0);
    let n = 0;
    const slope = fill.slope || 0;
    const ov = overs[fill.layer || 0];
    for (let dy = 0; dy < D; dy++) {
      const rowY = dy - R + 0.5 - fy;
      for (let dx = 0; dx < D; dx++) {
        const rx = dx - R + 0.5 - fx;
        const u = rx * co + rowY * si + cx, v = -rx * si + rowY * co + cy;
        const sx = Math.floor(u), sy = Math.floor(v);
        if (sx < 0 || sy < 0 || sx >= w || sy >= h) continue;
        const sI = sy * w + sx, di = dy * D + dx;
        const b = base[sI], o = ov ? ov[sI] : 0;
        if (inner[sI]) {
          /* liquid-holding pixels are finished in the second pass, once the surface is known */
          wxs[n] = dx + ox; wys[n] = dy + oy; sis[n] = sI; n++;
          if (A(b)) px[di] = b;
        } else if (A(b) || A(o)) {
          px[di] = A(o) ? over(A(b) ? b : 0, o) : b;
        }
      }
    }
    /* how many interior pixels hold liquid, and where the surface goes to make it so */
    const k = Math.max(0, Math.min(n, Math.round(fill.frac * n)));
    /* the surface that holds exactly k pixels of liquid, for a surface leaning by `sl` */
    const solve = sl => {
      if (k === 0) return 1e6;
      if (k >= n) return -1e6;
      let lo = -1e6, hi = 1e6;
      for (let it = 0; it < 18; it++) {
        const mid = (lo + hi) / 2;
        let cnt = 0;
        for (let i = 0; i < n; i++) if (wys[i] - sl * wxs[i] >= mid) cnt++;
        if (cnt >= k) lo = mid; else hi = mid;
      }
      return lo;
    };
    const sOf = i => wys[i] - slope * wxs[i];
    const cc = solve(slope);
    /* and the level one, which is what the pouring hand reacts to: the slosh is for show */
    const c0 = slope === 0 ? cc : solve(0);
    let cDraw = cc, spilled = 0, kk = k;
    if (fill.rim && fill.rim.length) {
      const cRim = Math.max.apply(null, fill.rim.map(p => p[1] - slope * p[0]));
      if (cc < cRim) {
        cDraw = cRim;
        kk = 0;
        for (let i = 0; i < n; i++) if (sOf(i) >= cRim) kk++;
        spilled = k - kk;
      }
    }
    /* paint it */
    const wave = fill.wave || 0, ph = fill.phase || 0;
    for (let i = 0; i < n; i++) {
      const sI = sis[i], wx = wxs[i], wy = wys[i];
      const s = sOf(i) + (wave ? Math.round(Math.sin(wx * 0.37 + ph) * wave + Math.sin(wx * 0.11 - ph * 0.7) * wave * 0.6) : 0);
      const di = (wy - oy) * D + (wx - ox);
      let p = px[di];
      if (s >= cDraw && cDraw < 1e5) {
        const d = s - cDraw;
        p = (fill.foam && d < fill.foam) ? col.foam : edge[sI] ? col.edge : d < 1.2 ? col.hi : d < 3.2 ? col.mid : col.base;
      }
      if (ov && A(ov[sI])) p = over(p, ov[sI]);
      px[di] = p;
    }
    og.putImageData(img, 0, 0);
    dst.drawImage(out, ox, oy);
    return { c: cc, c0, cDraw, n, k, kk, spilled, slope, surfY: x => cDraw + slope * x };
  }

  /* is the canvas point (x, y) inside the interior of the container, in this pose? */
  function inside(pose, x, y) {
    const co = Math.cos(pose.a), si = Math.sin(pose.a);
    const rx = x - pose.x, ry = y - pose.y;
    const sx = Math.floor(rx * co + ry * si + cx), sy = Math.floor(-rx * si + ry * co + cy);
    return sx >= 0 && sy >= 0 && sx < w && sy < h && inner[sy * w + sx] === 1;
  }

  return { render, inside, n0, w, h, cx, cy, R, col };
}

export const rot = (px_, py_, a) => [px_ * Math.cos(a) - py_ * Math.sin(a), px_ * Math.sin(a) + py_ * Math.cos(a)];
