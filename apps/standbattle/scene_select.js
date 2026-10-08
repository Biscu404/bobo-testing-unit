/* Choosing fighters (spec 11.2). One person at the cabinet picks with player 1; in ARCADE a second person who presses a button on THEIR keys joins in (the pick-up choice) and the
   run becomes a two-player versus. VERSUS: both pick, then player 1 picks the place. VERSUS CPU and TRAINING: pick yours, then the opponent. SURVIVAL and TIME ATTACK: yours. */
import { skyline, panel, title, drawIdle, hitRect, text, px } from './ui_kit.js';
import { PLAYABLE, ROSTER, movelistOf } from './roster.js';
import { STAGE_IDS, STAGES } from './stages.js';
import { begin } from './flow.js';
import { portrait } from './portraits.js';
import { sfxMove, sfxPick } from './audio.js';
import { emit } from './trophies_bridge.js';

const CARD = { x0: 45, y: 26, w: 72, gap: 6, h: 62 };
const cardRect = i => ({ x: CARD.x0 + i * (CARD.w + CARD.gap), y: CARD.y, w: CARD.w, h: CARD.h });

export function selectScene(app) {
  let mode = 'arcade', step = 'p1', cur = [0, 0], lock = [false, false], joined = false, stageSel = 0, picks = {}, t = 0;
  const heading = () => (step === 'stage' ? 'CHOOSE THE PLACE' : joined || mode === 'versus' ? (step === 'p1' ? 'PLAYER 1  AND  PLAYER 2: CHOOSE' : 'CHOOSE') : step === 'opp' ? 'CHOOSE YOUR OPPONENT' : 'CHOOSE YOUR FIGHTER');
  const two = () => joined || mode === 'versus';
  function exit() { app.dev.single = true; app.go('menu'); }
  function finish() {
    const p1 = PLAYABLE[cur[0]];
    app.meta.lastChar = p1;
    if (mode === 'training') return app.go('training', { p1, p2: PLAYABLE[cur[1]] });
    if (two()) { const stage = stageSel >= STAGE_IDS.length ? STAGE_IDS[Math.floor(Math.random() * STAGE_IDS.length)] : STAGE_IDS[stageSel]; emit('versus', {}); app.dev.single = false; return begin(app, { mode: 'versus', p1, p2: PLAYABLE[cur[1]], humans: [true, true], stage }); }
    if (mode === 'cpu') { const stage = STAGE_IDS[Math.floor(Math.random() * STAGE_IDS.length)]; return begin(app, { mode: 'cpu', p1, p2: PLAYABLE[cur[1]], humans: [true, false], stage }); }
    return begin(app, { mode, p1 });
  }
  function confirm(who) {
    sfxPick();
    if (step === 'stage') return finish();
    if (two()) {
      const k = who === 'p2' ? 1 : 0;
      lock[k] = true;
      if (lock[0] && lock[1]) { if (mode === 'versus' || joined) { step = 'stage'; stageSel = 0; } else finish(); }
      return;
    }
    if (step === 'p1') { if (mode === 'cpu' || mode === 'training') { step = 'opp'; cur[1] = cur[0]; } else finish(); }
    else if (step === 'opp') finish();
  }
  function move(who, d) {
    sfxMove();
    if (step === 'stage') { stageSel = (stageSel + d + STAGE_IDS.length + 1) % (STAGE_IDS.length + 1); return; }
    const k = two() ? (who === 'p2' ? 1 : 0) : step === 'opp' ? 1 : 0;
    if (two() && lock[k]) return;
    cur[k] = (cur[k] + d + PLAYABLE.length) % PLAYABLE.length;
  }
  return {
    enter(a) {
      mode = a.mode || 'arcade'; step = 'p1'; joined = false; lock = [false, false]; stageSel = 0; t = 0;
      const last = Math.max(0, PLAYABLE.indexOf(app.meta.lastChar)); cur = [last, last];
      app.dev.single = mode !== 'versus'; app.music(0);
    },
    update(dt) {
      t += dt / 1000;
      let n;
      while ((n = app.dev.popNav())) {
        const who = n.who;
        if (mode === 'arcade' && !joined && who === 'p2' && (n.k === 'confirm' || n.k === 'back' || n.k === 'alt')) { joined = true; app.dev.single = false; sfxPick(); continue; }
        const w1 = two() ? who : 'p1';
        if (n.k === 'left') move(w1, -1); else if (n.k === 'right') move(w1, 1);
        else if (n.k === 'up' && step === 'stage') move(w1, -1); else if (n.k === 'down' && step === 'stage') move(w1, 1);
        else if (n.k === 'confirm') confirm(w1);
        else if (n.k === 'back') {
          if (step === 'stage') step = 'p1';
          else if (two()) { const k = w1 === 'p2' ? 1 : 0; if (lock[k]) lock[k] = false; else if (!lock[0] && !lock[1]) { if (joined && mode === 'arcade') { joined = false; app.dev.single = true; } else exit(); } }
          else if (step === 'opp') step = 'p1'; else exit();
        }
      }
    },
    click(mx, my) {
      for (let i = 0; i < PLAYABLE.length; i++) if (hitRect(cardRect(i), mx, my)) { const k = two() ? (lock[0] ? 1 : 0) : step === 'opp' ? 1 : 0; cur[k] = i; confirm(k ? 'p2' : 'p1'); return; }
    },
    draw(g, W, H, tsec, dt) {
      skyline(g, W, H, tsec); g.save(); g.globalAlpha = 0.55; px(g, 0, 0, W, H, '#0A0614'); g.restore();
      title(g, heading(), W / 2, 6, 1, '#FFE86A');
      PLAYABLE.forEach((id, i) => {
        const r = cardRect(i), d = ROSTER[id];
        const on1 = cur[0] === i, on2 = (two() || step === 'opp') && cur[1] === i;
        panel(g, r.x, r.y, r.w, r.h, on1 && on2 ? '#FFFFFF' : on1 ? '#FFE86A' : on2 ? '#55FFFF' : '#4A5070');
        portrait(g, r.x + (r.w - 40) / 2, r.y + 4, 40, d.portrait || d.sprite);
        text(g, d.short, r.x + r.w / 2, r.y + 49, { scale: 1, align: 'center', color: '#FFFFFF' });
        if (on1) text(g, joined || mode === 'versus' ? 'P1' : step === 'opp' ? 'YOU' : 'P1', r.x + 4, r.y + 4, { scale: 1, color: '#FFE86A', outline: '#1E0A2A' });
        if (on2) text(g, joined || mode === 'versus' ? 'P2' : 'OPP', r.x + r.w - 4, r.y + 4, { scale: 1, align: 'right', color: '#55FFFF', outline: '#0A1A2A' });
        if (lock[0] && on1 || lock[1] && on2) px(g, r.x + 2, r.y + r.h - 5, r.w - 4, 3, '#5FD672');
      });
      const a = ROSTER[PLAYABLE[cur[0]]], b = ROSTER[PLAYABLE[cur[1]]], showB = two() || step === 'opp' || step === 'stage';
      drawIdle(g, a, 96, 246, 1, tsec, dt); if (showB) drawIdle(g, b, W - 96, 246, -1, tsec, dt);
      const info = step === 'opp' ? b : a;
      panel(g, 150, 108, 180, 112);
      text(g, info.short, W / 2, 114, { scale: 2, align: 'center', color: '#FFFFFF', outline: '#1E0A2A' });
      text(g, info.stand, W / 2, 132, { scale: 1, align: 'center', color: '#C8A0FF' });
      info.blurb.forEach((l, i) => text(g, l, W / 2, 148 + i * 11, { scale: 1, align: 'center', color: i === 0 ? '#FFE86A' : '#C8D0F0' }));
      text(g, movelistOf(info.id).list.length + ' MOVES', W / 2, 204, { scale: 1, align: 'center', color: '#9FB0D8' });
      if (step === 'stage') { const id = STAGE_IDS[stageSel]; text(g, '< ' + (id ? STAGES[id].name : 'RANDOM') + ' >', W / 2, 228, { scale: 2, align: 'center', color: '#FFE86A', outline: '#3A0A1E' }); }
      else if (mode === 'arcade' && !joined) text(g, 'PLAYER 2: PRESS A BUTTON ON YOUR KEYS TO JOIN IN', W / 2, H - 14, { scale: 1, align: 'center', color: '#55FFFF', alpha: 0.4 + 0.6 * Math.abs(Math.sin(tsec * 3)) });
      else if (two()) text(g, (lock[0] ? 'P1 READY' : 'P1 CHOOSING') + '      ' + (lock[1] ? 'P2 READY' : 'P2 CHOOSING'), W / 2, H - 14, { scale: 1, align: 'center', color: '#C8D0F0' });
    },
    hint() { return 'LEFT / RIGHT: CHOOSE   ENTER / LP: OK   ESC: BACK'; }
  };
}
