/* Bekkedal — the furniture of a made room, part one: where you sleep and what you keep.
 *
 * A house you walk into should make sense at a glance: a bed has a head and a foot, a pillow at the one and a folded blanket at the
 * other; a wardrobe is the height of a person; a bookcase is full of books that go in a row. So these are not scattered props, they
 * are *pieces*, drawn whole, and the ones that are bigger than a square (a double bed is two by two, a wardrobe two across) are
 * drawn once from their top-left square and spill over the squares beside and below, which are the same piece's other squares
 * (`BEK_DECOR` names the anchor; the squares under the rest of it carry a solid glyph in the map, `world_check.js` holds the two
 * together). Tall pieces spill *up* onto the wall behind them, which is already laid down by then.
 *
 * Every piece is the same few materials in the same few steps, so a room reads as one set of things bought together: pine, a cloth
 * in one of three colourways (`d.c`: blue, red, green), brass, and ink round the edge so it stands off the floor. Patterns repeat on
 * a fixed grid — a quilt in ten-pixel patches, a row of books in a fixed rhythm — because a made thing repeats.
 */
import { TIM, STO, SAN, SNO, WAR, WAT, CON, GRASS, DRY, ATMO } from './palette.js';

const INK = ATMO[0];
/* one colourway of cloth: [light, mid, dark] */
export const CLOTH = { blue: [WAT[4], WAT[3], WAT[2]], red: [WAR[2], WAR[1], WAR[0]], green: [GRASS[3], CON[3], CON[2]], sand: [SAN[2], SAN[1], SAN[0]] };
const cloth = d => CLOTH[(d && d.c) || 'blue'] || CLOTH.blue;
const post = (A, x, y, h) => { A.fill(INK, x, y, 5, h); A.fill(TIM[3], x + 1, y + 1, 3, h - 2); A.fill(TIM[4], x + 1, y + 1, 1, h - 2); };

/* a quilt of ten-pixel patches, two colours in a chequer, stitched: the same square repeated across and down */
function quilt(A, x, y, w, h, c) {
  for (let py = 0; py < h; py += 10) for (let px = 0; px < w; px += 10) {
    const on = ((px / 10 + py / 10) & 1) === 0;
    A.fill(on ? c[1] : c[0], x + px, y + py, Math.min(10, w - px), Math.min(10, h - py));
    A.fill(c[2], x + px, y + py, Math.min(10, w - px), 1); A.fill(c[2], x + px, y + py, 1, Math.min(10, h - py));   /* the seam */
  }
}

/* the lights of a made room, by kind (a nightstand says which with its `w`: kind:w), read with decor.js's LIGHTS */
export const HOME_LIGHTS = {
  'nightstand:lamp': { r: 1.7, peak: 12 }, 'nightstand:candle': { r: 1.1, peak: 9 },
  floorlamp: { r: 2.1, peak: 13 }, desk: { r: 1.8, peak: 12 }
};
/* How many squares a piece covers, from its top-left square (BEK_DECOR names that one). The map has a solid glyph under every one
   of them, which is what makes the piece solid; `world_check.js` holds the two together. Anything not named is one square. */
export const FOOT = { bed2: [2, 2], bed1: [1, 2], wardrobe: [2, 1], sofa: [3, 1], dtable: [2, 1], coffeetable: [2, 1], desk: [2, 1] };

/* What kind of thing each piece is, for `rooms_check.js`: a SOLID one stands on a solid glyph under every square of its footprint (that is
   what makes it solid), a WALL one hangs on the face of a wall, and anything else (a mat, a cat, boots, a basket) lies on the floor. */
export const SOLID_KINDS = ['bed2', 'bed1', 'nightstand', 'wardrobe', 'dresser', 'bookcase', 'trunk', 'sofa', 'armchair', 'chair', 'hallbench', 'dtable',
  'coffeetable', 'desk', 'counter', 'sink', 'stove', 'pantry', 'plant', 'floorlamp', 'hearthstone'];
export const WALL_KINDS = ['picture', 'clock', 'mirror', 'coatrack', 'wallshelf', 'breast', 'herbs'];

export const PROP_HOME = {

  /* ---- sleeping --------------------------------------------------------------- */
  /* a double bed, two squares by two, from its top-left square: headboard, two pillows, the quilt, a folded blanket at the foot */
  bed2(A, px, py, v, t, d) {
    const c = cloth(d);
    A.fill(INK, px + 1, py + 1, 78, 78);
    A.fill(TIM[2], px + 3, py + 3, 74, 74);
    A.fill(TIM[3], px + 3, py + 3, 74, 11); A.fill(TIM[4], px + 3, py + 3, 74, 2); A.fill(TIM[2], px + 3, py + 12, 74, 2);   /* the headboard */
    A.fill(SNO[1], px + 8, py + 15, 29, 14); A.fill(SNO[0], px + 8, py + 26, 29, 3); A.fill(SNO[0], px + 8, py + 15, 29, 1);  /* pillows */
    A.fill(SNO[1], px + 43, py + 15, 29, 14); A.fill(SNO[0], px + 43, py + 26, 29, 3); A.fill(SNO[0], px + 43, py + 15, 29, 1);
    A.fill(SNO[0], px + 6, py + 30, 68, 3);                                       /* the sheet turned down */
    quilt(A, px + 6, py + 33, 68, 33, c);
    A.fill(SAN[1], px + 6, py + 66, 68, 7); A.fill(SAN[2], px + 6, py + 66, 68, 2); A.fill(SAN[0], px + 6, py + 71, 68, 2);   /* the blanket folded at the foot */
    A.fill(TIM[3], px + 3, py + 72, 74, 5); A.fill(TIM[4], px + 3, py + 72, 74, 1);                                          /* the footboard */
  },
  /* a single bed, one square by two: the same, narrower */
  bed1(A, px, py, v, t, d) {
    const c = cloth(d);
    A.fill(INK, px + 1, py + 1, 38, 78);
    A.fill(TIM[2], px + 3, py + 3, 34, 74);
    A.fill(TIM[3], px + 3, py + 3, 34, 11); A.fill(TIM[4], px + 3, py + 3, 34, 2); A.fill(TIM[2], px + 3, py + 12, 34, 2);
    A.fill(SNO[1], px + 7, py + 15, 26, 14); A.fill(SNO[0], px + 7, py + 26, 26, 3); A.fill(SNO[0], px + 7, py + 15, 26, 1);
    A.fill(SNO[0], px + 6, py + 30, 28, 3);
    quilt(A, px + 6, py + 33, 28, 33, c);
    A.fill(SAN[1], px + 6, py + 66, 28, 7); A.fill(SAN[2], px + 6, py + 66, 28, 2);
    A.fill(TIM[3], px + 3, py + 72, 34, 5); A.fill(TIM[4], px + 3, py + 72, 34, 1);
  },
  /* the table at the head of the bed: a drawer, a pull, and what is on it (a lamp, a candle, a book and a clock) */
  nightstand(A, px, py, v, t, d) {
    const w = (d && d.w) || 'lamp';
    A.fill(INK, px + 5, py + 12, 30, 26); A.fill(TIM[3], px + 6, py + 13, 28, 8); A.fill(TIM[4], px + 6, py + 13, 28, 1);      /* the top */
    A.fill(TIM[2], px + 6, py + 21, 28, 15); A.fill(TIM[1], px + 6, py + 21, 28, 1);
    A.fill(TIM[1], px + 9, py + 24, 22, 9); A.fill(TIM[2], px + 10, py + 25, 20, 7); A.fill(WAR[4], px + 18, py + 27, 4, 2);   /* the drawer and its pull */
    if (w === 'lamp') {
      A.fill(STO[3], px + 16, py + 9, 8, 4); A.fill(INK, px + 11, py - 1, 18, 11);
      A.fill(WAR[3], px + 12, py, 16, 9); A.fill(WAR[4], px + 14, py + 2, 12, 5); A.fill(WAR[2], px + 12, py + 7, 16, 2);       /* the shade */
    } else if (w === 'candle') {
      A.fill(STO[3], px + 14, py + 10, 12, 3); A.fill(SNO[1], px + 18, py + 2, 4, 9); A.fill(SNO[0], px + 21, py + 2, 1, 9);
      A.fill(WAR[2], px + 19, py - 2, 2, 4); A.fill(WAR[4], px + 19, py - 3, 2, 2);
    } else {                                                                                                                    /* a book and a clock */
      A.fill(WAR[1], px + 9, py + 6, 14, 7); A.fill(SNO[1], px + 10, py + 7, 12, 1);
      A.fill(INK, px + 25, py + 3, 8, 10); A.fill(SAN[2], px + 26, py + 4, 6, 8); A.fill(INK, px + 28, py + 5, 1, 4);
    }
  },
  /* a wardrobe, two squares wide, taller than a person: crown, two doors with a raised panel each, brass pulls, bracket feet */
  wardrobe(A, px, py, v, t, d) {
    A.fill(INK, px + 1, py - 17, 78, 57);
    A.fill(TIM[3], px + 2, py - 16, 76, 5); A.fill(TIM[4], px + 2, py - 16, 76, 1);                                         /* the crown   */
    A.fill(TIM[2], px + 3, py - 11, 74, 47);
    for (let k = 0; k < 2; k++) {
      const x = px + 5 + k * 36;
      A.fill(TIM[1], x, py - 9, 32, 43); A.fill(TIM[2], x + 1, py - 8, 30, 41);                                             /* the door    */
      A.fill(TIM[3], x + 4, py - 5, 24, 1); A.fill(TIM[3], x + 4, py - 5, 1, 17); A.fill(TIM[1], x + 27, py - 4, 1, 17);       /* the panels  */
      A.fill(TIM[3], x + 4, py + 15, 24, 1); A.fill(TIM[3], x + 4, py + 15, 1, 15); A.fill(TIM[1], x + 27, py + 16, 1, 15);
      A.fill(TIM[1], x + 4, py + 12, 24, 1); A.fill(TIM[1], x + 4, py + 29, 24, 1);
    }
    A.fill(WAR[4], px + 33, py + 8, 2, 6); A.fill(WAR[4], px + 45, py + 8, 2, 6);                                           /* the pulls   */
    A.fill(TIM[1], px + 3, py + 36, 74, 3); A.fill(INK, px + 3, py + 39, 74, 1);                                            /* the plinth  */
  },
  /* a chest of drawers with a mirror over it */
  dresser(A, px, py, v, t, d) {
    A.fill(INK, px + 7, py - 18, 26, 24); A.fill(TIM[3], px + 8, py - 17, 24, 22);                                          /* the mirror frame */
    A.fill(WAT[5], px + 10, py - 15, 20, 18); A.fill(SNO[1], px + 12, py - 13, 4, 8); A.fill(SNO[1], px + 12, py - 13, 8, 2);      /* glass and a glint */
    A.fill(INK, px + 2, py + 5, 36, 33);
    A.fill(TIM[3], px + 3, py + 6, 34, 4); A.fill(TIM[4], px + 3, py + 6, 34, 1);
    A.fill(TIM[2], px + 3, py + 10, 34, 26);
    for (let k = 0; k < 3; k++) { A.fill(TIM[1], px + 5, py + 12 + k * 8, 30, 1); A.fill(WAR[4], px + 17, py + 14 + k * 8, 6, 2); }
    A.fill(SNO[1], px + 7, py + 3, 8, 3); A.fill(WAT[4], px + 27, py + 1, 5, 6);                                           /* a cloth and a bottle */
    A.fill(TIM[1], px + 4, py + 36, 6, 2); A.fill(TIM[1], px + 30, py + 36, 6, 2);
  },
  /* a bookcase, one square wide and taller than a person: the books stand in a fixed rhythm of colour and height */
  bookcase(A, px, py, v, t, d) {
    A.fill(INK, px + 2, py - 17, 36, 56);
    A.fill(TIM[2], px + 3, py - 16, 34, 54);
    A.fill(TIM[3], px + 3, py - 16, 34, 2);
    const SP = [WAR[1], CON[2], WAT[3], SAN[1], WAR[2], STO[3], TIM[4], WAT[2]];
    for (let s = 0; s < 3; s++) {
      const y = py - 13 + s * 17;
      A.fill(TIM[1], px + 5, y, 30, 14);                                                                                 /* the bay */
      for (let b = 0; b < 8; b++) {
        const h = 9 + ((b * 5 + s * 3) % 5), x = px + 6 + b * 3.5 | 0;
        A.fill(SP[(b + s * 3) % SP.length], x, y + 14 - h, 3, h); A.fill(TIM[0], x + 3, y + 14 - h, 1, h);
      }
      A.fill(TIM[3], px + 4, y + 14, 32, 2); A.fill(TIM[4], px + 4, y + 14, 32, 1);                                       /* the shelf */
    }
    A.fill(TIM[1], px + 3, py + 35, 34, 3);
  },

  /* ---- keeping ---------------------------------------------------------------- */
  /* a blanket chest at the foot of a bed or under a window: lid, iron bands, a lock */
  trunk(A, px, py, v, t, d) {
    A.fill(INK, px + 3, py + 9, 34, 28);
    A.fill(TIM[3], px + 4, py + 10, 32, 8); A.fill(TIM[4], px + 4, py + 10, 32, 2);                                         /* the lid  */
    A.fill(TIM[2], px + 4, py + 18, 32, 17); A.fill(TIM[1], px + 4, py + 18, 32, 1);
    A.fill(STO[2], px + 8, py + 10, 3, 25); A.fill(STO[2], px + 29, py + 10, 3, 25);                                       /* the bands */
    A.fill(STO[4], px + 8, py + 10, 1, 25); A.fill(STO[4], px + 29, py + 10, 1, 25);
    A.fill(WAR[4], px + 18, py + 16, 4, 5); A.fill(INK, px + 19, py + 18, 2, 2);
  }
};
