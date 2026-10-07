/* Bekkedal — the night, and what it costs to ignore it.
 *
 * Pure: a function of the minute and nothing else, the way `seasons.js` is. The clock runs 06:00 to 02:00 (BEK_DAY_END is
 * 26 * 60). Bed is allowed whenever you like, and is the only way to start a day properly. Stay up and the night starts to
 * charge for it:
 *
 *   from 24:00  tired     every swing and step of work costs a point more (`lateExtra`), a warning, and the edges of the
 *                         picture begin to close in
 *   from 25:00  worn out  two points more, and the edges close further
 *   at 02:00    you fall asleep where you stand: on the ground, outdoors, in your clothes. You wake at 08:00 (two hours
 *               of the day are gone), with two fifths of the bar, and a magpie has been in your pockets.
 *
 * A bed taken before midnight gives the whole bar; one taken after it, four fifths ("a short night"). The numbers are in
 * `NAP`/`WAKE`; `sleep_check.js` holds them, and `act2_check.js`'s balance pass reads none of them on purpose: a player who
 * goes to bed at a sensible hour (the policies it simulates) never meets any of this.
 *
 * The sleep itself is a short scene (`napPhase`): the picture closes to black through the ordered dither (no alpha), holds
 * on the sleeper and the Zs while the night passes and the day turns over, and opens again.
 */
import { BEK_DAY_START } from './data.js';

export const MIDNIGHT = 24 * 60, ONE = 25 * 60;
export const NAP = { out: 1.0, hold: 1.2, in: 1.3 };
export const NAP_TOTAL = NAP.out + NAP.hold + NAP.in;
export const WAKE = { rested: 1, late: 0.8, ground: 0.4 };
export const GROUND_WAKE_MIN = BEK_DAY_START + 2 * 60;

export const lateLevel = min => min >= ONE ? 2 : min >= MIDNIGHT ? 1 : 0;
/* extra energy a point of work costs at this hour */
export const lateExtra = lateLevel;

/* a warning the first time each hour is reached, never twice in a night */
export const WARN = [
  { at: 23 * 60, key: 'w23', no: 'DET BLIR SENT. TENK PÅ SENGEN.', en: 'IT IS GETTING LATE. THINK OF YOUR BED.' },
  { at: MIDNIGHT, key: 'w24', no: 'MIDNATT. ALT KOSTER MER NÅ.', en: 'MIDNIGHT. EVERYTHING COSTS MORE NOW.' },
  { at: ONE, key: 'w25', no: 'DU SOVNER STÅENDE. SENGEN, NÅ.', en: 'YOU ARE SWAYING ON YOUR FEET. BED. NOW.' }
];
export const warningFor = (min, seen) => WARN.filter(w => min >= w.at && !seen[w.key]).slice(-1)[0] || null;

/* what a night comes to: the share of the bar you wake with, the minute you wake at, and what it was */
export function nightOf(min, passed) {
  if (passed) return { frac: WAKE.ground, wakeMin: GROUND_WAKE_MIN, kind: 'ground' };
  if (min >= MIDNIGHT) return { frac: WAKE.late, wakeMin: BEK_DAY_START, kind: 'late' };
  return { frac: WAKE.rested, wakeMin: BEK_DAY_START, kind: 'rested' };
}
/* what the magpie takes: a twelfth of the purse, never less than 25 kr (if you have it) nor more than 600 */
export const pilfer = kr => kr <= 0 ? 0 : Math.min(kr, Math.max(25, Math.min(600, Math.round(kr / 12))));

/* the scene by the clock: which phase, and how closed the picture is, 0..16 of the dither */
export function napPhase(t) {
  if (t < NAP.out) return { phase: 'out', cover: Math.round(16 * Math.min(1, t / NAP.out)) };
  if (t < NAP.out + NAP.hold) return { phase: 'hold', cover: 16 };
  if (t < NAP_TOTAL) return { phase: 'in', cover: Math.round(16 * (1 - (t - NAP.out - NAP.hold) / NAP.in)) };
  return { phase: 'done', cover: 0 };
}
/* how many Zs are floating over a sleeper `t` seconds in */
export const zCount = t => Math.min(3, 1 + Math.floor(t / 0.55));

/* the closing-in of the edges when tired: strengths of the four bands from the rim inward (of 16), or null */
export function vignette(min) {
  const l = lateLevel(min);
  return l === 0 ? null : l === 1 ? [4, 2, 1] : [8, 5, 3, 1];
}
