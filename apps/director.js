/* A music director: which tune a game is playing, and when it changes to another.
 *
 * A game's tunes are studio songs (see `scorekit.js`); this is only the choosing, and the one thing about choosing that
 * every game got wrong the first time: the moment. A change of tune has to land where the music itself lands, so
 *
 *   - a tune is heard through at least `minLoops` times before another may follow it, so it is never cut in the
 *     middle of a phrase to make room;
 *   - when it has been, the next is chosen a little before the end of the pass and loaded (`prep` seconds), and starts on
 *     the very next sample after the last bar of the old one (`deck.segue`), the old one ringing out underneath.
 *     No two tunes ever sound at once except as a tail;
 *   - the next tune is not random: the pool is walked in order, so a game's music has a shape instead of a scatter;
 *   - a change of place (down into the mine, a rest day beginning) is the one thing that may not wait for the end of the
 *     pass, and it takes a short crossfade that begins on a bar line, never in the middle of one, unless the pass is
 *     nearly over anyway (`urgentRest`);
 *   - the first tune after a load is drawn from the pool for where you are standing.
 *
 * `createDirector(A)` wants:
 *   A.studio()      the studio (ctx.studio), for its deck and its song language
 *   A.channel       the deck's channel ('bekkedal', 'magen'...)
 *   A.playing()     whether it is allowed to make a sound at all
 *   A.pool()        the ids that belong here and now, in the order they follow each other
 *   A.score(L, id)  the studio song for an id
 *   A.layers(id)    (optional) the layer switches to start a tune with and to keep it at: { lead: false, ... }
 *   A.levels(id)    (optional) the layer levels to start a tune at: { h1: 0.4, ... }
 *   A.minLoops      how many passes before a change for its own sake: a number, or a function of the tune
 *   A.onStart(id)   (optional) a tune has begun: whatever the game had told the old one about, the new one has not been told
 *   A.first         (optional) the tune to begin with
 *   A.prep, A.urgentRest, A.fade, A.segueFade
 *
 * What it hands back is the object a game drives: `sync()` when the sound may have been switched on or off, `rotStep()`
 * every frame, `want(id)` to hold one tune (a rest day) and `want(null)` to let go of it, `pickNext(force)` to move on now.
 */
export const PREP = 14;                    /* seconds before the end of a pass that the next tune is arranged */
export const URGENT_REST = 20;             /* a change of place waits for the end of the pass if it is nearer than this */

export function createDirector(A) {
  const studio = () => { const S = A.studio && A.studio(); return S && S.deck ? S : null; };
  const deck = () => { const S = studio(); return S ? S.deck(A.channel) : null; };
  const minLoops = id => typeof A.minLoops === 'function' ? A.minLoops(id) : (A.minLoops || 2);
  const prep = A.prep || PREP, urgent = A.urgentRest || URGENT_REST;
  const same = (a, b) => JSON.stringify(a || null) === JSON.stringify(b || null);

  const Song = {
    on: false, cur: A.first || null, loading: null, layerSet: null,
    heard: 0, lastBeat: 0, queued: null, forced: null, back: null,
    pool() { return this.forced ? [this.forced] : A.pool(); },
    /* the tune that follows `id` in this place's pool, in order; a place that has only one goes on with it */
    successor(id) {
      const p = this.pool(), i = p.indexOf(id == null ? this.cur : id);
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
    /* Hold one tune whatever the pool says (a rest day), or, with null, let go of it and go on from where it was left. */
    want(id) {
      if (id) {
        if (this.forced === id) return;
        if (!this.forced) this.back = this.cur;
        this.forced = id; this.cur = id;
        if (this.on) this.play('now');
        return;
      }
      if (!this.forced) return;
      this.forced = null;
      const p = this.pool(), from = this.back, next = p.indexOf(from) >= 0 ? this.successor(from) : p[0];
      this.back = null; this.cur = next;
      if (this.on) this.play('now');
    },
    /* Bring `cur` in. `how`: 'start' (nothing is playing: fade in), 'segue' (at the end of the pass), 'now' (crossfade from the next bar). */
    async play(how) {
      const S = studio(), D = deck(), id = this.cur;
      if (!S || !D || this.loading === id) return;
      this.loading = id;
      const layers = A.layers ? A.layers(id) : undefined, levels = A.levels ? A.levels(id) : undefined;
      let p = null;
      try {
        const sg = A.score(S.lang, id), o = { layers, levels };
        p = (how === 'start' || !D.playing) ? await D.play(sg, Object.assign(o, { fade: A.fade || 1.8 }))
          : await D.segue(sg, Object.assign(o, { now: how === 'now', fade: A.segueFade || 1.4 }));
      } catch (e) { p = null; }
      if (this.loading === id) this.loading = null;
      if (p) { this.layerSet = layers || null; this.heard = 0; this.lastBeat = 0; this.queued = null; this.layers(); this.warm(); if (A.onStart) A.onStart(id); }
      else this.queued = null;
    },
    /* the layers a tune is to be played with can change under it (after dark the lead drops out): switch, do not restart */
    layers() {
      const D = deck();
      if (!D || !A.layers || !this.cur) return;
      const m = A.layers(this.cur);
      if (same(m, this.layerSet)) return;
      this.layerSet = m;
      D.layers(m);
    },
    /* load the next tune's instruments now, in the background, so that its segue is never waiting for them */
    warm() {
      const S = studio(), D = deck();
      if (!S || !D || !D.preload || this.pool().length < 2) return;
      try { Promise.resolve(D.preload(A.score(S.lang, this.successor()))).catch(() => {}); } catch (e) { /* a tune that will not build is play()'s to report */ }
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
        this.play(rest > urgent ? 'now' : 'segue');
        return;
      }
      /* it has been heard through enough: arrange the next, a little before this one ends */
      if (this.heard >= minLoops(this.cur) - 1 && rest < prep && rest > 1.2 && pool.length > 1) {
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
        if (p.indexOf(this.cur) < 0) this.cur = p[0];           /* the pool for where you are standing, not always the same one */
        this.play('start');
        return;
      }
      this.layers();
    },
    stop() {
      if (!this.on) return;
      this.on = false; this.loading = null; this.layerSet = null; this.queued = null; this.heard = 0; this.lastBeat = 0;
      const D = deck();
      if (D) D.stop(0.7);
    },
    hardStop() { this.stop(); }
  };
  return Song;
}
