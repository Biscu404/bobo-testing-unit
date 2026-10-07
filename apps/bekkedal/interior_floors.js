/* Bekkedal — floors and walls that are made, and so repeat.
 *
 * `interior.js` laid its boards from noise so that nothing ever repeated: a floor that could not be seen to tile. It also looked
 * like nobody had laid it. A made floor repeats — the same board, the same joint every fourth course, the same diamond in the rug,
 * the same stripe in the paper — and a calm room is one whose pattern you can read at a glance. So these are *periodic*, all of
 * them, off world position (so a pattern crosses a tile boundary without a seam) and off nothing else: no hash, no noise.
 *
 * Floors:  plank (a pine board, ten pixels, joints every eighty and stepped a quarter of that each course), parquet (twenty-pixel
 * basket weave), tile (twenty-pixel terracotta chequer with a grout line), flag (flagstones in running bond), wash (the same boards
 * limewashed pale). Walls: a face (the wall you see from the room, with a crown, a rail, a wainscot and a skirting) or a cap (the
 * top of a wall that is seen from above), in four papers. Plus the rug, a window with its curtains, and the door from inside.
 * Every colour is a step of a ramp in palette.js; every fill is an axis-aligned rect on whole pixels.
 */
import { TIM, STO, SAN, SNO, WAR, WAT, CON, SOI, GRASS, ATMO } from './palette.js';
import { BEK_T } from './data.js';

const T = BEK_T;

/* ---- floors ---------------------------------------------------------------- */
function boards(A, x, y, body, hi, seam, cycle) {
  const px = x * T, py = y * T;
  for (let r = 0; r < 4; r++) {
    const R = y * 4 + r, ly = py + r * 10, col = body[R % cycle];
    A.fill(col, px, ly, T, 9);
    A.fill(hi, px, ly, T, 1);                                  /* the lit edge of the board */
    A.fill(seam, px, ly + 9, T, 1);                            /* the gap under it          */
    /* the end joint: every eighty pixels, stepped twenty from one course to the next, so four courses and it comes round */
    for (let lx = 0; lx < T; lx++) if ((((px + lx) - R * 20) % 80 + 80) % 80 === 0) {
      A.fill(seam, px + lx, ly, 1, 9);
      A.fill(STO[2], px + lx + 3, ly + 4, 1, 1);               /* and the nail beside it    */
    }
  }
}

export const FLOORS = {
  plank(A, x, y) { boards(A, x, y, [TIM[3], TIM[3], TIM[2]], TIM[4], TIM[1], 3); },
  wash(A, x, y) { boards(A, x, y, [SAN[1], SAN[2], SAN[1]], SAN[2], SAN[0], 3); },
  parquet(A, x, y) {
    const px = x * T, py = y * T;
    for (let cy = 0; cy < 2; cy++) for (let cx = 0; cx < 2; cx++) {
      const ox = px + cx * 20, oy = py + cy * 20, horiz = ((x * 2 + cx + y * 2 + cy) & 1) === 0;
      A.fill(TIM[2], ox, oy, 20, 20);
      for (let k = 0; k < 2; k++) {
        if (horiz) { A.fill(TIM[3], ox + 1, oy + k * 10 + 1, 18, 8); A.fill(TIM[4], ox + 1, oy + k * 10 + 1, 18, 1); }
        else { A.fill(TIM[3], ox + k * 10 + 1, oy + 1, 8, 18); A.fill(TIM[4], ox + k * 10 + 1, oy + 1, 1, 18); }
      }
    }
  },
  tile(A, x, y) {
    const px = x * T, py = y * T;
    for (let cy = 0; cy < 2; cy++) for (let cx = 0; cx < 2; cx++) {
      const ox = px + cx * 20, oy = py + cy * 20, dark = ((x * 2 + cx + y * 2 + cy) & 1) === 0;
      A.fill(TIM[3], ox, oy, 20, 20);                          /* the grout, under and between */
      A.fill(dark ? SAN[0] : SAN[1], ox, oy, 19, 19);
      A.fill(dark ? SAN[1] : SAN[2], ox, oy, 19, 1);           /* the glaze catching on the top edge */
    }
  },
  flag(A, x, y) {
    const px = x * T, py = y * T;
    for (let r = 0; r < 2; r++) {
      const R = y * 2 + r, odd = R & 1, ly = py + r * 20;
      A.fill(STO[1], px, ly, T, 20);                                             /* the grout, under the slabs   */
      /* slabs forty by twenty in running bond: the seam is at the tile edge on one course and halfway on the next */
      const segs = odd ? [[0, 20, x - 1], [21, 40, x]] : [[1, 40, x]];
      segs.forEach(([a, b, sx]) => {
        A.fill((((sx + R) % 3) + 3) % 3 === 1 ? STO[2] : STO[3], px + a, ly + 1, b - a, 18);
        A.fill(STO[4], px + a, ly + 1, b - a, 1);                                /* the lit top edge             */
      });
    }
  }
};

/* ---- papers ---------------------------------------------------------------- */
export const PAPERS = {
  stripe: { cap: SAN[1], capHi: SAN[2], capLo: SAN[0], trim: TIM[3] },
  tiled:  { cap: SAN[1], capHi: SAN[2], capLo: SAN[0], trim: TIM[3] },
  panel:  { cap: SAN[0], capHi: SAN[1], capLo: TIM[3], trim: TIM[3] },
  white:  { cap: SNO[0], capHi: SNO[1], capLo: STO[5], trim: SNO[1] }
};

function skirting(A, px, py, hi, mid, lo) {
  A.fill(hi, px, py + 37, T, 1); A.fill(mid, px, py + 38, T, 1); A.fill(lo, px, py + 39, T, 1);
}

const FACES = {
  /* striped paper over a tongue-and-groove wainscot; a sprig on every stripe, stepped, so the paper has a lattice */
  stripe(A, px, py, x, ink) {
    A.fill(TIM[3], px, py + 2, T, 3); A.fill(TIM[4], px, py + 2, T, 1); A.fill(TIM[2], px, py + 4, T, 1);       /* the crown   */
    for (let s = 0; s < 5; s++) {
      A.fill(SAN[2], px + s * 8, py + 5, 4, 19);
      A.fill(SNO[0], px + s * 8 + 4, py + 5, 4, 19);
      const cx = px + s * 8 + 2, cy = py + (((x * 5 + s) & 1) ? 17 : 11);
      A.fill(SAN[1], cx, cy, 1, 3); A.fill(SAN[1], cx - 1, cy + 1, 3, 1);                                         /* the sprig   */
    }
    A.fill(TIM[4], px, py + 24, T, 1); A.fill(TIM[3], px, py + 25, T, 1); A.fill(TIM[2], px, py + 26, T, 1);      /* the rail    */
    A.fill(TIM[1], px, py + 27, T, 10);
    for (let b = 0; b < 5; b++) { A.fill(TIM[2], px + b * 8 + 1, py + 28, 7, 9); A.fill(TIM[3], px + b * 8 + 1, py + 28, 1, 9); }
    skirting(A, px, py, TIM[3], TIM[2], TIM[1]);
  },
  /* kitchen: a band of blue, then white subway tile in running bond (8 x 5, a joint every other course stepped half) */
  tiled(A, px, py) {
    A.fill(TIM[3], px, py + 2, T, 3); A.fill(TIM[4], px, py + 2, T, 1); A.fill(TIM[2], px, py + 4, T, 1);
    A.fill(SAN[2], px, py + 5, T, 12);
    A.fill(WAT[3], px, py + 17, T, 2); A.fill(WAT[4], px, py + 17, T, 1);                                        /* the blue band */
    A.fill(SNO[0], px, py + 19, T, 18);
    for (let r = 0; r < 4; r++) {
      const y0 = py + 19 + r * 5 - (r === 3 ? 1 : 0), h = r === 3 ? 5 : 4;
      for (let k = -1; k < 5; k++) {
        const x0 = px + k * 8 + (r & 1) * 4, a = Math.max(px, x0), b = Math.min(px + T, x0 + 7);
        if (b > a) { A.fill(SNO[1], a, y0, b - a, h); A.fill(SNO[1], a, y0, b - a, 1); }
      }
    }
    skirting(A, px, py, TIM[3], TIM[2], TIM[1]);
  },
  /* hall: a darker paper over panelling, the raised panel every twenty pixels */
  panel(A, px, py) {
    A.fill(TIM[2], px, py + 2, T, 3); A.fill(TIM[3], px, py + 2, T, 1); A.fill(TIM[1], px, py + 4, T, 1);
    A.fill(SAN[0], px, py + 5, T, 15);
    for (let k = 0; k < 4; k++) A.fill(SAN[1], px + k * 10 + 2, py + 5, 1, 15);                                    /* a pinstripe */
    A.fill(TIM[3], px, py + 20, T, 3); A.fill(TIM[4], px, py + 20, T, 1); A.fill(TIM[1], px, py + 22, T, 1);     /* the rail   */
    A.fill(TIM[1], px, py + 23, T, 14);
    for (let k = 0; k < 2; k++) {
      A.fill(TIM[2], px + k * 20 + 2, py + 25, 16, 10);                                                          /* a panel    */
      A.fill(TIM[3], px + k * 20 + 2, py + 25, 16, 1); A.fill(TIM[3], px + k * 20 + 2, py + 25, 1, 10);
      A.fill(TIM[1], px + k * 20 + 17, py + 26, 1, 9); A.fill(TIM[1], px + k * 20 + 3, py + 34, 15, 1);
    }
    skirting(A, px, py, TIM[3], TIM[2], TIM[1]);
  },
  /* the lake house: whitewash with a blue pinstripe, a painted wainscot */
  white(A, px, py) {
    A.fill(SNO[1], px, py + 2, T, 3); A.fill(SNO[0], px, py + 4, T, 1);
    A.fill(SNO[1], px, py + 5, T, 19);
    for (let k = 0; k < 4; k++) A.fill(WAT[5], px + k * 10 + 4, py + 5, 1, 19);                                    /* the stripe */
    A.fill(SNO[1], px, py + 24, T, 2); A.fill(SNO[0], px, py + 26, T, 1);
    A.fill(WAT[2], px, py + 27, T, 10);
    for (let b = 0; b < 8; b++) { A.fill(WAT[3], px + b * 5 + 1, py + 28, 4, 9); }
    skirting(A, px, py, SNO[1], SNO[0], WAT[2]);
  }
};

/* a face (the wall seen from the room) and a cap (the top of one seen from above) */
export function wallFace(A, x, y, paper, ink) {
  const px = x * T, py = y * T;
  A.fill(ATMO[0], px, py, T, T);
  (FACES[paper] || FACES.stripe)(A, px, py, x, ink);
  if (ink) A.fill(ATMO[0], px, py, T, 2);
}
export function wallCap(A, x, y, paper) {
  const px = x * T, py = y * T, P = PAPERS[paper] || PAPERS.stripe;
  const open = (dx, dy) => { const c = A.tileAt(x + dx, y + dy); return c !== 'H' && c !== ' ' && c !== 'D'; };
  const gone = (dx, dy) => A.tileAt(x + dx, y + dy) === ' ';
  A.fill(P.cap, px, py, T, T);
  /* the top of a wall is boards laid along it: a line every ten pixels in the direction it runs, the same on every tile of it */
  const vert = !open(0, -1) && !open(0, 1) && (A.tileAt(x, y - 1) === 'H' || A.tileAt(x, y + 1) === 'H') && !(A.tileAt(x - 1, y) === 'H' && A.tileAt(x + 1, y) === 'H');
  for (let k = 10; k < T; k += 10) {
    if (vert) { A.fill(P.capLo, px + k, py, 1, T); A.fill(P.capHi, px + k + 1, py, 1, T); }
    else { A.fill(P.capLo, px, py + k, T, 1); A.fill(P.capHi, px, py + k + 1, T, 1); }
  }
  const edge = (side) => {                                     /* a wall's edge where it meets floor: trim and an ink line */
    const horiz = side === 'n' || side === 's', at = side === 'n' || side === 'w' ? 0 : T - 3, ink = side === 'n' || side === 'w' ? 0 : T - 1;
    if (horiz) { A.fill(P.trim, px, py + at, T, 3); A.fill(ATMO[0], px, py + (side === 'n' ? 0 : T - 1), T, 1); }
    else { A.fill(P.trim, px + at, py, 3, T); A.fill(ATMO[0], px + ink, py, 1, T); }
  };
  if (open(0, -1)) edge('n'); else if (gone(0, -1)) A.fill(ATMO[0], px, py, T, 2);
  if (open(0, 1)) edge('s'); else if (gone(0, 1)) A.fill(ATMO[0], px, py + T - 2, T, 2);
  if (open(-1, 0)) edge('w'); else if (gone(-1, 0)) A.fill(ATMO[0], px, py, 2, T);
  if (open(1, 0)) edge('e'); else if (gone(1, 0)) A.fill(ATMO[0], px + T - 2, py, 2, T);
}

/* ---- the window, with its cloth ----------------------------------------------
   A face tile with a window in it: the opening above the rail, a sill over the rail, a mullion cross, and a curtain either side
   that hangs in folds four pixels apart (so it repeats), tied back halfway and hung from a pole under the crown. `c` is the
   colourway of the cloth; `lake` is what the lower third of the glass shows. */
const CLOTH = { blue: [WAT[3], WAT[2]], red: [WAR[2], WAR[1]], green: [CON[3], CON[2]] };
export function windowOn(A, x, y, c, lake, frame) {
  const px = x * T, py = y * T, F = frame || TIM[4], cl = CLOTH[c] || CLOTH.blue;
  A.fill(ATMO[0], px + 9, py + 5, 22, 20);                                        /* the reveal   */
  A.fill(F, px + 10, py + 6, 20, 18);                                             /* the frame    */
  A.fill(WAT[5], px + 12, py + 8, 16, 11);                                        /* the sky      */
  A.fill(SNO[1], px + 14, py + 10, 5, 2); A.fill(SNO[1], px + 17, py + 9, 4, 2);  /* a cloud      */
  A.fill(lake ? WAT[3] : GRASS[2], px + 12, py + 19, 16, 3);                     /* what is out there */
  A.fill(lake ? WAT[4] : GRASS[3], px + 12, py + 19, 16, 1);
  A.fill(F, px + 19, py + 8, 2, 14); A.fill(F, px + 12, py + 15, 16, 1);        /* the mullions */
  A.fill(F, px + 7, py + 23, 26, 3); A.fill(TIM[2], px + 7, py + 26, 26, 1);      /* the sill, over the rail */
  A.fill(TIM[2], px + 6, py + 6, 28, 2); A.fill(TIM[3], px + 6, py + 6, 28, 1);   /* the pole     */
  A.fill(TIM[4], px + 5, py + 5, 2, 4); A.fill(TIM[4], px + 33, py + 5, 2, 4);    /* its finials  */
  [[8, 12], [28, 32]].forEach(([a, b], side) => {                                 /* the two drops of cloth */
    const w = b - a + 1;
    A.fill(cl[1], px + a, py + 8, w, 17);
    for (let k = 0; k < w; k += 4) A.fill(cl[0], px + a + k, py + 8, 2, 17);      /* folds, four apart */
    A.fill(ATMO[0], px + (side ? b + 1 : a - 1), py + 8, 1, 17);
    A.fill(TIM[2], px + a, py + 17, w, 2);                                        /* the tie-back */
  });
  A.fill(cl[0], px + 8, py + 8, 25, 3); A.fill(cl[1], px + 8, py + 10, 25, 1);   /* the valance  */
}

/* ---- the rug ------------------------------------------------------------------
   A border, a field, and a diamond on a twenty-pixel lattice, four to a tile: the same motif over and over, with a fringe where
   the rug stops. `isRug(dx, dy)` says whether the square beside is rug. */
const RUGS = { red: [WAR[0], WAR[1], WAR[2]], blue: [WAT[2], WAT[3], WAT[4]], green: [CON[2], CON[3], GRASS[3]] };
export function rug(A, x, y, colour, isRug) {
  const px = x * T, py = y * T, R = RUGS[colour] || RUGS.blue;
  A.fill(R[1], px, py, T, T);
  for (let cy = 0; cy < 2; cy++) for (let cx = 0; cx < 2; cx++) {
    const mx = px + cx * 20 + 10, my = py + cy * 20 + 10;
    for (let dy = -6; dy <= 6; dy++) {
      const w = 7 - Math.abs(dy);
      A.fill(SAN[1], mx - w + 1, my + dy, w * 2 - 1, 1);
      if (Math.abs(dy) <= 4) A.fill(R[0], mx - (w - 2) + 1, my + dy, Math.max(1, (w - 2) * 2 - 1), 1);
    }
    A.fill(R[2], mx - 1, my - 1, 3, 3);
  }
  const band = (bx, by, bw, bh) => { A.fill(R[0], bx, by, bw, bh); };
  if (!isRug(0, -1)) { band(px, py, T, 5); A.fill(SAN[1], px, py + 4, T, 1); for (let k = 1; k < T; k += 3) A.fill(SAN[2], px + k, py - 1, 1, 1); }
  if (!isRug(0, 1)) { band(px, py + T - 5, T, 5); A.fill(SAN[1], px, py + T - 5, T, 1); for (let k = 1; k < T; k += 3) A.fill(SAN[2], px + k, py + T, 1, 1); }
  if (!isRug(-1, 0)) { band(px, py, 5, T); A.fill(SAN[1], px + 4, py, 1, T); }
  if (!isRug(1, 0)) { band(px + T - 5, py, 5, T); A.fill(SAN[1], px + T - 5, py, 1, T); }
}

/* ---- the door, from inside --------------------------------------------------------
   Boards on a ledge, a pale frame, a brass latch, and the sill of stone it stands on: the same leaf the outside shows. */
export function doorIn(A, x, y) {
  const px = x * T, py = y * T;
  A.fill(ATMO[0], px, py, T, T);
  A.fill(TIM[3], px + 3, py + 2, T - 6, T - 3);                                   /* the frame   */
  A.fill(TIM[4], px + 3, py + 2, T - 6, 1);
  A.fill(TIM[1], px + 6, py + 5, T - 12, T - 5);                                  /* the reveal  */
  for (let b = 0; b < 4; b++) { A.fill(TIM[2], px + 7 + b * 6, py + 6, 5, T - 6); A.fill(TIM[3], px + 7 + b * 6, py + 6, 1, T - 6); }
  A.fill(TIM[1], px + 7, py + 14, T - 14, 2); A.fill(TIM[1], px + 7, py + 30, T - 14, 2);   /* the ledges */
  A.fill(WAR[4], px + T - 13, py + 21, 3, 3); A.fill(WAR[3], px + T - 13, py + 24, 3, 1);   /* the latch  */
  A.fill(STO[3], px + 4, py + T - 3, T - 8, 3);                                   /* the sill   */
}

/* ---- a made room's wall ---------------------------------------------------------
   A wall with floor to its south is a *face*: the wall as you see it from the room, with a window where rooms.js says there is
   one. Anything else is a *cap*, the top of a wall seen from above, with a trim wherever it meets the floor. A single post (floor
   on both sides of it) is a cap too. The paper is the room's it faces. */
const openAt = (A, x, y) => { const c = A.tileAt(x, y); return c !== 'H' && c !== ' ' && c !== 'D'; };
export function wallZ(A, x, y) {
  const below = openAt(A, x, y + 1) ? A.zone(x, y + 1) : null;
  if (below && (!openAt(A, x - 1, y) || !openAt(A, x + 1, y))) {
    wallFace(A, x, y, below.paper, A.tileAt(x, y - 1) !== 'H');
    const w = A.win(x, y);
    if (w) windowOn(A, x, y, w.c, A.map() === 'lakehouse', below.paper === 'white' ? SNO[1] : null);
    return;
  }
  let paper = A.paper();
  for (const d of [[0, 1], [0, -1], [1, 0], [-1, 0]]) if (openAt(A, x + d[0], y + d[1])) { paper = A.zone(x + d[0], y + d[1]).paper; break; }
  wallCap(A, x, y, paper);
}
