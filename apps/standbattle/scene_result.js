/* The end of a match or a run (spec 11): who won and what it came to, then a short menu. Kinds: 'match' (versus), 'clear', 'over', 'scores'. */
import { skyline, panel, title, drawMenu, menuRects, hitRect, text, px, drawIdle } from './ui_kit.js';
import { drawTable } from './scene_hiscore.js';
import { begin } from './flow.js';
import { sfxVictory, sfxMove, sfxPick } from './audio.js';
import { defOf } from './roster.js';

export function resultScene(app) {
  let kind = 'match', sel = 0, t = 0, items = [], S = null;
  const mmss = s => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
  function build() {
    items = [{ label: 'AGAIN' }, { label: 'MENU' }];
    if (kind === 'scores') items = [{ label: 'CONTINUE' }];
  }
  function choose(i) {
    const lab = items[i].label;
    if (lab === 'AGAIN') begin(app, { mode: S.mode, p1: S.p1, p2: S.p2, humans: S.humans, stage: S.stageId, tier: S.tier });
    else app.go(lab === 'CONTINUE' && S.mode === 'arcade' ? 'title' : 'menu');
  }
  return {
    enter(a) { kind = a.kind || 'match'; S = app.session; sel = 0; t = 0; build(); app.music(0, 'menu'); if (kind === 'clear' || kind === 'match') sfxVictory(); },
    update(dt) {
      t += dt / 1000;
      let n;
      while ((n = app.dev.popNav())) {
        if (n.k === 'up') { sel = (sel + items.length - 1) % items.length; sfxMove(); }
        else if (n.k === 'down') { sel = (sel + 1) % items.length; sfxMove(); }
        else if ((n.k === 'confirm' || n.k === 'start') && t > 0.5) { sfxPick(); choose(sel); }
      }
    },
    click(mx, my) { menuRects(items, 240, 214, 20, 140).forEach(r => { if (hitRect(r, mx, my)) { sel = r.i; choose(r.i); } }); },
    hover(mx, my) { menuRects(items, 240, 214, 20, 140).forEach(r => { if (hitRect(r, mx, my)) sel = r.i; }); },
    draw(g, W, H, tsec, dt) {
      skyline(g, W, H, tsec); g.save(); g.globalAlpha = 0.55; px(g, 0, 0, W, H, '#0A0614'); g.restore();
      if (kind === 'scores') { drawTable(g, W, H, app.meta.hiscores, -1, tsec); drawMenu(g, items, sel, W / 2, 238, 20, tsec, { w: 140 }); return; }
      const m = S.lastMatch, won = m && m.winner === 0;
      const cleared = kind === 'clear' && S.cleared;
      const head = S.mode === 'arcade' ? (cleared ? 'LADDER CLEARED' : 'GAME OVER') : S.mode === 'survival' ? 'SURVIVAL OVER' : S.mode === 'timeattack' ? (cleared ? 'TIME ATTACK CLEARED' : 'TIME ATTACK OVER') : (won ? 'PLAYER 1 WINS' : (S.humans[1] ? 'PLAYER 2 WINS' : 'YOU LOSE'));
      title(g, head, W / 2, 24, 3, cleared || won ? '#FFE86A' : '#FF6B6B');
      drawIdle(g, defOf(S.p1), 100, 200, 1, tsec, dt, (cleared || won) ? 'win' : 'idle');
      panel(g, 170, 56, 270, 130);
      const lines = [];
      if (S.mode === 'arcade') { lines.push(['SCORE', String(S.score)], ['STAGES', Math.min(S.i + (cleared ? 0 : 0), S.total) + ' OF ' + S.total], ['TIME', mmss(S.secs)], ['CONTINUES', String(S.continues)], ['TIER', S.tier.toUpperCase()]); if (S.lastPay) lines.push(['SUN', '+' + S.lastPay]); }
      else if (S.mode === 'survival') { lines.push(['WINS IN A ROW', String(S.wins)], ['BEST', String(app.meta.survival.best) + (S.newBest ? '  NEW' : '')], ['TIME', mmss(S.secs)]); if (S.lastPay) lines.push(['SUN', '+' + S.lastPay]); }
      else if (S.mode === 'timeattack') { lines.push(['FIGHTS', S.i + ' OF ' + S.total], ['TIME', mmss(S.secs)], ['BEST', app.meta.timeattack[S.p1] != null ? mmss(app.meta.timeattack[S.p1]) + (S.newBest ? '  NEW' : '') : '--']); if (S.lastPay) lines.push(['SUN', '+' + S.lastPay]); }
      else if (m) { lines.push(['ROUNDS', m.wins[0] + ' - ' + m.wins[1]], ['MOST HITS', String(m.stats[0].maxCombo) + ' / ' + m.stats[1].maxCombo], ['THROWS BROKEN', m.stats[0].breaks + ' / ' + m.stats[1].breaks], ['TIME', mmss(m.frames / 60)]); if (S.lastPay) lines.push(['SUN', '+' + S.lastPay]); }
      lines.forEach((l, i) => { text(g, l[0], 182, 66 + i * 18, { scale: 1, color: '#9FB0D8' }); text(g, l[1], 430, 64 + i * 18, { scale: 2, align: 'right', color: '#FFFFFF', outline: '#1E0A2A' }); });
      drawMenu(g, items, sel, 340, 214, 20, tsec, { w: 140 });
    },
    hint() { return 'UP / DOWN: CHOOSE   ENTER: OK'; }
  };
}
