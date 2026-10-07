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
 *   - a tune is heard through at least three to five times before another may follow it (LOOPS), so
 *     it is never cut in the middle of a phrase to make room and a change is an event;
 *   - when it has been, the next is chosen a little before the end of the pass and loaded (PREP),
 *     and starts on the very next sample after the last bar of the old one (deck.segue), which
 *     lets the old one ring out underneath. No two tunes ever sound at once except as a tail;
 *   - the next tune is not random: the pool is walked in order, so the valley's music has a shape
 *     (dag, then folkedans in the square, then dag again) instead of a scatter;
 *   - the place changing under you is not, in itself, a reason to change tune: the tune you were hearing
 *     is one of those that may go on here, and the place only decides which follows it. Only the mine,
 *     which has a mood of its own, takes the music away, and it takes a six-second crossfade that
 *     begins on a bar line, never in the middle of one, unless the pass is nearly over anyway;
 *   - a natural change of tune is laid over the last seven seconds of the old one (OVERLAP), the new
 *     one swelling in as the old goes out, rather than the one stopping where the other begins; and
 *     the lead and the arpeggios leave at dusk over six seconds (GLIDE) instead of being switched off;
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

/* How many times a tune is heard through before another may follow it. A pass is eight bars: half a minute for the day's
   tune and most of a minute for the slow ones, so these are two to three minutes a tune, which is long enough that a change
   of tune is an event of its own and not a feature of walking. It was two passes, which was a minute. */
export const LOOPS = { dag: 4, folkedans: 5, kveld: 3, gruva: 3, vidda: 4 };
export const MIN_LOOPS = 4;                /* the figure for a tune not listed above */
export const OVERLAP = 7;                  /* seconds a change of tune is laid over the end of the old one */
export const GLIDE = 6;                    /* seconds the lead and the arpeggios take to leave at dusk, or to come back */
export { PREP, URGENT_REST };

export function createSongs(A) {
  const Song = createDirector({
    channel: 'bekkedal', first: 'dag', minLoops: id => LOOPS[id] || MIN_LOOPS,
    studio: A.studio, playing: A.playing, score: scoreOf,
    /* A place changing under you is not a reason to change the tune. Only somewhere with a mood of its own (the mine) takes
       the music away from the tune that was playing; everywhere else, the tune you were hearing is one of the tunes that
       may go on being heard, and what the place decides is which one *follows* it, at the end of a pass. So walking into the
       square, up onto the plateau, or the evening coming in changes the music at the next natural change and not at the
       step that crossed the line. The order of each list is the order they follow each other in. */
    pool() {
      const ctx = A.context(), winter = A.season() === 'vinter';
      switch (ctx) {
        case 'mine': return ['gruva'];
        case 'high': return winter ? ['vidda', 'kveld', 'dag'] : ['vidda', 'dag', 'folkedans'];
        case 'night': return ['kveld', 'gruva', 'dag'];
        case 'townday': return winter ? ['folkedans', 'kveld', 'dag'] : ['folkedans', 'dag'];
        default: return winter ? ['dag', 'kveld', 'folkedans'] : ['dag', 'folkedans'];
      }
    },
    /* what may go on being heard where you are: everything but the mine's own tune, which belongs to the mine (and to the night) */
    allow() {
      const ctx = A.context();
      return ctx === 'mine' ? ['gruva'] : ctx === 'night' ? ['kveld', 'gruva', 'dag', 'folkedans', 'vidda'] : ['dag', 'folkedans', 'kveld', 'vidda'];
    },
    /* after dark the lead and the arpeggios drop out of the two tunes that do without them: slowly, over GLIDE seconds */
    layers(id) {
      const quiet = !!NIGHT[id] && A.context() === 'night';
      return { lead: !quiet, arp: !quiet };
    },
    glide: GLIDE, overlap: OVERLAP, segueFade: 6, fade: 4, preferFirst: true
  });
  return Song;
}
