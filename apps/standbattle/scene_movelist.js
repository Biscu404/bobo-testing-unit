/* The move list (spec 11): every move of the fighter, its command, height and frame data, straight from the rows the sim runs on. */
import { skyline, panel, title, text, px } from './ui_kit.js';
import { PLAYABLE, ROSTER, movelistOf } from './roster.js';
import { sfxMove } from './audio.js';
import { emit } from './trophies_bridge.js';

const ROWS = 14;
const ARROW = { f: 'F', b: 'B', d: 'D', df: 'D/F', db: 'D/B' };
export const cmdText = m => {
  const c = m.cmd;
  if (c.kind === 'chain') return c.parent.toUpperCase().replace(/_/g, ' ') + ' > ' + btn(c.buttons);
  const b = btn(c.buttons);
  if (c.kind === 'motion') return { qcf: 'QCF', qcb: 'QCB', ch: 'CHARGE B~F' }[c.motion] + '+' + b;
  if (c.kind === 'dash') return 'F,F+' + b;
  return (c.dir ? ARROW[c.dir] + '+' : '') + b;
};
const btn = mask => ['LP', 'RP', 'LK', 'RK'].filter((n, i) => mask & (16 << i)).join('+');
export const advText = v => (v == null ? '--' : v > 0 ? '+' + v : String(v));

export function movelistScene(app) {
  let who = 0, top = 0, sel = 0;
  const list = () => movelistOf(PLAYABLE.concat(['boss'])[who]).list;
  return {
    enter() { who = Math.max(0, PLAYABLE.indexOf(app.meta.lastChar)); top = 0; sel = 0; app.music(0); emit('movelist-open', {}); },
    update() {
      let n;
      while ((n = app.dev.popNav())) {
        const L = list();
        if (n.k === 'up') { sel = (sel + L.length - 1) % L.length; sfxMove(); } else if (n.k === 'down') { sel = (sel + 1) % L.length; sfxMove(); }
        else if (n.k === 'left') { who = (who + PLAYABLE.length) % (PLAYABLE.length + 1); sel = 0; sfxMove(); } else if (n.k === 'right') { who = (who + 1) % (PLAYABLE.length + 1); sel = 0; sfxMove(); }
        else if (n.k === 'back' || n.k === 'confirm') app.go('menu');
        if (sel < top) top = sel; if (sel >= top + ROWS) top = sel - ROWS + 1;
      }
    },
    click() { app.go('menu'); },
    draw(g, W, H, tsec) {
      skyline(g, W, H, tsec); g.save(); g.globalAlpha = 0.65; px(g, 0, 0, W, H, '#0A0614'); g.restore();
      const id = PLAYABLE.concat(['boss'])[who], d = ROSTER[id], L = list();
      title(g, d.short + '  (' + L.length + ' MOVES)', W / 2, 8, 2);
      panel(g, 14, 30, W - 28, 218);
      text(g, 'MOVE', 20, 34, { scale: 1, color: '#9FB0D8' }); text(g, 'COMMAND', 150, 34, { scale: 1, color: '#9FB0D8' }); text(g, 'HT', 270, 34, { scale: 1, color: '#9FB0D8' });
      text(g, 'ST', 292, 34, { scale: 1, color: '#9FB0D8' }); text(g, 'AC', 316, 34, { scale: 1, color: '#9FB0D8' }); text(g, 'RC', 340, 34, { scale: 1, color: '#9FB0D8' });
      text(g, 'HIT', 372, 34, { scale: 1, color: '#9FB0D8' }); text(g, 'BLK', 410, 34, { scale: 1, color: '#9FB0D8' }); text(g, 'DMG', 446, 34, { scale: 1, color: '#9FB0D8' });
      for (let i = 0; i < ROWS; i++) {
        const m = L[top + i]; if (!m) break;
        const y = 48 + i * 14, on = top + i === sel;
        if (on) px(g, 16, y - 2, W - 32, 13, '#2A3366');
        const col = on ? '#FFFFFF' : '#C8D0F0', hc = { high: '#FF9A9A', mid: '#FFE86A', low: '#7AE0FF', throw: '#FF8AFF' }[m.height];
        text(g, m.name.slice(0, 24), 20, y, { scale: 1, color: col }); text(g, cmdText(m).slice(0, 24), 150, y, { scale: 1, color: col });
        text(g, m.h.toUpperCase(), 270, y, { scale: 1, color: hc }); text(g, 'I' + m.startup, 292 - 6, y, { scale: 1, color: col }); text(g, String(m.active), 318, y, { scale: 1, color: col }); text(g, String(m.recovery), 342, y, { scale: 1, color: col });
        const hit = m.launching ? (m.reaction === 'launch' ? 'LAUNCH' : m.reaction === 'bounce' ? 'BOUNCE' : 'DOWN') : advText(m.adv.hit);
        text(g, m.h === 't' ? 'THROW' : hit, 372, y, { scale: 1, color: m.launching || m.adv.hit > 0 ? '#7AF08A' : '#FF9A9A' });
        text(g, m.h === 't' ? '--' : advText(m.adv.block), 410, y, { scale: 1, color: m.adv.block >= 0 ? '#7AF08A' : m.adv.block <= -10 ? '#FF7A7A' : '#FFC8A0' }); text(g, String(m.dmg), 446, y, { scale: 1, color: col });
      }
      const m = L[sel];
      text(g, (m.special ? 'SPECIAL.  ' : '') + (m.track !== 'none' ? 'TRACKS: ' + m.track.toUpperCase() + '.  ' : 'LINEAR.  ') + 'REACH ' + m.reach + (m.juggle ? '.  JUGGLES' : '') + (m.splat ? '.  WALL SPLAT' : '') + (m.ch ? '.  COUNTER HIT LAUNCHES' : '') + (m.status ? '.  MARKS: ' + m.status.id.toUpperCase() : ''), W / 2, 254, { scale: 1, align: 'center', color: '#FFD98A' });
      text(g, '< ' + d.short + ' >', W / 2, 262, { scale: 1, align: 'center', color: '#9FB0D8' });
    },
    hint() { return 'UP / DOWN: MOVES   LEFT / RIGHT: FIGHTER   ESC: BACK'; }
  };
}
