/* DAVE'S SECOND SHELF OF LOGOS: thirty little pictures for the plate on the monitor, drawn on a sheet of 24 x 24 cells and shown at five pixels a cell (kernel/cos_px.js).
   Sixteen colours, whole cells, nothing smoothed. None is for sale: each is given by one trophy (`reward`), and the secret ones are `???` until it is earned. */
import { bitmap, grid } from './cos_px.js';

const L = (id, name, reward, blurb, draw, secret) => {
  const g = grid(); draw(g);
  const o = { id, name, price: 0, reward, blurb, rows: g.rows(), svg: bitmap(g.rows(), 5), more: true };
  if (secret) o.secret = true;
  return o;
};

export const LOGOS_M = [
  L('moon3am', 'THREE IN THE MORNING', 'sys_3am', 'A thin moon over a navy sky. The set was still on. So were you, and so was everything else.',
    g => { g.rect(0, 0, 24, 24, 'b'); g.disc(12, 12, 9, 'y'); g.disc(16, 9, 8, 'b'); g.px(18, 4, 'w').px(21, 8, 'w').px(4, 4, 'w').px(6, 18, 'w').px(20, 17, 'C').px(9, 2, 'C'); g.rect(0, 21, 24, 3, 'k'); }),
  L('tenkeys', 'THE WRONG KEY', 'sys_wrongkey', 'A grey pad with two red buttons. Pressed the wrong one in the dark. Nobody was meant to see that.',
    g => { g.rect(0, 6, 24, 14, 'a'); g.rect(0, 6, 24, 1, 'w'); g.rect(0, 19, 24, 1, 'd'); g.rect(4, 9, 3, 8, 'k'); g.rect(2, 11, 7, 3, 'k'); g.rect(5, 12, 1, 1, 'd'); g.disc(15, 15, 2, 'r'); g.disc(20, 13, 2, 'r'); g.px(15, 14, 'R'); g.px(20, 12, 'R'); g.rect(9, 17, 3, 1, 'd'); g.rect(13, 17, 3, 1, 'd'); }, true),
  L('ringzero', 'THE RINGS', 'sys_panic', 'Rings going out from one dot in the middle. The dot has the keys to everything and has never once been asked.',
    g => { g.ring(12, 12, 11, 'R', 2); g.ring(12, 12, 7, 'r', 2); g.disc(12, 12, 2, 'w'); }, true),
  L('eyeoracle', 'SEVEN WORDS', 'tl_seven', 'An eye that opens when you ask, and shuts when you say too many. Seven words is plenty.',
    g => { g.line(1, 12, 12, 5, 'y', 2); g.line(12, 5, 22, 12, 'y', 2); g.line(1, 12, 12, 19, 'y', 2); g.line(12, 19, 22, 12, 'y', 2); g.disc(12, 12, 4, 'C'); g.disc(12, 12, 2, 'k'); g.px(11, 11, 'w'); g.rect(11, 0, 2, 3, 'y'); g.line(4, 3, 7, 6, 'y'); g.line(20, 3, 17, 6, 'y'); }),
  L('defragmented', 'EVERYTHING IN ORDER', 'tl_defrag', 'Six bars, each a little longer than the one above. The disk ran for an hour and this is what it wanted.',
    g => { ['c', 'C', 'g', 'G', 'y', 'R'].forEach((c, i) => g.rect(2, 3 + i * 3, 4 + i * 3, 2, c)); g.rect(2, 21, 20, 1, 'd'); }),
  L('adam', 'ADAM', 'tl_adam', 'A man with a ring over his head. Task manager says there is nothing it can do. He agrees.',
    g => { g.ring(12, 4, 4, 'y', 1); g.disc(12, 8, 3, 'a'); g.rect(8, 12, 9, 8, 'a'); g.rect(5, 12, 3, 7, 'a'); g.rect(17, 12, 3, 7, 'a'); g.rect(9, 20, 3, 3, 'a'); g.rect(13, 20, 3, 3, 'a'); g.rect(11, 14, 3, 3, 'r'); g.px(11, 7, 'k').px(13, 7, 'k'); }, true),
  L('semicolon', 'THE MISSING SEMICOLON', 'hc_error', 'Fifty lines of HolyC and the one thing it wanted. The compiler says no, and says it on the right line.',
    g => { g.rect(10, 4, 4, 4, 'R'); g.rect(10, 12, 4, 4, 'R'); g.rect(8, 16, 4, 4, 'R'); g.rect(7, 19, 3, 3, 'R'); g.rect(0, 0, 24, 1, 'r'); g.rect(0, 23, 24, 1, 'r'); }),
  L('pileup', 'PILE DRIVER', 'sys_pile20', 'Twenty files in one go, stacked as they landed. The pages are not all facing the same way.',
    g => { g.rect(3, 13, 12, 9, 'a').rect(4, 14, 10, 7, 'w'); g.rect(9, 9, 12, 10, 'a').rect(10, 10, 10, 8, 'w'); g.rect(5, 3, 12, 10, 'a').rect(6, 4, 10, 8, 'w'); [6, 8, 10].forEach(y => g.rect(7, y, 7, 1, 'd')); [12, 14].forEach(y => g.rect(11, y, 7, 1, 'd')); g.rect(13, 3, 4, 1, 'k'); }),
  L('sss', 'SSS', 'sys_rank_sss', 'Three gold letters over a gold bar. The meter went there, and it stayed, and the files kept going in.',
    g => { const S = ['.yyy.', 'y...y', 'y....', '.yyy.', '....y', 'y...y', '.yyy.']; [3, 9, 15].forEach(x => g.stamp(x, 7, S)); g.rect(2, 4, 20, 1, 'y'); g.rect(2, 17, 20, 2, 'y'); g.px(1, 11, 'w').px(22, 9, 'w').px(23, 14, 'w'); }),
  L('suncoin', 'A THOUSAND SUN', 'sys_earned1', 'A gold coin with a sun on it. The first thousand were the hardest. Everyone says so about the first thousand.',
    g => { g.disc(12, 12, 10, 'n'); g.disc(12, 12, 9, 'y'); g.disc(12, 12, 3, 'n'); [[0, -6], [0, 6], [-6, 0], [6, 0], [4, 4], [-4, -4], [4, -4], [-4, 4]].forEach(p => g.rect(12 + p[0] - 1, 12 + p[1] - 1, 2, 2, 'n')); }),
  L('mask', 'FIRST BREATH', 'sw_first', 'A pale mask with two black eyes. Everybody starts with five of them and then stops counting.',
    g => { g.disc(12, 9, 8, 'w'); g.rect(4, 9, 17, 6, 'w'); g.rect(6, 15, 13, 3, 'w'); g.rect(8, 18, 9, 2, 'w'); g.rect(10, 20, 5, 1, 'w'); g.stamp(5, 8, ['.kk.', 'kkkk', 'kkk.', '.k..']); g.stamp(16, 8, ['.kk.', 'kkkk', '.kkk', '..k.']); g.rect(4, 14, 17, 1, 'a'); g.rect(6, 17, 13, 1, 'a'); }),
  L('geo', 'GEO', 'sw_rooms6', 'Three small coins and a bigger one on top. Nothing down there is for sale; you pay in this anyway.',
    g => { g.disc(7, 17, 4, 'a').disc(7, 17, 1, 'k'); g.disc(17, 17, 4, 'a').disc(17, 17, 1, 'k'); g.disc(12, 10, 5, 'w').disc(12, 10, 2, 'a').disc(12, 10, 1, 'k'); g.rect(3, 22, 18, 1, 'd'); }),
  L('barque', 'THE SUN BOAT', 'ae_pilgrim', 'A boat with the sun on board. It goes across the sky the same way every day, and you went with it.',
    g => { g.disc(12, 9, 6, 'R'); g.disc(12, 9, 4, 'y'); g.rect(2, 16, 20, 3, 'n'); g.rect(0, 14, 3, 3, 'n'); g.rect(21, 14, 3, 3, 'n'); g.rect(2, 16, 20, 1, 'y'); g.rect(0, 20, 24, 1, 'B'); g.rect(2, 22, 20, 1, 'b'); }),
  L('locust', 'AGAINST THE WIND', 'ae_wind', 'A locust with the wind behind it. You went through anyway, which was a mistake and also the point.',
    g => { g.oval(11, 13, 7, 3, 'G'); g.disc(19, 12, 3, 'G'); g.px(20, 11, 'k'); g.line(21, 9, 23, 5, 'g'); g.line(10, 9, 14, 6, 'C'); g.line(14, 6, 18, 9, 'C'); g.line(5, 15, 2, 20, 'g'); g.line(9, 16, 7, 21, 'g'); g.line(14, 16, 16, 21, 'g'); g.rect(3, 12, 3, 2, 'g'); g.rect(8, 11, 2, 1, 'g'); }),
  L('pyramid', 'WITHIN SIGHT', 'ae_near', 'A pyramid on the horizon and a sun to the side of it. It is not as far as it looks; it is exactly as far.',
    g => { for (let i = 0; i < 12; i++) { g.rect(13 - i, 8 + i, i + 1, 1, 'y'); g.rect(13, 8 + i, i + 1, 1, 'n'); } g.disc(4, 5, 3, 'R'); g.rect(0, 20, 24, 4, 'y'); g.rect(0, 22, 24, 2, 'n'); }),
  L('seedling', 'FIRST FRUIT', 'gd_first', 'A seedling in a plain pot. It will be gone in the next few minutes, and so will its price.',
    g => { g.rect(7, 16, 10, 6, 'n').rect(6, 15, 12, 2, 'R').rect(7, 15, 10, 1, 'n'); g.rect(11, 8, 2, 7, 'g'); g.oval(8, 9, 3, 2, 'G'); g.oval(16, 7, 3, 2, 'G'); g.px(11, 9, 'g').px(13, 7, 'g'); }),
  L('flask', 'THERMOSTAT', 'ck_thermo', 'Blue in a glass flask, held at the temperature it likes. Too hot and it ruins; too cold and it never sets.',
    g => { g.rect(10, 2, 4, 7, 'a'); g.rect(9, 2, 6, 1, 'w'); for (let i = 0; i < 12; i++) { g.px(11 - i * 0.55, 9 + i, 'a'); g.px(12 + i * 0.55, 9 + i, 'a'); g.rect(Math.round(12 - i * 0.55), 9 + i, Math.round(i * 1.1) + 1, 1, i > 5 ? 'C' : 'k'); } g.rect(3, 21, 18, 2, 'a'); g.px(10, 17, 'w').px(14, 15, 'w').px(12, 19, 'w'); }),
  L('hexagram', 'KEEP GOING', 'mg_chain25', 'Two triangles, one on the other, in a blue that does not move. Twenty-five presses and nobody blinked.',
    g => { g.line(12, 2, 3, 17, 'B', 2).line(12, 2, 21, 17, 'B', 2).line(3, 17, 21, 17, 'B', 2); g.line(12, 22, 3, 7, 'B', 2).line(12, 22, 21, 7, 'B', 2).line(3, 7, 21, 7, 'B', 2); g.disc(12, 12, 1, 'y'); }),
  L('fist', 'GOT YOU', 'sb_throw', 'A fist, closed, with lines either side to show how fast it was. There is nowhere to go from here.',
    g => { g.rect(6, 7, 3, 4, 'w').rect(9, 6, 3, 5, 'w').rect(12, 6, 3, 5, 'w').rect(15, 7, 3, 4, 'w'); g.rect(6, 10, 12, 8, 'w'); g.rect(5, 14, 3, 5, 'a'); g.rect(8, 18, 8, 4, 'd'); [9, 12, 15].forEach(x => g.px(x, 8, 'a').px(x, 9, 'a')); g.rect(0, 6, 4, 1, 'C').rect(0, 11, 3, 1, 'C').rect(20, 8, 4, 1, 'C').rect(21, 14, 3, 1, 'C'); }),
  L('bomb', 'IT WAS A BOMB ALL ALONG', 'sb_bomb', 'A round bomb with cat ears, a wick and a very satisfied look. You touched it. Of course you did.',
    g => { g.disc(12, 14, 8, 'd'); g.disc(10, 12, 3, 'a'); g.rect(5, 4, 4, 4, 'd'); g.rect(16, 4, 4, 4, 'd'); g.px(6, 5, 'R').px(17, 5, 'R'); g.rect(8, 12, 2, 2, 'y'); g.rect(14, 12, 2, 2, 'y'); g.rect(10, 17, 4, 1, 'R'); g.line(15, 6, 19, 1, 'n', 1); g.px(20, 0, 'y').px(21, 1, 'R'); }),
  L('cap', 'YARE YARE', 'sb_yare', 'A cap, a chain, and a sigh. He said it so you would not have to.',
    g => { g.disc(12, 12, 7, 'B'); g.rect(3, 12, 18, 6, 'k'); g.rect(3, 15, 18, 3, 'B'); g.rect(2, 17, 20, 2, 'b'); g.rect(10, 8, 4, 3, 'y'); for (let i = 0; i < 5; i++) g.ring(4 + i * 4, 21, 1, 'a'); }, true),
  L('pickaxe', 'THE FIRST STATION', 'bk_mine5', 'A pick with the handle worn smooth. Five floors down, and a bench to sit on before the sixth.',
    g => { g.line(5, 21, 17, 7, 'n', 2); [[5, 9], [6, 6], [8, 4], [11, 3], [15, 3], [18, 5], [20, 8], [21, 11]].forEach((p, i, a) => { if (i) g.line(a[i - 1][0], a[i - 1][1], p[0], p[1], 'a', 2); }); g.px(8, 3, 'w').px(12, 2, 'w'); }),
  L('trout', 'ANGLER', 'bk_fish5', 'Blue, with a pale belly and a tail that was in the way. Five of these, and you start to understand it.',
    g => { g.oval(12, 12, 8, 5, 'B'); g.rect(5, 14, 14, 2, 'C'); g.line(5, 12, 1, 7, 'B', 2); g.line(5, 12, 1, 17, 'B', 2); g.rect(2, 8, 2, 8, 'B'); g.rect(16, 11, 2, 2, 'w'); g.px(17, 12, 'k'); g.line(9, 7, 12, 4, 'b', 2); g.px(10, 11, 'C').px(13, 10, 'C').px(7, 12, 'C'); }),
  L('present', 'JUST WHAT I WANTED', 'bk_gift', 'A box with a ribbon, tied by someone who tried. Whatever is in it, they were right about you.',
    g => { g.rect(4, 10, 16, 11, 'R'); g.rect(3, 8, 18, 3, 'M'); g.rect(11, 8, 2, 13, 'y'); g.disc(9, 6, 2, 'y'); g.disc(15, 6, 2, 'y'); g.rect(11, 5, 2, 3, 'n'); g.rect(4, 19, 16, 2, 'r'); }),
  L('bruin', 'PERKELE', 'bk_bear', 'A bear with a snout and no opinion of you. It arrives on day twenty-one, and so does the swearing.',
    g => { g.disc(5, 6, 3, 'n').disc(19, 6, 3, 'n').disc(5, 6, 1, 'r').disc(19, 6, 1, 'r'); g.disc(12, 13, 8, 'n'); g.disc(12, 16, 4, 'y'); g.px(9, 11, 'k').px(15, 11, 'k').rect(11, 15, 3, 2, 'k').px(12, 18, 'r').px(13, 18, 'r'); }, true),
  L('stag', 'THE FIRST POUR', 'bt_pour', 'A stag between its antlers and a light shining where a cross would be. Fifty-six herbs, give or take.',
    g => { g.oval(12, 15, 4, 5, 'n'); g.px(10, 14, 'k').px(14, 14, 'k').rect(11, 18, 3, 2, 'k'); g.line(9, 12, 5, 5, 'y', 1); g.line(15, 12, 19, 5, 'y', 1); g.line(5, 5, 3, 1, 'y', 1); g.line(19, 5, 21, 1, 'y', 1); g.line(6, 8, 9, 6, 'y', 1); g.line(18, 8, 15, 6, 'y', 1); g.line(7, 6, 3, 6, 'y', 1); g.line(17, 6, 21, 6, 'y', 1); g.rect(11, 2, 2, 5, 'R'); g.rect(10, 4, 4, 1, 'R'); }),
  L('trunk', 'HEY THERE FRIEND', 'el_hello', 'A big grey face, two white tusks and a trunk hanging straight down. He said hello first. He always does.',
    g => { g.disc(4, 10, 5, 'd').disc(20, 10, 5, 'd'); g.disc(4, 10, 4, 'a').disc(20, 10, 4, 'a'); g.disc(12, 10, 6, 'a'); g.rect(10, 14, 4, 8, 'a'); g.rect(10, 21, 4, 1, 'd'); g.rect(7, 16, 2, 4, 'w').rect(15, 16, 2, 4, 'w'); g.px(9, 9, 'k').px(15, 9, 'k').px(9, 8, 'w').px(15, 8, 'w'); g.rect(10, 17, 1, 1, 'd').rect(13, 17, 1, 1, 'd'); }),
  L('crayon', 'FIRST MARK', 'cr_first', 'One red crayon, half the wrapper gone. It was a line, and then another, and now you have a drawing.',
    g => { g.line(5, 20, 17, 8, 'R', 4); g.line(7, 18, 15, 10, 'a', 2); g.line(17, 8, 20, 5, 'r', 3); g.px(21, 4, 'w'); g.px(20, 4, 'w'); g.line(3, 22, 6, 22, 'R', 1); }),
  L('quavers', 'FIRST NOTE', 'gr_note', 'Two eighth notes, beamed. The first was an accident. The second one, you meant.',
    g => { g.disc(6, 18, 3, 'G'); g.disc(17, 16, 3, 'G'); g.rect(8, 5, 1, 13, 'G'); g.rect(19, 3, 1, 13, 'G'); g.rect(8, 4, 12, 3, 'G'); g.rect(8, 8, 12, 1, 'g'); }),
  L('record', 'YOUR RECORD', 'hf_own', 'A silver disc with a label you made yourself, and a hole for the spindle. Nobody else has one like it.',
    g => { g.disc(12, 12, 10, 'C'); g.ring(12, 12, 10, 'c', 1); g.disc(12, 12, 4, 'M'); g.disc(12, 12, 1, 'k'); g.ring(12, 12, 7, 'a', 1); g.line(4, 6, 8, 3, 'w', 1); g.line(3, 9, 5, 7, 'w', 1); })
];
