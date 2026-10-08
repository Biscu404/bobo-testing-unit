/* The main menu, the options and the records (spec 11.2). Keys, the pad and the mouse all work. */
import { skyline, panel, title, drawMenu, menuRects, hitRect, text, px } from './ui_kit.js';
import { sfxMove, sfxPick, sfxDeny } from './audio.js';
import { ROSTER, PLAYABLE } from './roster.js';

const MODES = [
  { label: 'ARCADE', go: 'select', args: { mode: 'arcade' }, note: 'SIX FIGHTS AND A BOSS. A SECOND PLAYER CAN JOIN IN.' },
  { label: 'VERSUS', go: 'select', args: { mode: 'versus' }, note: 'TWO PEOPLE, ONE KEYBOARD (OR TWO PADS).' },
  { label: 'VERSUS CPU', go: 'select', args: { mode: 'cpu' }, note: 'PICK YOUR OPPONENT. THE TIER IS IN OPTIONS.' },
  { label: 'SURVIVAL', go: 'select', args: { mode: 'survival' }, note: 'ONE ROUND EACH. YOUR LIFE CARRIES OVER.' },
  { label: 'TIME ATTACK', go: 'select', args: { mode: 'timeattack' }, note: 'FIVE FIGHTS AS FAST AS YOU CAN.' },
  { label: 'TRAINING', go: 'select', args: { mode: 'training' }, note: 'FRAME DATA, DUMMIES, RECORD AND PLAYBACK.' },
  { label: 'MOVE LIST', go: 'movelist', args: {}, note: 'EVERY MOVE OF EVERY FIGHTER, FRAME BY FRAME.' },
  { label: 'RECORDS', go: 'records', args: {}, note: 'THE HIGH SCORES AND YOUR BEST RUNS.' },
  { label: 'OPTIONS', go: 'options', args: {}, note: 'DIFFICULTY, SHAKE, CONTROLS.' }
];
const TIERS = ['easy', 'normal', 'hard'];

export function menuScene(app) {
  let sel = 0;
  const items = MODES;
  const rects = () => menuRects(items, 240, 74, 19, 200);
  function choose(i) { sfxPick(); const m = items[i]; app.go(m.go, m.args); }
  return {
    enter() { sel = 0; app.dev.single = true; app.music(0); },
    update() {
      let n;
      while ((n = app.dev.popNav())) {
        if (n.k === 'up') { sel = (sel + items.length - 1) % items.length; sfxMove(); }
        else if (n.k === 'down') { sel = (sel + 1) % items.length; sfxMove(); }
        else if (n.k === 'confirm' || n.k === 'start') choose(sel);
        else if (n.k === 'back') app.go('title');
        else if (n.k === 'left' || n.k === 'right') { const t = TIERS.indexOf(app.meta.difficulty); app.meta.difficulty = TIERS[(t + (n.k === 'right' ? 1 : 2)) % 3]; app.saveMeta(); sfxMove(); }
      }
    },
    click(mx, my) { rects().forEach(r => { if (hitRect(r, mx, my)) { sel = r.i; choose(r.i); } }); },
    hover(mx, my) { rects().forEach(r => { if (hitRect(r, mx, my)) sel = r.i; }); },
    draw(g, W, H, tsec) {
      skyline(g, W, H, tsec); g.save(); g.globalAlpha = 0.5; px(g, 0, 0, W, H, '#0A0614'); g.restore();
      title(g, 'STAND BATTLE ARENA', W / 2, 14, 3);
      drawMenu(g, items.map(m => ({ label: m.label })), sel, W / 2, 74, 19, tsec, { scale: 2, w: 220 });
      text(g, items[sel].note, W / 2, H - 34, { scale: 1, align: 'center', color: '#FFD98A' });
      text(g, '< ' + app.meta.difficulty.toUpperCase() + ' >', W / 2, H - 20, { scale: 1, align: 'center', color: '#9FB0D8' });
    },
    hint() { return 'UP / DOWN: CHOOSE   ENTER: OK   LEFT / RIGHT: DIFFICULTY   ESC: TITLE'; }
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
    enter() { sel = 0; app.music(0); },
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
      text(g, t === 'easy' ? 'THE CPU REACTS SLOWLY AND MAKES MISTAKES. SEVEN CONTINUES. SCORE X0.5.' : t === 'normal' ? 'THE CPU PLAYS FAIRLY AND GETS BETTER EACH STAGE. FIVE CONTINUES.' : 'THE CPU READS YOU AND PUNISHES. THREE CONTINUES. SCORE X2.', W / 2, 190, { scale: 1, align: 'center', color: '#C8D0F0' });
      text(g, 'THE SAME FIGHTERS, THE SAME NUMBERS: ONLY THE CPU\'S EYES AND NERVES CHANGE.', W / 2, 204, { scale: 1, align: 'center', color: '#9FB0D8' });
    },
    hint() { return 'UP / DOWN: CHOOSE   LEFT / RIGHT / ENTER: CHANGE   ESC: BACK'; }
  };
}

export function recordsScene(app) {
  return {
    enter() { app.music(0); },
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
  text(g, 'SURVIVAL BEST ' + meta.survival.best + (meta.survival.char ? ' (' + ROSTER[meta.survival.char].short + ')' : ''), 14, H - 30, { scale: 1, color: '#C8D0F0' });
  text(g, 'TIME ATTACK ' + PLAYABLE.map(id => ROSTER[id].short.slice(0, 3) + ' ' + (meta.timeattack[id] != null ? mm(meta.timeattack[id]) : '--')).join('  '), 14, H - 18, { scale: 1, color: '#C8D0F0' });
  text(g, 'CLEARED ' + PLAYABLE.map((id, i) => ROSTER[id].short.slice(0, 3) + ' ' + cleared[i]).join('  '), 14, H - 6, { scale: 1, color: '#FFE86A' });
}
