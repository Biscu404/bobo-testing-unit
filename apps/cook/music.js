/* The Cook's music: which tune, how much of it, and the stingers. The tunes are in score.js (studio songs, real instruments);
   this plays them on the game's own channel of the studio ('cook': the MUS knob and the taskbar mixer's THE COOK slider set how
   loud), switches the tune when the bench changes (a crossfade that begins on a bar line, never in the middle of one), rides the
   two layers as the bench gets worse (`setHeat`: 0 all is well, 1 over par, 2 the sweep is close), and lays a stinger over the top
   for a won or a ruined batch, ducking the tune under it. It used to be a bank of oscillators with its own bus and its own timers
   and a mixer listener; the studio does all of that. `createCookMusic(A)` wants A.studio() and A.playing() (may it make a sound at all). */
import { song, stinger, levelsFor, TUNE_OF } from './score.js';

export function createCookMusic(A) {
  const S = () => { const s = A.studio && A.studio(); return s && s.deck ? s : null; };
  let cur = 'desert', on = false, heat = 0, token = 0;
  const M = {
    get tune() { return cur; }, get on() { return on; },
    /* the tune for a bench: the place changes the music, and a change of place is a crossfade on the next bar line */
    want(id) {
      if (id === cur) return;
      cur = id;
      const s = S(); if (!on || !s) return;
      s.deck('cook').segue(song(s.lang, cur), { now: true, fade: 1.6, levels: levelsFor(heat) }).catch(() => {});
    },
    forBench(n) { M.want(TUNE_OF(n)); },
    setHeat(h) {
      if (h === heat) return;
      heat = h;
      const s = S(); if (on && s) s.deck('cook').levels(levelsFor(h), { glide: h > 0 ? 1.4 : 3 });
    },
    /* the sound may have been switched on or off, or the window may have gone */
    sync() {
      if (!A.playing()) { M.stop(); return; }
      if (!on) M.start();
    },
    start() {
      const s = S(); if (on || !s || !s.ensure()) return;                 /* no audio yet (nobody has touched the machine): try again at the next sync */
      on = true; token++;
      s.preload(stinger(s.lang, 'win')).catch(() => {}); s.preload(stinger(s.lang, 'ruin')).catch(() => {});      /* so a stinger never waits on a sample */
      s.deck('cook').play(song(s.lang, cur), { fade: 1.2, levels: levelsFor(heat) }).catch(() => { /* no sound on this machine */ });
    },
    stop() {
      if (!on) return;
      on = false; token++;
      const s = S(); if (s) s.deck('cook').stop(0.7);
    },
    /* a stinger over the top: 'win' or 'ruin'. The tune ducks under it and comes back. */
    sting(kind) {
      const s = S(); if (!s || !A.playing()) return;
      const st = stinger(s.lang, kind);
      s.preload(st).then(() => {
        if (!A.playing()) return;
        const p = s.deck('cook').player;
        s.play(st, { channel: 'cook', loop: false });
        if (p) { p.fade(0.3, 0.15); setTimeout(() => { if (s.deck('cook').player === p) p.fade(1, 1.8); }, kind === 'win' ? 4300 : 3300); }
      }).catch(() => { /* no sound on this machine */ });
    }
  };
  return M;
}
