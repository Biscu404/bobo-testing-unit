/* Bekkedal — what is on a wall: the window, the door, the lantern.
 *
 * Split off `building.js` for the 300-line rule once a house could be told from the next by what hung on it. Everything is drawn
 * in *building space*, as a distance below the eave line, the way the wall itself is, so a window that is taller than a tile is
 * drawn in two pieces by two tiles that never have to agree about anything but where the eave is. `put` is the one clipped fill
 * that makes that true: it takes a rectangle in building space and lays down only the part of it that is in this tile.
 */
import { SHADOWS, FEATURES } from './palette_marks.js';
import { BEK_T } from './data.js';

/* the window and the door, in building space: distance below the eave line */
export const WIN_T = 22, WIN_H = 28, WIN_W = 22, DOOR_H = 46, DOOR_W = 22, PLINTH = 9;

export function createParts(A) {
  /* ---- a window ------------------------------------------------------------
     `F.win` says how it is glazed: `cross` is the old four pane, `plain` is one big pane (the new houses), `six` is two columns of
     three. `F.shut` hangs a pair of boards either side, `F.box` stands a box of flowers on the sill. */
  function windowOn(px, py, v0, M, lit, F) {
    const x0 = (BEK_T - WIN_W) >> 1, L = FEATURES.WINDOW_LIT.cols, FL = FEATURES.FLOWER.cols, SO = FEATURES.BOX_SOIL.cols;
    const put = (col, wy, wh, wx, ww) => {
      const a = Math.max(0, wy - v0), b = Math.min(BEK_T, wy + wh - v0);
      if (b > a) A.fill(col, px + wx, py + a, ww, b - a);
    };
    if (F.shut) {                                                  /* the shutters, folded back against the wall */
      [x0 - 9, x0 + WIN_W + 2].forEach(sx => {
        put(M.deep, WIN_T - 1, WIN_H + 2, sx - 1, 8);
        put(F.shut[0], WIN_T, WIN_H, sx, 6);
        for (let sy = WIN_T + 3; sy < WIN_T + WIN_H - 2; sy += 4) put(F.shut[1], sy, 1, sx, 6);   /* slats */
      });
    }
    put(M.deep, WIN_T - 1, WIN_H + 2, x0 - 1, WIN_W + 2);          /* the reveal  */
    put(M.trim[0], WIN_T, WIN_H, x0, WIN_W);                       /* the frame   */
    put(lit ? L[1] : M.glass[0], WIN_T + 3, WIN_H - 8, x0 + 3, WIN_W - 6);
    put(lit ? L[0] : M.glass[1], WIN_T + 3, 3, x0 + 3, WIN_W - 6); /* sky in it   */
    if (F.win !== 'plain') {
      put(M.trim[1], WIN_T + (F.win === 'six' ? 9 : 12), 2, x0 + 3, WIN_W - 6);       /* glazing bars */
      if (F.win === 'six') put(M.trim[1], WIN_T + 15, 2, x0 + 3, WIN_W - 6);
      put(M.trim[1], WIN_T + 3, WIN_H - 8, x0 + 10, 2);
    }
    put(M.trim[1], WIN_T + WIN_H - 5, 4, x0 - 2, WIN_W + 4);       /* the sill    */
    put(M.deep, WIN_T + WIN_H - 1, 2, x0 - 1, WIN_W + 2);          /* under it    */
    if (F.box) {                                                   /* the flower box: blooms over the sill, soil in a board box */
      put(SO[0], WIN_T + WIN_H + 1, 6, x0 - 2, WIN_W + 4);
      put(SO[1], WIN_T + WIN_H + 1, 2, x0 - 2, WIN_W + 4);
      for (let bx = 0; bx < WIN_W + 2; bx += 4) {
        put(FEATURES.PICKABLE.on, WIN_T + WIN_H - 4, 5, x0 - 1 + bx + 1, 2);   /* stems */
        put(FL[(bx >> 2) % FL.length], WIN_T + WIN_H - 6 - ((bx >> 2) & 1) * 2, 3, x0 - 1 + bx, 3);              /* heads */
      }
    }
  }

  /* ---- the door ------------------------------------------------------------
     Drawn by the `D` tile and rising into the `H` above it. The detail pass runs top to bottom, so that tile is already laid down
     and the door wins — which is the whole reason it can be taller than a tile, and so the whole reason it reads as a door. It
     stands on the sill beam at the top of the plinth, which the profile has already put at a known height. A painted door is the
     same boards in the paint of its house: red, green, blue or the dark of an old storehouse. */
  function door(px, py, M, F) {
    const x0 = (BEK_T - DOOR_W) >> 1, bot = BEK_T - PLINTH, top = bot - DOOR_H;
    const B = F.door, J = SHADOWS.DOOR_JOINT.cols, I = FEATURES.DOOR_IRON.cols;
    A.fill(J[1], px + x0 - 4, py + top - 1, DOOR_W + 8, bot - top + 2);
    A.fill(M.trim[0], px + x0 - 3, py + top, DOOR_W + 6, bot - top);      /* the frame */
    A.fill(J[0], px + x0 - 1, py + top + 2, DOOR_W + 2, bot - top - 2);
    for (let bx = 0; bx < DOOR_W; bx += 5) {
      A.fill(B[(bx / 5) & 1], px + x0 + bx, py + top + 3, 4, bot - top - 3);
      A.fill(J[0], px + x0 + bx + 4, py + top + 3, 1, bot - top - 3);
    }
    A.fill(B[2], px + x0, py + top + 3, DOOR_W, 1);                       /* the head  */
    A.fill(I[0], px + x0 + 1, py + top + 7, DOOR_W - 2, 2);               /* two hinges */
    A.fill(I[0], px + x0 + 1, py + bot - 9, DOOR_W - 2, 2);
    A.fill(I[1], px + x0 + DOOR_W - 6, py + bot - 20, 3, 3);              /* the handle */
    /* the threshold, and the worn step down off it */
    A.fill(M.plinthTop, px + x0 - 4, py + bot, DOOR_W + 8, 3);
    A.fill(M.plinth, px + x0 - 6, py + bot + 3, DOOR_W + 12, 3);
    A.fill(M.deep, px + x0 - 6, py + bot + 6, DOOR_W + 12, 1);
    if (F.lantern) {                                                      /* a lantern on its bracket, to the right of the frame */
      const L = FEATURES.LANTERN.cols, lx = x0 + DOOR_W + 4;
      A.fill(J[1], px + lx - 1, py + top + 8, 5, 9);
      A.fill(L[0], px + lx, py + top + 9, 3, 6);
      A.fill(L[1], px + lx + 1, py + top + 11, 1, 2);
      A.fill(J[1], px + lx - 2, py + top + 7, 7, 2);
    }
  }

  return { windowOn: windowOn, door: door };
}
