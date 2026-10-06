/* Hallucinations, part two: a heap of discs, a very small turtle, a map with three
   lanes, a Debian desktop. The first three are photographs (blackout_photo.js) with
   snow falling through them; the desktop is drawn out of the sixteen colours, text and
   all, because a screenshot pressed down to 320 pixels is a screenshot nobody can read. */
import { W, H, K, pen, snow, dith, layer } from './blackout_draw.js';
import { photo } from './blackout_photo.js';

export const cd = (g, t) => {
  photo(g, 'cd', t);
  const { R } = pen(g);
  snow(R, t, 80, 21, 6);
};

export const turtle = (g, t) => {
  photo(g, 'turtle', t);
  const { R } = pen(g);
  snow(R, t, 120, 23, 5); snow(R, t * 1.4, 30, 24, 12, 0.5);
};

export const lol = (g, t) => {
  photo(g, 'lol', t);
  const { R, T } = pen(g);
  const bn = ['VICTORY', 'DEFEAT', 'PENTAKILL', 'ACED'][Math.floor(t * 2.2) % 4], x = (W - bn.length * 12) / 2, c = bn === 'DEFEAT' ? K.lred : K.yellow;
  T(bn, x + 1, 61, K.black, 3); T(bn, x, 60, c, 3);
  snow(R, t, 130, 25, 7); snow(R, t * 1.3, 40, 26, 14, 0.5);
};

/* ---- the Debian desktop: GNOME's bar, the swirl, a quick-settings panel, and neofetch ---- */
const TUX = [                                                    /* what neofetch draws for Debian */
  '       _,met$$$$$gg.', '    ,g$$$$$$$$$$$$$$$P.', '  ,g$$P"     """Y$$.".', ' ,$$P\'              `$$$.',
  '\',$$P       ,ggs.     `$$b:', '`d$$\'     ,$P"\'   .    $$$', ' $$P      d$\'     ,    $$P', ' $$:      $$.   -    ,d$$\'',
  ' $$;      Y$b._   _,d$P\'', ' Y$$.    `.`"Y$$$$P"\'', ' `$$b      "-.__', '  `Y$$', '   `Y$$.', '     `$$b.', '       `Y$$b.',
  '          `"Y$b._', '              `"""'];
const INFO = ['OS: DEBIAN GNU/LINUX 12', 'HOST: KVM/QEMU (Q35)', 'KERNEL: 6.1.0-7-AMD64', 'UPTIME: 3 HOURS, 25 MINS', 'PACKAGES: 2761 (DPKG)',
  'SHELL: BASH 5.2.15', 'RESOLUTION: 1680X1050', 'DE: GNOME 43.3', 'WM: MUTTER', 'THEME: ADWAITA-DARK [GTK2/3]', 'TERMINAL: GNOME-TERMINAL',
  'CPU: AMD RYZEN 5 3600 (2)', 'GPU: VIRTIO GPU', 'MEMORY: 1210MIB / 3911MIB'];

const TX = 82, TY = 54;                                           /* the terminal's corner */
function desktop(g) {
  const { R, T, circle } = pen(g);
  dith(g, 0, 0, W, H, K.black, K.blue, 1); dith(g, 0, 70, W, 60, K.black, K.blue, 2); dith(g, 0, 130, W, 50, K.black, K.blue, 1);
  /* the wallpaper: rings round the logo, and the logo */
  [[58, K.blue], [42, K.blue], [31, K.cyan]].forEach(([r, c]) => { for (let a = 0; a < 6.283; a += 0.5 / r * 2) R(50 + Math.cos(a) * r, 84 + Math.sin(a) * r, 1, 1, c); });
  circle(50, 84, 22, K.cyan); circle(50, 84, 20, K.lcyan);
  for (let y = -17; y <= 17; y++) { const w = Math.floor(Math.sqrt(17 * 17 - y * y)); dith(g, 50 - w, 84 + y, w * 2 + 1, 1, K.white, K.yellow, 1); }
  for (let a = 0.3; a < 11.5; a += 0.1) { const r = 2 + a * 1.05, d = a > 9 ? 1 : 2; R(50 + Math.cos(a + 2.4) * r - d / 2, 84 + Math.sin(a + 2.4) * r - d / 2, d, d, K.black); }
  T('DEBIAN', 22, 116, K.grey, 2);
  /* GNOME's bar */
  R(0, 0, W, 9, K.black); T('ACTIVITIES', 3, 2, K.white, 1); R(50, 2, 5, 5, K.dgrey); T('TERMINAL', 58, 2, K.white, 1);
  T('APR 4 11:51 AM', 126, 2, K.white, 1); R(292, 2, 5, 5, K.grey); R(299, 2, 5, 5, K.grey); R(306, 2, 5, 5, K.grey);
  /* the quick-settings panel */
  R(216, 11, 100, 40, K.dgrey); R(217, 12, 98, 38, K.black);
  [221, 233].forEach(x => R(x, 15, 7, 7, K.dgrey)); [292, 304].forEach(x => R(x, 15, 7, 7, K.dgrey));
  R(221, 26, 5, 4, K.grey); R(230, 27, 80, 2, K.lblue); R(300, 25, 4, 5, K.white);
  R(219, 33, 47, 8, K.lblue); T('WIRED', 224, 35, K.white, 1); R(269, 33, 45, 8, K.dgrey); T('BALANCED', 272, 35, K.white, 1);
  R(219, 42, 47, 8, K.dgrey); T('NIGHT LIGHT', 221, 44, K.white, 1); R(269, 42, 45, 8, K.lblue); T('DARK MODE', 272, 44, K.white, 1);
  /* the terminal */
  const x0 = TX, y0 = TY;
  R(x0, y0, 236, 124, K.dgrey); R(x0 + 1, y0 + 9, 234, 114, K.black);
  T('LINUXIAC@BOOKWORM: ~', x0 + 78, y0 + 2, K.white, 1); [214, 220, 226].forEach(d => R(x0 + d, y0 + 2, 4, 4, K.grey));
  TUX.forEach((s, i) => T(s, x0 + 4, y0 + 11 + i * 6, K.white, 1));
  const ix = x0 + 116;
  T('LINUXIAC', ix, y0 + 11, K.lred, 1); T('@', ix + 32, y0 + 11, K.white, 1); T('BOOKWORM', ix + 36, y0 + 11, K.lred, 1);
  R(ix, y0 + 18, 68, 1, K.white);
  INFO.forEach((s, i) => {
    const k = s.indexOf(':');
    T(s.slice(0, k + 1), ix, y0 + 23 + i * 6, K.lred, 1); T(s.slice(k + 1), ix + (k + 1) * 4, y0 + 23 + i * 6, K.white, 1);
  });
  [[0, 4, 2, 6, 1, 5, 3, 7], [8, 12, 10, 14, 9, 13, 11, 15]].forEach((row, j) => row.forEach((c, i) => R(ix + i * 6, y0 + 23 + INFO.length * 6 + 3 + j * 5, 6, 5, c)));
  T('LINUXIAC@BOOKWORM:~$', x0 + 4, y0 + 113, K.lgreen, 1);
}

export const linux = (g, t) => {
  const { R } = pen(g);
  g.drawImage(layer('linux', desktop), 0, 0);
  if (((t * 2.5) | 0) % 2) R(TX + 4 + 21 * 4, TY + 113, 3, 5, K.white);       /* the cursor, waiting */
  snow(R, t, 90, 27, 4);
};
