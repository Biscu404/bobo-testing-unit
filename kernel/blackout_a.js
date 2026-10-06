/* Hallucinations, part one: a snowy bridge in the city, chickens on a park bench,
   a corridor that runs on blood, a chat that never stops, a bouldering wall. Each is
   draw(g, t): t seconds since it came on. All but the chat are photographs
   (blackout_photo.js) with snow falling through them. */
import { W, H, K, pen, snow } from './blackout_draw.js';
import { photo } from './blackout_photo.js';

export const city = (g, t) => {
  photo(g, 'city', t);
  const { R } = pen(g);
  snow(R, t, 90, 3, -4); snow(R, t * 1.6, 40, 4, -8, 0.4);
};

export const park = (g, t) => {
  photo(g, 'park', t);
  const { R } = pen(g);
  snow(R, t, 110, 7, 8); snow(R, t * 1.5, 40, 8, 14, 0.5);
};

export const boulder = (g, t) => {
  photo(g, 'boulder', t);
  const { R } = pen(g);
  snow(R, t, 60, 16, 5); snow(R, t * 1.4, 24, 17, 12, 0.5);        /* chalk, or snow; it comes down either way */
};

export const ultrakill = (g, t) => {
  photo(g, 'ultrakill', t);
  const { R } = pen(g);
  snow(R, t, 50, 9, 0, 0.3);
};

export const discord = (g, t) => {
  const { R, T } = pen(g);
  R(0, 0, W, H, K.dgrey); R(0, 0, 26, H, K.black); R(26, 0, 78, H, K.dgrey); R(104, 0, W - 104, H, K.black);
  const icons = [K.lblue, K.lgreen, K.lred, K.yellow, K.lmagenta, K.lcyan, K.brown];
  icons.forEach((c, i) => { R(6, 8 + i * 22, 14, 14, c); if (i === 0) R(2, 8, 2, 14, K.white); });
  R(6, 164, 14, 10, K.green);
  T('NEW SERVER', 30, 8, K.white, 1); R(30, 16, 70, 1, K.black);
  ['GENERAL', 'MEMES', 'MUSIC', 'ULTRAKILL', 'BOULDER', 'LINUX', 'LEAGUE', 'TURTLES'].forEach((n, i) => {
    const on = i === 0;
    if (on) R(28, 22 + i * 12, 74, 10, K.black);
    T('#' + n, 34, 25 + i * 12, on ? K.white : K.grey, 1);
    if (i === 2 || i === 4) R(29, 25 + i * 12, 2, 3, K.white);
  });
  R(110, 6, 8, 1, K.grey); T('# GENERAL', 110, 8, K.white, 1); R(104, 18, W - 104, 1, K.dgrey);
  const lines = [['SNOWMAN', 'IT IS SNOWING IN THE PARK', K.lcyan], ['XX_TURTLE_XX', 'HE MADE IT TO THE SEA', K.lgreen], ['TUX', 'SUDO MAKE ME A SANDWICH', K.yellow],
    ['V1', 'BLOOD IS FUEL', K.lred], ['YOU', 'WAKE UP', K.white], ['CLIMBER', 'FLASHED THE YELLOW ONE', K.lmagenta], ['HENS', 'THEY ARE ON THE BENCHES AGAIN', K.lblue]];
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
