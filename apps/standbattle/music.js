/* The arena's music: which tune, and how much of the band. The tunes are in score.js (seven of them, thirty-two bars each: tunes_a.js, tunes_b.js), the choosing is the shared
   director's (apps/director.js), and the band is a number the scenes hand in: the level, 0 explore (the floor of the tune), 1 combat (the band), 2 tension (the last round, a boss).

   WHICH TUNE depends on where you are: the menus have ARENA LIGHTS, the fighter select has CHOOSE, the boss has KILLER QUEEN, and a fight has the tune of its own stage first (the
   alley, the street, the park and the store each have one) and then the other three in turn: a tune is heard through twice before another may follow it, the next starts on the
   downbeat after the last bar, and nothing is cut in the middle of a phrase. The old score was one eight-bar loop for everything.

   `musicStart(studio)`, `musicSet(level, place)`, `musicStep()` every frame, `musicStop()`. It plays on the studio's 'standbattle' channel, so the MUS knob and the taskbar
   mixer's STAND BATTLE slider set how loud. */
import { createDirector } from '../director.js';
import { song, layersFor, poolFor, passSecs, IDS } from './score.js';

export const GLIDE = 0.9;                    /* seconds a layer takes to come in or go out as the fight changes */
export const MIN_HEARD = 100;                /* seconds a tune is heard through before another may follow it */
export const loopsFor = id => Math.max(1, Math.ceil(MIN_HEARD / passSecs(id)));
export const PLACES = ['menu', 'select', 'alley', 'street', 'park', 'store', 'boss'];

export function createSbMusic(A) {
  const S = { level: 0, place: 'menu', running: false };
  const Song = createDirector({
    channel: 'standbattle', studio: A.studio, playing: () => S.running && !!(A.studio && A.studio()),
    score: song, pool: () => poolFor(S.place), layers: () => layersFor(S.level), minLoops: loopsFor, glide: GLIDE, preferFirst: true
  });
  return {
    Song, state: S,
    start() { if (S.running) return; S.running = true; Song.sync(); },
    stop() { S.running = false; Song.stop(); },
    /* the scenes say where they are and how hard it is; either may be left out (a fight says the level every frame and the place once) */
    set(level, place) {
      if (place != null && PLACES.indexOf(place) >= 0) S.place = place;
      if (level != null) S.level = level;
      if (S.running) { Song.sync(); Song.layers(); }
    },
    step() { if (S.running) Song.rotStep(); }
  };
}

let studio = null, M = null;
export function musicStart(St) {
  if (M || !St || !St.deck) return;
  studio = St; M = createSbMusic({ studio: () => studio });
  M.start();
}
export const musicSet = (level, place) => { if (M) M.set(level, place); };
export const musicSetIntensity = level => musicSet(level);
export const musicStep = () => { if (M) M.step(); };
export function musicStop() { if (M) { M.stop(); M = null; } studio = null; }
export { IDS };
