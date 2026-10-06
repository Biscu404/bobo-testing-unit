/* Hallucinations, part one: a snowy city, a snowy park, a machine that runs on
   blood, a chat that never stops, a skater. Each is draw(g, t): t seconds since
   it came on. */
import { W, H, K, pen, snow, seeded } from './blackout_draw.js';

export const city = (g, t) => {
  const { R } = pen(g);
  for (let y = 0; y < H; y += 6) R(0, y, W, 6, y < 60 ? K.black : y < 110 ? K.blue : K.dgrey > 7 ? 1 : 1);
  R(0, 110, W, 70, K.black);
  const r = seeded(11);
  for (let layer = 0; layer < 2; layer++) {
    let x = -((t * (6 + layer * 8)) % 40);
    while (x < W) {
      const bw = 22 + r() * 22 | 0, bh = 40 + r() * (layer ? 60 : 85) | 0, top = 150 - bh;
      R(x, top, bw, bh + 30, layer ? K.dgrey : K.blue);
      R(x, top, bw, 2, K.white);                                    /* snow on the roof */
      for (let wy = top + 6; wy < 146; wy += 7) for (let wx = x + 3; wx < x + bw - 3; wx += 6)
        if (r() < 0.45) R(wx, wy, 3, 4, ((wx * 7 + wy * 3 + Math.floor(t * 2)) % 11) ? K.yellow : K.black);
      x += bw + 2 + (r() * 4 | 0);
    }
  }
  R(0, 150, W, 30, K.dgrey); R(0, 150, W, 2, K.white);
  for (let x = 20; x < W; x += 70) { R(x, 120, 2, 30, K.black); R(x - 4, 118, 10, 3, K.black); R(x - 3, 121, 8, 6, K.yellow); R(x - 8, 127, 18, 24, K.yellow); }
  for (let x = 0; x < W; x += 24) R(x + ((t * 30) % 24), 166, 12, 2, K.grey);
  const cx = W - ((t * 60) % (W + 60));                                /* a red car, crawling */
  R(cx, 156, 26, 7, K.red); R(cx + 6, 151, 13, 6, K.red); R(cx + 8, 152, 9, 4, K.lcyan); R(cx + 2, 162, 5, 4, K.black); R(cx + 18, 162, 5, 4, K.black);
  snow(R, t, 90, 3, -4); snow(R, t * 1.6, 40, 4, -8, 0.4);
};

export const park = (g, t) => {
  const { R, circle } = pen(g);
  R(0, 0, W, H, K.black);
  for (let y = 0; y < 100; y += 5) R(0, y, W, 5, y < 40 ? K.black : K.blue);
  circle(250, 34, 15, K.white); circle(256, 31, 13, K.black); circle(244, 40, 2, K.grey);
  const r = seeded(5);
  for (let i = 0; i < 28; i++) R(r() * W, r() * 70, 1, 1, K.white);
  R(0, 118, W, 62, K.white); R(0, 118, W, 2, K.grey);
  for (let y = 126; y < H; y += 9) R(((y * 13) % 50), y, W, 1, K.grey);
  const tree = (x, s) => {
    const top = 118 - 34 * s, tw = Math.max(3, s * 2);
    R(x, top, tw, 118 - top, K.brown); R(x - 3, 114, tw + 6, 5, K.brown);
    for (let k = 0; k < 6; k++) {                                       /* branches climbing away from the trunk */
      const by = top + 6 + k * (34 * s - 14) / 6, d = k % 2 ? -1 : 1, len = (10 + (k * 7) % 14) * s / 2;
      for (let q = 0; q < len; q += 2) R(x + tw / 2 + d * q, by - q * 0.55, 3, 2, K.brown);
      const ex = x + tw / 2 + d * len, ey = by - len * 0.55;
      R(ex - 2, ey - 6, 2, 6, K.brown); R(ex - 4, ey - 7, 7, 2, K.white);
    }
    R(x - 4, 112, tw + 8, 3, K.white);
  };
  tree(60, 3); tree(180, 2.2); tree(290, 2.6);
  R(110, 112, 46, 4, K.brown); R(110, 104, 46, 3, K.brown); R(112, 116, 3, 8, K.black); R(151, 116, 3, 8, K.black); R(108, 101, 50, 3, K.white);
  R(205, 78, 3, 42, K.black); R(199, 74, 15, 5, K.black); R(201, 79, 11, 8, K.yellow);
  const g2 = 0.25 + 0.2 * Math.sin(t * 9);
  g.globalAlpha = g2; R(190, 79, 34, 40, K.yellow); g.globalAlpha = 1;
  for (let i = 0; i < 10; i++) { R(30 + i * 9, 150 + (i % 2) * 5, 4, 2, K.grey); }
  const sx = 255, sy = 130;                                            /* a snowman nobody built */
  [[0, 12], [2, 9], [4, 7]].forEach(([a, b], i) => { for (let yy = -b; yy <= b; yy++) { const w = Math.floor(Math.sqrt(b * b - yy * yy)); R(sx - w, sy - i * 15 + yy, w * 2 + 1, 1, K.white); } });
  R(sx - 3, sy - 31, 2, 2, K.black); R(sx + 1, sy - 31, 2, 2, K.black); R(sx, sy - 28, 6, 2, K.lred);
  snow(R, t, 140, 7, 8); snow(R, t * 1.5, 40, 8, 14, 0.5);
};

export const ultrakill = (g, t) => {
  const { R, T } = pen(g);
  R(0, 0, W, H, K.black);
  const beat = (t * 4) % 1;
  for (let i = 0; i < 16; i++) {                                         /* a corridor that does not end */
    const k = ((i + beat) / 16), z = 1 - k, w = W * 0.52 * z * z + 5, h = H * 0.52 * z * z + 3;
    const c = i % 2 ? K.red : K.lred;
    R(W / 2 - w, H / 2 - h, w * 2, 2, c); R(W / 2 - w, H / 2 + h - 2, w * 2, 2, c);
    R(W / 2 - w, H / 2 - h, 2, h * 2, c); R(W / 2 + w - 2, H / 2 - h, 2, h * 2, c);
  }
  for (let q = 0; q < 8; q++) {                                           /* the seams running into the dark */
    const a = q * 0.785 + 0.39, ex = W / 2 + Math.cos(a) * W, ey = H / 2 + Math.sin(a) * W;
    for (let s2 = 0.08; s2 < 1; s2 += 0.04) R(W / 2 + (ex - W / 2) * s2 * 0.62, H / 2 + (ey - H / 2) * s2 * 0.62, 2, 2, K.red);
  }
  R(W / 2 - 3, H / 2 - 12, 6, 24, K.lred); R(W / 2 - 1, H / 2 - 12, 2, 24, K.white);
  /* the machine: two yellow eyes in a red face, arms out */
  const fx = W / 2 + Math.sin(t * 7) * 3;
  R(fx - 28, 56, 56, 64, K.dgrey); R(fx - 28, 56, 56, 3, K.grey); R(fx - 22, 64, 44, 50, K.black);
  R(fx - 18, 78, 12, 7, K.yellow); R(fx + 6, 78, 12, 7, K.yellow); R(fx - 16, 80, 4, 3, K.white); R(fx + 8, 80, 4, 3, K.white);
  R(fx - 12, 100, 24, 4, K.lred); for (let q = -10; q < 10; q += 4) R(fx + q, 98, 2, 8, K.black);
  R(fx - 64, 94, 36, 9, K.dgrey); R(fx + 28, 94, 36, 9, K.dgrey); R(fx - 64, 90, 9, 17, K.lred); R(fx + 55, 90, 9, 17, K.lred);
  R(8, 8, 96, 8, K.dgrey); R(9, 9, 94 * (0.35 + 0.3 * Math.sin(t * 3)), 6, K.lred); R(8, 18, 70, 4, K.dgrey); R(9, 19, 40, 2, K.yellow);
  const ranks = ['DESTRUCTIVE', 'CHAOTIC', 'BRUTAL', 'ANARCHIC', 'SUPREME', 'SSADISTIC', 'SSSHITSTORM', 'ULTRAKILL'];
  const rk = Math.min(7, Math.floor(t * 9) % 8);
  T(ranks[rk], 214, 10, rk > 4 ? K.lred : K.yellow, 1);
  for (let i = 0; i <= rk; i++) R(214, 18 + i * 3, 8 + i * 6, 2, i > 4 ? K.lred : K.yellow);
  T('BLOOD IS FUEL', 90, 150, ((t * 6) | 0) % 2 ? K.lred : K.white, 2);
  for (let i = 0; i < 26; i++) { const r = seeded(i + 40)(); R((r * 997 + t * 30 * (1 + r)) % W, (r * 551 + t * 50 * (0.5 + r)) % H, 1 + (i % 3 === 0), 2, K.lred); }
  snow(R, t, 40, 9, 0, 0.3);
};

export const discord = (g, t) => {
  const { R, T } = pen(g);
  R(0, 0, W, H, K.dgrey); R(0, 0, 26, H, K.black); R(26, 0, 78, H, K.dgrey); R(104, 0, W - 104, H, K.black);
  const icons = [K.lblue, K.lgreen, K.lred, K.yellow, K.lmagenta, K.lcyan, K.brown];
  icons.forEach((c, i) => { R(6, 8 + i * 22, 14, 14, c); if (i === 0) R(2, 8, 2, 14, K.white); });
  R(6, 164, 14, 10, K.green);
  T('NEW SERVER', 30, 8, K.white, 1); R(30, 16, 70, 1, K.black);
  ['GENERAL', 'MEMES', 'MUSIC', 'ULTRAKILL', 'SKATE', 'LINUX', 'LEAGUE', 'TURTLES'].forEach((n, i) => {
    const on = i === 0;
    if (on) R(28, 22 + i * 12, 74, 10, K.black);
    T('#' + n, 34, 25 + i * 12, on ? K.white : K.grey, 1);
    if (i === 2 || i === 4) R(29, 25 + i * 12, 2, 3, K.white);
  });
  R(110, 6, 8, 1, K.grey); T('# GENERAL', 110, 8, K.white, 1); R(104, 18, W - 104, 1, K.dgrey);
  const lines = [['SNOWMAN', 'IT IS SNOWING IN THE PARK', K.lcyan], ['XX_TURTLE_XX', 'HE MADE IT TO THE SEA', K.lgreen], ['TUX', 'SUDO MAKE ME A SANDWICH', K.yellow],
    ['V1', 'BLOOD IS FUEL', K.lred], ['YOU', 'WAKE UP', K.white], ['SKATER', 'LANDED IT FIRST TRY', K.lmagenta], ['VHS', 'BE KIND REWIND', K.lblue]];
  const shown = Math.min(lines.length, 2 + Math.floor(t * 7));
  lines.slice(0, shown).forEach(([who, msg, c], i) => {
    const y = 26 + i * 18 - Math.max(0, shown - 7) * 18;
    R(110, y, 10, 10, c); T(who, 124, y, c, 1); T('TODAY AT 3:' + (14 + i * 7), 124 + who.length * 4 + 6, y, K.grey, 1); T(msg, 124, y + 7, K.white, 1);
  });
  R(112, 160, W - 124, 14, K.dgrey);
  const dots = ((t * 4) | 0) % 4;
  T('SOMEONE IS TYPING' + '...'.slice(0, dots), 114, 164, K.grey, 1);
  R(300, 4, 12, 9, K.lred); T('9', 304, 6, K.white, 1);
  snow(R, t, 70, 12, 3, 0.25);
};

export const skate = (g, t) => {
  const { R } = pen(g);
  for (let y = 0; y < 110; y += 5) R(0, y, W, 5, y < 30 ? K.blue : y < 60 ? K.magenta : y < 85 ? K.lmagenta : K.lred);
  R(0, 110, W, 70, K.white); R(0, 110, W, 2, K.grey);
  for (let x = -((t * 20) % 40); x < W; x += 40) R(x, 100, 24, 10, K.dgrey);        /* a city behind */
  R(0, 138, W, 42, K.dgrey); R(0, 138, W, 3, K.white);
  for (let i = 0; i < 14; i++) R(i * 4, 138 - i, 4, i + 1, K.grey);                   /* a snowy quarter pipe */
  for (let i = 0; i < 14; i++) R(W - 4 - i * 4, 138 - i, 4, i + 1, K.grey);
  R(110, 128, 100, 3, K.grey); R(112, 131, 3, 7, K.dgrey); R(205, 131, 3, 7, K.dgrey); R(110, 126, 100, 2, K.white);   /* the rail */
  const u = (t * 0.7) % 1, jump = Math.sin(Math.min(1, u * 1.6) * Math.PI);
  const x = 40 + u * 240, y = 124 - jump * 46, flip = u < 0.65 ? Math.sin(u * 1.54 * Math.PI * 2) : 0;
  const bh = Math.max(1, Math.abs(flip) * 4);
  R(x - 14, y + 20 + (1 - jump) * 0, 28, bh, K.brown); R(x - 14, y + 20, 28, 1, K.yellow);
  R(x - 11, y + 24, 3, 3, K.white); R(x + 8, y + 24, 3, 3, K.white);
  R(x - 8, y + 8, 5, 12, K.black); R(x + 3, y + 8, 5, 12, K.black);                  /* legs */
  R(x - 6, y - 8, 12, 17, K.lcyan); R(x - 5, y - 8, 4, 17, K.cyan);                  /* a puffer jacket */
  R(x - 11, y - 6 - jump * 6, 5, 3, K.lcyan); R(x + 6, y - 7 - jump * 4, 5, 3, K.lcyan);
  R(x - 4, y - 18, 9, 10, K.lred); R(x - 5, y - 20, 11, 4, K.black);
  snow(R, t, 110, 16, 18); snow(R, t * 1.4, 30, 17, 28, 0.5);
};
