/* Bekkedal — felling a tree is a rhythm, not a keypress.
 *
 * Pure, the way `schedule.js` and `mine.js` are: nothing here touches the canvas, `S` or a clock. A tree is a number of
 * points of cutting to get through (`CHOP_POINTS`); a marker sweeps across a bar and SPACE swings the axe where it is.
 * Inside the pale stretch of the bar the blow bites (one point), in the heart of it it bites deep (two), anywhere else the
 * axe glances off, costs a breath and gets you nothing. After every blow the stretch moves, so it is never the same press
 * twice. The energy for the whole tree is still paid once, when the first blow is struck, exactly as it was when a tree was a
 * single press: the mechanic spends the player's time and attention, never more of the bar, so what felling is worth per
 * point of energy (`act2_check_rates.js`) is untouched.
 *
 * A steel axe (axeLv >= 2) bites a point deeper into every tree, which is what the tier means now that a swing is not the
 * unit any more.
 */

/* points of cutting in a tree: the birch (Y) and the great fir (G) */
export const CHOP_POINTS = { Y: 3, G: 5 };
export const CHOP_STEEL_CUT = 1;
export const CHOP_SWEEP_S = 0.62;        /* one pass of the marker across the bar */
export const CHOP_ZONE = 0.17;           /* half-width of the bite */
export const CHOP_HEART = 0.06;          /* half-width of the deep bite */
export const CHOP_MISS_LOCK_S = 0.28;    /* the glance: the axe is not ready again for this long */
export const CHOP_MIN_C = 0.28, CHOP_MAX_C = 0.72;   /* where the stretch may be centred */
export const CHOP_IDLE_S = 6;            /* walking off is how you stop; standing there is not, until this long */

export const chopPoints = (glyph, axeLv) =>
  Math.max(1, (CHOP_POINTS[glyph] || 1) - (axeLv >= 2 ? CHOP_STEEL_CUT : 0));

/* where the marker is `t` seconds into its sweep: back and forth, 0..1 */
export const markerAt = t => {
  const p = (t / CHOP_SWEEP_S) % 2;
  return p < 1 ? p : 2 - p;
};

const pickCentre = rnd => CHOP_MIN_C + (CHOP_MAX_C - CHOP_MIN_C) * rnd();

/* `rnd` is Math.random in the game and a seeded stream in the check */
export function newChop(glyph, axeLv, x, y, rnd) {
  const need = chopPoints(glyph, axeLv);
  return { glyph: glyph, x: x, y: y, need: need, got: 0, t: 0, pos: 0, centre: pickCentre(rnd || Math.random),
           lock: 0, blows: 0, clean: 0, glances: 0, idle: 0, last: '' };
}

export function chopTick(c, dt) {
  c.t += dt; c.idle += dt;
  c.pos = markerAt(c.t);
  if (c.lock > 0) c.lock = Math.max(0, c.lock - dt);
}

/* one press of SPACE. Returns 'heart' | 'bite' | 'glance' | 'wait', and sets `c.done` once the tree is through. */
export function chopStrike(c, rnd) {
  if (c.lock > 0) return 'wait';
  c.idle = 0; c.blows++;
  const d = Math.abs(c.pos - c.centre);
  let r;
  if (d <= CHOP_HEART) { c.got += 2; c.clean++; r = 'heart'; }
  else if (d <= CHOP_ZONE) { c.got += 1; r = 'bite'; }
  else { c.lock = CHOP_MISS_LOCK_S; c.glances++; r = 'glance'; }
  if (r !== 'glance') c.centre = pickCentre(rnd || Math.random);
  if (c.got >= c.need) c.done = true;
  c.last = r;
  return r;
}

/* a tree that has been stood in front of and not struck for CHOP_IDLE_S is let go (the energy is gone, as with a cast line) */
export const chopAbandoned = c => c.idle >= CHOP_IDLE_S;
