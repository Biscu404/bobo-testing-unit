/* Bekkedal's soundtrack: which tune, and when it changes.
 *
 * The tunes themselves are in `score.js`, written for the studio's real instruments (flute,
 * violin, nylon guitar, harp, strings, cello, an upright bass); this is only the choosing.
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

export const MIN_LOOPS = 2;                /* heard through this many times before a change for its own sake */
export const PREP = 14;                    /* seconds before the end of a pass that the next tune is arranged */
export const URGENT_REST = 20;             /* a change of place waits for the end of the pass if it is nearer than this */

export function createSongs(A) {
  const studio = () => { const S = A.studio && A.studio(); return S && S.deck ? S : null; };
  const deck = () => { const S = studio(); return S ? S.deck('bekkedal') : null; };
  const Song = {
    on: false, cur: 'dag', loading: null, quiet: null,
    heard: 0, lastBeat: 0, queued: null, entry: 0,
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
    /* the tune that follows `cur` in this place's pool, in order; a place that has only one goes on with it */
    successor() {
      const p = this.pool(), i = p.indexOf(this.cur);
      return p[(i + 1) % p.length];
    },
    /* a way of asking for the next tune from the outside (waking up, an ending closing): a change on a bar line, now */
    pickNext(force) {
      const p = this.pool();
      const next = p.indexOf(this.cur) < 0 ? p[0] : this.successor();
      if (next === this.cur && !force) return;
      this.cur = next;
      if (this.on) this.play('now');
    },
    /* Bring `cur` in. `how`: 'start' (nothing is playing: fade in), 'segue' (at the end of the pass), 'now' (crossfade from the next bar). */
    async play(how) {
      const S = studio(), D = deck(), id = this.cur;
      if (!S || !D || this.loading === id) return;
      this.loading = id;
      const quiet = !!NIGHT[id] && A.context() === 'night';
      const layers = { lead: !quiet, arp: !quiet };
      let p = null;
      try {
        const sg = scoreOf(S.lang, id);
        p = (how === 'start' || !D.playing) ? await D.play(sg, { fade: 1.8, layers })
          : await D.segue(sg, { layers, now: how === 'now', fade: 1.4 });
      } catch (e) { p = null; }
      if (this.loading === id) this.loading = null;
      if (p) { this.quiet = quiet; this.heard = 0; this.lastBeat = 0; this.queued = null; this.layers(); }
      else this.queued = null;
    },
    /* after dark the lead and the arpeggios drop out of the two tunes that do without them */
    layers() {
      const D = deck();
      if (!D) return;
      const quiet = !!NIGHT[this.cur] && A.context() === 'night';
      if (quiet === this.quiet) return;
      this.quiet = quiet;
      D.layers({ lead: !quiet, arp: !quiet });
    },
    /* called every frame: count the passes, and arrange the change when it is due */
    rotStep() {
      if (!this.on || this.loading) return;
      const D = deck(), p = D && D.player;
      if (!p) return;
      const b = p.beat();
      if (b < this.lastBeat - 1) this.heard++;                 /* the pass came round */
      this.lastBeat = b;
      if (this.queued) return;
      const pool = this.pool(), rest = p.remaining();
      /* the place changed under the music: this tune does not belong here */
      if (pool.indexOf(this.cur) < 0) {
        this.queued = true;
        this.cur = pool[0];
        this.play(rest > URGENT_REST ? 'now' : 'segue');
        return;
      }
      /* it has been heard through enough: arrange the next, a little before this one ends */
      if (this.heard >= MIN_LOOPS - 1 && rest < PREP && rest > 1.2 && pool.length > 1) {
        this.queued = true;
        this.cur = this.successor();
        this.play('segue');
      }
    },
    sync() {
      if (!A.playing()) { this.stop(); return; }
      if (!this.on) {
        this.on = true;
        const p = this.pool();
        if (p.indexOf(this.cur) < 0) this.cur = p[0];           /* the pool for where you are standing, not always dag */
        this.play('start');
        return;
      }
      this.layers();
    },
    stop() {
      if (!this.on) return;
      this.on = false; this.loading = null; this.quiet = null; this.queued = null; this.heard = 0; this.lastBeat = 0;
      const D = deck();
      if (D) D.stop(0.7);
    },
    hardStop() { this.stop(); }
  };
  return Song;
}
