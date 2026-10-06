/* Drinking a measure. The glass is lifted to a mouth, the rim is laid on the
   lip and the glass is tipped, further and further as it empties. As before,
   none of the liquid is scripted: it is poured into the turned tumbler like
   any other, so it slides to the low side of the rim and, once it is at the
   rim, runs over it -- into the mouth -- and each time a third of the glass has
   gone over, there is a swallow. */
import { GLS, LIPS } from './art.js';
import { rot } from './raster.js';
import { clamp, lerp, ease } from './physics.js';

const UP = GLS.oy - GLS.cy;
const GC = [GLS.rest[0], GLS.rest[1] - UP];
const RIMC = [GLS.rim[0][0], GLS.rim[0][1] + UP];            /* the rim's left corner, from the middle */
export const DRINK_LEN = 2.75;
export const glassRim = (C, a) => GLS.rim.map(p => { const r = rot(p[0], p[1] + UP, a); return [C[0] + r[0], C[1] + r[1]]; });
const centreFor = (rim, a) => { const r = rot(RIMC[0], RIMC[1], a); return [rim[0] - r[0], rim[1] - r[1]]; };
export const REST_RIM = [GC[0] + RIMC[0], GC[1] + RIMC[1]];

export function startDrink(S) {
  S.phase = 'drink'; S.t = 0; S.swallowed = 0; S.gulpAt = -9; S.gulps = 0; S.pending = 0;
  S.gls.hand = true;
}

export function drinkStep(S, dt, fx) {
  const G = S.gls;
  S.t += dt;
  const t = S.t;
  const a = t < 0.7 ? -0.12 * ease(t / 0.7)
    : t < 1.15 ? lerp(-0.12, -1.05, ease((t - 0.7) / 0.45))
    : t < 2.0 ? lerp(-1.05, -2.0, ease((t - 1.15) / 0.85))
    : lerp(-2.0, 0, ease((t - 2.0) / 0.75));
  const bob = (S.t - S.gulpAt) < 0.35 ? Math.sin((S.t - S.gulpAt) / 0.35 * Math.PI) * 2.2 : 0;
  let rim;
  if (t < 0.7) {
    const e = ease(t / 0.7);
    rim = [lerp(REST_RIM[0], LIPS.x + 1, e) - 16 * Math.sin(Math.PI * e), lerp(REST_RIM[1], LIPS.y + 1, e) - 26 * Math.sin(Math.PI * e)];
  } else if (t < 2.0) rim = [LIPS.x + 1 + bob * 0.4, LIPS.y + 1 + bob];
  else { const e = ease((t - 2.0) / 0.75); rim = [lerp(LIPS.x + 1, REST_RIM[0], e) - 12 * Math.sin(Math.PI * e), lerp(LIPS.y + 1, REST_RIM[1], e) - 22 * Math.sin(Math.PI * e)]; }
  G.a = a;
  G.c = centreFor(rim, a);
  S.face = {
    dy: -190 * (1 - ease(t / 0.55)) * (t < 2.0 ? 1 : 1) - (t > 2.25 ? 190 * ease((t - 2.25) / 0.5) : 0),
    mouth: clamp(ease((t - 0.45) / 0.25) * (1 - ease((t - 2.0) / 0.25)) * 0.8 + (S.t - S.gulpAt < 0.2 ? 0.3 : 0), 0, 1),
    eyes: t > 0.75 && t < 2.1 ? 1 : 0,
    gulp: S.t - S.gulpAt < 0.42 ? (S.t - S.gulpAt) / 0.42 : -1
  };
  /* a swallow for every third of the glass that goes over the rim */
  if (S.pending >= 0.25 * 0.8) {
    S.pending -= 0.25 * 0.8; S.gulps++; S.gulpAt = S.t; fx.sfx.gulp(S.gulps);
  }
  /* the glass, back on the table */
  if (t >= DRINK_LEN) {
    G.a = 0; G.c = GC.slice(); G.hand = false; S.face = null;
    return true;
  }
  return false;
}

export const glassRest = () => GC.slice();
