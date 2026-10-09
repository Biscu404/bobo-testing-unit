/* The main menu, the options and the records (spec 11.2). Keys, the pad and the mouse all work. */
import { skyline, panel, title, drawMenu, menuRects, hitRect, text, px } from './ui_kit.js';
import { sfxMove, sfxPick, sfxDeny } from './audio.js';
import { ROSTER, PLAYABLE } from './roster.js';

/* The main menu is two columns, because nine rows of big letters in a 270-pixel-high picture left no air between them and let the last one run into the note under the list.
   FIGHT holds the ways to play; the other column is for looking things up and for the CPU's difficulty, which is the last row (LEFT / RIGHT change it there). */
const FIGHT = [
  { label: 'ARCADE', go: 'select', args: { mode: 'arcade' }, note: 'SIX FIGHTS AND A BOSS. A SECOND PLAYER CAN JOIN IN.' },
  { label: 'VERSUS', go: 'select', args: { mode: 'versus' }, note: 'TWO PEOPLE, ONE KEYBOARD (OR TWO PADS).' },
  { label: 'VERSUS CPU', go: 'select', args: { mode: 'cpu' }, note: 'PICK YOUR OPPONENT. THE TIER IS THE LAST ROW OF THE OTHER COLUMN.' },
  { label: 'SURVIVAL', go: 'select', args: { mode: 'survival' }, note: 'ONE ROUND EACH. YOUR LIFE CARRIES OVER.' },
  { label: 'TIME ATTACK', go: 'select', args: { mode: 'timeattack' }, note: 'FIVE FIGHTS AS FAST AS YOU CAN.' }
];
const MORE = [
  { label: 'TRAINING', go: 'select', args: { mode: 'training' }, note: 'FRAME DATA, DUMMIES, RECORD AND PLAYBACK.' },
  { label: 'MOVE LIST', go: 'movelist', args: {}, note: 'EVERY MOVE OF EVERY FIGHTER, FRAME BY FRAME.' },
  { label: 'RECORDS', go: 'records', args: {}, note: 'THE HIGH SCORES AND YOUR BEST RUNS.' },
  { label: 'OPTIONS', go: 'options', args: {}, note: 'SHAKE AND THE KEYS.' },
  { label: 'DIFFICULTY', diff: true, note: 'EASY, NORMAL OR HARD: ONLY THE CPU\'S EYES AND NERVES CHANGE. LEFT / RIGHT.' }
];
export const MENU_COLS = [FIGHT, MORE];
const TIERS = ['easy', 'normal', 'hard'];
/* the geometry, in the picture's own pixels: two bars of 210, five rows of 30 */
const BAR_W = 210, ROW_H = 32, TOP = 70, COL_X = [22, 248];
const barRect = (c, r) => ({ x: COL_X[c], y: TOP + r * ROW_H, w: BAR_W, h: ROW_H - 4, c, r });

export function menuScene(app) {
  let col = 0, row = 0;
  const cur = () => MENU_COLS[col][row];
  const cycle = d => { const t = TIERS.indexOf(app.meta.difficulty); app.meta.difficulty = TIERS[(t + d + 3) % 3]; app.saveMeta(); sfxMove(); };
  function choose() { const m = cur(); if (m.diff) return cycle(1); sfxPick(); app.go(m.go, m.args); }
  const rects = () => MENU_COLS.flatMap((items, c) => items.map((it, r) => barRect(c, r)));
  return {
    enter() { col = 0; row = 0; app.dev.single = true; app.music(0, 'menu'); },
    update() {
      let n;
      while ((n = app.dev.popNav())) {
        if (n.k === 'up') { row = (row + 4) % 5; sfxMove(); }
        else if (n.k === 'down') { row = (row + 1) % 5; sfxMove(); }
        else if (n.k === 'confirm' || n.k === 'start') choose();
        else if (n.k === 'back') app.go('title');
        else if (n.k === 'left' || n.k === 'right') { if (cur().diff) cycle(n.k === 'right' ? 1 : -1); else { col = 1 - col; sfxMove(); } }
      }
    },
    click(mx, my) { rects().forEach(r => { if (hitRect(r, mx, my)) { col = r.c; row = r.r; choose(); } }); },
    hover(mx, my) { rects().forEach(r => { if (hitRect(r, mx, my)) { col = r.c; row = r.r; } }); },
    draw(g, W, H, tsec) {
      skyline(g, W, H, tsec); g.save(); g.globalAlpha = 0.68; px(g, 0, 0, W, H, '#0A0614'); g.restore();
      title(g, 'STAND BATTLE ARENA', W / 2, 12, 3);
      MENU_COLS.forEach((items, c) => {
        const x0 = COL_X[c];
        text(g, c === 0 ? 'FIGHT' : 'LEARN, LOOK, SET', x0 + BAR_W / 2, 52, { scale: 1, align: 'center', color: '#55FFFF' });
        px(g, x0, 63, BAR_W, 1, '#4A5070');
        items.forEach((it, r) => {
          const on = c === col && r === row, b = barRect(c, r);
          if (on) { px(g, b.x, b.y, b.w, b.h, '#2A3366'); px(g, b.x, b.y, b.w, 1, '#8A93B8'); px(g, b.x + 4 + (Math.sin(tsec * 8) > 0 ? 1 : 0), b.y + b.h / 2 - 3, 4, 6, '#FFE86A'); }
          const ink = on ? '#FFFFFF' : '#C8D0F0', cx = b.x + b.w / 2;
          if (it.diff) {
            text(g, 'DIFFICULTY', cx, b.y + 1, { scale: 1, align: 'center', color: on ? '#FFD98A' : '#9FB0D8' });
            text(g, '< ' + app.meta.difficulty.toUpperCase() + ' >', cx, b.y + 11, { scale: 2, align: 'center', color: ink, outline: on ? '#1E2A5A' : null });
          } else text(g, it.label, cx, b.y + 6, { scale: 2, align: 'center', color: ink, outline: on ? '#1E2A5A' : null });
        });
      });
      text(g, cur().note, W / 2, H - 22, { scale: 1, align: 'center', color: '#FFD98A' });
    },
    hint() { return 'ARROWS: CHOOSE (LEFT / RIGHT SWITCH COLUMN, OR CHANGE THE DIFFICULTY)   ENTER: OK   ESC: TITLE'; }
  };
}

export function optionsScene(app) {
  let sel = 0;
  const items = () => [
    { label: 'DIFFICULTY: ' + app.meta.difficulty.toUpperCase() }, { label: 'SHAKE: ' + (app.meta.shakeEnabled ? 'ON' : 'OFF') },
    { label: 'CONTROLS' }, { label: 'BACK' }
  ];
  function act(i, d) {
    sfxPick();
    if (i === 0) { const t = TIERS.indexOf(app.meta.difficulty); app.meta.difficulty = TIERS[(t + (d || 1) + 3) % 3]; }
    else if (i === 1) app.meta.shakeEnabled = !app.meta.shakeEnabled;
    else if (i === 2) return app.go('controls');
    else return app.go('menu');
    app.saveMeta();
  }
  return {
    enter() { sel = 0; app.music(0, 'menu'); },
    update() {
      let n;
      while ((n = app.dev.popNav())) {
        if (n.k === 'up') { sel = (sel + 3) % 4; sfxMove(); } else if (n.k === 'down') { sel = (sel + 1) % 4; sfxMove(); }
        else if (n.k === 'confirm' || n.k === 'start') act(sel, 1);
        else if (n.k === 'left') act(sel, -1); else if (n.k === 'right') act(sel, 1);
        else if (n.k === 'back') app.go('menu');
      }
    },
    click(mx, my) { menuRects(items(), 240, 80, 24, 240).forEach(r => { if (hitRect(r, mx, my)) { sel = r.i; act(r.i, 1); } }); },
    hover(mx, my) { menuRects(items(), 240, 80, 24, 240).forEach(r => { if (hitRect(r, mx, my)) sel = r.i; }); },
    draw(g, W, H, tsec) {
      skyline(g, W, H, tsec); g.save(); g.globalAlpha = 0.55; px(g, 0, 0, W, H, '#0A0614'); g.restore();
      title(g, 'OPTIONS', W / 2, 20, 3);
      drawMenu(g, items(), sel, W / 2, 80, 24, tsec, { w: 240 });
      const t = app.meta.difficulty;
      panel(g, 14, 180, W - 28, 38, '#3A4060');
      text(g, t === 'easy' ? 'THE CPU REACTS SLOWLY AND MAKES MISTAKES. SEVEN CONTINUES. SCORE X0.5.' : t === 'normal' ? 'THE CPU PLAYS FAIRLY AND GETS BETTER EACH STAGE. FIVE CONTINUES.' : 'THE CPU READS YOU AND PUNISHES. THREE CONTINUES. SCORE X2.', W / 2, 188, { scale: 1, align: 'center', color: '#C8D0F0' });
      text(g, 'THE SAME FIGHTERS, THE SAME NUMBERS: ONLY THE CPU\'S EYES AND NERVES CHANGE.', W / 2, 203, { scale: 1, align: 'center', color: '#9FB0D8' });
    },
    hint() { return 'UP / DOWN: CHOOSE   LEFT / RIGHT / ENTER: CHANGE   ESC: BACK'; }
  };
}

export function recordsScene(app) {
  return {
    enter() { app.music(0, 'menu'); },
    update() { let n; while ((n = app.dev.popNav())) if (n.k === 'confirm' || n.k === 'start' || n.k === 'back') app.go('menu'); },
    click() { app.go('menu'); },
    draw(g, W, H, tsec) {
      skyline(g, W, H, tsec); g.save(); g.globalAlpha = 0.55; px(g, 0, 0, W, H, '#0A0614'); g.restore();
      drawRecords(g, W, H, app.meta, tsec);
    },
    hint() { return 'ENTER / ESC: BACK'; }
  };
}

import { drawTable } from './scene_hiscore.js';
function drawRecords(g, W, H, meta, tsec) {
  drawTable(g, W, H, meta.hiscores, -1, tsec);
  const mm = s => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
  const cleared = PLAYABLE.map(id => (meta.cleared[id] ? ['E', 'N', 'H'].filter((c, i) => meta.cleared[id][['easy', 'normal', 'hard'][i]]).join('') || '-' : '-'));
  text(g, 'SURVIVAL BEST ' + meta.survival.best + (meta.survival.char ? ' (' + ROSTER[meta.survival.char].short + ')' : ''), 14, H - 32, { scale: 1, color: '#C8D0F0' });
  text(g, 'TIME ATTACK ' + PLAYABLE.map(id => ROSTER[id].short.slice(0, 3) + ' ' + (meta.timeattack[id] != null ? mm(meta.timeattack[id]) : '--')).join('  '), 14, H - 21, { scale: 1, color: '#C8D0F0' });
  text(g, 'CLEARED ' + PLAYABLE.map((id, i) => ROSTER[id].short.slice(0, 3) + ' ' + cleared[i]).join('  '), 14, H - 10, { scale: 1, color: '#FFE86A' });
}
