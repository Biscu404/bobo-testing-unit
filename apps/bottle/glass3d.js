/* The tumbler, as an object in the room rather than a drawing of one.

   It is a thick-walled cylinder with a floor, held in front of an eye that sits
   above the table, and every pixel of it is found by following a ray out of that
   eye: through the near wall, into the liquor if the ray meets any, out of the
   far wall. So when the glass is lifted toward the screen it grows (it is nearer),
   and when it is tipped toward the viewer the open mouth turns to face them and
   the liquor, which stays level with the room, climbs the inside of it and runs
   over the near edge. Nobody is drawn drinking: the person at the monitor is the
   one the glass is tipped to.

   Pose is { sx, sy, z, th }: where the middle of the glass is on the screen, how far
   toward the viewer it has come (0 is the table, -D is the eye) and how far it is
   tipped toward the viewer (0 upright, PI/2 mouth on).

   Nothing is smoothed. The picture is found at whole pixels (or two by two once
   it is close), its colours are pressed to a few levels, and it is stamped on with
   smoothing off, like everything else on this table. */
import { clamp } from './physics.js';

export const GL = { R: 32, Ri: 28, H: 70, FL: 6 };            /* outer and inner radius, height, thickness of the floor */
export const D = 360;                                          /* the eye's distance from the table plane */
const EX = 190, EY = 96;                                       /* where the eye is, in table coordinates */
const ROOM = { glass: [205, 220, 230], glassDk: [124, 150, 166], hi: [255, 255, 255],
  liq: [216, 128, 34], liqDk: [104, 50, 12], top: [238, 166, 62], foam: [240, 217, 160], rim: [250, 252, 255], floor: [110, 140, 150] };

const N_SLICE = 40;
const out = [0, 0, 0, 0];

/* the interval of a ray (origin o, direction d, both relative to the cylinder's base) inside a capped cylinder
   about axis a of radius r between s0 and s1; out = [t0, t1, how it was entered, how it was left] where
   1 is the side and 2 / 3 are the caps at s0 / s1. Returns false for a miss. */
function cylinder(ox, oy, oz, dx, dy, dz, ax, ay, az, r, s0, s1) {
  const da = dx * ax + dy * ay + dz * az, oa = ox * ax + oy * ay + oz * az;
  const px = dx - da * ax, py = dy - da * ay, pz = dz - da * az;
  const qx = ox - oa * ax, qy = oy - oa * ay, qz = oz - oa * az;
  const A = px * px + py * py + pz * pz, B = px * qx + py * qy + pz * qz, C = qx * qx + qy * qy + qz * qz - r * r;
  let t0 = 1e-4, t1 = 1e9, k0 = 0, k1 = 0;
  if (A > 1e-9) {
    const disc = B * B - A * C;
    if (disc < 0) return false;
    const sq = Math.sqrt(disc), a0 = (-B - sq) / A, a1 = (-B + sq) / A;
    if (a0 > t0) { t0 = a0; k0 = 1; }
    t1 = a1; k1 = 1;
  } else if (C > 0) return false;
  if (Math.abs(da) > 1e-9) {
    let ta = (s0 - oa) / da, tb = (s1 - oa) / da, ka = 2, kb = 3;
    if (ta > tb) { const t = ta; ta = tb; tb = t; ka = 3; kb = 2; }
    if (ta > t0) { t0 = ta; k0 = ka; }
    if (tb < t1) { t1 = tb; k1 = kb; }
  } else if (oa < s0 || oa > s1) return false;
  if (t0 >= t1) return false;
  out[0] = t0; out[1] = t1; out[2] = k0; out[3] = k1;
  return true;
}

/* where a world point lands on the screen */
const toScreen = (x, y, z) => { const k = D / (D + z); return [EX + (x - EX) * k, EY + (y - EY) * k]; };

/* the world position of the glass's middle for a pose */
function centreOf(p) { const k = (D + p.z) / D; return [EX + (p.sx - EX) * k, EY + (p.sy - EY) * k, p.z]; }

/* the volume of the cavity that lies below the plane y = L (y runs down the screen), in units of the
   cavity's own volume, for a glass whose base is at (bx, by, bz) with axis a = (0, -cos, -sin) */
function below(L, by, cs, sn) {
  const r = GL.Ri, h = GL.H - GL.FL;
  let v = 0;
  const sinT = Math.max(0.06, Math.abs(sn));
  for (let i = 0; i < N_SLICE; i++) {
    const s = GL.FL + (i + 0.5) / N_SLICE * h, yc = by - s * cs;
    const v0 = (yc - L) / sinT * Math.sign(sn || 1);
    let area;
    if (v0 >= r) area = Math.PI * r * r;
    else if (v0 <= -r) area = 0;
    else area = r * r * Math.acos(-v0 / r) + v0 * Math.sqrt(r * r - v0 * v0);
    v += area;
  }
  return v / (N_SLICE * Math.PI * r * r);
}
/* the level (screen y at the glass's own depth) at which the cavity holds `frac` of its volume */
function levelFor(frac, by, cs, sn) {
  let lo = by - GL.H - GL.R - 4, hi = by + GL.R + 4;
  for (let i = 0; i < 22; i++) { const m = (lo + hi) / 2; if (below(m, by, cs, sn) > frac) lo = m; else hi = m; }
  return (lo + hi) / 2;
}

/* the colour being built up, back to front, for one pixel */
let cr = 0, cg = 0, cb = 0, ca = 0;
function over(c, a) {
  const na = a + ca * (1 - a);
  if (na <= 0) return;
  cr = (c[0] * a + cr * ca * (1 - a)) / na; cg = (c[1] * a + cg * ca * (1 - a)) / na; cb = (c[2] * a + cb * ca * (1 - a)) / na; ca = na;
}
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

export function makeGlass3D() {
  let off = null, og = null, img = null;
  const q = v => Math.max(0, Math.min(255, Math.round(v / 20) * 20 + 4));   /* a few levels of each colour, never a ramp */

  /* g: the table's canvas. st: { vol, foam }. Returns where the liquor stands and what went over the lip. */
  function render(g, pose, st) {
    const th = clamp(pose.th, 0, Math.PI - 0.05), cs = Math.cos(th), sn = Math.sin(th);
    const [cx, cy, cz] = centreOf(pose);
    const ax = 0, ay = -cs, az = -sn;
    const bx = cx, by = cy - ay * GL.H / 2, bz = cz - az * GL.H / 2;      /* the middle of the base */
    /* the liquor: where its level is, and whatever the lowest point of the rim cannot hold */
    const rimLowY = by + ay * GL.H + GL.Ri * sn;
    let vol = clamp(st.vol, 0, 1), L = levelFor(vol, by, cs, sn), spilled = 0;
    if (vol > 0 && L < rimLowY - 0.01) {
      const keep = below(rimLowY, by, cs, sn);
      if (keep < vol) { spilled = vol - keep; vol = keep; L = rimLowY; }
    }
    const res = { vol, spilled, scale: D / (D + cz),
      surfY: toScreen(bx, vol > 0 ? L : by - GL.FL * cs, bz)[1],
      rimLow: toScreen(bx, rimLowY, bz + az * GL.H - GL.Ri * cs) };
    /* where it is on the screen: the corners of a box round it */
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const s of [0, GL.H]) for (const u of [-GL.R, GL.R]) for (const v of [-GL.R, GL.R]) {
      const p = toScreen(bx + u, by + ay * s - v * sn, bz + az * s + v * cs);
      x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]);
    }
    const W = g.canvas.width, H = g.canvas.height, rs = res.scale > 1.5 ? 2 : 1;
    x0 = Math.max(0, Math.floor(x0 / rs) * rs - rs); y0 = Math.max(0, Math.floor(y0 / rs) * rs - rs);
    x1 = Math.min(W, Math.ceil(x1 / rs) * rs + rs); y1 = Math.min(H, Math.ceil(y1 / rs) * rs + rs);
    const w = Math.max(0, (x1 - x0) / rs | 0), h = Math.max(0, (y1 - y0) / rs | 0);
    res.box = [x0, y0, x1, y1];
    if (w < 2 || h < 2) return res;
    if (!off) { off = document.createElement('canvas'); og = off.getContext('2d'); }
    if (off.width < w || off.height < h) { off.width = Math.max(off.width, w); off.height = Math.max(off.height, h); img = null; }
    if (!img) img = og.createImageData(off.width, off.height);
    const px = img.data, iw = img.width;
    px.fill(0);
    const ox = EX - bx, oy = EY - by, oz = -D - bz;
    const foam = st.foam > 0.05 ? Math.min(1, st.foam / 2.5) : 0;
    for (let j = 0; j < h; j++) {
      const dy = y0 + (j + 0.5) * rs - EY;
      for (let i = 0; i < w; i++) {
        const dx = x0 + (i + 0.5) * rs - EX, dz = D, dl = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (!cylinder(ox, oy, oz, dx, dy, dz, ax, ay, az, GL.R, 0, GL.H)) continue;
        const To0 = out[0], To1 = out[1], Ko0 = out[2];
        cr = cg = cb = ca = 0;
        /* the cavity, and so the walls either side of it. It is open at the top, so it is taken a little past the rim. */
        const cav = cylinder(ox, oy, oz, dx, dy, dz, ax, ay, az, GL.Ri, GL.FL, GL.H + 2);
        const c0 = out[0], c1 = out[1], kc1 = out[3];
        /* the far wall, or the floor, seen through whatever is in front of it */
        if (cav) {
          const len = (To1 - c1) * dl;
          if (len > 0) over(kc1 === 2 ? ROOM.floor : ROOM.glassDk, clamp(0.5 + len * 0.02, 0, 0.85));
        } else over(ROOM.glassDk, clamp((To1 - To0) * dl * 0.05, 0.3, 0.9));
        /* the liquor: everything in the cavity at or below the plane */
        if (cav && vol > 0) {
          let l0 = c0, l1 = c1, surface = false;
          if (Math.abs(dy) > 1e-9) {
            const tp = (L - EY) / dy;
            if (dy > 0) { if (tp > l0) { l0 = tp; surface = true; } } else l1 = Math.min(l1, tp);
          } else if (EY < L) l1 = l0;
          if (l1 > l0) {
            const len = (l1 - l0) * dl;
            over(mix(ROOM.liq, ROOM.liqDk, Math.round(clamp(len / 80, 0, 1) * 3) / 3), clamp(0.8 + len * 0.01, 0, 1));
            if (surface) over(mix(ROOM.top, ROOM.foam, foam * 0.7), 0.7 + foam * 0.25);
          }
        }
        /* the near wall, and the ring of the mouth */
        const lenF = ((cav ? c0 : To1) - To0) * dl;
        if (lenF > 0.01) {
          if (Ko0 === 3) over(ROOM.rim, 0.92);
          else {
            let nx, ny, nz, face;
            if (Ko0 === 1) {                                              /* the side: the normal points out from the axis */
              const tx = ox + To0 * dx, ty = oy + To0 * dy, tz = oz + To0 * dz, s = tx * ax + ty * ay + tz * az;
              nx = tx - s * ax; ny = ty - s * ay; nz = tz - s * az;
              const nl = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1; nx /= nl; ny /= nl; nz /= nl;
            } else { nx = -ax; ny = -ay; nz = -az; }                       /* the foot of the glass */
            face = Math.abs((nx * dx + ny * dy + nz * dz) / dl);
            const lit = clamp(0.5 - nx * 0.55 + ny * 0.2, 0, 1), edge = (1 - face) * (1 - face);
            over(mix(ROOM.glassDk, ROOM.glass, lit), clamp(0.12 + edge * 0.6 + lenF * 0.004, 0, 0.85));
            if (face < 0.22 || (nx < -0.72 && nx > -0.9 && face < 0.7)) over(ROOM.hi, 0.6);
          }
        }
        if (ca <= 0.05) continue;
        const o = (j * iw + i) * 4;
        px[o] = q(cr); px[o + 1] = q(cg); px[o + 2] = q(cb); px[o + 3] = Math.round(Math.min(1, ca) * 3) / 3 * 255;
      }
    }
    og.putImageData(img, 0, 0);
    g.imageSmoothingEnabled = false;
    g.drawImage(off, 0, 0, w, h, x0, y0, w * rs, h * rs);
    return res;
  }
  return { render };
}

/* a pose for a point in the lift: the table spot, and the spot just in front of the face */
export const REST = { sx: 328, sy: 257, z: 0, th: 0 };
export const NEAR = { sx: 196, sy: 286, z: -D * 0.58, th: 0 };
