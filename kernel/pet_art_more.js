/* The small elephant's fourteen newer things to wear (kernel/pet_art.js is the first thirteen and draws these in the same passes). Dave's second stock: none is for sale
   (kernel/cos_more_stock.js ELEPHANT_M). Each is [x, y, w, h, colour] rectangles in the pixel space of a standing elephant, the same way as pet_art.js, with the offsets that
   follow the head (`hy` and the face's `fx`/`fy`), the throat (`nx`/`ny`) or the body (`by`). The big elephant's pictures of the same things are apps/elephant/wear_more.js. */
export const WEAR_MORE = {
  horns:     (R, o) => { R(56, 12 + o.hy, 12, 2, 15); R(55, 10 + o.hy, 3, 2, 15); R(54, 7 + o.hy, 3, 3, 15); R(53, 4 + o.hy, 2, 3, 15); R(66, 10 + o.hy, 3, 2, 15); R(67, 7 + o.hy, 3, 3, 15); R(69, 4 + o.hy, 2, 3, 15); R(56, 13 + o.hy, 12, 1, 7); },
  nemes:     (R, o) => { R(55, 8 + o.hy, 14, 5, 14); for (let i = 0; i < 7; i++) R(56 + i * 2, 8 + o.hy, 1, 5, 1); R(55, 13 + o.hy, 2, 7, 14); R(55, 14 + o.hy, 1, 5, 1); R(61, 7 + o.hy, 2, 3, 12); },
  toque:     (R, o) => { R(57, 2 + o.hy, 12, 8, 15); R(58, 1 + o.hy, 10, 2, 15); R(57, 10 + o.hy, 12, 3, 15); R(57, 12 + o.hy, 12, 1, 7); R(60, 3 + o.hy, 1, 6, 7); R(64, 3 + o.hy, 1, 6, 7); },
  viking:    (R, o) => { R(57, 5 + o.hy, 11, 7, 7); R(58, 4 + o.hy, 9, 2, 7); R(56, 11 + o.hy, 13, 2, 14); R(54, 8 + o.hy, 3, 3, 15); R(52, 5 + o.hy, 2, 3, 15); R(51, 3 + o.hy, 2, 2, 15); R(68, 8 + o.hy, 3, 3, 15); R(70, 5 + o.hy, 2, 3, 15); R(71, 3 + o.hy, 2, 2, 15); },
  straw:     (R, o) => { R(52, 12 + o.hy, 20, 2, 14); R(53, 14 + o.hy, 18, 1, 6); R(58, 6 + o.hy, 9, 6, 14); R(58, 10 + o.hy, 9, 2, 12); R(66, 11 + o.hy, 2, 3, 12); },
  headband:  (R, o) => { R(55, 12 + o.hy, 14, 3, 15); R(61, 12 + o.hy, 3, 3, 12); R(69, 13 + o.hy, 5, 1, 15); R(70, 14 + o.hy, 5, 1, 15); R(71, 15 + o.hy, 4, 1, 15); },
  tubehat:   (R, o) => { R(60, 1 + o.hy, 1, 4, 0); R(65, 0 + o.hy, 1, 5, 0); R(56, 4 + o.hy, 13, 9, 7); R(57, 5 + o.hy, 8, 6, 1); R(57, 7 + o.hy, 8, 1, 9); R(57, 9 + o.hy, 8, 1, 3); R(66, 6 + o.hy, 2, 2, 12); },
  visor:     (R, o) => { R(58 + o.fx, 21 + o.hy + o.fy, 12, 5, 2); R(58 + o.fx, 21 + o.hy + o.fy, 12, 1, 10); R(56, 23 + o.hy + o.fy, 3, 1, 0); R(60 + o.fx, 24 + o.hy + o.fy, 5, 1, 10); },
  anaglyph:  (R, o) => { const x = 60 + o.fx, y = 20 + o.hy + o.fy; R(x, y, 6, 7, 15); R(x + 1, y + 1, 4, 5, 12); R(x + 5, y + 1, 6, 7, 15); R(x + 6, y + 2, 4, 5, 11); R(56, y + 3, 5, 1, 15); },
  ankhchain: (R, o) => { R(52 + o.nx, 33 + o.hy + o.ny, 14, 1, 14); R(53 + o.nx, 34 + o.hy + o.ny, 12, 1, 6); R(56 + o.nx, 37 + o.hy + o.ny, 3, 3, 14); R(57 + o.nx, 38 + o.hy + o.ny, 1, 1, 0); R(54 + o.nx, 40 + o.hy + o.ny, 7, 1, 14); R(57 + o.nx, 41 + o.hy + o.ny, 1, 4, 14); },
  arrowchain: (R, o) => { R(52 + o.nx, 33 + o.hy + o.ny, 14, 1, 8); R(53 + o.nx, 34 + o.hy + o.ny, 12, 1, 8); R(56 + o.nx, 35 + o.hy + o.ny, 1, 3, 8); R(54 + o.nx, 38 + o.hy + o.ny, 5, 2, 14); R(55 + o.nx, 40 + o.hy + o.ny, 3, 2, 14); R(56 + o.nx, 42 + o.hy + o.ny, 1, 1, 6); },
  lusekofte: (R, o) => { R(21, 17 + o.by, 30, 13, 12); R(21, 20 + o.by, 30, 1, 15); R(21, 27 + o.by, 30, 1, 15); for (let x = 23; x < 50; x += 5) { R(x, 22 + o.by, 1, 4, 15); R(x - 1, 23 + o.by, 3, 1, 15); } R(21, 29 + o.by, 30, 2, 15); },
  yellowsuit: (R, o) => { R(21, 17 + o.by, 30, 13, 14); R(21, 28 + o.by, 30, 2, 6); R(35, 17 + o.by, 1, 13, 6); R(24, 22 + o.by, 6, 5, 6); R(25, 23 + o.by, 4, 3, 14); },
  robe:      (R, o) => { R(21, 17 + o.by, 30, 14, 6); R(21, 24 + o.by, 30, 2, 14); R(35, 24 + o.by, 2, 5, 14); R(26, 18 + o.by, 1, 12, 0); R(44, 18 + o.by, 1, 12, 0); }
};
export const BODY_MORE = { lusekofte: 1, yellowsuit: 1, robe: 1 };
export const NECK_MORE = { ankhchain: 1, arrowchain: 1 };
