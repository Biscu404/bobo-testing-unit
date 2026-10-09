/* The pictures on the credits screen that are not the portraits: an open hand in a glove, and the eight things the four give you, as grids of hex digits (the sixteen colours of the
   machine: 0 black 1 blue 2 green 3 cyan 4 red 5 magenta 6 brown 7 light grey 8 dark grey 9 light blue A light green B light cyan C light red D light magenta E yellow F white, '.' clear).
   In the hand 'S' and 's' are the sleeve and its shade, whatever colour the giver wears. The cookie is made, not drawn, so it can be any size (the Magen star that can be a cookie and
   the Garden's flower use it too: apps/gifts_art.js). Drawn by drawGrid at a whole multiple of its pixels. */
export const PAL = [[0, 0, 0], [0, 0, 170], [0, 170, 0], [0, 170, 170], [170, 0, 0], [170, 0, 170], [170, 85, 0], [170, 170, 170],
  [85, 85, 85], [85, 85, 255], [85, 255, 85], [85, 255, 255], [255, 85, 85], [255, 85, 255], [255, 255, 85], [255, 255, 255]];
export const css = c => 'rgb(' + PAL[c].join(',') + ')';

export const HAND = [
  '....................',
  '....................',
  '........00..........',
  '.......0FF000.......',
  '.......0FF0FF0......',
  '.....000FF0FF0......',
  '....0FF0FF0FF000....',
  '....0FF0FF0FF0FF0...',
  '....0FF0FF0FF0FF0...',
  '..000FF0FF0FF0FF0...',
  '..000FF0FF0FF0FF0...',
  '.0FF0FF0FF0FF0FF0...',
  '.0FFFFFFFFFFFFFF0...',
  '.0FFFFFFFFFFFFFF0...',
  '..0FFFFFFFFFFFFF0...',
  '...0FFFFFFFFFF770...',
  '...0FFFFFFFFFF770...',
  '....0FFFFFFFFF77....',
  '.....0FFFFFFFF0.....',
  '......00000000......',
  '.....0ssssssss0.....',
  '.....0SSSSSSSS0.....',
  '.....0SSSSSSSS0.....',
  '.....0SSSSSSSS0.....'
];

export const BORSEC = [
  '................',
  '......0000......',
  '......0990......',
  '......0110......',
  '......0110......',
  '.....000000.....',
  '......0BB0......',
  '.....0BFFB0.....',
  '....0BFFFFB0....',
  '....0B1111B0....',
  '....0F1FF1F0....',
  '....0B1111B0....',
  '....0BFFFFB0....',
  '....0B9999B0....',
  '....0BFFFFB0....',
  '.....000000.....'
];

export const GOOSE = [
  '................',
  '.........000....',
  '........0FFF0...',
  '.......0FF0F0E0.',
  '.......0FFFF0EE0',
  '.......0FFFF00E0',
  '........0FF0.00.',
  '........0FF0....',
  '...00..00FFF0...',
  '..0FF0.0FFFFF0..',
  '.0FFFF00FFFFFF0.',
  '0FF77FFFFFFFFF0.',
  '0F7777FFFFFFF70.',
  '.0F7777FFFFF70..',
  '..00F77777770...',
  '....0000EE00....'
];

export const BLUEPRINT = [
  '................',
  '.00000000000000.',
  '.01111111111110.',
  '.01FFFFFFFFFF10.',
  '.01F1111F111F10.',
  '.01F1991F1FFF10.',
  '.01F1991F1111F0.',
  '.01F1111F1FFF10.',
  '.01FFFF1F1111F0.',
  '.01111F11FFFF10.',
  '.01FFFFFFFFFF10.',
  '.01111111111110.',
  '.0F7F7F7F7F7F70.',
  '.00000000000000.',
  '................',
  '................'
];

export const CHIPS = [
  '................',
  '......0000......',
  '......0CC0......',
  '......0440......',
  '.....000000.....',
  '......0EE0......',
  '.....0EEEE0.....',
  '....0EEEEEE0....',
  '....0EFEEEE0....',
  '....0E0E0E60....',
  '....0EEEEEE0....',
  '....0E6EE6E0....',
  '....0EEEEEE0....',
  '....0EEEEEE0....',
  '.....000000.....',
  '................'
];

export const BEER = [
  '................',
  '......0000......',
  '......0EE0......',
  '......0EE0......',
  '.......66.......',
  '.......66.......',
  '......0660......',
  '.....066660.....',
  '.....0FFFF0.....',
  '.....0F44F0.....',
  '.....0FFFF0.....',
  '.....066660.....',
  '.....066660.....',
  '.....066660.....',
  '......0000......',
  '................'
];

export const MORGAN = [
  '................',
  '.....000000.....',
  '.....0EEEE0.....',
  '.....0E66E0.....',
  '....00000000....',
  '...0666666660...',
  '..066666666660..',
  '..06CCCCCCCC60..',
  '..06C000000C60..',
  '..06C0EE0EC060..',
  '..06CC0EE0CC60..',
  '..06CCCCCCCC60..',
  '..066666666660..',
  '..066666666660..',
  '...0000000000...',
  '................'
];

export const POTION = [
  '................',
  '.......66.......',
  '......0660......',
  '......0AA0......',
  '......0AA0......',
  '.....0AAAA0.....',
  '....0AAAAAA0....',
  '...0AFAAAAAA0...',
  '...0AAAAAA2A0...',
  '...0A2AAAAAA0...',
  '...0AAAA2AAA0...',
  '...0AAAAAAAA0...',
  '....0AAAAAA0....',
  '.....000000.....',
  '................',
  '................'
];


/* a cookie of n x n pixels, bitten: a round of dough with a darker rim, a lighter top, five chips, and a bite out of the top right */
export function cookie(n) {
  const rows = [], c = n / 2, R = c - 0.5, inb = (x, y) => Math.hypot(x + 0.5 - n * 0.80, y + 0.5 - n * 0.22) < n * 0.2 || Math.hypot(x + 0.5 - n * 0.93, y + 0.5 - n * 0.45) < n * 0.11 || Math.hypot(x + 0.5 - n * 0.64, y + 0.5 - n * 0.06) < n * 0.1;
  const inside = (x, y) => x >= 0 && y >= 0 && x < n && y < n && Math.hypot(x + 0.5 - c, y + 0.5 - c) <= R && !inb(x, y);
  const chips = [[0.34, 0.34], [0.58, 0.55], [0.3, 0.64], [0.7, 0.72], [0.5, 0.2], [0.44, 0.82]].map(p => [Math.round(p[0] * n), Math.round(p[1] * n)]);
  const cs = n >= 16 ? 2 : 1;
  for (let y = 0; y < n; y++) {
    let r = '';
    for (let x = 0; x < n; x++) {
      if (!inside(x, y)) { r += '.'; continue; }
      const edge = !inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1) || !inside(x, y + 1);
      if (edge) { r += '0'; continue; }
      if (chips.some(p => x >= p[0] && x < p[0] + cs && y >= p[1] && y < p[1] + cs)) { r += '0'; continue; }
      const d = Math.hypot(x + 0.5 - c * 0.85, y + 0.5 - c * 0.8);
      const rim = !inside(x - 2, y) || !inside(x + 2, y) || !inside(x, y - 2) || !inside(x, y + 2);
      r += rim ? '6' : (d < R * 0.55 && (x + y) % 2 === 0) ? 'E' : '6';
    }
    rows.push(r);
  }
  return rows;
}

/* paints a grid: (x, y) the top left, s the size of one pixel of it, `sleeve` the digits (or one) standing for 'S' and 's' */
export function drawGrid(g, rows, x, y, s, sleeve) {
  const sl = sleeve || [4, 4];
  for (let j = 0; j < rows.length; j++) {
    const row = rows[j];
    let i = 0;
    while (i < row.length) {
      const ch = row[i];
      if (ch === '.') { i++; continue; }
      let k = i + 1;
      while (k < row.length && row[k] === ch) k++;                       /* a run of one colour is one rectangle */
      const d = ch === 'S' ? sl[0] : ch === 's' ? (sl[1] != null ? sl[1] : sl[0]) : parseInt(ch, 16);
      if (!Number.isNaN(d)) { g.fillStyle = css(d); g.fillRect(Math.round(x + i * s), Math.round(y + j * s), Math.round((k - i) * s), Math.ceil(s)); }
      i = k;
    }
  }
}
export const sizeOf = rows => [rows[0].length, rows.length];
