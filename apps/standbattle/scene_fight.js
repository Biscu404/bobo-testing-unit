/* The fight scene, for every mode (spec 10): builds the fight from a config, feeds it frames from the devices or the CPU, draws it, and hands the finished match back.

   enter({ defs: [a, b], stage, humans: [bool, bool], ais: [profile|null, ...], rng, wins, timerFrames, hp, carry, training, onEnd(match, fight), label })  */

import { createFight } from './fight.js';
import { wireAudio, sfxVictory, sfxDefeat } from './audio.js';
import { drawFight, ensureView } from './draw_fight.js';
import { drawFightHUD } from './hud_fight.js';
import { createRng } from './rng.js';
import { text } from './font.js';
import { px } from './draw.js';

export function fightScene(app) {
  let fight = null, view = null, cfg = null, ais = [null, null], paused = false, endDelay = 0, ended = false;
  const bitsOf = slot => (cfg.humans[slot] ? app.dev.bits(slot) : ais[slot] ? ais[slot].bits() : 0);
  return {
    enter(c) {
      cfg = c;
      fight = createFight({ defs: c.defs, stage: c.stage, rng: c.rng || createRng('fight'), training: c.training, wins: c.wins, timerFrames: c.timerFrames, hp: c.hp, carry: c.carry });
      wireAudio(fight);
      view = ensureView(fight, app.meta.shakeEnabled);
      ais = (c.ais || []).map((p, k) => (c.humans[k] ? null : (c.makeAI ? c.makeAI(fight, k, p) : null)));
      app.dev.single = !(c.humans[0] && c.humans[1]);
      app.dev.release();
      app.music(1);
      if (c.onStart) c.onStart(fight);
      app.fight = fight;
    },
    leave() { app.fight = null; },
    shake(on) { if (view) view.juice.setShakeEnabled(on); },
    update(dt) {
      let nav;
      while ((nav = app.dev.popNav())) if (nav.k === 'pause' && fight.phase !== 'over') { paused = !paused; app.dev.release(); }
      if (paused) return;
      fight.update(dt, bitsOf);
      if (cfg.tick) cfg.tick(fight, dt);
      const hp = fight.fighters.map(f => f.hp / f.maxHp);
      app.music(fight.phase === 'over' ? 0 : (fight.final || fight.def_boss || Math.min(hp[0], hp[1]) < 0.3) ? 2 : 1);
      if (fight.phase === 'over' && !ended) { ended = true; endDelay = 0; }
      if (ended) { endDelay += dt; if (endDelay > 400 && cfg.onEnd) { const f = cfg.onEnd; cfg.onEnd = null; f(fight.match, fight); } }
    },
    draw(g, W, H, tsec, dt) {
      drawFight(g, W, H, fight, view, tsec, dt, { overlay: cfg.overlay });
      drawFightHUD(g, W, H, fight, tsec, cfg.hud);
      if (cfg.drawHud) cfg.drawHud(g, W, H, fight, tsec);
      if (paused) {
        g.save(); g.globalAlpha = 0.6; px(g, 0, 0, W, H, '#000000'); g.restore();
        text(g, 'PAUSED', W / 2, H / 2 - 12, { scale: 4, align: 'center', color: '#FFFFFF', outline: '#1E0A2A' });
        text(g, 'ESC OR ENTER TO CONTINUE', W / 2, H / 2 + 28, { scale: 1, align: 'center', color: '#C8D0F0' });
      }
    },
    hint() { return cfg && cfg.hint ? cfg.hint : 'WASD/ARROWS: MOVE (TAP UP/DOWN: SIDESTEP)  F G V B / K L , . : LP RP LK RK  LP+RP: THROW  ESC: PAUSE'; }
  };
}
