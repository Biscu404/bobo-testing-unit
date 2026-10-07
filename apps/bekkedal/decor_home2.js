/* Bekkedal — the furniture of a made room, part two: where you sit, eat, cook and look.
 *
 * Same rules as `decor_home.js`: whole pieces, one set of materials, a cloth in one of three colourways (`d.c`), ink round the edge,
 * patterns on a fixed grid. A piece bigger than a square is drawn from its top-left square (the others carry a solid glyph), and a
 * tall one spills up onto the wall. Everything on a wall (a clock, a mirror, a picture, a coat rack) stands on a wall square and
 * changes nothing about walking. The pieces you can *do* something with are the ones `furniture_act.js` names.
 */
import { TIM, STO, SAN, SNO, WAR, WAT, CON, GRASS, DRY, ATMO } from './palette.js';
import { CLOTH } from './decor_home.js';

const INK = ATMO[0];
const cloth = d => CLOTH[(d && d.c) || 'blue'] || CLOTH.blue;

export const PROP_HOME2 = {

  /* ---- sitting ------------------------------------------------------------------ */
  /* a sofa, three squares across, from the left: a back of three cushions, arms, a seat; the fabric is striped on a four-pixel beat */
  sofa(A, px, py, v, t, d) {
    const c = cloth(d);
    A.fill(INK, px + 2, py + 3, 116, 36);
    A.fill(TIM[2], px + 4, py + 5, 112, 32);
    A.fill(c[2], px + 6, py + 6, 108, 15);                                                                              /* the back   */
    for (let k = 0; k < 3; k++) {
      A.fill(c[1], px + 10 + k * 36, py + 7, 32, 13); A.fill(c[0], px + 10 + k * 36, py + 7, 32, 2);                    /* a cushion  */
      for (let s = 0; s < 32; s += 4) A.fill(c[2], px + 10 + k * 36 + s, py + 9, 1, 11);                                /* its stripe */
    }
    A.fill(c[2], px + 4, py + 5, 8, 31); A.fill(c[1], px + 5, py + 6, 6, 29); A.fill(c[0], px + 5, py + 6, 6, 2);        /* the arms   */
    A.fill(c[2], px + 108, py + 5, 8, 31); A.fill(c[1], px + 109, py + 6, 6, 29); A.fill(c[0], px + 109, py + 6, 6, 2);
    A.fill(c[1], px + 12, py + 21, 96, 13); A.fill(c[0], px + 12, py + 21, 96, 2); A.fill(c[2], px + 12, py + 33, 96, 1);   /* the seat   */
    for (let s = 0; s < 96; s += 4) A.fill(c[2], px + 12 + s, py + 24, 1, 9);
    A.fill(INK, px + 46, py + 21, 1, 13); A.fill(INK, px + 82, py + 21, 1, 13);                                         /* between the seats */
    A.fill(TIM[1], px + 6, py + 36, 5, 3); A.fill(TIM[1], px + 109, py + 36, 5, 3);                                     /* feet       */
  },
  /* a fireside armchair, one square: a high back, wings, a seat cushion; faces south (the viewer) */
  armchair(A, px, py, v, t, d) {
    const c = cloth(d);
    A.fill(INK, px + 4, py + 4, 32, 34);
    A.fill(c[2], px + 5, py + 5, 30, 14); A.fill(c[1], px + 8, py + 6, 24, 12); A.fill(c[0], px + 8, py + 6, 24, 2);     /* the high back */
    A.fill(c[2], px + 5, py + 14, 7, 21); A.fill(c[1], px + 6, py + 15, 5, 19); A.fill(c[0], px + 6, py + 15, 5, 2);   /* the wings    */
    A.fill(c[2], px + 28, py + 14, 7, 21); A.fill(c[1], px + 29, py + 15, 5, 19); A.fill(c[0], px + 29, py + 15, 5, 2);
    A.fill(c[1], px + 12, py + 20, 16, 12); A.fill(c[0], px + 12, py + 20, 16, 2); A.fill(c[2], px + 12, py + 31, 16, 1);  /* the seat    */
    for (let s = 0; s < 16; s += 4) A.fill(c[2], px + 12 + s, py + 23, 1, 8);
    A.fill(TIM[1], px + 7, py + 35, 4, 3); A.fill(TIM[1], px + 29, py + 35, 4, 3);
  },
  /* a kitchen or dining chair: `d.o` is which way it faces (0 south, 1 north, 2 east, 3 west), back toward the other side */
  chair(A, px, py, v, t, d) {
    const o = (d && d.o) || 0;
    A.fill(INK, px + 8, py + 8, 24, 28);
    if (o === 0) {
      A.fill(TIM[1], px + 10, py + 9, 20, 9); A.fill(TIM[2], px + 11, py + 10, 18, 7); A.fill(TIM[3], px + 11, py + 10, 18, 1);   /* the back  */
      A.fill(TIM[3], px + 10, py + 19, 20, 11); A.fill(TIM[4], px + 10, py + 19, 20, 2);                                           /* the seat  */
      A.fill(TIM[1], px + 11, py + 30, 3, 5); A.fill(TIM[1], px + 26, py + 30, 3, 5);
    } else if (o === 1) {
      A.fill(TIM[3], px + 10, py + 11, 20, 11); A.fill(TIM[4], px + 10, py + 11, 20, 2);
      A.fill(TIM[1], px + 10, py + 22, 20, 9); A.fill(TIM[2], px + 11, py + 23, 18, 7); A.fill(TIM[3], px + 11, py + 23, 18, 1);
      A.fill(TIM[1], px + 11, py + 31, 3, 4); A.fill(TIM[1], px + 26, py + 31, 3, 4);
    } else {
      const back = o === 2 ? 0 : 1;                                                                                                 /* 2 faces east: the back is on the west */
      A.fill(TIM[3], px + (back ? 10 : 15), py + 12, 15, 18); A.fill(TIM[4], px + (back ? 10 : 15), py + 12, 15, 2);
      A.fill(TIM[1], px + (back ? 25 : 10), py + 9, 5, 24); A.fill(TIM[2], px + (back ? 26 : 11), py + 10, 3, 22);
      A.fill(TIM[1], px + 12, py + 31, 3, 4); A.fill(TIM[1], px + 25, py + 31, 3, 4);
    }
  },
  /* a bench in the hall, with the boots under it and a pair on the seat */
  hallbench(A, px, py, v, t, d) {
    A.fill(INK, px + 2, py + 10, 36, 28);
    A.fill(TIM[3], px + 3, py + 11, 34, 9); A.fill(TIM[4], px + 3, py + 11, 34, 2);
    A.fill(TIM[2], px + 3, py + 20, 34, 4); A.fill(TIM[1], px + 6, py + 24, 4, 12); A.fill(TIM[1], px + 30, py + 24, 4, 12);
    A.fill(ATMO[0], px + 12, py + 27, 7, 8); A.fill(STO[0], px + 13, py + 28, 5, 6); A.fill(INK, px + 22, py + 27, 7, 8); A.fill(STO[0], px + 23, py + 28, 5, 6);   /* boots under it */
    A.fill(WAT[3], px + 11, py + 6, 18, 6); A.fill(WAT[4], px + 11, py + 6, 18, 1);                                         /* a folded scarf */
  },

  /* ---- eating and working ----------------------------------------------------------- */
  /* a dining table, two squares, from the left: cloth with a runner, bowl, cups, a candlestick */
  dtable(A, px, py, v, t, d) {
    const c = cloth(d);
    A.fill(INK, px + 1, py + 6, 78, 26); A.fill(TIM[4], px + 2, py + 7, 76, 22); A.fill(TIM[3], px + 2, py + 7, 76, 2);
    A.fill(SNO[1], px + 4, py + 10, 72, 16);                                                                              /* the cloth   */
    for (let k = 0; k < 72; k += 6) A.fill(SNO[0], px + 4 + k, py + 10, 1, 16);                                           /* its weave   */
    A.fill(c[1], px + 4, py + 16, 72, 5); A.fill(c[0], px + 4, py + 16, 72, 1);                                           /* the runner  */
    A.fill(SNO[0], px + 14, py + 12, 12, 5); A.fill(WAT[4], px + 16, py + 13, 8, 2);                                      /* a bowl      */
    A.fill(SNO[0], px + 52, py + 12, 6, 5); A.fill(SNO[0], px + 62, py + 14, 6, 5);                                       /* two cups    */
    A.fill(STO[4], px + 37, py + 8, 3, 9); A.fill(SNO[1], px + 37, py + 5, 3, 5); A.fill(WAR[3], px + 38, py + 3, 1, 3);    /* a candlestick */
    A.fill(TIM[2], px + 2, py + 29, 76, 3); A.fill(INK, px + 3, py + 32, 6, 7); A.fill(TIM[1], px + 4, py + 32, 4, 6);
    A.fill(INK, px + 71, py + 32, 6, 7); A.fill(TIM[1], px + 72, py + 32, 4, 6);
  },
  /* a low table in front of a sofa: a tray, a book, a cup */
  coffeetable(A, px, py, v, t, d) {
    A.fill(INK, px + 1, py + 9, 78, 25); A.fill(TIM[3], px + 2, py + 10, 76, 17); A.fill(TIM[4], px + 2, py + 10, 76, 2);
    A.fill(TIM[2], px + 2, py + 27, 76, 3); A.fill(TIM[1], px + 3, py + 30, 5, 4); A.fill(TIM[1], px + 72, py + 30, 5, 4);
    A.fill(STO[3], px + 24, py + 13, 32, 10); A.fill(STO[4], px + 25, py + 14, 30, 1);                                    /* the tray    */
    A.fill(WAR[1], px + 28, py + 15, 10, 6); A.fill(SNO[1], px + 29, py + 16, 8, 1);                                      /* a book      */
    A.fill(SNO[0], px + 44, py + 15, 7, 6);                                                                               /* a cup       */
  },
  /* a writing desk, two squares: papers, an inkwell, a lamp's pool of light on the blotter */
  desk(A, px, py, v, t, d) {
    A.fill(INK, px + 1, py + 6, 78, 28); A.fill(TIM[3], px + 2, py + 7, 76, 22); A.fill(TIM[4], px + 2, py + 7, 76, 2);
    A.fill(WAT[2], px + 12, py + 11, 34, 14); A.fill(WAT[1], px + 12, py + 11, 34, 1);                                    /* the blotter */
    A.fill(SNO[1], px + 16, py + 13, 18, 11); A.fill(SNO[0], px + 17, py + 16, 14, 1); A.fill(SNO[0], px + 17, py + 19, 12, 1);   /* a letter */
    A.fill(INK, px + 52, py + 11, 5, 6); A.fill(WAT[3], px + 53, py + 12, 3, 3);                                          /* the inkwell */
    A.fill(STO[3], px + 66, py + 18, 8, 5); A.fill(INK, px + 62, py + 6, 14, 11); A.fill(WAR[3], px + 63, py + 7, 12, 9); A.fill(WAR[4], px + 65, py + 9, 8, 5);   /* a lamp */
    A.fill(TIM[2], px + 2, py + 29, 76, 3); A.fill(TIM[1], px + 6, py + 32, 6, 7); A.fill(TIM[1], px + 68, py + 32, 6, 7);
  },

  /* ---- the kitchen: a run of units that all have the same worktop, door and handle ------------------ */
  counter(A, px, py, v, t, d) { counterBase(A, px, py); },
  sink(A, px, py, v, t, d) {
    counterBase(A, px, py);
    A.fill(INK, px + 7, py + 3, 26, 10); A.fill(STO[4], px + 9, py + 5, 22, 6); A.fill(WAT[4], px + 11, py + 6, 18, 3); A.fill(SNO[1], px + 12, py + 6, 5, 1);   /* the basin */
    A.fill(STO[3], px + 29, py - 5, 3, 9); A.fill(STO[4], px + 24, py - 6, 8, 2); A.fill(STO[3], px + 24, py - 6, 2, 5);    /* the tap     */
  },
  stove(A, px, py, v, t, d) {
    A.fill(INK, px + 3, py - 3, 34, 41);
    A.fill(STO[1], px + 4, py - 2, 32, 38); A.fill(STO[2], px + 4, py - 2, 32, 2);
    A.fill(STO[0], px + 6, py + 14, 28, 18); A.fill(STO[1], px + 8, py + 16, 24, 14); A.fill(WAR[3], px + 12, py + 20, 16, 6); A.fill(WAR[4], px + 15, py + 22, 10, 3);   /* the oven's window with its fire */
    A.fill(STO[4], px + 8, py + 31, 24, 2);                                                                              /* the rail    */
    A.fill(INK, px + 7, py + 1, 26, 11); A.fill(STO[0], px + 8, py + 2, 24, 9);                                          /* the hob     */
    A.fill(STO[2], px + 9, py + 3, 10, 7); A.fill(STO[2], px + 21, py + 3, 10, 7); A.fill(INK, px + 11, py + 5, 6, 3); A.fill(INK, px + 23, py + 5, 6, 3);
    A.fill(STO[3], px + 9, py - 7, 11, 9); A.fill(STO[4], px + 9, py - 7, 11, 2); A.fill(STO[2], px + 20, py - 4, 3, 2);   /* the kettle on the hob */
    A.fill(STO[2], px + 31, py - 14, 5, 12); A.fill(INK, px + 31, py - 14, 5, 1);                                         /* the flue    */
  },
  /* a larder cupboard, tall, with a shelf of jars on show */
  pantry(A, px, py, v, t, d) {
    A.fill(INK, px + 2, py - 13, 36, 52);
    A.fill(TIM[2], px + 3, py - 12, 34, 50); A.fill(TIM[3], px + 3, py - 12, 34, 2);
    A.fill(TIM[1], px + 6, py - 8, 28, 16); A.fill(TIM[0], px + 7, py - 7, 26, 14);
    const JAR = [WAR[1], GRASS[2], DRY[1], WAT[3], SAN[1]];
    for (let k = 0; k < 4; k++) { A.fill(JAR[k], px + 8 + k * 6, py - 4, 5, 9); A.fill(SNO[0], px + 8 + k * 6, py - 5, 5, 1); }
    A.fill(TIM[3], px + 6, py + 8, 28, 2);
    A.fill(TIM[1], px + 6, py + 11, 28, 24); A.fill(TIM[2], px + 7, py + 12, 26, 22); A.fill(TIM[3], px + 7, py + 12, 26, 1); A.fill(INK, px + 19, py + 12, 1, 22);
    A.fill(WAR[4], px + 15, py + 22, 3, 5); A.fill(WAR[4], px + 22, py + 22, 3, 5);
  },

  /* ---- on the wall -------------------------------------------------------------------- */
  clock(A, px, py, v, t, d) {
    A.fill(INK, px + 11, py + 6, 18, 28); A.fill(TIM[3], px + 12, py + 7, 16, 26); A.fill(TIM[4], px + 12, py + 7, 16, 1);
    A.fill(SAN[2], px + 14, py + 10, 12, 12); A.fill(INK, px + 19, py + 12, 1, 5); A.fill(INK, px + 19, py + 16, 4, 1);      /* the face and hands */
    A.fill(STO[3], px + 18, py + 24, 4, 7); A.fill(WAR[4], px + 19, py + 28, 2, 3);                                         /* the pendulum */
  },
  mirror(A, px, py, v, t, d) {
    A.fill(INK, px + 9, py + 4, 22, 32); A.fill(TIM[3], px + 10, py + 5, 20, 30); A.fill(WAT[5], px + 12, py + 7, 16, 26);
    A.fill(SNO[1], px + 13, py + 9, 3, 9); A.fill(SNO[1], px + 13, py + 9, 7, 2);
  },
  coatrack(A, px, py, v, t, d) {
    A.fill(INK, px + 3, py + 8, 34, 4); A.fill(TIM[3], px + 4, py + 9, 32, 2); A.fill(TIM[4], px + 4, py + 9, 32, 1);        /* the rail with its pegs */
    [8, 18, 28].forEach(x => { A.fill(TIM[1], px + x, py + 11, 3, 5); });
    A.fill(WAT[2], px + 6, py + 14, 9, 19); A.fill(WAT[3], px + 6, py + 14, 9, 2); A.fill(INK, px + 10, py + 17, 1, 16);     /* a coat    */
    A.fill(WAR[2], px + 16, py + 14, 9, 15); A.fill(WAR[3], px + 16, py + 14, 9, 2);                                        /* a red one */
    A.fill(DRY[1], px + 26, py + 12, 10, 3); A.fill(DRY[2], px + 28, py + 9, 6, 4);                                         /* a hat     */
  },
  /* a picture: `d.p` chooses fjord (0), field (1) or a sampler (2); the frame is the same */
  picture(A, px, py, v, t, d) {
    const p = (d && d.p) || 0;
    A.fill(INK, px + 7, py + 8, 26, 22); A.fill(TIM[3], px + 8, py + 9, 24, 20); A.fill(SAN[2], px + 10, py + 11, 20, 16);
    if (p === 0) { A.fill(WAT[4], px + 10, py + 11, 20, 8); A.fill(CON[2], px + 10, py + 16, 20, 6); A.fill(SNO[1], px + 15, py + 13, 5, 2); A.fill(SAN[1], px + 10, py + 22, 20, 5); }
    else if (p === 1) { A.fill(WAT[5], px + 10, py + 11, 20, 7); A.fill(GRASS[3], px + 10, py + 18, 20, 9); A.fill(WAR[3], px + 14, py + 21, 2, 2); A.fill(WAR[3], px + 22, py + 23, 2, 2); }
    else { for (let k = 0; k < 4; k++) { A.fill(WAR[2], px + 12 + k * 5, py + 13, 3, 3); A.fill(WAT[3], px + 12 + k * 5, py + 19, 3, 3); } A.fill(CON[2], px + 12, py + 17, 16, 1); }
  },
  /* a small shelf with jars and a plant, for a kitchen wall */
  wallshelf(A, px, py, v, t, d) {
    A.fill(INK, px + 3, py + 18, 34, 5); A.fill(TIM[3], px + 4, py + 19, 32, 3); A.fill(TIM[4], px + 4, py + 19, 32, 1);
    const JAR = [WAR[1], GRASS[2], DRY[1], WAT[3]];
    for (let k = 0; k < 4; k++) { A.fill(INK, px + 6 + k * 8, py + 8, 7, 11); A.fill(JAR[k], px + 7 + k * 8, py + 9, 5, 9); A.fill(SNO[0], px + 7 + k * 8, py + 8, 5, 2); }
  },
  /* the chimney breast over a hearth, one square of it on each side of the middle: stone in courses that run on across both, a mantel
     shelf, and what stands on it — a candle and a book on the left, a clock and a candle on the right (`d.h`: 0, 1) */
  breast(A, px, py, v, t, d) {
    const R = (d && d.h) || 0;
    A.fill(STO[2], px, py, 40, 40); A.fill(STO[3], px, py, 40, 2);
    for (let k = 0; k < 4; k++) {                                                                                        /* the courses */
      const y = py + 6 + k * 8;
      A.fill(STO[1], px, y, 40, 1);
      for (let m = 0; m < 3; m++) A.fill(STO[1], px + ((m * 14 + k * 7 + R * 40) % 40), y - 7 + 1, 1, 7);
    }
    A.fill(INK, px - (R ? 0 : 2), py + 30, 42, 8); A.fill(TIM[3], px - (R ? 0 : 1), py + 31, 41, 5); A.fill(TIM[4], px - (R ? 0 : 1), py + 31, 41, 1);   /* the mantel */
    if (!R) {
      A.fill(STO[4], px + 8, py + 22, 3, 9); A.fill(SNO[1], px + 8, py + 19, 3, 3); A.fill(WAR[3], px + 9, py + 16, 1, 3);   /* a candlestick */
      A.fill(WAR[1], px + 20, py + 25, 14, 6); A.fill(SNO[1], px + 21, py + 26, 12, 1);                                        /* a book lying down */
    } else {
      A.fill(INK, px + 8, py + 13, 12, 18); A.fill(TIM[3], px + 9, py + 14, 10, 16); A.fill(SAN[2], px + 10, py + 16, 8, 8); A.fill(INK, px + 14, py + 17, 1, 4); A.fill(INK, px + 14, py + 20, 3, 1);   /* the clock */
      A.fill(STO[4], px + 29, py + 22, 3, 9); A.fill(SNO[1], px + 29, py + 19, 3, 3); A.fill(WAR[3], px + 30, py + 16, 1, 3);
    }
  },
  /* the hearth itself, two squares, a half to each: the jambs and the lintel in the same stone, the firebox, a hearthstone, logs and
     embers. The flames are live and `index.js` draws them over this. */
  hearthstone(A, px, py, v, t, d) {
    const R = (d && d.h) || 0, ox = R ? 0 : 8, w = R ? 32 : 32;
    A.fill(STO[3], px, py, 40, 40);                                                                                        /* the stone */
    A.fill(STO[4], px, py, 40, 2);
    A.fill(INK, px + ox, py + 9, w, 25); A.fill(STO[0], px + ox + 1, py + 10, w - 1, 23);                                  /* the opening, and the soot of its back */
    for (let k = 0; k < 3; k++) A.fill(STO[1], px + ox + 1, py + 15 + k * 6, w - 1, 1);
    A.fill(STO[2], px + (R ? 0 : 0), py + 10, 3, 1);
    A.fill(STO[4], px - (R ? 0 : 2), py + 34, 42, 6); A.fill(STO[5], px - (R ? 0 : 2), py + 34, 42, 1); A.fill(INK, px - (R ? 0 : 2), py + 39, 42, 1);   /* the hearthstone, proud of the jamb */
    A.fill(INK, px + ox + 4, py + 27, 22, 7); A.fill(TIM[1], px + ox + 5, py + 28, 20, 5); A.fill(TIM[3], px + ox + 6, py + 28, 3, 5); A.fill(TIM[3], px + ox + 22, py + 28, 3, 5);   /* two logs, ends toward you */
    A.fill(WAR[1], px + ox + 8, py + 31, 14, 3); A.fill(WAR[2], px + ox + 10, py + 32, 8, 2);                                  /* the embers */
  },

  /* ---- living things and light ----------------------------------------------------------------- */
  plant(A, px, py, v, t, d) {
    A.fill(INK, px + 11, py + 22, 18, 16); A.fill(TIM[2], px + 12, py + 23, 16, 14); A.fill(TIM[3], px + 12, py + 23, 16, 2); A.fill(TIM[1], px + 12, py + 35, 16, 2);   /* the pot */
    const leaf = (x, y, w, h, c) => { A.fill(INK, x - 1, y - 1, w + 2, h + 2); A.fill(c, x, y, w, h); };
    leaf(px + 6, py + 4, 8, 16, CON[3]); leaf(px + 14, py - 6, 9, 24, GRASS[2]); leaf(px + 24, py + 2, 8, 18, CON[3]); leaf(px + 11, py + 12, 7, 11, GRASS[3]); leaf(px + 22, py + 10, 7, 12, GRASS[3]);
    A.fill(GRASS[4], px + 17, py - 4, 1, 14);                                                                                    /* a midrib */
  },
  floorlamp(A, px, py, v, t, d) {
    A.fill(INK, px + 9, py + 33, 22, 5); A.fill(STO[3], px + 10, py + 34, 20, 3);
    A.fill(STO[3], px + 19, py + 11, 3, 24); A.fill(STO[4], px + 19, py + 11, 1, 24);
    A.fill(INK, px + 7, py - 12, 26, 25); A.fill(WAR[3], px + 8, py - 11, 24, 23); A.fill(WAR[4], px + 12, py - 8, 16, 17); A.fill(WAR[2], px + 8, py + 9, 24, 3); A.fill(SAN[2], px + 8, py - 11, 24, 2);
  },
  mat(A, px, py, v, t, d) {
    A.fill(INK, px + 4, py + 10, 32, 22); A.fill(DRY[1], px + 5, py + 11, 30, 20);
    for (let k = 0; k < 30; k += 3) A.fill(DRY[2], px + 5 + k, py + 11, 1, 20);                                               /* the bristles in rows */
    A.fill(DRY[0], px + 5, py + 11, 30, 1); A.fill(DRY[0], px + 5, py + 30, 30, 1);
  }
};

/* the unit every kitchen run shares: a worktop, a pair of doors, a handle on each, a plinth */
function counterBase(A, px, py) {
  A.fill(INK, px + 1, py + 3, 38, 36);
  A.fill(SNO[0], px + 2, py + 4, 36, 8); A.fill(SNO[1], px + 2, py + 4, 36, 2);                                             /* the worktop */
  A.fill(TIM[2], px + 2, py + 12, 36, 24); A.fill(TIM[1], px + 2, py + 12, 36, 1);
  A.fill(TIM[3], px + 4, py + 14, 15, 19); A.fill(TIM[3], px + 21, py + 14, 15, 19);                                        /* the two doors */
  A.fill(TIM[2], px + 6, py + 16, 11, 15); A.fill(TIM[2], px + 23, py + 16, 11, 15);
  A.fill(WAR[4], px + 16, py + 22, 2, 5); A.fill(WAR[4], px + 22, py + 22, 2, 5);
  A.fill(TIM[1], px + 2, py + 36, 36, 3);
}
