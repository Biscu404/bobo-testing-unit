/* The screen between fights (spec 11.3): who, where, how far up the ladder. It runs itself for TIMING.VS_SECS and a confirm after VS_SKIP_SECS goes on. */
import { skyline, panel, title, drawIdle, text, px } from './ui_kit.js';
import { TIMING } from './timing.js';
import { playFight } from './flow.js';
import { sfxPick } from './audio.js';
import { portrait } from './portraits.js';

export function vsScene(app) {
  let t = 0, S = null, defs = null, cfg = null, go = false;
  return {
    enter() {
      S = app.session; cfg = S.fightConfig(); defs = cfg.defs; t = 0; go = false; app.music(0);
      sfxPick();
    },
    update(dt) {
      t += dt / 1000;
      let n;
      while ((n = app.dev.popNav())) if ((n.k === 'confirm' || n.k === 'start') && t > TIMING.VS_SKIP_SECS) go = true;
      if (go || t >= TIMING.VS_SECS) { go = false; playFight(app); }
    },
    click() { if (t > TIMING.VS_SKIP_SECS) playFight(app); },
    draw(g, W, H, tsec, dt) {
      skyline(g, W, H, tsec);
      g.save(); g.globalAlpha = 0.5; px(g, 0, 0, W, H, '#0A0614'); g.restore();
      const slide = Math.min(1, t / 0.35), ease = 1 - Math.pow(1 - slide, 3);
      drawIdle(g, defs[0], Math.round(-60 + (118 + 60) * ease), 236, 1, tsec, dt);
      drawIdle(g, defs[1], Math.round(W + 60 - (118 + 60) * ease), 236, -1, tsec, dt);
      title(g, 'VS', W / 2, 96, 6, '#FFFFFF');
      panel(g, 14, 22, 150, 30); panel(g, W - 164, 22, 150, 30);
      portrait(g, 18, 26, 22, defs[0].portrait || defs[0].sprite); portrait(g, W - 40, 26, 22, defs[1].portrait || defs[1].sprite);
      text(g, defs[0].short, 46, 26, { scale: 2, color: '#FFFFFF', outline: '#1E0A2A' }); text(g, defs[0].stand, 46, 43, { scale: 1, color: '#C8D0F0' });
      text(g, defs[1].short, W - 46, 26, { scale: 2, align: 'right', color: '#FFFFFF', outline: '#1E0A2A' }); text(g, defs[1].stand, W - 46, 43, { scale: 1, align: 'right', color: '#C8D0F0' });
      text(g, cfg.label, W / 2, 150, { scale: 2, align: 'center', color: '#FFE86A', outline: '#3A0A1E' });
      text(g, cfg.stage.name, W / 2, 172, { scale: 1, align: 'center', color: '#E4EAFF' });
      text(g, S.mode === 'versus' ? 'TWO PLAYERS' : S.tier.toUpperCase(), W / 2, 184, { scale: 1, align: 'center', color: '#9FB0D8' });
      if (cfg.boss) text(g, 'BOSS', W / 2, 200, { scale: 2, align: 'center', color: '#FF6B9E', outline: '#2A0620' });
      if (t > TIMING.VS_SKIP_SECS) text(g, 'PRESS TO FIGHT', W / 2, H - 22, { scale: 1, align: 'center', color: '#FFFFFF', alpha: 0.5 + 0.5 * Math.sin(tsec * 6) });
    },
    hint() { return 'ENTER / LP: SKIP'; }
  };
}
