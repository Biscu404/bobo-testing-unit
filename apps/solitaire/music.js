/* Solitaire's soundtrack: which tune, and how much of the band.
 *
 * The tunes are in `score.js` (sixteen bars each, a core and two layers). This is the choosing, as it is for Magen: the director (apps/director.js)
 * walks the rotation, each tune heard through for about a minute and a half and the next one starting on the downbeat after the last bar; and the
 * band is a number that moves smoothly: `energy`, 0 to 2, which the cards that are home pull toward (HOME), and which comes back down slowly when a new
 * deal puts them all back. The two layers are `deck.levels` of that one number, so the vibes and the answering trumpet arrive as the first aces are
 * played home and the kit and the sax as the pile grows. Nothing a card does restarts, ducks or re-cues the tune that is playing.
 *
 * `createSolitaireMusic(A)` wants A.studio() (ctx.studio) and A.playing() (the screen is on, MUS is up, the window is alive), and hands back the
 * director's object (`sync`, `rotStep`...) with `home(n)` to say how many cards are home, `won()`, and `step(dt)` every frame.
 */
import { createDirector } from '../director.js';
import { song as scoreOf, ORDER, LAYERS, TUNES, BARS } from './score.js';

/* the cards home at which each layer is fully in: a few aces bring the first, a good pile the second */
export const HOME = [[0, 0], [4, 0], [12, 1], [24, 1], [40, 2], [52, 2]];
export const RISE = 1.2, FALL = 4.5;       /* seconds: how quickly the band leans in, and how slowly it sits back */
export const GLIDE = 0.8;                  /* seconds a layer takes to come to a new level on the desk */
const PUSH = 0.2, EPS = 0.015;

/* the heat n cards home have earned: linear between the marks of HOME */
export function heatOf(n) {
  if (!(n > 0)) return 0;
  for (let i = 1; i < HOME.length; i++) if (n <= HOME[i][0]) { const a = HOME[i - 1], b = HOME[i]; return a[1] + (b[1] - a[1]) * (n - a[0]) / (b[0] - a[0]); }
  return HOME[HOME.length - 1][1];
}
/* how far each layer is in, 0 to 1, for an energy of 0 to 2: the second starts as the first is full */
export const levelsOf = e => { const o = {}; LAYERS.forEach((l, i) => { o[l] = Math.max(0, Math.min(1, e - i)); }); return o; };
export const lean = (e, target, dt) => e + (target - e) * (1 - Math.exp(-dt / (target > e ? RISE : FALL)));
export const passSecs = id => BARS * TUNES[id].beats * 60 / TUNES[id].bpm;
export const MIN_HEARD = 85;
export const loopsFor = id => Math.max(2, Math.ceil(MIN_HEARD / passSecs(id)));

export function createSolitaireMusic(A) {
  let energy = 0, target = 0, sent = { h1: 0, h2: 0 }, pushT = 0;
  const Song = createDirector({
    channel: 'solitaire', first: ORDER[0], minLoops: loopsFor,
    studio: A.studio, playing: A.playing, score: scoreOf,
    pool: () => ORDER,
    levels: () => { const l = levelsOf(energy); sent = Object.assign({}, l); return l; },
    onStart: () => { sent = { h1: -1, h2: -1 }; pushT = 0; }
  });
  const deck = () => { const S = A.studio && A.studio(); return S && S.deck ? S.deck('solitaire') : null; };
  Song.home = n => { target = heatOf(n); };
  Song.won = () => { target = 2; };
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
