/* Rebinding (spec 4.3): a grid of what each action is on player 1's keys, player 2's keys and the pad. Pick a cell, press the key or the pad button you want. */
import { skyline, panel, title, hitRect, text, px } from './ui_kit.js';
import { ACTIONS, keyLabel } from './input.js';
import { sfxMove, sfxPick, sfxDeny } from './audio.js';
import { emit } from './trophies_bridge.js';

const COLS = ['p1', 'p2', 'pad'], NAMES = { left: 'LEFT', right: 'RIGHT', up: 'UP', down: 'DOWN', LP: 'LP', RP: 'RP', LK: 'LK', RK: 'RK' };
const X0 = 70, CW = 110, Y0 = 56, RH = 16;

export function controlsScene(app) {
  let r = 0, c = 0, ask = false, padAsk = false, msg = '';
  const dev = app.dev;
  const rows = ACTIONS.length + 2;                 /* the actions, then DEFAULTS and BACK */
  const cell = (a, col) => {
    if (col === 'pad') { const b = Object.keys(dev.map.pad).find(k => dev.map.pad[k] === a); return b != null ? 'BTN ' + b : ['left', 'right', 'up', 'down'].indexOf(a) >= 0 ? 'D-PAD' : '--'; }
    const k = dev.keyFor(col, a); return k ? keyLabel(k) : '--';
  };
  function save() { app.meta.keymap = dev.dump(); app.saveMeta(); emit('rebind', {}); }
  function act() {
    if (r === ACTIONS.length) { dev.reset(); save(); msg = 'DEFAULTS RESTORED'; sfxPick(); return; }
    if (r === ACTIONS.length + 1) { app.go('options'); return; }
    const a = ACTIONS[r], col = COLS[c];
    if (col === 'pad') { if (['left', 'right', 'up', 'down'].indexOf(a) >= 0) { msg = 'THE PAD\'S DIRECTIONS ARE THE D-PAD AND THE STICK'; sfxDeny(); return; } padAsk = true; msg = 'PRESS A BUTTON ON THE PAD   (ESC: CANCEL)'; return; }
    ask = true; msg = 'PRESS A KEY FOR ' + NAMES[a] + '   (ESC: CANCEL)';
    dev.askKey(code => { ask = false; if (code === 'Escape') { msg = ''; return; } dev.bindKey(col, a, code); save(); msg = NAMES[a] + ' IS NOW ' + keyLabel(code); sfxPick(); });
  }
  return {
    enter() { r = 0; c = 0; ask = false; padAsk = false; msg = ''; app.music(0); },
    leave() { dev.cancelAsk(); },
    update() {
      if (padAsk) {
        const b = dev.padFaceButtonDown();
        if (b >= 0) { dev.bindPad(ACTIONS[r], b); save(); padAsk = false; msg = NAMES[ACTIONS[r]] + ' IS NOW BTN ' + b; sfxPick(); }
        let n; while ((n = dev.popNav())) if (n.k === 'back') { padAsk = false; msg = ''; }
        return;
      }
      if (ask) { dev.clearNav(); return; }
      let n;
      while ((n = dev.popNav())) {
        if (n.k === 'up') { r = (r + rows - 1) % rows; sfxMove(); } else if (n.k === 'down') { r = (r + 1) % rows; sfxMove(); }
        else if (n.k === 'left') { c = (c + 2) % 3; sfxMove(); } else if (n.k === 'right') { c = (c + 1) % 3; sfxMove(); }
        else if (n.k === 'confirm' || n.k === 'start') act();
        else if (n.k === 'back') app.go('options');
      }
    },
    click(mx, my) {
      ACTIONS.forEach((a, i) => COLS.forEach((col, j) => { if (hitRect({ x: X0 + 60 + j * CW, y: Y0 + i * RH - 2, w: CW - 6, h: RH - 2 }, mx, my)) { r = i; c = j; act(); } }));
      if (hitRect({ x: 120, y: 214, w: 110, h: 14 }, mx, my)) { r = ACTIONS.length; act(); }
      if (hitRect({ x: 250, y: 214, w: 110, h: 14 }, mx, my)) { r = ACTIONS.length + 1; act(); }
    },
    draw(g, W, H, tsec) {
      skyline(g, W, H, tsec); g.save(); g.globalAlpha = 0.6; px(g, 0, 0, W, H, '#0A0614'); g.restore();
      title(g, 'CONTROLS', W / 2, 12, 3);
      COLS.forEach((col, j) => text(g, col === 'pad' ? 'GAMEPAD' : col === 'p1' ? 'PLAYER 1' : 'PLAYER 2', X0 + 60 + j * CW + CW / 2 - 3, 40, { scale: 1, align: 'center', color: '#55FFFF' }));
      ACTIONS.forEach((a, i) => {
        text(g, NAMES[a], X0, Y0 + i * RH, { scale: 1, color: i < 4 ? '#C8D0F0' : '#FFE86A' });
        COLS.forEach((col, j) => {
          const on = r === i && c === j, x = X0 + 60 + j * CW;
          if (on) px(g, x, Y0 + i * RH - 2, CW - 6, RH - 2, ask || padAsk ? '#6A2A2A' : '#2A3366');
          text(g, on && (ask || padAsk) ? '...' : cell(a, col), x + (CW - 6) / 2, Y0 + i * RH, { scale: 1, align: 'center', color: on ? '#FFFFFF' : '#C8D0F0' });
        });
      });
      [['DEFAULTS', 120, ACTIONS.length], ['BACK', 250, ACTIONS.length + 1]].forEach(([l, x, k]) => { const on = r === k; panel(g, x, 214, 110, 14, on ? '#FFE86A' : '#4A5070'); text(g, l, x + 55, 217, { scale: 1, align: 'center', color: on ? '#FFE86A' : '#FFFFFF' }); });
      text(g, msg, W / 2, 238, { scale: 1, align: 'center', color: '#FFD98A' });
      text(g, 'LEFT / RIGHT / UP / DOWN: MOVE   ENTER: REBIND   ESC: BACK', W / 2, 254, { scale: 1, align: 'center', color: '#9FB0D8' });
    },
    hint() { return ask ? 'PRESS THE KEY YOU WANT' : 'ENTER: REBIND THE CELL   ESC: BACK'; }
  };
}
