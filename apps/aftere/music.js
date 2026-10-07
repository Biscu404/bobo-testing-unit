/* AfterEgypt's music: which tune, and how much of it, and what happens when the flight is over.
 *
 *   TITLE   NILE DAWN plays whenever nobody is flying (the screen that asks for a way, and what is left of the flight once its stinger is done).
 *   FLIGHT  taking off starts the way's tune from its first bar, at once (a quarter of a second across from the title). It is a core that is a
 *           tune on its own and layers (`score.js`), and the run rides them: `danger.js` says how much of each the sky is asking for and the
 *           levels lean toward it (fast in, slow out), glided to by the desk. Nothing restarts, ducks or re-cues the tune: the band leans in.
 *   END     a stinger is played once over the top of the flight (which goes in a tenth of a second): the arrival, the arrival with a way opening,
 *           or the sand. When it is done the title comes back, two seconds in.
 * It plays on the studio's own 'aftere' channel through `studio.deck('aftere')`, so the MUS knob and the taskbar mixer's AFTEREGYPT slider set how
 * loud, and the deck is the only thing that is ever playing: `stop()` fades it and leaves nothing behind.
 *
 * `createAfterMusic(A)` wants:
 *   A.studio()    the studio (ctx.studio)
 *   A.playing()   whether it may make a sound at all (the window is alive, the screen is on, MUS is up)
 */
import { song as scoreOf, sting as stingOf, secsOf, LAYERS_OF } from './score.js';
import { heat, lean, FEEL } from './danger.js';

export const GLIDE = 0.35;                 /* seconds a layer takes to come to a new level on the desk */
export const PUSH = 0.16, EPS = 0.02;      /* how often a changed level is sent to the desk, and how small a change is not worth sending */
export const TAIL = 0.4;                   /* seconds after a stinger's last bar before the title comes back */

export function createAfterMusic(A) {
  const M = {
    on: false, want: { kind: 'menu' }, started: null, loading: null, lv: {}, sent: null, pushT: 0, left: 0, calls: 0,
    deck() { const S = A.studio && A.studio(); return S && S.deck ? S.deck('aftere') : null; },
    layers() { return M.want.kind === 'run' ? LAYERS_OF[M.want.id] || [] : []; },
    key() { return M.want.kind + ':' + (M.want.id || ''); },

    /* ---- what the game says ---- */
    menu() { if (M.want.kind === 'menu') return; M.want = { kind: 'menu' }; if (M.on) M.start(); },
    /* a flight begins: the way's own tune from its first bar */
    run(id) {
      M.want = { kind: 'run', id }; M.lv = {}; M.layers().forEach(k => { M.lv[k] = 0; });
      M.sent = null; M.pushT = 0;
      if (M.on) M.start();
    },
    /* a flight has ended: `how` is 'clear', 'unlock' or 'death' */
    end(how) {
      M.want = { kind: 'sting', id: how };
      const S = A.studio && A.studio();
      M.left = S ? secsOf(stingOf(S.lang, how)) + TAIL : 0;
      if (M.on) M.start();
    },
    /* load a tune's instruments now so that taking off does not wait for them */
    warm(ids) {
      const S = A.studio && A.studio(), D = M.deck();
      if (!S || !D || !D.preload || !A.playing()) return;
      ids.forEach(id => { try { Promise.resolve(D.preload(id === 'title' || LAYERS_OF[id] ? scoreOf(S.lang, id) : stingOf(S.lang, id))).catch(() => {}); } catch (e) { /* a tune that will not build is play()'s to report */ } });
    },

    /* ---- the desk ---- */
    async start() {
      const S = A.studio && A.studio(), D = M.deck();
      if (!S || !D) return;
      const w = M.want, key = M.key(), mine = ++M.calls;
      M.started = key; M.loading = key;
      let sg, o;
      if (w.kind === 'run') { sg = scoreOf(S.lang, w.id); o = { fade: 0.25, levels: Object.assign({}, M.lv) }; }
      else if (w.kind === 'sting') { sg = stingOf(S.lang, w.id); o = { fade: 0.1, fadeIn: 0, loop: false }; }
      else { sg = scoreOf(S.lang, 'title'); o = { fade: 2 }; }
      let p = null;
      try { p = await D.play(sg, o); } catch (e) { p = null; }
      if (mine !== M.calls) return;                                                 /* a newer request has overtaken this one */
      M.loading = null;
      if (p) M.sent = Object.assign({}, o.levels || {});                            /* what the tune began with: the next push is measured from it */
      else M.started = null;                                                        /* it did not play (no sound card): try again when asked */
    },
    /* the sound has been switched on or off, or the window has gone: call every frame */
    sync() {
      if (!A.playing()) { M.stop(); return; }
      if (M.on) return;
      M.on = true; M.start();
    },
    stop() {
      if (!M.on) return;
      M.on = false; M.started = null; M.loading = null; M.sent = null;
      const D = M.deck();
      if (D) D.stop(0.7);
    },
    /* every frame: the run in flight, and how long the frame was. Rides the layers; counts a stinger out. */
    step(dt, run) {
      if (M.want.kind === 'sting') {
        M.left -= dt;
        if (M.left <= 0) { M.want = { kind: 'menu' }; if (M.on) M.start(); }
        return;
      }
      if (M.want.kind !== 'run' || !run) return;
      const h = heat(run);
      M.layers().forEach(k => { M.lv[k] = lean(M.lv[k] || 0, h[k], dt, FEEL[k]); if (Math.abs(M.lv[k] - h[k]) < 0.002) M.lv[k] = h[k]; });
      M.pushT -= dt;
      if (M.pushT > 0 || !M.on || M.loading || !M.sent) return;
      const ks = M.layers(), moved = ks.some(k => Math.abs(M.lv[k] - (M.sent[k] || 0)) >= EPS), residue = ks.some(k => M.lv[k] === h[k] && M.lv[k] !== M.sent[k]);
      if (!moved && !residue) return;
      M.pushT = PUSH; M.sent = Object.assign({}, M.lv);
      const D = M.deck();
      if (D) D.levels(Object.assign({}, M.lv), { glide: GLIDE });
    }
  };
  return M;
}
