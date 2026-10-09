/* The sprites a document can drop into a line: $SP,"temple"$. Sixteen by sixteen, flat rects, the sixteen colours and nothing else, like every icon on the machine.
   The names are the ones Doc/Welcome.DD and Doc/DolDoc.DD have always promised (temple cross folder scroll disk bell flame ark glider); anything the desktop already
   has an icon for (folder, disc, notes, terminal, ...) answers to its own name too. Pure data: Node can read it. */
import { SPRITES } from './sprites.js';
import './sprites_extra.js';

const S = body => '<svg viewBox="0 0 16 16" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg">' + body + '</svg>';
const R = (x, y, w, h, c) => '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + c + '"/>';
const Y = '#FFFF55', W = '#FFFFFF', G = '#AAAAAA', D = '#555555', K = '#000000', C = '#55FFFF', B = '#0000AA', LB = '#5555FF', RD = '#AA0000', LR = '#FF5555', BR = '#AA5500';

export const DD_SPRITES = {
  /* the temple of the splash: a cross, a stepped pediment, columns and a stepped base */
  temple: S(R(7, 0, 2, 3, Y) + R(6, 1, 4, 1, Y) + R(6, 3, 4, 1, Y) + R(4, 4, 8, 1, Y) + R(2, 5, 12, 1, Y) + R(1, 6, 14, 1, W) +
    R(5, 7, 6, 6, '#00AAAA') + R(3, 7, 2, 6, G) + R(7, 7, 2, 6, G) + R(11, 7, 2, 6, G) + R(3, 7, 1, 6, W) + R(7, 7, 1, 6, W) + R(11, 7, 1, 6, W) +
    R(1, 13, 14, 1, G) + R(0, 14, 16, 1, D) + R(0, 15, 16, 1, G)),
  /* a gold cross with a little light round it */
  cross: S(R(7, 2, 2, 12, Y) + R(4, 5, 8, 2, Y) + R(6, 0, 4, 1, W) + R(2, 3, 1, 1, C) + R(13, 3, 1, 1, C) + R(2, 8, 1, 1, C) + R(13, 8, 1, 1, C) + R(3, 14, 10, 1, D)),
  /* a scroll: the roll at each end, the page between, the lines on it */
  scroll: S(R(2, 1, 12, 3, G) + R(2, 1, 12, 1, W) + R(3, 4, 10, 8, '#FFFFFF') + R(3, 4, 1, 8, G) + R(12, 4, 1, 8, G) + R(5, 6, 6, 1, D) + R(5, 8, 5, 1, D) + R(5, 10, 6, 1, D) +
    R(2, 12, 12, 3, G) + R(2, 14, 12, 1, D) + R(1, 2, 1, 1, BR) + R(14, 2, 1, 1, BR) + R(1, 13, 1, 1, BR) + R(14, 13, 1, 1, BR)),
  /* a floppy disk: the shutter, the label, the notch */
  disk: S(R(1, 1, 14, 14, B) + R(1, 1, 14, 1, LB) + R(4, 1, 8, 5, G) + R(9, 2, 2, 3, K) + R(3, 9, 10, 6, W) + R(4, 10, 8, 1, D) + R(4, 12, 6, 1, D) + R(1, 14, 14, 1, K) + R(14, 1, 1, 3, K)),
  /* a bell: the crown, the waist, the flare, the clapper */
  bell: S(R(7, 0, 2, 2, Y) + R(5, 2, 6, 1, Y) + R(4, 3, 8, 2, Y) + R(3, 5, 10, 4, Y) + R(2, 9, 12, 2, Y) + R(1, 11, 14, 1, '#AA5500') + R(4, 3, 2, 6, W) + R(7, 12, 2, 2, BR) + R(6, 14, 4, 1, BR) + R(12, 5, 1, 4, BR)),
  /* a flame: red, then yellow, then white at its heart */
  flame: S(R(7, 0, 2, 2, LR) + R(6, 2, 4, 2, LR) + R(5, 4, 6, 3, RD) + R(4, 6, 8, 5, LR) + R(3, 9, 10, 4, LR) + R(5, 6, 6, 7, Y) + R(6, 9, 4, 5, W) + R(4, 13, 8, 1, RD) + R(5, 14, 6, 1, D)),
  /* the ark: a gold chest, its two poles, and a cherub's wings over the lid */
  ark: S(R(1, 4, 3, 3, Y) + R(12, 4, 3, 3, Y) + R(3, 5, 10, 1, Y) + R(4, 6, 8, 1, Y) + R(2, 7, 12, 1, Y) + R(2, 8, 12, 5, Y) + R(2, 8, 12, 1, W) + R(2, 12, 12, 1, BR) + R(4, 9, 8, 2, BR) +
    R(0, 14, 16, 1, D) + R(5, 3, 2, 2, Y) + R(9, 3, 2, 2, Y) + R(7, 2, 2, 3, W)),
  /* the glider: five cells of the Game of Life that walk across a grid for ever */
  glider: S(R(1, 1, 14, 14, K) + R(1, 5, 14, 1, D) + R(1, 10, 14, 1, D) + R(5, 1, 1, 14, D) + R(10, 1, 1, 14, D) + R(6, 1, 4, 4, '#55FF55') + R(11, 6, 4, 4, '#55FF55') + R(1, 11, 4, 4, '#55FF55') + R(6, 11, 4, 4, '#55FF55') + R(11, 11, 4, 4, '#55FF55')),
  /* a god's eye: the oracle's word, with rays */
  god: S(R(0, 0, 16, 16, K) + R(7, 0, 2, 3, Y) + R(7, 13, 2, 3, Y) + R(0, 7, 3, 2, Y) + R(13, 7, 3, 2, Y) + R(3, 3, 1, 1, Y) + R(12, 3, 1, 1, Y) + R(3, 12, 1, 1, Y) + R(12, 12, 1, 1, Y) +
    R(4, 5, 8, 6, W) + R(5, 4, 6, 8, W) + R(6, 6, 4, 4, '#0000AA') + R(7, 7, 2, 2, K)),
  /* a note on a stave (the oracle's song) */
  note: S(R(1, 4, 14, 1, D) + R(1, 6, 14, 1, D) + R(1, 8, 14, 1, D) + R(1, 10, 14, 1, D) + R(1, 12, 14, 1, D) + R(9, 1, 1, 11, W) + R(10, 1, 4, 2, W) + R(5, 10, 5, 3, C) + R(4, 11, 1, 1, C))
};

/* the svg markup for a name, or null when the machine has no such picture */
export function ddSprite(name) {
  const k = String(name || '').toLowerCase().trim();
  return DD_SPRITES[k] || SPRITES[k] || null;
}
export const DD_NAMES = Object.keys(DD_SPRITES);
