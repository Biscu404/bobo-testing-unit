/* DAVE'S SECOND SHELF OF POINTERS: eighteen, none for sale, each given by one trophy. Three are the plain arrow in the colours of somewhere on the machine; the rest are a
   shape drawn here as a silhouette on a sheet of cells (kernel/cos_px.js `grid`, the cells written 'O') whose edge is put round it by `sil`, so every pointer has the same
   one-cell black outline and the same two inks as the others (X the edge, O the fill: kernel/cos.js). `hx`, `hy` is the cell that is the point. */
import { grid } from './cos_px.js';

/* a silhouette drawn with 'O' on a w x h sheet -> the rows of a mask: O inside, X on every empty cell that touches it, '.' elsewhere */
function sil(draw, w, h) {
  const g = grid(w || 14, h || 16); draw(g);
  const r = g.rows(), H = r.length, W = r[0].length, on = (x, y) => x >= 0 && y >= 0 && x < W && y < H && r[y][x] === 'O';
  return r.map((row, y) => [...row].map((ch, x) => on(x, y) ? 'O' : (on(x - 1, y) || on(x + 1, y) || on(x, y - 1) || on(x, y + 1)) ? 'X' : '.').join(''));
}

const P = (id, name, reward, blurb, mask, o, f, hx, hy, secret) => {
  const it = { id, name, price: 0, reward, blurb, mask, o, f, hx: hx || 0, hy: hy || 0, more: true };
  if (secret) it.secret = true;
  return it;
};

const PICK = sil(g => { g.line(5, 14, 12, 5, 'O', 2); [[2, 6], [3, 4], [5, 3], [8, 2], [11, 3], [12, 5]].forEach((p, i, a) => { if (i) g.line(a[i - 1][0], a[i - 1][1], p[0], p[1], 'O', 2); }); });
const HAMMER = sil(g => { g.rect(2, 2, 9, 4, 'O'); g.rect(1, 3, 2, 2, 'O'); g.line(7, 6, 11, 14, 'O', 2); });
const AXE = sil(g => { g.rect(1, 1, 2, 7, 'O'); g.rect(3, 2, 7, 5, 'O'); g.line(6, 7, 11, 14, 'O', 2); });
const HOOK = sil(g => { g.line(7, 1, 7, 10, 'O', 2); g.line(7, 10, 5, 13, 'O', 2); g.line(5, 13, 2, 12, 'O', 2); g.line(2, 12, 2, 9, 'O', 1); g.rect(1, 8, 2, 2, 'O'); });
const SPRIG = sil(g => { g.line(4, 14, 7, 3, 'O', 1); g.oval(5, 5, 3, 2, 'O'); g.oval(10, 7, 3, 2, 'O'); g.oval(4, 10, 3, 2, 'O'); g.rect(7, 1, 2, 3, 'O'); });
const QUILL = sil(g => { g.line(12, 1, 4, 11, 'O', 3); g.line(11, 2, 8, 2, 'O', 2); g.line(4, 11, 1, 15, 'O', 1); g.line(9, 3, 11, 5, 'O', 3); });
const NOTE = sil(g => { g.disc(5, 12, 2, 'O'); g.rect(7, 2, 2, 11, 'O'); g.rect(9, 2, 3, 2, 'O'); g.rect(10, 4, 2, 3, 'O'); });
const SKULL = sil(g => { g.disc(7, 6, 5, 'O'); g.rect(4, 9, 7, 5, 'O'); g.rect(4, 5, 2, 3, 'k'); g.rect(9, 5, 2, 3, 'k'); g.px(7, 9, 'k'); g.px(6, 12, 'k'); g.px(8, 12, 'k'); });
const STAR6 = sil(g => { for (let y = 1; y <= 8; y++) { const w = Math.round((y - 1) * 0.8); g.rect(7 - w, y, w * 2 + 1, 1, 'O'); } for (let y = 7; y <= 14; y++) { const w = Math.round((14 - y) * 0.8 + 0.4); g.rect(7 - w, y - 1, w * 2 + 1, 1, 'O'); } for (let y = 5; y <= 11; y++) { const w = Math.round((y - 5) * 0.8) + 2; g.rect(7 - w, y, w * 2 + 1, 1, 'O'); } g.rect(6, 7, 3, 1, 'k'); });
const FIST = sil(g => { g.rect(2, 7, 11, 5, 'O'); g.rect(2, 3, 2, 5, 'O'); g.rect(5, 2, 2, 6, 'O'); g.rect(8, 2, 2, 6, 'O'); g.rect(11, 3, 2, 5, 'O'); g.rect(0, 8, 3, 3, 'O'); g.rect(4, 12, 7, 3, 'O'); });
const LENS = sil(g => { g.ring(5, 5, 4, 'O', 2); g.line(8, 8, 13, 14, 'O', 2); });
const NEEDLE = sil(g => { g.line(1, 1, 11, 13, 'O', 1); g.line(2, 1, 12, 14, 'O', 1); g.px(10, 11, 'k').px(11, 12, 'k'); });
const LOCK = sil(g => { g.rect(3, 6, 9, 8, 'O'); g.ring(7, 6, 3, 'O', 1); g.rect(4, 4, 1, 3, 'O'); g.rect(10, 4, 1, 3, 'O'); g.rect(7, 9, 1, 3, 'k'); g.px(6, 9, 'k').px(8, 9, 'k'); });
const BIRD = sil(g => { g.oval(8, 8, 5, 3, 'O'); g.disc(3, 6, 2, 'O'); g.rect(0, 6, 2, 1, 'O'); g.line(12, 9, 15, 13, 'O', 2); g.line(6, 11, 6, 14, 'O', 1); g.line(9, 11, 9, 14, 'O', 1); g.px(3, 5, 'k'); }, 16, 16);
const FLAG = sil(g => { g.line(2, 1, 2, 15, 'O', 2); g.rect(3, 2, 9, 6, 'O'); g.px(9, 4, 'k').px(10, 4, 'k'); });

/* `ARROW` is the stock arrow mask of cos_data.js, handed in so this file does not import the file that imports it */
export const cursorsM = ARROW => [
  P('termgreen', 'TERRY\'S ARROW', 'sys_eggs3', 'A black arrow with a green edge, like the one that blinks at the end of a line. It has seen a lot of words come and go.', ARROW, '#55FF55', '#000000'),
  P('blasphemy', 'BLASPHEMOUS', 'sys_rank_b', 'Red, edged in white. The first rank on the meter is a sin, and this is what it points like.', ARROW, '#FFFFFF', '#AA0000'),
  P('bluearrow', 'THUNK', 'sys_thunk', 'White on blue, the colours of the screen that comes up when the machine has had enough. It points at the problem.', ARROW, '#FFFFFF', '#0000AA'),
  P('pickcur', 'THE TENTH FLOOR', 'bk_mine10', 'An iron pick with a short handle. Ten floors down, and the pointer is the only thing that has not got heavy.', PICK, '#000000', '#AAAAAA', 2, 6),
  P('hammercur', 'SWIFT HAMMER', 'bk_house30', 'A carpenter\'s hammer. A house in under thirty days, and the thumb still has the print of it.', HAMMER, '#000000', '#FFFF55', 1, 2),
  P('axecur', 'TIMBER', 'bk_timber', 'A felling axe, sharp and a little heavy at the head. Six trees in a row, and not one of them knew.', AXE, '#000000', '#FF5555', 4, 2),
  P('hookcur', 'A GOLDEN MORNING', 'bk_rare', 'A fish hook in the colour of the thing it caught. The line is not shown; you will find it again.', HOOK, '#AA5500', '#FFFF55', 7, 1),
  P('sprigcur', 'GREEN THUMB', 'gd_sun1', 'A twig with three leaves. It points the way the garden grows, which is up and a bit to the left.', SPRIG, '#000000', '#55FF55', 7, 1),
  P('quillcur', 'A PROMISE', 'nt_promise', 'A quill, for writing things down so that you cannot say you did not. It is kept, and so is this.', QUILL, '#000000', '#FFFFFF', 1, 15),
  P('notecur', 'BY EAR', 'gr_ear', 'An eighth note, because you played it back from memory and were right. It points where the sound goes.', NOTE, '#000000', '#55FFFF', 7, 2),
  P('skullcur', 'END TASK', 'tl_kill', 'A pale skull that points where the process is. It does not mean anything by it. It is only the pointer.', SKULL, '#000000', '#FFFFFF', 7, 1),
  P('starcur', 'SHARP EYE', 'mg_eye', 'A six-pointed star in gold and blue, for the one in the star you saw that nobody else did.', STAR6, '#0000AA', '#FFFF55', 7, 1),
  P('fistcur', 'COUNTER HIT', 'sb_counter', 'A closed fist. It arrived while the other one was still on its way, which is the only polite way.', FIST, '#000000', '#FF5555', 5, 1),
  P('lenscur', 'FEEL IT OUT', 'sw_noflag', 'A glass on a handle. You never needed it. You did the whole room by the numbers, and carried it anyway.', LENS, '#000000', '#55FFFF', 3, 3),
  P('needlecur', 'THE WHITE NEEDLE', 'bk_needle', 'A white needle, very thin, exactly as long as the one in the water. You are not supposed to have this.', NEEDLE, '#000000', '#FFFFFF', 1, 1, true),
  P('padlock', 'SAVE AND EXIT', 'tl_readonly', 'A lock on the file you were about to ruin. You let it. It is better now. It did not ask.', LOCK, '#000000', '#FFFF55', 7, 3, true),
  P('magpiecur', 'A THIEF IN FEATHERS', 'bk_magpie', 'A little black-and-white bird with a stolen krone in its beak. You were asleep. You are never anywhere near asleep.', BIRD, '#000000', '#FFFFFF', 0, 6, true),
  P('whiteflag', 'SORRY!', 'el_sorry', 'A white flag on a pole. For an elephant, with a very small trunk, who really did not mean it.', FLAG, '#000000', '#FFFFFF', 2, 1, true)
];
