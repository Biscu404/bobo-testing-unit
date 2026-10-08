/* The fight's heads-up display (spec 10, 11.7): two life bars with a ghost of the damage just taken, the clock, the round lamps, the combo readouts, and
   the announcements (ROUND, FIGHT, K.O., TIME UP, who won). Chunky bevelled panels in the bitmap font, sized for the 480x270 frame. */

import { px } from './draw.js';
import { text, textWidth } from './font.js';
import { portrait } from './portraits.js';
import { BASE, LT, S, RIM } from './palette.js';

const ghosts = new WeakMap();
const GREEN = ['#0E4A22', '#17692F', '#2FA34A', '#5FD672', '#B6FFC0'], YELLOW = ['#5A4A0B', '#8E7812', '#CFAE1E', '#F6DC4F', '#FFF6C4'], RED = ['#4A0B12', '#7C141E', '#C2242E', '#E85A54', '#FFB0A0'];

function panel(g, x, y, w, h) {
  px(g, x - 2, y - 2, w + 4, h + 4, '#05060C'); px(g, x - 1, y - 1, w + 2, h + 2, '#4A5070'); px(g, x - 1, y - 1, w + 2, 1, '#8A93B8'); px(g, x, y, w, h, '#12141F');
}

function bar(g, x, y, w, h, frac, ghost, ramp, flip) {
  panel(g, x, y, w, h);
  const at = f => (flip ? x + w - Math.round(w * f) : x);
  if (ghost > frac) px(g, at(ghost), y, Math.round(w * ghost), h, '#8E2230');
  const fw = Math.round(w * Math.max(0, Math.min(1, frac)));
  if (fw > 0) {
    px(g, at(frac), y, fw, h, ramp[BASE]); px(g, at(frac), y, fw, Math.max(1, Math.round(h * 0.38)), ramp[LT]);
    px(g, at(frac), y + h - 1, fw, 1, ramp[S]); px(g, flip ? at(frac) : x + fw - 1, y, 1, h, ramp[RIM]);
  }
  for (let i = 1; i < 4; i++) px(g, x + Math.round(w * i / 4), y, 1, h, '#05060C');
}

function lamps(g, x, y, n, got, flip) {
  for (let i = 0; i < n; i++) {
    const on = i < got, xx = flip ? x - i * 11 : x + i * 11;
    px(g, xx, y, 8, 6, '#05060C'); px(g, xx + 1, y + 1, 6, 4, on ? '#FFE05A' : '#2A2F45'); if (on) px(g, xx + 1, y + 1, 6, 1, '#FFFBD0');
  }
}

function side(g, W, f, k, fight, gh) {
  const flip = k === 1, hpf = f.hp / f.maxHp;
  gh[k] += (hpf - gh[k]) * 0.06;
  const x0 = flip ? W - 4 - 22 : 4;
  portrait(g, x0, 6, 22, f.def.portrait || f.def.sprite, { frame: f.statuses.length ? '#FF55FF' : '#6A7396' });
  const bx = flip ? 28 + 2 : 30, bw = W / 2 - 52;
  const bxx = flip ? W - 30 - bw : bx;
  bar(g, bxx, 17, bw, 9, hpf, gh[k], hpf > 0.5 ? GREEN : hpf > 0.25 ? YELLOW : RED, flip);
  text(g, f.def.short || f.def.name, flip ? W - 30 : 30, 6, { scale: 1, align: flip ? 'right' : 'left', color: '#E8ECFF', shadow: '#05060C' });
  lamps(g, flip ? W - 38 : 30, 30, fight.need, fight.wins[k], flip);
  if (f.statuses.length) text(g, f.statuses[0].id.toUpperCase(), flip ? W - 30 - 56 : 30 + 56, 30, { scale: 1, align: flip ? 'right' : 'left', color: '#FF8AFF', outline: '#2A0A2A' });
}

function combo(g, W, f, k, tsec) {
  const c = f.comboOut;
  if (!(c.shown > 0) || c.hits < 2) return;
  const flip = k === 1, x = flip ? W - 14 : 14, fade = Math.min(1, c.shown / 20);
  const pulse = 1 + (c.shown > 90 ? 0.25 : 0);
  g.save(); g.globalAlpha = fade;
  text(g, String(c.hits), x, 52, { scale: 4 * 1, align: flip ? 'right' : 'left', color: c.hits >= 8 ? '#FFF08A' : '#FFD24A', outline: '#3A1A06', shadow: '#7A2A0E', shadowDy: 2 });
  text(g, 'HITS', x, 86, { scale: 1, align: flip ? 'right' : 'left', color: '#FFC94A', outline: '#3A1A06' });
  text(g, c.dmg + ' DMG', x, 96, { scale: 1, align: flip ? 'right' : 'left', color: '#FFFFFF', outline: '#3A1A06' });
  g.restore();
}

function banner(g, W, H, str, color, scale, y, wave, tsec) {
  const w = textWidth(str, scale) + 24, x = (W - w) / 2;
  px(g, x, y - 4, w, scale * 8 + 8, '#0A0C16'); px(g, x, y - 4, w, 1, color); px(g, x, y + scale * 8 + 3, w, 1, color);
  text(g, str, W / 2, y, { scale, align: 'center', color: '#FFFFFF', outline: '#1E0A2A', shadow: color, shadowDy: 2, wave: wave ? { amp: 1, freq: 4, t: tsec } : null });
}

export function drawFightHUD(g, W, H, fight, tsec, opts) {
  const o = opts || {};
  let gh = ghosts.get(fight); if (!gh) { gh = [1, 1]; ghosts.set(fight, gh); }
  const [A, B] = fight.fighters;
  side(g, W, A, 0, fight, gh); side(g, W, B, 1, fight, gh);
  /* the clock */
  panel(g, W / 2 - 18, 6, 36, 24);
  const secs = fight.training ? '--' : fight.timed ? String(Math.max(0, Math.ceil(fight.timer / 60))) : '--';
  text(g, secs.length < 2 ? '0' + secs : secs, W / 2, 11, { scale: 2, align: 'center', color: fight.timed && fight.timer < 600 && !fight.training ? '#FF6B6B' : '#FFFFFF', shadow: '#05060C' });
  text(g, fight.final ? 'FINAL' : 'ROUND ' + fight.round, W / 2, 32, { scale: 1, align: 'center', color: '#9FB0D8', shadow: '#05060C' });
  if (!o.noCombo) { combo(g, W, A, 0, tsec); combo(g, W, B, 1, tsec); }
  /* announcements */
  const ph = fight.phase;
  if (!fight.training) {
    if (ph === 'intro') {
      if (fight.phaseT < 90) banner(g, W, H, fight.final ? 'FINAL ROUND' : 'ROUND ' + fight.round, '#FF6B9E', 3, 104, false, tsec);
      else banner(g, W, H, 'FIGHT!', '#FFE05A', 4, 100, true, tsec);
    } else if (ph === 'fight' && fight.clock < 36) banner(g, W, H, 'FIGHT!', '#FFE05A', 4, 100, true, tsec);
    else if ((ph === 'ko' || ph === 'end') && fight.result) {
      const r = fight.result;
      const head = r.how === 'ring' ? 'RING OUT' : r.how === 'time' ? 'TIME UP' : 'K.O.';
      if (ph === 'ko' || fight.phaseT < 50) banner(g, W, H, r.winner < 0 && r.how !== 'ko' ? 'DRAW' : head, '#FF4A4A', 5, 96, true, tsec);
      else banner(g, W, H, r.winner < 0 ? 'DRAW GAME' : fight.fighters[r.winner].def.short + ' WINS', '#FFE05A', 3, 104, false, tsec);
    }
  }
}
