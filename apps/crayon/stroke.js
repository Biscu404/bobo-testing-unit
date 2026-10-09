/* ---- the stroke -------------------------------------------------------
   A grain of wax, stamped. Every dot is offset by a random amount inside the nib, drawn at a random alpha, and skipped one time in six, which is what gives the
   edge its bite and the drag its texture. (This was inside the one big function that was the whole Crayon; it moved out unchanged so the panels could have the rest.)
   env: { g() the layer being drawn on, layers() the stack, paper() the sheet's paper, tool(), hex(), nib() the size in pixels, W, H }
   ====================================================================== */
import { BRUSHES } from './brushes.js';

export function createStroke(env) {
  let state = {};                                     /* what a brush remembers from one segment of a stroke to the next */

  function stamp(x, y, w, col, alpha) {
    const g = env.g(), n = Math.max(5, Math.round(w * 2.4));
    for (let i = 0; i < n; i++) {
      if (Math.random() < 0.11) continue;
      const a = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * (w / 2);
      const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
      g.globalAlpha = alpha * (0.5 + Math.random() * 0.5);
      g.fillStyle = col;
      const s = 1 + (Math.random() < 0.3 ? 1 : 0);
      g.fillRect(px | 0, py | 0, s, s);
    }
    g.globalAlpha = 1;
  }

  function seg(x0, y0, x1, y1, speed) {
    const g = env.g(), tool = env.tool(), colorHex = env.hex(), base = env.nib(), layers = env.layers();
    /* speed arrives in pixels per millisecond: a considered line is under one, a flick is three or more. Fast goes thin and faint, slow goes dense,
       and the whole range has to sit inside a normal hand. */
    const fast = Math.min(1, speed / 2.4);
    const dx = x1 - x0, dy = y1 - y0;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (BRUSHES[tool]) { BRUSHES[tool](g, { x0, y0, x1, y1, dist, fast, base, col: colorHex, s: state }); return; }

    if (tool === 'eraser') {
      const w = Math.max(3, base * (1 - fast * 0.45));
      const stepN = Math.max(1, Math.ceil(dist / Math.max(1, w * 0.3)));
      for (let i = 0; i <= stepN; i++) {
        const t = i / stepN;
        const jx = (Math.random() - 0.5) * w * 0.22, jy = (Math.random() - 0.5) * w * 0.22;
        const px = x0 + dx * t + jx, py = y0 + dy * t + jy;
        /* the eraser has the same texture and reveals paper, not white */
        const n = Math.max(4, Math.round(w * 1.8));
        for (let k = 0; k < n; k++) {
          if (Math.random() < 0.12) continue;
          const a = Math.random() * Math.PI * 2;
          const r = Math.sqrt(Math.random()) * (w / 2);
          const ex = (px + Math.cos(a) * r) | 0, ey = (py + Math.sin(a) * r) | 0;
          if (layers.active === 0) g.drawImage(env.paper(), ex, ey, 2, 2, ex, ey, 2, 2);
          else { g.globalCompositeOperation = 'destination-out'; g.fillRect(ex, ey, 2, 2); g.globalCompositeOperation = 'source-over'; }
        }
      }
      return;
    }

    if (tool === 'marker') {
      /* flat and opaque, almost no grain -- a wide felt tip, not wax */
      const w = Math.max(5, base * 1.1);
      const stepN = Math.max(1, Math.ceil(dist / Math.max(1, w * 0.4)));
      g.globalAlpha = 0.92 - fast * 0.1;
      g.fillStyle = colorHex;
      for (let i = 0; i <= stepN; i++) {
        const t = i / stepN;
        g.beginPath(); g.arc(x0 + dx * t, y0 + dy * t, w / 2, 0, Math.PI * 2); g.fill();
      }
      g.globalAlpha = 1;
      return;
    }

    if (tool === 'pencil') {
      /* thin and crisp: small jitter, a hard rather than waxy edge */
      const w = Math.max(1, base * 0.3);
      const stepN = Math.max(1, Math.ceil(dist / Math.max(1, w * 0.5)));
      for (let i = 0; i <= stepN; i++) {
        const t = i / stepN;
        const px = x0 + dx * t + (Math.random() - 0.5) * 0.4, py = y0 + dy * t + (Math.random() - 0.5) * 0.4;
        stamp(px, py, w, colorHex, 0.85 - fast * 0.2);
      }
      return;
    }

    if (tool === 'spray') {
      /* a scatter of single pixels over a much wider radius than the nib */
      const w = Math.max(12, base * 2.4);
      const stepN = Math.max(1, Math.ceil(dist / 3));
      g.fillStyle = colorHex;
      for (let i = 0; i <= stepN; i++) {
        const t = i / stepN;
        const px = x0 + dx * t, py = y0 + dy * t;
        for (let k = 0; k < 6; k++) {
          const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * (w / 2);
          g.globalAlpha = 0.45 + Math.random() * 0.3;
          g.fillRect((px + Math.cos(a) * r) | 0, (py + Math.sin(a) * r) | 0, 1, 1);
        }
      }
      g.globalAlpha = 1;
      return;
    }

    /* crayon: waxy grain, the machine's default nib */
    const w = Math.max(3, base * (1 - fast * 0.45));
    const alpha = 0.96 - fast * 0.34;
    const stepN = Math.max(1, Math.ceil(dist / Math.max(1, w * 0.3)));
    for (let i = 0; i <= stepN; i++) {
      const t = i / stepN;
      const jx = (Math.random() - 0.5) * w * 0.22;
      const jy = (Math.random() - 0.5) * w * 0.22;
      const px = x0 + dx * t + jx, py = y0 + dy * t + jy;
      stamp(px, py, w, colorHex, alpha);
    }
  }

  /* a flood fill with a deliberately ragged edge: the frontier stops one pixel early about a third of the time, so the boundary is not a machine
     line but something that was coloured in */
  function fill(sx, sy) {
    const g = env.g(), W = env.W, H = env.H;
    const img = g.getImageData(0, 0, W, H);
    const d = img.data;
    const at = (x, y) => (y * W + x) * 4;
    const s = at(sx, sy);
    const t = [d[s], d[s + 1], d[s + 2]], ta = d[s + 3];
    const hex = env.hex();
    const nc = [parseInt(hex.substr(1, 2), 16), parseInt(hex.substr(3, 2), 16), parseInt(hex.substr(5, 2), 16)];
    if (ta === 255 && Math.abs(t[0] - nc[0]) + Math.abs(t[1] - nc[1]) + Math.abs(t[2] - nc[2]) < 12) return;
    /* the tolerance itself is jittered, so the frontier stops unevenly and the boundary comes out hand-coloured rather than machine-cut. Jitter
       the FRONTIER, never the interior: a random skip inside the region leaves unfilled speckles, which is a bug and not a texture. */
    const near = i => Math.abs(d[i] - t[0]) + Math.abs(d[i + 1] - t[1]) + Math.abs(d[i + 2] - t[2]) + Math.abs(d[i + 3] - ta) * 2
      < 46 + (Math.random() * 22 - 11);
    const seen = new Uint8Array(W * H);
    const q = [sy * W + sx];
    seen[q[0]] = 1;
    let head = 0;
    while (head < q.length) {
      const p = q[head++];
      const x = p % W, y = (p / W) | 0;
      const i = p * 4;
      const jit = (Math.random() * 13 - 6) | 0;
      d[i] = Math.max(0, Math.min(255, nc[0] + jit));
      d[i + 1] = Math.max(0, Math.min(255, nc[1] + jit));
      d[i + 2] = Math.max(0, Math.min(255, nc[2] + jit));
      d[i + 3] = 255;
      const push = (nx, ny) => {
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) return;
        const np = ny * W + nx;
        if (seen[np]) return;
        if (!near(np * 4)) { seen[np] = 1; return; }
        seen[np] = 1;
        q.push(np);
      };
      push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1);
    }
    g.putImageData(img, 0, 0);
  }

  return { seg, fill, begin() { state = {}; } };
}
