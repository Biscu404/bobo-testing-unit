/* The title and the attract loop (spec 11.1): the logo card, a live CPU-vs-CPU fight on HARD, the high-score table and the control sheet, round and round until a key goes down. */
import { skyline, title, drawIdle, text, px, panel } from './ui_kit.js';
import { createFight } from './fight.js';
import { createAI } from './ai.js';
import { profileOf } from './ai_profiles.js';
import { createRng } from './rng.js';
import { PLAYABLE, defOf } from './roster.js';
import { STAGES, STAGE_IDS } from './stages.js';
import { drawFight, ensureView } from './draw_fight.js';
import { drawFightHUD } from './hud_fight.js';
import { drawTable } from './scene_hiscore.js';
import { wireAudio } from './audio.js';
import { sfxPick } from './audio.js';

const VIEWS = [{ k: 'logo', s: 8 }, { k: 'demo', s: 30 }, { k: 'scores', s: 9 }, { k: 'controls', s: 9 }];

export function titleScene(app) {
  let vi = 0, t = 0, n = 0, demo = null, seen = 0;
  function startDemo() {
    const seed = 'attract' + n++, rng = createRng(seed), a = PLAYABLE[Math.floor(rng.stream('a').random() * PLAYABLE.length)];
    let b = PLAYABLE[Math.floor(rng.stream('b').random() * PLAYABLE.length)]; if (b === a) b = PLAYABLE[(PLAYABLE.indexOf(a) + 1) % PLAYABLE.length];
    const stage = STAGES[STAGE_IDS[Math.floor(rng.stream('s').random() * STAGE_IDS.length)]];
    const fight = createFight({ defs: [defOf(a), defOf(b)], stage, rng, wins: 1, timerFrames: 25 * 60 });
    const ais = [createAI(fight, 0, profileOf('hard'), rng.stream('ai0')), createAI(fight, 1, profileOf('hard'), rng.stream('ai1'))];
    demo = { fight, ais, view: ensureView(fight, false) };
    wireAudio(fight); fight.bus.on('onHit', () => {});
  }
  function next() { vi = (vi + 1) % VIEWS.length; t = 0; if (VIEWS[vi].k === 'demo') startDemo(); }
  return {
    enter() { vi = 0; t = 0; seen = app.dev.pressCount; demo = null; app.dev.single = true; app.music(0); },
    update(dt) {
      t += dt / 1000;
      const v = VIEWS[vi];
      if (v.k === 'demo' && demo) {
        demo.fight.update(dt, s => demo.ais[s].bits());
        if (demo.fight.phase === 'over' || t > v.s) next();
      } else if (t > v.s) next();
      let q; while ((q = app.dev.popNav())) { if (q.k !== 'left' && q.k !== 'right' && q.k !== 'up' && q.k !== 'down') { sfxPick(); return app.go('menu'); } }
      if (app.dev.pressCount !== seen) { seen = app.dev.pressCount; sfxPick(); app.go('menu'); }
    },
    click() { sfxPick(); app.go('menu'); },
    draw(g, W, H, tsec, dt) {
      const v = VIEWS[vi];
      if (v.k === 'demo' && demo) {
        drawFight(g, W, H, demo.fight, demo.view, tsec, dt);
        drawFightHUD(g, W, H, demo.fight, tsec, { noCombo: false });
        panel(g, W / 2 - 52, H - 44, 104, 14); text(g, 'DEMONSTRATION', W / 2, H - 41, { scale: 1, align: 'center', color: '#FFE86A' });
      } else {
        skyline(g, W, H, tsec);
        if (v.k === 'logo') {
          drawIdle(g, defOf('jotaro'), W - 96, H - 8, -1, tsec, dt); drawIdle(g, defOf('kira'), 96, H - 8, 1, tsec, dt);
          text(g, 'A JOJO FIGHTING GAME', W / 2, 44, { scale: 1, align: 'center', color: '#F4C0EC', outline: '#2A0620' });
          title(g, 'STAND', W / 2, 56, 5); title(g, 'BATTLE', W / 2, 98, 5); title(g, 'ARENA', W / 2, 140, 5, '#FFA0CB');
        } else if (v.k === 'scores') { g.save(); g.globalAlpha = 0.55; px(g, 0, 0, W, H, '#0A0614'); g.restore(); drawTable(g, W, H, app.meta.hiscores, -1, tsec); }
        else controlsCard(g, W, H);
      }
      if (v.k !== 'demo' || Math.floor(tsec * 2) % 2 === 0) text(g, 'PRESS ANY KEY', W / 2, H - 22, { scale: 2, align: 'center', color: '#FFFFFF', outline: '#1E2A5A', alpha: 0.6 + 0.4 * Math.sin(tsec * 3) });
    },
    hint() { return 'ANY KEY OR CLICK: START'; }
  };
}

function controlsCard(g, W, H) {
  g.save(); g.globalAlpha = 0.6; px(g, 0, 0, W, H, '#0A0614'); g.restore();
  title(g, 'HOW TO FIGHT', W / 2, 12, 3);
  const rows = [
    ['MOVE', 'A D  /  LEFT RIGHT:   FORWARD, BACK (BACK GUARDS)'], ['CROUCH', 'HOLD DOWN: DUCKS HIGHS, GUARDS LOWS WITH BACK'], ['SIDESTEP', 'TAP UP OR DOWN: INTO THE OTHER LANE'],
    ['PUNCH, KICK', 'F G V B  /  K L , .  =  LP RP LK RK'], ['THROW', 'LP + RP: BEATS GUARD, LOSES TO A SIDESTEP. BREAK IT WITH LP / RP'], ['SPECIALS', 'QUARTER-CIRCLE + BUTTON, OR HOLD BACK THEN FORWARD + BUTTON'],
    ['DASH', 'FORWARD, FORWARD  OR  BACK, BACK'], ['GAMEPAD', 'D-PAD OR STICK, X Y A B = LP RP LK RK, START: PAUSE']
  ];
  rows.forEach((r, i) => { text(g, r[0], 40, 52 + i * 19, { scale: 1, color: '#FFE86A' }); text(g, r[1], 120, 52 + i * 19, { scale: 1, color: '#E4EAFF' }); });
}
