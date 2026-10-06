/* Bekkedal's soundtrack: which tune, and when.
 *
 * The tunes themselves are in `score.js`, written for the studio's real instruments (flute,
 * violin, nylon guitar, harp, strings, cello, an upright bass); this is only the choosing.
 * Five of them, on rotation, drawn from a pool that depends on where you are and what time it
 * is; one is let go and the next comes in underneath it, both on the game's own channel of the
 * studio (so the taskbar mixer's slider for BEKKEDAL, and the MUS knob, set how loud). After
 * dark the two tunes that go quiet at night lose their lead and their arpeggios, which
 * score.js tags as layers, and keep a pad and a bass.
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

export function createSongs(A) {
  const studio = () => { const S = A.studio && A.studio(); return S && S.deck ? S : null; };
  const Song = {
    on: false, cur: 'dag', rotIn: 90, loading: null, quiet: null,
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
    pickNext(force) {
      const p = this.pool();
      let choices = p.filter(x => x !== this.cur);
      if (!choices.length) choices = p;
      const next = choices[Math.floor(Math.random() * choices.length)];
      if (next === this.cur && !force) return;
      this.cur = next;
      if (this.on) this.play();
    },
    /* bring `cur` in, and let whatever was playing go out underneath it */
    async play() {
      const S = studio(), id = this.cur;
      if (!S || this.loading === id) return;
      this.loading = id;
      const quiet = !!NIGHT[id] && A.context() === 'night';
      let p = null;
      try { p = await S.deck('bekkedal').play(scoreOf(S.lang, id), { fade: 1.8, layers: { lead: !quiet, arp: !quiet } }); } catch (e) { p = null; }
      if (this.loading === id) this.loading = null;
      if (p) { this.quiet = quiet; this.layers(); }
    },
    /* after dark the lead and the arpeggios drop out of the two tunes that do without them */
    layers() {
      const S = studio();
      if (!S) return;
      const quiet = !!NIGHT[this.cur] && A.context() === 'night';
      if (quiet === this.quiet) return;
      this.quiet = quiet;
      S.deck('bekkedal').layers({ lead: !quiet, arp: !quiet });
    },
    rotStep(dt) {
      if (!this.on) return;
      this.rotIn -= dt;
      if (this.pool().indexOf(this.cur) < 0 && this.rotIn > 3) this.rotIn = 3;   /* context changed */
      if (this.rotIn <= 0) { this.pickNext(false); this.rotIn = 70 + Math.random() * 45; }   /* <= 115s, never 2 min */
    },
    sync() {
      if (!A.playing()) { this.stop(); return; }
      if (!this.on) { this.on = true; this.play(); return; }
      this.layers();
    },
    stop() {
      if (!this.on) return;
      this.on = false; this.loading = null; this.quiet = null;
      const S = studio();
      if (S) S.deck('bekkedal').stop(0.7);
    },
    hardStop() { this.stop(); }
  };
  return Song;
}
