/* The credits' picture, drawn in the machine's sixteen colours and never antialiased: a blue ground (the
   colour of the machine's own desktop), a sunburst of rings and rays round the creator's head, a little
   light in the blue, and a cross behind each playtester in the way the old temple screens drew them. Every
   pixel is written by the ImageData or a whole-pixel rectangle, so the picture is exactly these colours. */
import { W, H } from './layout.js';

/* VGA16, the same sixteen as kernel/god.js (apps may not import from kernel/) */
const PAL = [[0, 0, 0], [0, 0, 170], [0, 170, 0], [0, 170, 170], [170, 0, 0], [170, 0, 170], [170, 85, 0], [170, 170, 170],
  [85, 85, 85], [85, 85, 255], [85, 255, 85], [85, 255, 255], [255, 85, 85], [255, 85, 255], [255, 255, 85], [255, 255, 255]];
export const INK = { blue: 1, cyan: 3, lightBlue: 9, yellow: 14, white: 15, rim: 11 };

const setPx = (d, i, c) => { d[i] = PAL[c][0]; d[i + 1] = PAL[c][1]; d[i + 2] = PAL[c][2]; d[i + 3] = 255; };

/* the ground, the sparkles, and the halo's rings and rays (the ellipse round the creator's head: layout.js haloOf), all in one pass over the pixels */
export function sky(g, halo) {
  const id = g.createImageData(W, H), d = id.data;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4;
    const dx = (x + 0.5 - halo.x) / halo.rx, dy = (y + 0.5 - halo.y) / halo.ry;
    const r = Math.sqrt(dx * dx + dy * dy), th = Math.atan2(dy, dx) + Math.PI;
    let c = INK.blue;
    if (r >= 0.7 && r < 1) c = Math.floor((r - 0.7) * 40) & 1 ? INK.white : INK.yellow;      /* the rings of light */
    else if (r >= 1 && r < 1.45) c = Math.floor(th / (Math.PI / 12)) & 1 ? INK.lightBlue : INK.blue;   /* the rays */
    else if (r < 0.7) c = INK.blue;
    else if (((x * 73856093) ^ (y * 19349663)) % 97 === 0) c = INK.white;                        /* a little light */
    setPx(d, i, c);
  }
  g.putImageData(id, 0, 0);
}

/* a cross, outlined, its bars whole pixels: the upright runs well above the portrait in front of it, and the arm sits just
   above the head and is wider than the portrait, so the cross shows round the picture and not only behind it */
export function cross(g, cx, top, height, armW, armY) {
  const w = 12, arm = armW;
  const bars = [[cx - w / 2, top, w, height], [cx - arm / 2, armY, arm, 12]];
  g.fillStyle = PAL_CSS(INK.white);
  bars.forEach(([x, y, bw, bh]) => g.fillRect(x - 2, y - 2, bw + 4, bh + 4));
  g.fillStyle = PAL_CSS(INK.cyan);
  bars.forEach(([x, y, bw, bh]) => g.fillRect(x, y, bw, bh));
  g.fillStyle = PAL_CSS(INK.rim);
  bars.forEach(([x, y, bw, bh]) => g.fillRect(x + 2, y + 2, bw - 4, bh - 4));
}

export const PAL_CSS = c => 'rgb(' + PAL[c].join(',') + ')';
