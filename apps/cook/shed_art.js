/* The pictures of the backyard puzzle (shed_draw.js draws them, two screen pixels to each of theirs), as grids of hex digits in the machine's sixteen colours: 0 black, 1 blue, 2 green, 3 cyan,
   4 red, 5 magenta, 6 brown, 7 light grey, 8 dark grey, 9 light blue, A light green, B light cyan, C light red, D light magenta, E yellow, F white, '.' clear. The parts are household junk on
   purpose: nothing here is anything but a spoon. A neighbour is made (`neighbour`) so that she can look any of four ways, or have her eyes shut. */
export const SPOON = [
  '..00000..',
  '.0FFFFF0.',
  '.0F777F0.',
  '.0F777F0.',
  '..0FFF0..',
  '...0F0...',
  '...0F0...',
  '...0F0...',
  '....0....'
];
export const CAN = [
  '.........',
  '..00000..',
  '.0FFFFF0.',
  '.0777770.',
  '.0FFFFF0.',
  '.0777770.',
  '.0FFFFF0.',
  '..00000..',
  '.........'
];
export const BATTERY = [
  '...000...',
  '...0F0...',
  '..00000..',
  '.0EEEEE0.',
  '.0E000E0.',
  '.0444440.',
  '.0444440.',
  '.0444440.',
  '..00000..'
];
export const FUNNEL = [
  '.0000000.',
  '.0FFFFF0.',
  '..0F7F0..',
  '..0F7F0..',
  '...0F0...',
  '...0F0...',
  '...0F0...',
  '....0....',
  '.........'
];
export const KETTLE = [
  '....0....',
  '...060...',
  '..00000..',
  '.0FFFFF00',
  '0F7FFF0F0',
  '0FFFFF0.0',
  '.0FFFFF0.',
  '..00000..',
  '.........'
];
export const COIN = [
  '..000..',
  '.0EEE0.',
  '0EE6EE0',
  '0E6EEE0',
  '0EE6EE0',
  '.0EEE0.',
  '..000..'
];
export const GNOME = [
  '....0....',
  '...040...',
  '..04440..',
  '..04C40..',
  '.0444440.',
  '..0CCC0..',
  '..0CFC0..',
  '.0FFFFF0.',
  '.0FFFFF0.',
  '..0FFF0..',
  '..0FFF0..',
  '..00F00..',
  '...000...'
];
export const TAX = [
  '...00000...',
  '..0000000..',
  '...0CCC0...',
  '...0C0C0...',
  '...0CCC0...',
  '..0777770..',
  '.07777F770.',
  '.07777F770.',
  '.0777F7770.',
  '.07.777.70.',
  '...07070...',
  '...07070...',
  '..0000000..'
];
export const JESSE = [
  '...06666...',
  '..0666666..',
  '..0CCCCC0..',
  '..0C0C0C0..',
  '..0CCCCC0..',
  '...0CCC0...',
  '..0FFFFF0..',
  '.0F0FFF0F0.',
  '.080FFF080.',
  '.080FFF080.',
  '.080FFF080.',
  '..08.0.80..',
  '..00...00..'
];
export const VAN = [
  '...............',
  '..000000000000.',
  '.0FFFFFFFFF0F0.',
  '.0F444F444F0BB0',
  '.0FFFFFFFFFFBB0',
  '.0FFFFFFFFFFFF0',
  '.0777777777777.',
  '.0FFFFFFFFFFFF0',
  '.0000000000000.',
  '..08880.08880..',
  '..08F80.08F80..',
  '...000...000...'
];
export const STALL = [
  'EEFFEEFFEEFFEEF',
  'EEFFEEFFEEFFEEF',
  'EEFFEEFFEEFFEEF',
  '000000000000000',
  '.6...........6.',
  '.6...EE......6.',
  '.6..EEEE.....6.',
  '.6...EE......6.',
  '666666666666666',
  '6EEEEEEEEEEEEE6',
  '666666666666666',
  '.6...........6.',
  '.6...........6.',
  '.6...........6.',
  '.6...........6.'
];
export const SHED = [
  '......000......',
  '....0066600....',
  '..00666666600..',
  '.0666666666660.',
  '066666666666666',
  '.0888888888880.',
  '.0877777777780.',
  '.0878888888780.',
  '.0878000008780.',
  '.0878066608780.',
  '.0878066608780.',
  '.0878066E08780.',
  '.0878066608780.',
  '.0888888888880.',
  '.0000000000000.'
];
/* the parts, in the order they are handed out */
export const PARTS = [SPOON, CAN, BATTERY, FUNNEL, KETTLE];
export const PART_NAMES = ['A SPOON', 'A TIN CAN', 'A BATTERY', 'A FUNNEL', 'A KETTLE'];

/* a neighbour, 11 x 13: hair, a face whose eyes look `look` ('N', 'E', 'S', 'W', or '-' for shut), a collar and a shirt */
const EYES = {
  E: ['.0CCCCCCC0.', '.0CF0CF0C0.'], W: ['.0CCCCCCC0.', '.0C0FC0FC0.'],
  N: ['.0C00C00C0.', '.0CFFCFFC0.'], S: ['.0CFFCFFC0.', '.0C00C00C0.'], '-': ['.0CCCCCCC0.', '.0C00C00C0.']
};
export const NEIGHBOURS = [['9', '8', 'MRS. PICKLES'], ['A', '6', 'OLD GEORGE'], ['D', '0', 'MS. VANCE'], ['B', '7', 'THE TWINS DAD']];
const memo = {};
export function neighbour(who, look) {
  const key = who + look;
  if (memo[key]) return memo[key];
  const [shirt, hair] = NEIGHBOURS[who % NEIGHBOURS.length], e = EYES[look] || EYES['-'];
  return (memo[key] = [
    '...00000...', '..0hhhhh0..'.replace(/h/g, hair), '.0hhhhhhh0.'.replace(/h/g, hair), e[0], e[1],
    '..0CCCCC0..', '..0CCCCC0..', '..0888880..', '.0SSSSSSS0.'.replace(/S/g, shirt), '0SSSSSSSSS0'.replace(/S/g, shirt), '0SSSSSSSSS0'.replace(/S/g, shirt), '.000000000.'
  ]);
}

/* the runs of one colour along each row of a grid, [x, y, length, digit]: what a painter that fills rectangles wants */
export function runs(rows) {
  const key = rows.join('|');
  if (memo[key]) return memo[key];
  const out = [];
  rows.forEach((row, j) => {
    let i = 0;
    while (i < row.length) {
      const ch = row[i];
      if (ch === '.') { i++; continue; }
      let k = i + 1;
      while (k < row.length && row[k] === ch) k++;
      out.push([i, j, k - i, parseInt(ch, 16)]);
      i = k;
    }
  });
  return (memo[key] = out);
}
/* R(x, y, w, h, digit) paints a rectangle; the grid with its top left at (x, y), each of its pixels `s` of yours */
export const blit = (R, rows, x, y, s) => runs(rows).forEach(([i, j, len, c]) => R(x + i * s, y + j * s, len * s, s, c));
export const sizeOf = rows => [rows[0].length, rows.length];
