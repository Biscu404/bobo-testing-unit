/* Fifteen ways of pouring and drinking, by how drunk the hand is. A style is the numbers that make one measure move: how long the whole of it takes (never less than sober),
   how much of it is spent in lurches, how far the hand wanders sideways, how the bottle rocks in it, how the glass shakes, whether it overshoots, whether it has second
   thoughts (stops half way, takes it back, starts again), whether the bottle slips, whether the hand goes round in circles, and how long it stares at the thing before it moves.
   Pure arithmetic: nothing here knows about the canvas, so Node holds all of it (styles_check.js). pour.js and drink.js read the style once per measure and ask the
   functions below where the hand is. The same measure drawn twice moves the same way (the seed is the measure's number).

   style 0 is the sober hand and is exactly what the game was before: even, straight, 3.5 seconds a drink. The other fourteen only ever add. */
import { clamp } from './physics.js';

export const STYLE_COUNT = 15;

/* pace     times as long as sober, at least 1             lurch   how much of the move is lurches (physics.lurch), 0..0.9
   sway     px the hand wanders sideways                   rock    radians the bottle (or glass) rocks in the hand
   shake    px the glass trembles when it is lifted        over    how far a move overshoots (a fraction of the way)
   slip     how wrong the tipping is, in radians           orbit   px radius of the hand going round in circles
   lead     seconds spent looking at it before it moves    tail    seconds of a heavy landing after it
   thoughts [{ at, hold, back }]: stop `at` of the way, wait `hold` seconds, take back `back` of the way, then go on
   fumble   { at, depth }: the bottle slips down `depth` pixels at `at` of the carry                                                     */
export const STYLES = [
  { id: 'steady',    name: 'STEADY',          pace: 1,    lurch: 0,    sway: 0,  rock: 0,    shake: 0,   over: 0,    slip: 0,    orbit: 0,   lead: 0,    tail: 0,    thoughts: [], fumble: null },
  { id: 'easy',      name: 'EASY',            pace: 1,    lurch: 0.05, sway: 2,  rock: 0.01, shake: 0,   over: 0,    slip: 0,    orbit: 0,   lead: 0,    tail: 0,    thoughts: [], fumble: null },
  { id: 'cheerful',  name: 'CHEERFUL',        pace: 1.02, lurch: 0.1,  sway: 4,  rock: 0.025, shake: 0.3, over: 0,   slip: 0.04, orbit: 0,   lead: 0.05, tail: 0,    thoughts: [], fumble: null },
  { id: 'loose',     name: 'LOOSE WRIST',     pace: 1.04, lurch: 0.16, sway: 7,  rock: 0.05, shake: 0.6, over: 0.02, slip: 0.08, orbit: 0,   lead: 0.1,  tail: 0,    thoughts: [], fumble: null },
  { id: 'generous',  name: 'GENEROUS',        pace: 1.06, lurch: 0.2,  sway: 9,  rock: 0.07, shake: 0.9, over: 0.04, slip: 0.12, orbit: 2,   lead: 0.15, tail: 0.05, thoughts: [], fumble: null },
  { id: 'showy',     name: 'SHOWING OFF',     pace: 1.08, lurch: 0.26, sway: 12, rock: 0.1,  shake: 1.2, over: 0.06, slip: 0.16, orbit: 6,   lead: 0.2,  tail: 0.05, thoughts: [], fumble: null },
  { id: 'wander',    name: 'WANDERING',       pace: 1.08, lurch: 0.3,  sway: 22, rock: 0.12, shake: 1.5, over: 0.06, slip: 0.22, orbit: 4,   lead: 0.25, tail: 0.1,  thoughts: [{ at: 0.55, hold: 0.25, back: 0.06 }], fumble: null },
  { id: 'thoughts',  name: 'SECOND THOUGHTS', pace: 1.1,  lurch: 0.3,  sway: 16, rock: 0.12, shake: 1.8, over: 0.05, slip: 0.25, orbit: 3,   lead: 0.35, tail: 0.1,  thoughts: [{ at: 0.42, hold: 0.45, back: 0.16 }], fumble: null },
  { id: 'overshoot', name: 'OVERSHOOTING',    pace: 1.1,  lurch: 0.34, sway: 18, rock: 0.14, shake: 2,   over: 0.16, slip: 0.3,  orbit: 3,   lead: 0.3,  tail: 0.15, thoughts: [{ at: 0.7, hold: 0.2, back: 0.06 }], fumble: null },
  { id: 'fumble',    name: 'FUMBLING',        pace: 1.12, lurch: 0.4,  sway: 20, rock: 0.16, shake: 2.4, over: 0.1,  slip: 0.34, orbit: 3,   lead: 0.3,  tail: 0.15, thoughts: [{ at: 0.5, hold: 0.3, back: 0.1 }], fumble: { at: 0.35, depth: 30 } },
  { id: 'lurch',     name: 'LURCHING',        pace: 1.12, lurch: 0.62, sway: 24, rock: 0.18, shake: 2.8, over: 0.12, slip: 0.4,  orbit: 3,   lead: 0.3,  tail: 0.2,  thoughts: [{ at: 0.3, hold: 0.2, back: 0.06 }, { at: 0.66, hold: 0.25, back: 0.08 }], fumble: null },
  { id: 'slump',     name: 'SLUMPED',         pace: 1.15, lurch: 0.5,  sway: 16, rock: 0.2,  shake: 3,   over: 0.1,  slip: 0.46, orbit: 4,   lead: 0.5,  tail: 0.35, thoughts: [{ at: 0.4, hold: 0.45, back: 0.14 }], fumble: null },
  { id: 'spin',      name: 'SPINNING',        pace: 1.16, lurch: 0.55, sway: 26, rock: 0.22, shake: 3.4, over: 0.14, slip: 0.5,  orbit: 10,  lead: 0.35, tail: 0.25, thoughts: [{ at: 0.5, hold: 0.3, back: 0.1 }], fumble: null },
  { id: 'drift',     name: 'DRIFTING OFF',    pace: 1.2,  lurch: 0.7,  sway: 22, rock: 0.24, shake: 3.6, over: 0.12, slip: 0.55, orbit: 6,   lead: 0.7,  tail: 0.4,  thoughts: [{ at: 0.35, hold: 0.6, back: 0.1 }, { at: 0.75, hold: 0.5, back: 0.14 }], fumble: { at: 0.6, depth: 34 } },
  { id: 'last',      name: 'THE LAST ONE',    pace: 1.22, lurch: 0.8,  sway: 28, rock: 0.28, shake: 4,   over: 0.2,  slip: 0.6,  orbit: 8,   lead: 0.9,  tail: 0.5,  thoughts: [{ at: 0.3, hold: 0.5, back: 0.2 }, { at: 0.6, hold: 0.55, back: 0.15 }, { at: 0.85, hold: 0.3, back: 0.08 }], fumble: { at: 0.5, depth: 40 } }
];

/* which of the fifteen a hand is, from how drunk it is (kernel/drunk.js `level`, 0..1) */
export const styleIndex = level => clamp(Math.floor((+level || 0) * STYLE_COUNT), 0, STYLE_COUNT - 1);
export const styleOf = level => STYLES[styleIndex(level)];

/* The way a move of `len` seconds (sober) goes by the clock for this style: key frames of [seconds, how far along the way (0..1)]. Time spent looking at it first (`lead`), the way at
   `pace` times as long, each second thought (go to it, wait, take it back faster than it was made, wait a moment longer, set off again), and the landing after. */
const BACK = 2.4;                                         /* a thought is taken back this much faster than the way was made */
export function schedule(style, len, hold = 1) {
  const v = 1 / (len * style.pace);                       /* progress a second */
  let t = style.lead * hold, p = 0;
  const kf = [[0, 0]];
  if (t > 0) kf.push([t, 0]);
  const go = (q, speed) => { t += Math.abs(q - p) / (v * speed); p = q; kf.push([t, p]); };
  style.thoughts.forEach(th => { go(th.at, 1); t += th.hold * hold; kf.push([t, p]); go(Math.max(0, th.at - th.back), BACK); t += th.hold * hold * 0.3; kf.push([t, p]); });
  go(1, 1);
  if (style.tail > 0) { t += style.tail * hold; kf.push([t, 1]); }
  return { kf, T: t };
}
/* how far along the way after `tr` seconds (0..1; it goes back a little at a second thought) */
export function progress(sch, tr) {
  const kf = sch.kf;
  if (tr <= 0) return 0;
  if (tr >= sch.T) return 1;
  for (let i = 1; i < kf.length; i++) if (tr <= kf[i][0]) { const a = kf[i - 1], b = kf[i]; return b[0] === a[0] ? b[1] : a[1] + (b[1] - a[1]) * (tr - a[0]) / (b[0] - a[0]); }
  return 1;
}

/* the hand's wandering: a slow drift of three sines that never quite repeat, different for every measure (`seed`), in -1..1 (the same as physics.drift) */
const drift = (t, seed) => Math.sin(t * 2.1 + seed * 1.7) * 0.55 + Math.sin(t * 3.7 + seed * 4.1) * 0.3 + Math.sin(t * 6.3 + seed * 0.9) * 0.15;
/* sideways px and rocking radians of the hand holding the bottle (or the glass) at time t */
export const hand = (st, t, seed) => ({ x: drift(t, seed) * st.sway, a: drift(t * 1.3 + 2, seed + 7) * st.rock });
/* the hand going round: where it is off the straight line, px */
export const circle = (st, t, seed) => (st.orbit ? { x: Math.cos(t * 3.1 + seed) * st.orbit, y: Math.sin(t * 3.1 + seed) * st.orbit * 0.7 } : { x: 0, y: 0 });
/* a bump from nothing to one and back to nothing as z goes 0..1 (a slip, an overshoot) */
export const bump = z => (z <= 0 || z >= 1 ? 0 : Math.sin(Math.PI * z));
/* how far the bottle has slipped down at `u` of the way (px) */
export const slipDown = (st, u) => (st.fumble ? st.fumble.depth * bump((u - st.fumble.at) / 0.2) : 0);
/* the tipping of the glass that is wrong by how much, at time t */
export const tipError = (st, t, seed) => drift(t * 0.8 + 3, seed + 5) * st.slip;
/* how far a lift or a carry runs on past where it should stop, as a fraction of the way: a swing out and back */
export const overshoot = (st, u) => st.over * bump((u - 0.35) / 0.65);
