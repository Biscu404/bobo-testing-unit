/* The arena's music: the score (score.js) played on the game's own channel of the studio, with
   `setIntensity` switching its layers while it runs: 0 explore, 1 combat, 2 tension. The MUS
   knob and the taskbar mixer's STAND BATTLE slider set how loud. */
import { song, layersFor } from './score.js';

let studio = null, level = 0, running = false;

export function musicStart(S) {
  if (running || !S || !S.deck) return;
  studio = S; running = true;
  S.deck('standbattle').play(song(S.lang), { fade: 0.5, layers: layersFor(level) }).catch(() => {});
}
export function musicSetIntensity(l) {
  level = l;
  if (running && studio) studio.deck('standbattle').layers(layersFor(level));
}
export function musicStop() {
  running = false;
  if (studio) studio.deck('standbattle').stop(0.5);
}
