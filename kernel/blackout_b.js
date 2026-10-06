/* Hallucinations, part two: a disc, a tape, a very small turtle, a map with
   three lanes, a penguin. */
import { W, H, K, pen, snow, seeded } from './blackout_draw.js';

const RAINBOW = [K.lred, K.yellow, K.lgreen, K.lcyan, K.lblue, K.lmagenta];
let discBuf = null;
function disc(g, cx, cy, r, rot) {
  const { R } = pen(g);
  for (let y = -r; y <= r; y++) {
    const half = Math.floor(Math.sqrt(r * r - y * y));
    for (let x = -half; x <= half; x += 2) {
      const d = Math.hypot(x, y);
      if (d < r * 0.16) continue;
      const a = Math.atan2(y, x) + rot;
      let c = d > r * 0.9 ? K.grey : d < r * 0.3 ? K.white : RAINBOW[Math.floor(((a / 6.283 + 1) * 6 + d / r * 2) % 6)];
      if (Math.sin(a * 3) > 0.55 && d > r * 0.35) c = K.white;                  /* the glare */
      R(cx + x, cy + y, 2, 1, c);
    }
  }
  R(cx - 2, cy - 2, 4, 4, K.black);
}
export const cd = (g, t) => {
  const { R, T } = pen(g);
  R(0, 0, W, H, K.black);
  for (let y = 0; y < H; y += 4) R(0, y, W, 1, K.dgrey);
  [[40, 40, 22, 1], [270, 60, 26, -1.3], [60, 140, 18, 0.8], [280, 150, 20, 1.6]].forEach(([x, y, r, s], i) =>
    disc(g, x + Math.sin(t * 2 + i) * 6, y + ((t * 20 * (1 + i * 0.3)) % 30) - 10, r, t * s * 3));
  disc(g, W / 2, H / 2 - 6, 62, t * 4.2);
  T('AUDIO', 126, 162, K.white, 2);
  T('74:00', 134, 174, K.lcyan, 1);
  snow(R, t, 80, 21, 6);
  void discBuf;
};

export const vhs = (g, t) => {
  const { R, T, circle } = pen(g);
  R(0, 0, W, H, K.dgrey);
  const wob = Math.sin(t * 5) * 2;
  const x = 60 + wob, y = 38;
  R(x, y, 200, 110, K.black); R(x, y, 200, 3, K.dgrey); R(x + 3, y + 108, 194, 2, K.dgrey);
  R(x + 14, y + 10, 172, 40, K.white); R(x + 14, y + 10, 172, 7, K.lred); R(x + 14, y + 43, 172, 3, K.lblue);
  T('E-180', x + 20, y + 22, K.black, 2); T('HG', x + 150, y + 22, K.black, 2); T('SP', x + 20, y + 38, K.dgrey, 1);
  R(x + 28, y + 60, 144, 36, K.dgrey); R(x + 32, y + 64, 136, 28, K.black);
  [[x + 62, y + 78], [x + 138, y + 78]].forEach(([cx, cy], i) => {
    circle(cx, cy, 15, K.white); circle(cx, cy, 6, K.black);
    for (let k = 0; k < 6; k++) { const a = t * 4 * (i ? 0.7 : 1) + k * 1.047; R(cx + Math.cos(a) * 11 - 1, cy + Math.sin(a) * 11 - 1, 3, 3, K.white); }
  });
  R(x + 80, y + 76, 40, 3, K.brown);
  /* tracking: bars of snow that crawl up the picture */
  const r = seeded(Math.floor(t * 12));
  for (let b = 0; b < 4; b++) {
    const by = (H - ((t * 70 + b * 47) % (H + 20))) | 0, bh = 5 + (r() * 9 | 0);
    for (let xx = 0; xx < W; xx += 3) if (r() < 0.55) R(xx, by + (r() * bh | 0), 2 + (r() * 4 | 0), 1, r() < 0.5 ? K.white : K.grey);
  }
  T('PLAY >', 14, 12, K.lgreen, 2); T('SP 0:' + String(10 + ((t * 7) | 0) % 50) + ':' + String(((t * 31) | 0) % 60).padStart(2, '0'), 14, 28, K.lgreen, 1);
  T('REW <<', 224, 160, ((t * 3) | 0) % 2 ? K.lgreen : K.black, 2);
  snow(R, t, 50, 22, 0);
};

export const turtle = (g, t) => {
  const { R, circle } = pen(g);
  for (let y = 0; y < 70; y += 5) R(0, y, W, 5, y < 25 ? K.black : K.blue);
  for (let i = 0; i < 10; i++) R(0, 44 + i * 2, W, 1, i % 2 ? K.lblue : K.blue);
  for (let x = 0; x < W; x += 16) R(x + Math.sin(t * 2 + x) * 5, 58 + Math.sin(x + t * 3) * 2, 12, 2, K.white);
  circle(260, 20, 10, K.white); circle(265, 18, 9, K.black);
  R(0, 66, W, 114, K.brown); for (let y = 66; y < H; y += 6) R(0, y, W, 3, K.brown);
  const r = seeded(30);
  for (let i = 0; i < 160; i++) R(r() * W, 68 + r() * 112, 1 + (r() < 0.2), 1, r() < 0.5 ? K.yellow : K.dgrey);
  /* footprints, going up toward the water */
  for (let i = 0; i < 9; i++) { R(W / 2 - 14 + (i % 2) * 24, 160 - i * 10 + (t * 6) % 10, 3, 2, K.dgrey); }
  const cx = W / 2, cy = 112 + Math.sin(t * 3) * 1.5, s = 3;
  const flap = Math.sin(t * 9) > 0;
  R(cx - 6 * s, cy - 4 * s, 12 * s, 9 * s, K.green); R(cx - 5 * s, cy - 5 * s, 10 * s, 11 * s, K.green);
  R(cx - 4 * s, cy - 3 * s, 8 * s, 7 * s, K.lgreen);
  for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) R(cx + i * 3 * s - s, cy + j * 3 * s - s, 2 * s, 2 * s, K.green);
  R(cx - s, cy - 5 * s, 2 * s, 2 * s, K.lgreen);
  R(cx - 2 * s, cy - 9 * s, 4 * s, 4 * s, K.lgreen);                              /* the head */
  R(cx - 2 * s, cy - 8 * s, s, s, K.black); R(cx + s, cy - 8 * s, s, s, K.black);
  R(cx - 2 * s, cy - 6 * s, 4 * s, 1, K.green);
  [[-1, -3], [1, -3], [-1, 3], [1, 3]].forEach(([sx, sy], i) => {
    const up = (i % 2 === 0) === flap;
    R(cx + sx * 7 * s - (sx > 0 ? 0 : 4 * s), cy + sy * s - (up ? 2 * s : 0), 4 * s, 2 * s, K.lgreen);
  });
  R(cx - s, cy + 5 * s, 2 * s, 2 * s, K.lgreen);
  snow(R, t, 120, 23, 5); snow(R, t * 1.4, 30, 24, 12, 0.5);
};

export const lol = (g, t) => {
  const { R, T, circle } = pen(g);
  R(0, 0, W, H, K.black);
  for (let y = 0; y < 150; y += 5) R(0, y, W, 5, y < 60 ? K.blue : K.dgrey);
  /* the map: three lanes and a river, corner to corner */
  const mx = 100, my = 6, ms = 128;
  R(mx, my, ms, ms, K.green); R(mx + 2, my + 2, ms - 4, ms - 4, K.black);
  for (let i = 0; i < ms - 8; i += 3) { R(mx + 4 + i, my + ms - 8 - i, 5, 5, K.brown); R(mx + 4, my + ms - 8 - i, 5, 3, K.brown); R(mx + 4 + i, my + 4, 3, 5, K.brown); R(mx + ms - 9, my + ms - 8 - i, 5, 3, K.brown); R(mx + 4 + i, my + ms - 9, 3, 5, K.brown); }
  for (let i = 0; i < ms - 16; i += 2) R(mx + 8 + i, my + ms - 12 - i, 4, 3, K.lblue);
  R(mx + 8, my + ms - 20, 14, 14, K.lblue); R(mx + ms - 22, my + 6, 14, 14, K.lred);
  R(mx + 12, my + ms - 16, 6, 6, K.white); R(mx + ms - 18, my + 10, 6, 6, K.white);
  for (let i = 0; i < 12; i++) {                                                   /* minions marching */
    const k = ((t * 0.12 + i * 0.08) % 1) * (ms - 30);
    R(mx + 14 + k, my + ms - 18 - k, 3, 3, i % 2 ? K.lblue : K.lred);
    R(mx + ms - 20 - k, my + 12 + k, 3, 3, i % 2 ? K.lred : K.lblue);
  }
  circle(mx + 40 + Math.sin(t) * 8, my + ms - 50 - Math.sin(t) * 8, 5, K.lcyan); circle(mx + ms - 50, my + 40, 5, K.lmagenta);
  R(8, 160, 304, 18, K.dgrey);
  ['Q', 'W', 'E', 'R'].forEach((q, i) => { R(94 + i * 26, 156, 22, 22, K.black); R(95 + i * 26, 157, 20, 20, K.blue); R(95 + i * 26, 157, 20, Math.max(0, 20 * Math.sin(t * 2 + i) ** 2), K.dgrey); T(q, 102 + i * 26, 162, K.white, 2); });
  R(20, 163, 60, 5, K.lred); R(20, 163, 60 * (0.5 + 0.3 * Math.sin(t)), 5, K.lgreen); R(20, 170, 60, 4, K.lblue);
  T('12487', 240, 164, K.yellow, 2);
  T('12/3/7', 8, 8, K.white, 2); T('24:15', 8, 22, K.grey, 1);
  const bn = ['VICTORY', 'DEFEAT', 'PENTAKILL', 'ACED'][Math.floor(t * 2.2) % 4];
  const bw = bn.length * 12;
  T(bn, (W - bw) / 2, 90, bn === 'DEFEAT' ? K.lred : K.yellow, 3);
  snow(R, t, 130, 25, 7); snow(R, t * 1.3, 40, 26, 14, 0.5);
};

export const linux = (g, t) => {
  const { R, T } = pen(g);
  R(0, 0, W, H, K.black);
  const log = ['[  OK  ] REACHED TARGET GRAPHICAL', '[  OK  ] STARTED NETWORK MANAGER', '[  OK  ] STARTED SNOWFALL.SERVICE', '[ FAIL ] FAILED TO START SLEEP.TARGET',
    'LINUX VERSION 6.1.0-SNOW (GCC 12)', 'USER@TEMPLE:~$ UNAME -A', 'LINUX TEMPLE 6.1.0 #1 SMP PREEMPT', 'USER@TEMPLE:~$ SUDO RM -RF /SNOW',
    '[SUDO] PASSWORD FOR USER: ', 'USER@TEMPLE:~$ APT INSTALL TURTLE', 'READING PACKAGE LISTS... DONE', 'E: UNABLE TO LOCATE PACKAGE WAKE-UP', 'USER@TEMPLE:~$ '];
  const n = Math.min(log.length, 3 + Math.floor(t * 9));
  log.slice(0, n).forEach((s, i) => T(s, 6, 6 + (i - Math.max(0, n - 20)) * 8, s.indexOf('FAIL') > 0 || s.indexOf('E:') === 0 ? K.lred : s.indexOf('OK') > 0 ? K.lgreen : K.white, 1));
  if (((t * 3) | 0) % 2) R(6 + (log[n - 1].length * 4), 6 + (n - 1) * 8, 3, 5, K.white);
  /* the penguin, on a window of his own: black on black would be no one */
  R(184, 14, 128, 150, K.blue); R(184, 14, 128, 9, K.lblue); R(188, 16, 5, 5, K.lred); R(196, 16, 5, 5, K.yellow); R(204, 16, 5, 5, K.lgreen);
  const px = 232, py = 60 + Math.sin(t * 4) * 2;
  R(px - 4, py - 12, 36, 8, K.black);
  R(px, py - 16, 28, 26, K.black); R(px - 2, py - 8, 32, 8, K.black);
  R(px - 4, py + 6, 36, 52, K.black); R(px - 8, py + 14, 6, 30, K.black); R(px + 30, py + 14, 6, 30, K.black);
  R(px + 6, py + 12, 20, 40, K.white); R(px + 4, py + 18, 24, 30, K.white);
  R(px + 6, py - 6, 7, 8, K.white); R(px + 15, py - 6, 7, 8, K.white); R(px + 9, py - 3, 2, 3, K.black); R(px + 18, py - 3, 2, 3, K.black);
  R(px + 8, py + 3, 12, 5, K.yellow); R(px + 10, py + 8, 8, 2, K.brown);
  R(px - 6, py + 58, 14, 5, K.yellow); R(px + 20, py + 58, 14, 5, K.yellow);
  R(px - 4, py - 16, 36, 3, K.white);                                               /* snow on his head */
  T('TUX', px + 8, py + 68, K.white, 1);
  T('$ ls', 192, 28, K.white, 1);
  snow(R, t, 90, 27, 4);
};
