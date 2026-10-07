/* Bekkedal — the numbers and the state maths under a pool of light (`lamp.js` is the pass that uses them).
 *
 * The falloff constants, the lamp's own light state, the affine re-light coefficients and the bands' states. Split off
 * `lamp.js` for the 300-line rule the way `palette_marks.js` is off `palette.js`; `lamp.js` re-exports all of it, so
 * import from there. The doctrine for all of it is in `lamp.js`'s header and in `light.js`.
 */
import { quantState, L_R, L_G, L_B } from './light.js';

/* ---- the falloff ----------------------------------------------------------
   A source is a field of strengths, 0 to 16, laid down one GLOW_CELL square
   at a time (half a tile) and then interpolated between the cells' centres,
   so a contour of it is a smooth ellipse and not a staircase of squares. The
   field is cut into STEPS bands, each a hard edge: band b is where the
   strength reaches b/STEPS of the way to 16, which is where the picture is b
   steps of the way from the hour's to the lit one.

   The profile stays deliberately flat-topped and steep at the rim rather than
   a smooth bell. A bell spends most of its *area* in the outer ring, and the
   outer ring is where the strength is a sixteenth or two — which, cut into
   bands, would be a wide, barely-lit fringe that says nothing. And the flat
   top is a virtue now that the top is the daylight picture rather than
   opaque paint: full strength means *fully legible*, so holding it across
   the middle of the pool is the point rather than the damage.

   Four bands, not more: each one is a visible step of light, which is what a
   lamp drawn in pixel art looks like, and every added band is a ring that is
   closer to the last, until they read as the gradient this machine is not
   allowed to have. */
export const STEPS = 4;
export const GLOW_CELL = 20;

/* How far toward daylight a pool takes the exposure of what it lights. Not
   all the way: a disc of exact noon dropped into a blue valley reads as a
   hole cut through to another hour, and the last tenth is what keeps a pool
   sitting *in* the night rather than on top of it. */

export const LAMP_MIX = 0.9;
/* Exposure and saturation are pulled back toward daylight by *different*
   amounts, and that separation is the difference between a pool of light and
   a hole cut through to the afternoon. Take `sat` all the way back with `k`
   and a lamp on grass restores full daylight green, which against a blue-grey
   valley and a warm rim reads as a chequer of complementary colours rather
   than as a lit patch of ground — the town's two street lamps are where it
   showed. A warm lamp is not the sun: it lifts the exposure most of the way
   and gives back only some of the colour, and the tint below supplies the
   hue it does not. It costs nothing to have them differ, because `sat` is
   the one term of the transform the luminance is provably blind to. */
export const LAMP_SAT = 0.45;
/* Daylight is the ceiling, and it is a hard one. A lamp brighter than noon
   was tried: at `k` above 1 the entries the palette already puts near 255
   clamp, stop climbing, and get overtaken by entries that have not clamped
   yet — 1908 reordered pairs at the first run of palette_check, which is the
   one thing this file is not allowed to do. Local light brightens by
   *revealing* the daylight picture, never by exceeding it. */
export const LAMP_K = 1;
/* The warm cast a lamp leaves, and it has a ceiling of its own for the same
   reason `LAMP_K` does: past about +50 on red the entries the palette already
   puts at 255 there clamp, stop climbing, and get passed by entries that have
   not. Measured, not guessed — 48 is clean and 52 costs one reordered pair
   (index 12 against 25). This sits under that with room for an anchor
   somebody adds later, and palette_check is what will say so if it runs out. */
export const LAMP_TINT = [46, 19, -13];

/* What a pool resolves what it lights *toward*. A light state like any other
   — the same `{ k, sat, a }`, blended toward daylight the way `shelter`
   blends a room toward it — so it goes through `lutOf` and inherits
   `light.js`'s ordering guarantee for free, and `palette_check.js` asserts
   that over the lamp's tables as well as the hour's. `dark` is how dark it is
   *outside* (the unsheltered exposure), because that is what decides how hard
   a fire has to burn, and it is the same figure the source peaks scale on. */
export function lampState(st, dark) {
  const u = LAMP_MIX, f = (v, one) => v + (one - v) * u;
  /* The tint is the one part of a pool that must go to nothing in daylight,
     and it is the part that does not fall off on its own. Exposure does:
     `LAMP_K` is daylight, so at eight in the morning there is almost nothing
     between the hour's table and the lamp's and the pool disappears whatever
     its peak. A fixed warm cast does not, and a window ringed in amber at
     08:00 is what that looks like. */
  const d = Math.min(1, Math.max(0, dark));
  return quantState(
    f(st.k, LAMP_K), st.sat + (1 - st.sat) * LAMP_SAT,
    [f(st.a[0], 0) + LAMP_TINT[0] * d,
     f(st.a[1], 0) + LAMP_TINT[1] * d,
     f(st.a[2], 0) + LAMP_TINT[2] * d],
    f(st.exposure, LAMP_K));
}

/* Coefficients for re-lighting an already-rendered pixel from state `f` to
   state `t`, as one affine map per channel:

       lit = P * lum(c) + Q * c + D

   Work it through. The hour renders `c = (l + (p-l)*sat)*k + a` where `l` is
   the entry's own luminance, and because `lum` is linear and the saturation
   term cancels under it, `lum(c) = k*l + lum(a)` — so `l` comes straight back
   out of the pixel. With `l` known, `q = (c-a)/k` gives `p - l = (q-l)/sat`,
   and the target state applied to that collapses to the line above. Six
   multiplies a pixel, and exact to within the forward clamp: about a third of
   a channel step at a midnight exposure, which is under the rounding the LUT
   already does.

   This is the same claim as "night is a palette" run backwards, and it holds
   for the same reason — the transform is affine with a scalar exposure. A
   per-channel multiplier would not invert like this either. */
export function relightCoef(f, t) {
  const R = f.sat > 0 ? t.sat / f.sat : 1, P = t.k * (1 - R) / f.k, Q = t.k * R / f.k;
  const la = L_R * f.a[0] + L_G * f.a[1] + L_B * f.a[2];
  return { P: P, Q: Q,
           D: [t.a[0] - P * la - Q * f.a[0],
               t.a[1] - P * la - Q * f.a[1],
               t.a[2] - P * la - Q * f.a[2]] };
}


/* The states a pool moves a pixel through: index 0 is the hour's own state (the pixel is not lit), STEPS is the
   lit one, and the ones between are the hour's blended toward it in equal parts. Built through `quantState` like
   every other state, so each has the ordering guarantee and byte-identical tables for identical numbers. */
export function bandStates(from, to) {
  const out = [from];
  for (let b = 1; b < STEPS; b++) {
    const w = b / STEPS, f = (p, q) => p + (q - p) * w;
    out.push(quantState(f(from.k, to.k), f(from.sat, to.sat),
                        [f(from.a[0], to.a[0]), f(from.a[1], to.a[1]), f(from.a[2], to.a[2])], f(from.exposure, to.exposure)));
  }
  out.push(to);
  return out;
}

/* The coefficients that take a pixel rendered in band `a` to band `b`, for every pair: STEPS+1 squared little
   affine maps, which is what lets a live pool light a pixel a static one has already half lit without lighting it
   twice. */
export function coefTable(states) {
  const t = [];
  for (let a = 0; a <= STEPS; a++) { t.push([]); for (let b = 0; b <= STEPS; b++) t[a].push(a === b ? null : relightCoef(states[a], states[b])); }
  return t;
}
