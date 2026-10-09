/* Cheese, for the elephant (Gheghe's present: a button on the desktop that puts a pile of it down). Pure: the wedge, the pile that gets smaller as it is eaten, and how an elephant eats a
   piece of it (`eatPose`: his trunk goes down to the pile, comes up with a piece, brings it to his mouth, and he chews). Both elephants use the same numbers, the big one in his window
   (apps/elephant) and the small one on the desktop (kernel/pet.js, pet_art.js); the pile is drawn by whoever has the floor it is on. node scripts/check-cheese.mjs holds it. */
export const MAX_BITES = 6, PER_PRESS = 3;                 /* a pile is at most six wedges; a press adds three */

/* a wedge, 14 x 9, in the machine's colours as hex digits: E yellow, 6 brown (rind and holes), F a glint, 0 the edge */
export const WEDGE = [
  '..............',
  '...0000000000.',
  '..0EEEEEEEEF60',
  '.0EE0EEEE0EE60',
  '0EEEEEE0EEEE60',
  '0EEE0EEEEEE660',
  '0EEEEEEEE0E600',
  '00EEEEEEEE6000',
  '.0000000000...'
];
/* where each wedge of a pile lies in its 42 x 28 box, in the order they are laid down: the last is the first to be eaten */
export const SPOTS = [[14, 18], [0, 17], [28, 17], [7, 9], [21, 9], [14, 1]];
export const PILE_W = 42, PILE_H = 28;

/* the pile of `n` wedges as runs of one colour: [x, y, length, colour digit], each wedge over the one behind it */
export function pileRuns(n) {
  const out = [];
  SPOTS.slice(0, Math.max(0, Math.min(MAX_BITES, n))).forEach(([ox, oy]) => {
    WEDGE.forEach((row, j) => {
      let i = 0;
      while (i < row.length) {
        const ch = row[i];
        if (ch === '.') { i++; continue; }
        let k = i + 1;
        while (k < row.length && row[k] === ch) k++;
        out.push([ox + i, oy + j, k - i, parseInt(ch, 16)]);
        i = k;
      }
    });
  });
  return out;
}
/* R(x, y, w, h, colourIndex) fills a rectangle; the pile with its top left at (x, y) and each of its pixels `s` of yours */
export function drawPile(R, x, y, n, s) {
  pileRuns(n).forEach(([i, j, len, c]) => R(x + i * s, y + j * s, len * s, s, c));
}
export const drawWedge = (R, x, y, s) => WEDGE.forEach((row, j) => { for (let i = 0; i < row.length; i++) if (row[i] !== '.') R(x + i * s, y + j * s, s, s, parseInt(row[i], 16)); });

/* ---- the eating --------------------------------------------------------------------------------------------------------------- */
export const EAT_SECS = 3.4, PICK_AT = 0.3, CHEW_FROM = 0.72;
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const smooth = x => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };

/* k is how far through a piece he is (0..1): lean is how far the trunk reaches toward the pile (0..1), curl how far its tip has come up to the mouth, `wedge` whether there is a
   piece held in it, `chew` 1 while the jaw goes, `bite` true from the moment the piece is taken */
export function eatPose(k) {
  k = clamp(k, 0, 1);
  const down = smooth(k / 0.26), up = smooth((k - 0.38) / 0.3);
  const lean = down * (1 - up), curl = up * (k < 0.9 ? 1 : 1 - smooth((k - 0.9) / 0.1));
  return { lean, curl, wedge: k >= PICK_AT && k < CHEW_FROM, chew: k >= CHEW_FROM && k < 0.96 ? 1 : 0, bite: k >= PICK_AT, k };
}

/* how long until the next piece, in seconds: from a pile in his window, from one on the desktop (when he thinks of it, which pet.js does; this is for the window) */
export const nextEatIn = (r = Math.random()) => 6 + r * 6;
