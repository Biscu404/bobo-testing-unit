/* The furniture of the shed's puzzle screen that is not the board: the strip along the top (which board, how many moves, what is in your hands), Jesse's box along the bottom (the same box as the
   bench's, but it is the other Jesse in it), the panel when a board is done, and the help. Pure drawing, handed the Cook's painters. */
import { drawJesseEC } from './jesse_ec.js';
import { PARTS, blit } from './shed_art.js';

export function createUi(P) {
  const { R, wash, txt, g, wrapTo } = P;
  const frame = (x, y, w, h, c) => { R(x, y, w, 1, c); R(x, y + h - 1, w, 1, c); R(x, y, 1, h, c); R(x + w - 1, y, 1, h, c); };

  /* the strip: board, subtitle, moves against par, what you hold, coins, parts handed in */
  function hud(lv, wd, s, o) {
    R(0, 0, 420, 36, 0); wash(0, 0, 420, 36, 8, 3); R(0, 35, 420, 1, 8);
    txt(String(lv.id).padStart(2, '0') + '  ' + lv.name, 8, 4, 14, 'bold 13px monospace');
    g().save(); g().beginPath(); g().rect(0, 18, 224, 16); g().clip();
    txt(lv.sub, 8, 21, 7, '9px monospace');
    g().restore();
    const over = s.moves - lv.par;
    txt('MOVES', 232, 4, 7, '9px monospace');
    txt(s.moves + ' / ' + lv.par, 232, 15, over > 0 ? 12 : over === 0 ? 14 : 10, 'bold 13px monospace');
    txt('IN', 302, 4, 7, '9px monospace');
    txt(s.delivered + ' / ' + wd.need, 302, 15, s.delivered >= wd.need ? 10 : 15, 'bold 13px monospace');
    txt('HANDS', 346, 4, 7, '9px monospace');
    if (s.held) blit(R, PARTS[o.heldIx % PARTS.length], 352, 14, 1); else txt('—', 354, 15, 7, 'bold 13px monospace');
    if (wd.price || wd.coins.length || wd.stall) {
      txt('COINS', 388, 4, 7, '9px monospace');
      txt(s.coins + (wd.price ? '/' + wd.price : ''), 392, 15, wd.price && s.coins >= wd.price ? 10 : 14, 'bold 13px monospace');
    }
  }

  /* Jesse's box. A small one slides up from the bottom and goes by itself; a held one (the first time in the shed, the end, the help) gets the middle of the screen and waits for a click */
  function speech(kid) {
    if (!kid) return;
    const rate = kid.big ? 36 : 44, typing = Math.floor(kid.t * rate) < kid.s.length, talk = typing && Math.floor(kid.t * 9) % 2 === 0;
    if (kid.big) {
      const open = Math.min(1, kid.t / 0.25), dy = Math.round((1 - open) * 30);
      wash(0, 0, 420, 320, 0, 6);
      const X = 36, Y = 62 + dy, W = 348, H = 150;
      R(X, Y, W, H, 0); R(X, Y, W, 2, 14); R(X, Y + H - 2, W, 2, 14); R(X, Y, 2, H, 14); R(X + W - 2, Y, 2, H, 14);
      wash(X + 2, Y + 2, W - 4, H - 4, 8, 2);
      R(X + 10, Y + 10, 96, 118, 1); R(X + 10, Y + 10, 96, 1, 14); R(X + 10, Y + 127, 96, 1, 14);
      drawJesseEC(g(), X + 14, Y + 14, 5.4, kid.mood, talk);
      txt('JESSE', X + 118, Y + 10, 14, 'bold 12px monospace');
      if (kid.pages > 1) txt(kid.page + ' / ' + kid.pages, X + W - 10, Y + 10, 7, '10px monospace', 'right');
      g().font = '12px monospace';
      if (!kid.lines) kid.lines = wrapTo(kid.s, W - 140);
      const shown = Math.floor(kid.t * 36);
      let n = 0;
      kid.lines.slice(0, 7).forEach((l, i) => { const cut = Math.max(0, Math.min(l.length, shown - n)); n += l.length; if (cut > 0) txt(l.slice(0, cut), X + 118, Y + 30 + i * 16, 15, '12px monospace'); });
      if (shown >= kid.s.length) txt(Math.floor(kid.t * 2.2) % 2 ? '▼ CLICK' : '▼', X + W - 10, Y + H - 16, 11, '10px monospace', 'right');
      return;
    }
    const k = kid.t / kid.life, slide = k < 0.1 ? Math.round(-60 + (k / 0.1) * 60) : k > 0.94 ? Math.round(((k - 0.94) / 0.06) * 60) : 0;
    const H = 62, Y = 254 + slide;
    R(6, Y, 408, H, 0); frame(6, Y, 408, H, 10); wash(6, Y, 408, H, 8, 2);
    drawJesseEC(g(), 12, Y + 5, 2.7, kid.mood, talk);
    if (!kid.lines) { g().font = '11px monospace'; kid.lines = wrapTo(kid.s, 336); }
    const shown = Math.floor(kid.t * 44);
    let n = 0;
    txt('JESSE', 62, Y + 3, 14, '9px monospace');
    kid.lines.slice(0, 3).forEach((l, i) => { const cut = Math.max(0, Math.min(l.length, shown - n)); n += l.length; if (cut > 0) txt(l.slice(0, cut), 62, Y + 15 + i * 13, 15, '11px monospace'); });
  }

  /* a board is done */
  function won(info, t) {
    wash(0, 0, 420, 320, 0, 9);
    R(60, 84, 300, 128, 0); R(60, 84, 300, 2, 11); R(60, 210, 300, 2, 11); R(60, 84, 2, 128, 11); R(358, 84, 2, 128, 11);
    txt(info.last ? 'THE THING IS WHOLE' : 'THE PART IS IN', 210, 98, 15, 'bold 15px monospace', 'center');
    txt(info.moves + ' moves', 210, 124, info.moves <= info.par ? 11 : 14, 'bold 26px monospace', 'center');
    txt('par ' + info.par + (info.best && info.best < info.moves ? '   ·   your best ' + info.best : info.first ? '   ·   first time' : ''), 210, 158, 7, '10px monospace', 'center');
    txt(info.moves <= info.par ? 'PAR OR BETTER' : (info.moves - info.par) + ' over par', 210, 174, info.moves <= info.par ? 10 : 12, '11px monospace', 'center');
    if (t > 1.2) txt(info.last ? 'SPACE' : 'SPACE: THE NEXT ONE', 210, 192, Math.floor(t * 2) % 2 ? 11 : 7, '10px monospace', 'center');
  }
  /* caught: the board goes red and says who */
  function caught(why, t) {
    const w = 240, x = 90, y = 100;
    R(x, y, w, 40, 0); frame(x, y, w, 40, 12); R(x, y, w, 2, 12);
    txt(why === 'taxed' ? 'THE TAX MAN GOT YOU' : 'THEY SAW YOU', 210, y + 7, 12, 'bold 14px monospace', 'center');
    txt('that move did not happen', 210, y + 25, 7, '10px monospace', 'center');
  }
  /* the Thing, going off: the last board's ending (a flash, rings of pink and yellow, confetti coming down; two seconds, and nobody is hurt) */
  function boom(t) {
    const k = Math.min(1, t / 2.2);
    wash(0, 0, 420, 320, 15, Math.round((1 - k) * 9));
    for (let r = 0; r < 3; r++) {
      const rad = Math.floor((t - r * 0.18) * 170);
      if (rad > 0 && rad < 300) for (let a = 0; a < 56; a++) { const an = a / 56 * 6.2832; R(Math.round(210 + Math.cos(an) * rad), Math.round(150 + Math.sin(an) * rad * 0.7), 4, 4, [13, 14, 15][r]); }
    }
    for (let i = 0; i < 70; i++) R((i * 97) % 420, ((i * 53) % 180) + t * (50 + (i % 5) * 22) - 40, 3, 3, [12, 13, 14, 10, 11][i % 5]);
  }
  return { hud, speech, won, caught, boom };
}
