/* Magen's soundtrack: which tune, how much of the band, and the seams between.
 *
 * The tunes are in `score.js` (sixteen bars each, a core and three layers, for the studio's real instruments).
 * This is the choosing, and it is two separate jobs that used to be one:
 *
 *  WHICH TUNE is `apps/director.js`'s: the rotation in ORDER, each tune heard through three or four times (about a minute and a
 *  half) and then the next one starting on the downbeat after the last bar of the old one. Shabbat holds its own tune (`want`).
 *
 *  HOW MUCH OF THE BAND is a number that moves smoothly: `energy`, 0 to 3, which the click chain pulls toward the heat it
 *  has earned (CHAIN) and which comes back down slowly when the chain breaks. The three layers are `deck.levels` of that
 *  one number, so holding the button down brings the fiddle in, then the kit, then the room, one swell after another, and
 *  letting go lets them leave the same way. It used to restart the bar on every step of the chain: the old tune was ducked, killed
 *  and begun again from the middle of a bar, which is exactly the splice it sounded like.
 *
 * `createMagenMusic(A)` wants:
 *   A.studio()    the studio (the same one `ctx.studio` is)
 *   A.playing()   whether it is allowed to make a sound at all (the screen is on, MUS is up, the window is alive)
 * and hands back the director's own object (`sync`, `rotStep`, `want`, `stop`...) with two more: `chain(combo)` to say how long a
 * chain is, and `step(dt)` every frame.
 */
import { createDirector } from '../director.js';
import { song as scoreOf, ORDER, LAYERS, TUNES, BARS } from './score.js';

/* the chain length at which each layer is fully in: a short chain brings the fiddle, a long one the kit, a very long one the room */
export const CHAIN = [[0, 0], [8, 1], [22, 2], [40, 3]];
export const RISE = 0.9, FALL = 3.6;      /* seconds: how quickly the band leans in, and how slowly it sits back */
export const GLIDE = 0.55;                /* seconds a layer takes to come to a new level on the desk */
const PUSH = 0.18, EPS = 0.012;           /* how often a changed level is sent to the desk, and how small a change is not worth it */

/* the heat a chain has earned: linear between the marks of CHAIN, 3 at the top */
export function heatOf(combo) {
  if (!(combo > 0)) return 0;
  for (let i = 1; i < CHAIN.length; i++) if (combo <= CHAIN[i][0]) { const a = CHAIN[i - 1], b = CHAIN[i]; return a[1] + (b[1] - a[1]) * (combo - a[0]) / (b[0] - a[0]); }
  return CHAIN[CHAIN.length - 1][1];
}
/* how far each layer is in, 0 to 1, for an energy of 0 to 3: the next one starts as the last is full, not before */
export const levelsOf = e => {
  const o = {};
  LAYERS.forEach((l, i) => { o[l] = Math.max(0, Math.min(1, e - i)); });
  return o;
};
/* one frame of the band leaning in (fast) or sitting back (slow) toward the heat */
export const lean = (e, target, dt) => e + (target - e) * (1 - Math.exp(-dt / (target > e ? RISE : FALL)));
/* seconds one pass of a tune lasts */
export const passSecs = id => BARS * TUNES[id].beats * 60 / TUNES[id].bpm;
/* a tune is heard for about a minute and a half before the next: as many passes as that takes */
export const MIN_HEARD = 85;
export const loopsFor = id => Math.max(2, Math.ceil(MIN_HEARD / passSecs(id)));

export function createMagenMusic(A) {
  let energy = 0, target = 0, sent = { h1: 0, h2: 0, h3: 0 }, pushT = 0;
  const Song = createDirector({
    channel: 'magen', first: ORDER[0], minLoops: loopsFor,
    studio: A.studio, playing: A.playing, score: scoreOf,
    pool: () => ORDER,
    levels: () => { const l = levelsOf(energy); sent = Object.assign({}, l); return l; },
    onStart: () => { sent = { h1: -1, h2: -1, h3: -1 }; pushT = 0; }       /* the levels went out while it was loading: say them again once it plays */
  });
  const deck = () => { const S = A.studio && A.studio(); return S && S.deck ? S.deck('magen') : null; };
  Song.chain = combo => { target = Song.forced ? 0 : heatOf(combo); };
  Song.step = dt => {
    Song.rotStep();
    energy = lean(energy, target, dt);
    if (Math.abs(energy - target) < 0.002) energy = target;
    pushT -= dt;
    if (pushT > 0 || !Song.on) return;
    const l = levelsOf(energy);
    const moved = LAYERS.some(k => Math.abs(l[k] - sent[k]) >= EPS), residue = energy === target && LAYERS.some(k => l[k] !== sent[k]);
    if (!moved && !residue) return;
    pushT = PUSH; sent = Object.assign({}, l);
    const D = deck();
    if (D) D.levels(l, { glide: GLIDE });
  };
  Object.defineProperty(Song, 'energy', { get: () => energy });
  return Song;
}
