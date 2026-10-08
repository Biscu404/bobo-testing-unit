/* Solitaire's music: the tunes are in score.js; this plays them on the game's own studio channel ('solitaire': the MUS knob and the
   taskbar mixer's slider set how loud), swaps to the other tune on a new deal (on a bar line) and brings the layers in as cards go home. */
import { song, levelsFor, IDS } from './score.js';

export function createSolitaireMusic(A) {
  const S = () => { const s = A.studio && A.studio(); return s && s.deck ? s : null; };
  let on = false, i = 0, home = 0;
  return {
    get on() { return on; },
    sync() { if (!A.playing()) this.stop(); else if (!on) this.start(); },
    start() {
      const s = S(); if (on || !s || !s.ensure()) return;
      on = true;
      s.deck('solitaire').play(song(s.lang, IDS[i]), { fade: 1.2, levels: levelsFor(home) }).catch(() => {});
    },
    stop() { if (!on) return; on = false; const s = S(); if (s) s.deck('solitaire').stop(0.7); },
    cards(n) {
      if (n === home) return;
      home = n;
      const s = S(); if (on && s) s.deck('solitaire').levels(levelsFor(n), { glide: 1.6 });
    },
    nextDeal() {
      home = 0; i = (i + 1) % IDS.length;
      const s = S(); if (on && s) s.deck('solitaire').segue(song(s.lang, IDS[i]), { fade: 1.6, levels: levelsFor(0) }).catch(() => {});
    }
  };
}
