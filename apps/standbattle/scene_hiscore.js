/* Three initials (spec 11.3): up and down choose a letter, left and right move, a confirm on the third letter saves; then the table with the new entry lit. */
import { skyline, panel, title, text, px } from './ui_kit.js';
import { saveScore } from './flow.js';
import { cleanInitials } from './hiscore.js';
import { ROSTER } from './roster.js';
import { sfxMove, sfxPick } from './audio.js';

const LETTERS = ' ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

export function hiscoreScene(app) {
  let ch = [], pos = 0, rank = -1, phase = 'enter', t = 0;
  return {
    enter() { ch = cleanInitials(app.meta.initials).split('').map(c => Math.max(0, LETTERS.indexOf(c))); pos = 0; rank = -1; phase = 'enter'; t = 0; app.music(0); },
    update(dt) {
      t += dt / 1000;
      let n;
      while ((n = app.dev.popNav())) {
        if (phase === 'enter') {
          if (n.k === 'up') { ch[pos] = (ch[pos] + 1) % LETTERS.length; sfxMove(); }
          else if (n.k === 'down') { ch[pos] = (ch[pos] + LETTERS.length - 1) % LETTERS.length; sfxMove(); }
          else if (n.k === 'left') pos = Math.max(0, pos - 1);
          else if (n.k === 'right') pos = Math.min(2, pos + 1);
          else if (n.k === 'confirm' || n.k === 'start') {
            if (pos < 2) { pos++; sfxMove(); } else { rank = saveScore(app, ch.map(i => LETTERS[i]).join('')); phase = 'table'; t = 0; sfxPick(); }
          } else if (n.k === 'back' && pos > 0) pos--;
        } else if (n.k === 'confirm' || n.k === 'start' || n.k === 'back') app.go('result', { kind: 'scores' });
      }
      if (phase === 'table' && t > 20) app.go('result', { kind: 'scores' });
    },
    draw(g, W, H, tsec) {
      skyline(g, W, H, tsec); g.save(); g.globalAlpha = 0.6; px(g, 0, 0, W, H, '#0A0614'); g.restore();
      const S = app.session;
      if (phase === 'enter') {
        title(g, S.cleared ? 'A NEW CHAMPION' : 'A HIGH SCORE', W / 2, 30, 3);
        text(g, 'SCORE  ' + S.score, W / 2, 70, { scale: 2, align: 'center', color: '#FFFFFF', outline: '#1E0A2A' });
        text(g, 'ENTER YOUR INITIALS', W / 2, 104, { scale: 1, align: 'center', color: '#C8D0F0' });
        for (let i = 0; i < 3; i++) {
          const x = W / 2 - 54 + i * 40, on = i === pos;
          panel(g, x, 124, 32, 44, on ? '#FFE86A' : '#4A5070');
          text(g, LETTERS[ch[i]] === ' ' ? '_' : LETTERS[ch[i]], x + 16, 134, { scale: 4, align: 'center', color: on ? '#FFE86A' : '#FFFFFF', outline: '#1E0A2A' });
          if (on) { px(g, x + 12, 118, 8, 3, '#FFE86A'); px(g, x + 12, 171, 8, 3, '#FFE86A'); }
        }
        text(g, 'UP / DOWN: LETTER    LEFT / RIGHT: MOVE    ENTER: OK', W / 2, 200, { scale: 1, align: 'center', color: '#9FB0D8' });
      } else {
        drawTable(g, W, H, app.meta.hiscores, rank, tsec);
        text(g, 'PRESS ANY BUTTON', W / 2, H - 16, { scale: 1, align: 'center', color: '#FFFFFF', alpha: 0.5 + 0.5 * Math.sin(tsec * 6) });
      }
    },
    hint() { return 'UP / DOWN: LETTER   LEFT / RIGHT: MOVE   ENTER: CONFIRM'; }
  };
}

export function drawTable(g, W, H, table, hot, tsec) {
  title(g, 'HIGH SCORES', W / 2, 14, 3);
  panel(g, 70, 44, W - 140, 188);
  text(g, 'RK  NAME  SCORE      FIGHTER      TIER   STAGE', 80, 50, { scale: 1, color: '#9FB0D8' });
  for (let i = 0; i < 10; i++) {
    const e = table[i], y = 66 + i * 16, on = i === hot && Math.sin(tsec * 8) > -0.4;
    const col = on ? '#FFE86A' : i < 3 ? '#FFFFFF' : '#C8D0F0';
    text(g, String(i + 1).padStart(2, ' '), 80, y, { scale: 1, color: col });
    if (!e) { text(g, '---', 110, y, { scale: 1, color: '#555577' }); continue; }
    text(g, e.initials, 110, y, { scale: 1, color: col }); text(g, String(e.score), 150, y, { scale: 1, color: col });
    text(g, (ROSTER[e.char] ? ROSTER[e.char].short : '?'), 230, y, { scale: 1, color: col });
    text(g, String(e.tier || '').toUpperCase(), 322, y, { scale: 1, color: col }); text(g, e.cleared ? 'CLEAR' : 'ST ' + (e.stage + 1), 372, y, { scale: 1, color: col });
  }
}
