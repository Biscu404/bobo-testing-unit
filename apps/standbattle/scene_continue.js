/* "CONTINUE?" (spec 11.3): ten seconds, each one ticks; a press starts the fight again and costs a continue; zero is game over. */
import { skyline, title, text, px, drawIdle } from './ui_kit.js';
import { TIMING } from './timing.js';
import { playFight, finish } from './flow.js';
import { sfxTick, sfxDefeat } from './audio.js';
import { defOf } from './roster.js';

export function continueScene(app) {
  let t = 0, last = 99, S = null, def = null;
  return {
    enter() { S = app.session; t = 0; last = 99; def = defOf(S.p1); app.music(0, 'menu'); sfxDefeat(); },
    update(dt) {
      t += dt / 1000;
      const n = Math.max(0, Math.ceil(TIMING.CONTINUE_SECS - t));
      if (n !== last) { last = n; if (n > 0) sfxTick(n); }
      let k;
      while ((k = app.dev.popNav())) if (k.k === 'confirm' || k.k === 'start') return take();
      if (t >= TIMING.CONTINUE_SECS) finish(app, 'over');
    },
    click() { take(); },
    draw(g, W, H, tsec, dt) {
      skyline(g, W, H, tsec);
      g.save(); g.globalAlpha = 0.6; px(g, 0, 0, W, H, '#0A0614'); g.restore();
      drawIdle(g, def, W / 2, 236, 1, tsec, dt, 'down');
      title(g, 'CONTINUE?', W / 2, 40, 4, '#FF6B6B');
      const n = Math.max(0, Math.ceil(TIMING.CONTINUE_SECS - t));
      text(g, String(n), W / 2, 84, { scale: 8, align: 'center', color: n <= 3 ? '#FF6B6B' : '#FFE86A', outline: '#1E0A2A', shadow: '#5A1A06', shadowDy: 3 });
      text(g, 'CONTINUES LEFT  ' + (S.maxContinues - S.continues), W / 2, 160, { scale: 1, align: 'center', color: '#C8D0F0' });
      text(g, 'SCORE  ' + S.score, W / 2, 174, { scale: 1, align: 'center', color: '#FFFFFF' });
      text(g, 'PRESS START TO FIGHT AGAIN', W / 2, H - 22, { scale: 1, align: 'center', color: '#FFFFFF', alpha: 0.5 + 0.5 * Math.sin(tsec * 8) });
    },
    hint() { return 'ENTER / LP: CONTINUE'; }
  };
  function take() { if (app.session.useContinue()) playFight(app); else finish(app, 'over'); }
}
