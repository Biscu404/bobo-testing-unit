/* The caps, drawn for the neck they are on. A cap is worked out from its bottle's geometry (shapes.js): it is as wide as the lip it covers plus its own wall, it stands a few
   pixels over the lip and its skirt comes down over it, so it fits, whatever the bottle is. `r` fills one rectangle, `K` is the drink's colours (drinks.js), `g` the geometry.
   Four kinds: a screw cap (ribbed, with a ring), a crown cap (pleated, small), a cork (in the neck, a head over the lip) and a plastic bottle's wide ribbed cap. */

/* what each takes of the lip: how far it stands over it, and how far down it comes. The top of a cap is never above the sprite (shapes.js MAX_TOP + `up`). */
export const CAPS = {
  screw: { up: 13, down: 8, dome: 2 },
  crown: { up: 3, down: 6, dome: 0 },
  cork:  { up: 10, down: 0, dome: 0 },
  pet:   { up: 12, down: 10, dome: 0 }
};
export const capTop = g => g.top + CAPS[g.cap].up + CAPS[g.cap].dome;      /* how far over the base the cap's highest pixel is */

export function drawCap(r, K, g) {
  const t = -g.top, hw = g.lipHW, c = CAPS[g.cap];
  if (g.cap === 'screw') {
    const cw = hw + 2, y0 = t - c.up, y1 = t + c.down, h = y1 - y0;
    r(-cw, y0, cw * 2, h, K.cap);                                        /* the cap, over the lip and the top of the neck */
    r(-cw + 2, y0 - c.dome, cw * 2 - 4, c.dome, K.cap);                  /* its dome, a step in from the sides */
    r(-cw + 2, y0 - c.dome, 4, h + c.dome, K.capHi);                     /* the light down its left */
    r(-cw + 2, y0 - c.dome, cw * 2 - 4, 1, K.capHi);
    for (let x = -cw + 7; x < cw - 1; x += 4) r(x, y0 + 3, 1, h - 8, K.capLo);          /* the ribs */
    r(-cw, y1 - 3, cw * 2, 3, K.capLo);                                  /* the ring that breaks when it is first opened */
    r(cw - 4, y0, 4, h, K.capLo);                                        /* its shadow side */
  } else if (g.cap === 'crown') {
    const cw = hw + 2, y0 = t - c.up, y1 = t + c.down;
    r(-cw + 1, y0, cw * 2 - 2, 3, K.cap);                                /* the disc on top */
    r(-cw, y0 + 3, cw * 2, y1 - y0 - 3, K.cap);                          /* the pleated skirt that bites the lip */
    r(-cw + 1, y0, cw * 2 - 2, 1, K.capHi);
    for (let x = -cw + 2; x < cw; x += 3) r(x, y0 + 4, 1, y1 - y0 - 4, K.capLo);       /* the pleats */
    for (let x = -cw + 1; x < cw; x += 3) r(x, y1 - 1, 1, 1, K.capHi);   /* the edge of each one catches the light */
  } else if (g.cap === 'cork') {
    const n = g.neckHW, y0 = t - c.up, head = n - 1;
    r(-head, y0, head * 2, 10 + 4, K.cork);                              /* the head above the lip, and a little more into the neck */
    r(-head, y0, head * 2, 2, K.corkHi);
    r(-(n - 4), t + 4, (n - 4) * 2, 10, K.corkLo);                       /* the rest of it, seen through the glass of the neck */
    for (let k = 0; k < 7; k++) r(-head + 2 + ((k * 7) % (head * 2 - 4)), y0 + 3 + ((k * 5) % 9), 1, 1, K.corkLo);   /* its grain */
    r(head - 3, y0 + 2, 3, 12, K.corkLo);
  } else {
    const cw = hw, y0 = t - c.up, y1 = t + c.down, h = y1 - y0;
    r(-cw, y0 + 1, cw * 2, h - 1, K.cap);                                /* a plastic bottle's cap: as wide as the neck and tall */
    r(-cw + 1, y0, cw * 2 - 2, 1, K.cap);
    r(-cw + 1, y0, 3, h, K.capHi);
    for (let x = -cw + 5; x < cw - 1; x += 3) r(x, y0 + 2, 1, h - 6, K.capLo);          /* ribs all the way round */
    r(-cw - 1, y1 - 3, cw * 2 + 2, 3, K.capLo);                          /* the safety ring, a little wider than the cap */
    r(cw - 3, y0 + 1, 3, h - 1, K.capLo);
  }
}

/* the cap put down on the table beside the bottle while it is being poured: on its side, the same cap in little */
export function drawCapOnBar(R, K, g, x, y) {
  if (g.cap === 'screw' || g.cap === 'pet') {
    const w = g.cap === 'pet' ? 20 : 22, h = g.cap === 'pet' ? 13 : 12;
    R(x, y - h, w, h, K.cap); R(x, y - h, w, 2, K.capHi); R(x + w - 5, y - h, 5, h, K.capLo);
    for (let i = 5; i < w - 5; i += 3) R(x + i, y - h + 3, 1, h - 5, K.capLo);
  } else if (g.cap === 'crown') {
    R(x, y - 4, 17, 4, K.cap); R(x, y - 4, 17, 1, K.capHi);
    for (let i = 2; i < 17; i += 3) R(x + i, y - 3, 1, 3, K.capLo);
  } else {
    R(x, y - 10, 18, 10, K.cork); R(x, y - 10, 18, 2, K.corkHi); R(x + 14, y - 10, 4, 10, K.corkLo);
    R(x + 4, y - 6, 1, 1, K.corkLo); R(x + 9, y - 4, 1, 1, K.corkLo);
  }
  R(x - 2, y, 26, 2, '#150f08');
}
