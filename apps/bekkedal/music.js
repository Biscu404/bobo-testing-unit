/* Bekkedal's soundtrack: which tune, and when it changes.
 *
 * The tunes themselves are in `score.js`, written for the studio's real instruments (flute,
 * violin, nylon guitar, harp, strings, cello, an upright bass); this is only the choosing, and
 * the mechanics of it (heard through, then a segue on the downbeat) are `apps/director.js`, which
 * Magen's music uses as well. What is Bekkedal's own is which pool, and what the dark does to a tune.
 *
 * The valley used to change tune on a timer, at a moment that had nothing to do with the music:
 * somewhere between seventy and a hundred and fifteen seconds in, from whichever bar it had got to,
 * into whichever of two tunes a dice roll said, in a different key and at a different speed, over a
 * crossfade that put the two on top of each other. It sounded like exactly that. Now:
 *
 *   - a tune is heard through at least twice before another may follow it (MIN_LOOPS), so it is
 *     never cut in the middle of a phrase to make room;
 *   - when it has been, the next is chosen a little before the end of the pass and loaded (PREP),
 *     and starts on the very next sample after the last bar of the old one (deck.segue), which
 *     lets the old one ring out underneath. No two tunes ever sound at once except as a tail;
 *   - the next tune is not random: the pool is walked in order, so the valley's music has a shape
 *     (dag, then folkedans in the square, then dag again) instead of a scatter;
 *   - the place changing under you (down into the mine, up onto the plateau, the dark coming in) is
 *     the one thing that may not wait for the end of the pass, and it takes a short crossfade that
 *     begins on a bar line, never in the middle of one, unless the pass is nearly over anyway;
 *   - the first tune after a load is drawn from the pool for where you are standing, not always `dag`.
 *
 * `createSongs(A)` wants:
 *   A.studio()   the studio (ctx.studio), for its deck and its song language
 *   A.playing()  whether it is allowed to make a sound at all
 *   A.context()  'mine' | 'high' | 'night' | 'townday' | 'day' — which pool
 *                to draw the next track from
 *   A.season()   a BEK_SEASONS id — nudges that pool toward the sparser
 *                tracks in winter
 *
 * Nobody has a voice actor here either; the speech blips stay in index.js
 * with the rest of the SFX, because they are per-line and not per-scene.
 */
import { NIGHT, song as scoreOf } from './score.js';
import { createDirector, PREP, URGENT_REST } from '../director.js';

export const MIN_LOOPS = 2;                /* heard through this many times before a change for its own sake */
export { PREP, URGENT_REST };

export function createSongs(A) {
  const Song = createDirector({
    channel: 'bekkedal', first: 'dag', minLoops: MIN_LOOPS,
    studio: A.studio, playing: A.playing, score: scoreOf,
    pool() {
      const ctx = A.context(), winter = A.season() === 'vinter';
      switch (ctx) {
        case 'mine': return ['gruva'];
        case 'high': return winter ? ['vidda', 'kveld'] : ['vidda', 'dag'];
        case 'night': return ['kveld', 'gruva'];
        case 'townday': return winter ? ['folkedans', 'kveld'] : ['folkedans', 'dag'];
        default: return winter ? ['dag', 'kveld'] : ['dag', 'folkedans'];
      }
    },
    /* after dark the lead and the arpeggios drop out of the two tunes that do without them */
    layers(id) {
      const quiet = !!NIGHT[id] && A.context() === 'night';
      return { lead: !quiet, arp: !quiet };
    }
  });
  return Song;
}
