/* Bekkedal — a pool of light, as bands of the picture daylight would have.
 *
 * The doctrine is in `light.js`: night is a palette and not an overlay. A pool
 * of local light is the same idea at a smaller radius: for every pixel in
 * reach it takes the colour the hour gave it to the colour it would have had
 * in daylight plus a warm tint (`lampState`). At full strength you are looking
 * at the daylight picture, so full strength is *maximum* legibility rather
 * than none.
 *
 * It used to be an ordered dither between the two pictures, and that was the
 * one thing in the light that did not work: a 4x4 matrix at half strength is
 * a checkerboard, and a checkerboard laid over a lit window, a roof, a wall
 * and a stretch of grass is exactly what it looked like — a lit window in a
 * chequer of two colours, a row of isolated bright dots along a roof ridge
 * where the matrix happened to land on the capping, a lattice of warm
 * specks (the veil that was added to give it a colour temperature). People
 * who played it said it hurt to look at, and they were right.
 *
 * So there is no dither in it any more. The strength of a pool is a smooth
 * field (the falloff below, interpolated between cells so a ring is a ring
 * and not a staircase of squares) and it is cut into STEPS bands with hard
 * edges, the way a lamp is drawn in pixel art: four contours, each band one
 * more step of the way from the hour's picture to the lit one, and every
 * pixel in a band transformed the same way. Nothing in a band is a different
 * colour from its neighbour except by exactly what the band does to it.
 *
 * What falls out of that shape is still true, and still the reason for it:
 *
 *   - **Stacking is impossible.** A pixel's band is the maximum over every
 *     source, and the target of a band is a fixed state, not an addend, so
 *     two pools over one pixel light it to the same colour. That was the
 *     hearth bug and it is still unexpressible.
 *   - **It costs nothing in daylight.** As the hour approaches noon the
 *     states converge, so the pool fades out on its own.
 *   - **Every state is a state `light.js` knows.** The bands are the hour's
 *     state blended toward the lamp's in STEPS equal parts, all through
 *     `quantState`, so the ordering guarantee (no two palette entries swap
 *     luminance order) holds for each of them, and `palette_check.js` holds
 *     it to that.
 *   - **No alpha.** Every pixel written is one whole colour of one band's
 *     table. The only transparency anywhere in this file is the mask a live
 *     pool is cut out with (a pixel is in it or it is not).
 *
 * Two kinds of pool. A *static* one (a lit window, a lamp on a post) is
 * worked into the terrain cache when the cache is rebuilt, which is also
 * where its band map is kept. A *live* one (the lantern you carry, a hearth
 * that breathes) is worked out every frame, but from the terrain cache and
 * not from the screen: the cache is a canvas that lives in memory, so
 * reading a box out of it is a copy, where reading the screen — a canvas the
 * graphics card owns — stalls the whole pipeline until everything queued has
 * been drawn, every frame, which is what made caves slow. What the live pass
 * produces is a small patch the caller lays over the picture and, because
 * the sprites are drawn after it, a band number for any point
 * (`bandAt`) so the player standing in his own lantern is drawn in the
 * lit palette too.
 *
 * What it is not is a substitute for warmth. The cast is in the states
 * themselves (`LAMP_TINT`, scaled by how dark it is), which is how a fire
 * reads as amber against a blue valley with no paint over it.
 *
 * The falloff, the lamp's own light state and the pass are all here; the hour
 * itself, and the affine shape both of them rest on, are in `light.js`.
 */
import { STEPS, GLOW_CELL, bandStates, coefTable } from './lamp_bands.js';
export { STEPS, GLOW_CELL, LAMP_MIX, LAMP_SAT, LAMP_K, LAMP_TINT, lampState, relightCoef, bandStates } from './lamp_bands.js';


/* The block a band is decided for: two device pixels square, which is one pixel of the art (BEK_ART_SCALE), so a
   contour moves in whole art pixels and never cuts one in half. */
const BLOCK = 2, NEVER = 255;

/* Everything a pass needs for one canvas of W x H device pixels:
     bands   one byte per block: the band of every pixel in it, as the static pass left it
     compose(sources, rect, into)   lay sources into a band map over a rect, as the maximum of them
     bake(ctx, sources, from, to, clip)   the static pass: relight `ctx` in place and keep the bands
     clear(rect)   forget the static bands in a rect (the cache is about to repaint it)
     live(ctx, sources, from, to, clip, into)   the live pass: a patch (ImageData) of pixels lifted above what the
                   static pass left, cut out of `ctx`'s pixels, and the band map to look points up in
     bandAt(x, y)  the band of a point, static or live, for whatever is drawn over it */
export function createLamp(W, H) {
  const BW = Math.ceil(W / BLOCK), BH = Math.ceil(H / BLOCK);
  const CW = Math.ceil(W / GLOW_CELL) + 2, CH = Math.ceil(H / GLOW_CELL) + 2;
  const bands = new Uint8Array(BW * BH), liveBands = new Uint8Array(BW * BH);
  const field = new Float32Array(CW * CH);
  let liveBoxes = [], patch = null, states = null, table = null, statesKey = '';

  const stateSet = (from, to) => {
    const k = [from.k, from.sat, from.a.join(), to.k, to.sat, to.a.join()].join('|');
    if (k !== statesKey) { states = bandStates(from, to); table = coefTable(states); statesKey = k; }
    return states;
  };

  /* every source into the strength field, as a maximum, over its own box; returns the boxes (device pixels, whole blocks,
     clipped to `rect`) that hold what was lit. Sources that overlap share a box; sources far apart do not, so a town with
     thirty windows is thirty small boxes and not one the size of the town. */
  function gather(sources, rect) {
    const raw = [];
    const lo = (v, min) => Math.max(min, v - (v % BLOCK));
    for (let i = 0; i < sources.length; i++) {
      const sc = sources[i];
      if (sc.peak <= 0 || sc.r <= 0) continue;
      const c = GLOW_CELL, r = sc.r;
      const gx0 = Math.max(0, Math.floor((sc.px - r) / c)), gx1 = Math.min(CW - 2, Math.ceil((sc.px + r) / c));
      const gy0 = Math.max(0, Math.floor((sc.py - r / 1.15) / c)), gy1 = Math.min(CH - 2, Math.ceil((sc.py + r / 1.15) / c));
      for (let gy = gy0; gy <= gy1; gy++) {
        for (let gx = gx0; gx <= gx1; gx++) {
          const dx = (gx + 0.5) * c - sc.px, dy = ((gy + 0.5) * c - sc.py) * 1.15;      /* a shade wider than tall */
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d >= r) continue;
          const u = d / r, v = sc.peak * (1 - u * u * u);
          const ix = gy * CW + gx;
          if (v > field[ix]) field[ix] = v;
        }
      }
      const x0 = Math.max(rect ? rect.x : 0, Math.floor(sc.px - r - c)), y0 = Math.max(rect ? rect.y : 0, Math.floor(sc.py - r / 1.15 - c));
      const x1 = Math.min(rect ? rect.x + rect.w : W, Math.ceil(sc.px + r + c)), y1 = Math.min(rect ? rect.y + rect.h : H, Math.ceil(sc.py + r / 1.15 + c));
      if (x1 <= x0 || y1 <= y0) continue;
      const ax = lo(x0, 0), ay = lo(y0, 0);
      raw.push({ x: ax, y: ay, x1: Math.min(W, Math.ceil(x1 / BLOCK) * BLOCK), y1: Math.min(H, Math.ceil(y1 / BLOCK) * BLOCK) });
    }
    /* merge any two that touch, until none do */
    for (let again = true; again;) {
      again = false;
      for (let i = 0; i < raw.length && !again; i++) for (let j = i + 1; j < raw.length; j++) {
        const A = raw[i], B = raw[j];
        if (A.x < B.x1 && B.x < A.x1 && A.y < B.y1 && B.y < A.y1) {
          A.x = Math.min(A.x, B.x); A.y = Math.min(A.y, B.y); A.x1 = Math.max(A.x1, B.x1); A.y1 = Math.max(A.y1, B.y1);
          raw.splice(j, 1); again = true; break;
        }
      }
    }
    return raw.map(q => ({ x: q.x, y: q.y, w: q.x1 - q.x, h: q.y1 - q.y }));
  }

  /* the field, sampled between cell centres at each block of the box, cut into bands, written into `into` as a maximum */
  function cut(box, into) {
    const c = GLOW_CELL;
    let any = false;
    for (let by = box.y / BLOCK; by < (box.y + box.h) / BLOCK; by++) {
      const fy = (by * BLOCK + BLOCK / 2) / c - 0.5, j = Math.floor(fy), ty = fy - j;
      if (j < -1 || j >= CH - 1) continue;
      const r0 = Math.max(0, j) * CW, r1 = Math.min(CH - 1, j + 1) * CW;
      for (let bx = box.x / BLOCK; bx < (box.x + box.w) / BLOCK; bx++) {
        const fx = (bx * BLOCK + BLOCK / 2) / c - 0.5, i = Math.floor(fx), tx = fx - i;
        if (i < -1 || i >= CW - 1) continue;
        const i0 = Math.max(0, i), i1 = Math.min(CW - 1, i + 1);
        const a = field[r0 + i0], b = field[r0 + i1], d1 = field[r1 + i0], e = field[r1 + i1];
        if (a === 0 && b === 0 && d1 === 0 && e === 0) continue;
        const top = a + (b - a) * tx, bot = d1 + (e - d1) * tx;
        const s = top + (bot - top) * ty;
        const band = Math.floor(s / 16 * STEPS + 0.5);
        if (band <= 0) continue;
        const k = by * BW + bx, v = band > STEPS ? STEPS : band;
        if (v > into[k]) { into[k] = v; any = true; }
      }
    }
    return any;
  }

  /* the sources into a band map, as a maximum; the boxes that got any light, or an empty list */
  function compose(sources, rect, into) {
    field.fill(0);
    return gather(sources, rect).filter(box => cut(box, into));
  }

  function clear(rect) {
    const bx0 = Math.max(0, Math.floor(rect.x / BLOCK)), bx1 = Math.min(BW, Math.ceil((rect.x + rect.w) / BLOCK));
    const by0 = Math.max(0, Math.floor(rect.y / BLOCK)), by1 = Math.min(BH, Math.ceil((rect.y + rect.h) / BLOCK));
    for (let by = by0; by < by1; by++) bands.fill(0, by * BW + bx0, by * BW + bx1);
  }

  /* a rect that no light may reach (the dead black margin outside a room's walls): marked, so a live pool skips it */
  function mask(rect) {
    const bx0 = Math.max(0, Math.floor(rect.x / BLOCK)), bx1 = Math.min(BW, Math.ceil((rect.x + rect.w) / BLOCK));
    const by0 = Math.max(0, Math.floor(rect.y / BLOCK)), by1 = Math.min(BH, Math.ceil((rect.y + rect.h) / BLOCK));
    for (let by = by0; by < by1; by++) bands.fill(NEVER, by * BW + bx0, by * BW + bx1);
  }

  /* The static pass. `from` is the state the pixels in `ctx` were rasterised through, `to` is what the pool resolves
     them toward; `clip` bounds it to a rect the caller owns. One getImageData, one putImageData, and a loop that
     touches a pixel once; the canvas is the terrain cache, which lives in memory, so the read is a copy. */
  function plan(sources, from, to, clip) {
    stateSet(from, to);
    return compose(sources, clip, bands);
  }
  /* one box of the static pass: relight it in `ctx` and return how many pixels were lit */
  function bakeBox(ctx, box) {
    let lit = 0;
    const img = ctx.getImageData(box.x, box.y, box.w, box.h), d = img.data;
    for (let j = 0; j < box.h; j++) {
      const row = ((box.y + j) / BLOCK | 0) * BW;
      for (let i = 0, o = j * box.w * 4; i < box.w; i++, o += 4) {
        const band = bands[row + ((box.x + i) / BLOCK | 0)];
        if (band === 0) continue;
        const co = table[0][band], P = co.P, Q = co.Q;
        const r = d[o], gr = d[o + 1], b = d[o + 2];
        const t = P * (0.2126 * r + 0.7152 * gr + 0.0722 * b);
        d[o] = t + Q * r + co.D[0];
        d[o + 1] = t + Q * gr + co.D[1];
        d[o + 2] = t + Q * b + co.D[2];
        lit++;
      }
    }
    ctx.putImageData(img, box.x, box.y);
    return lit;
  }
  /* the whole static pass at once; a rebuild that is spread over several frames asks for the boxes (`plan`) and does them
     one at a time (`bakeBox`) */
  function bake(ctx, sources, from, to, clip) {
    const boxes = plan(sources, from, to, clip);
    let lit = 0;
    for (let n = 0; n < boxes.length; n++) lit += bakeBox(ctx, boxes[n]);
    return lit;
  }

  /* The live pass: the pixels of `ctx` (the terrain cache) that a moving source lifts above whatever the static pass
     already did to them, as a patch with a transparent pixel wherever nothing is lifted. Returns { x, y, img } or
     null; the caller draws `img` where it says. */
  function live(ctx, sources, from, to, clip) {
    for (let n = 0; n < liveBoxes.length; n++) clearBox(liveBands, liveBoxes[n]);
    stateSet(from, to);
    liveBoxes = compose(sources, clip, liveBands);
    if (!liveBoxes.length) return null;
    /* one patch for all of them: the box that bounds them, as pixels with a transparent hole wherever nothing is lifted.
       The buffer is kept from frame to frame (a new one every frame is a megabyte and a half of garbage sixty times a second)
       and only the part this frame uses is cleared; its rows are `stride` pixels, a couple wider than the clip for the
       whole blocks the boxes are cut in. */
    let x0 = W, y0 = H, x1 = 0, y1 = 0;
    liveBoxes.forEach(b => { x0 = Math.min(x0, b.x); y0 = Math.min(y0, b.y); x1 = Math.max(x1, b.x + b.w); y1 = Math.max(y1, b.y + b.h); });
    const stride = clip.w + 2 * BLOCK;
    if (!patch || patch.width !== stride || patch.height < y1 - y0) patch = ctx.createImageData(stride, Math.max(clip.h + 2 * BLOCK, y1 - y0));
    const out = patch, o2 = out.data, ow = stride;
    o2.fill(0, 0, (y1 - y0) * ow * 4);
    let any = false;
    for (let n = 0; n < liveBoxes.length; n++) {
      const box = liveBoxes[n];
      const src = ctx.getImageData(box.x, box.y, box.w, box.h), d = src.data;
      for (let j = 0; j < box.h; j++) {
        const row = ((box.y + j) / BLOCK | 0) * BW;
        for (let i = 0, o = j * box.w * 4, q = ((box.y - y0 + j) * ow + (box.x - x0)) * 4; i < box.w; i++, o += 4, q += 4) {
          const k = row + ((box.x + i) / BLOCK | 0), lb = liveBands[k], sb = bands[k];
          if (lb <= sb || sb === NEVER) continue;
          const co = table[sb][lb], P = co.P, Q = co.Q;
          const r = d[o], gr = d[o + 1], b = d[o + 2];
          const t = P * (0.2126 * r + 0.7152 * gr + 0.0722 * b);
          o2[q] = t + Q * r + co.D[0];
          o2[q + 1] = t + Q * gr + co.D[1];
          o2[q + 2] = t + Q * b + co.D[2];
          o2[q + 3] = 255;
          any = true;
        }
      }
    }
    return any ? { x: x0, y: y0, w: x1 - x0, h: y1 - y0, img: out } : null;
  }
  function clearBox(map, box) {
    const bx0 = Math.max(0, Math.floor(box.x / BLOCK)), bx1 = Math.min(BW, Math.ceil((box.x + box.w) / BLOCK));
    const by0 = Math.max(0, Math.floor(box.y / BLOCK)), by1 = Math.min(BH, Math.ceil((box.y + box.h) / BLOCK));
    for (let by = by0; by < by1; by++) map.fill(0, by * BW + bx0, by * BW + bx1);
  }

  /* the band of a point (device pixels of this canvas), static or live: what a sprite standing there is drawn in */
  function bandAt(x, y) {
    if (x < 0 || y < 0 || x >= W || y >= H) return 0;
    const k = ((y / BLOCK) | 0) * BW + ((x / BLOCK) | 0), s = bands[k], l = liveBands[k];
    if (s === NEVER) return 0;
    return l > s ? l : s;
  }

  return { bake, plan, bakeBox, live, clear, mask, bandAt, states: () => states, stateSet };
}
