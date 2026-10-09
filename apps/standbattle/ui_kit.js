/* The pieces every screen is made of: the dusk skyline (it was the title card of the old game), bevelled panels, a vertical menu that answers to keys and the mouse,
   and a fighter standing in a pose for the select and versus screens. Everything is painted with the app's rasterizer and bitmap font. */

import { px, poly, disc, ellipse, vband, dither } from './draw.js';
import { text, textWidth } from './font.js';
import { buffer, stamp } from './layer.js';
import { fighterPose } from './pose_fighter.js';
import { SPRITES } from './sprites.js';
import { SKY, TOWN, FX, BASE, SH, LT } from './palette.js';
import { GROUND_Y } from './constants.js';

export function skyline(g, W, H, tsec) {
  vband(g, 0, 0, W, H, SKY.dusk);
  const sx = W * 0.68, sy = H * 0.44;
  disc(g, sx, sy, 26, '#FFC98A'); disc(g, sx, sy, 19, '#FFF0CC');
  g.save(); g.globalAlpha = 0.14;
  for (let i = -3; i <= 3; i++) poly(g, [[sx, sy], [sx + i * 44 - 60, H], [sx + i * 44 + 20, H]], '#FFD79B');
  g.restore();
  for (let i = 0; i < 4; i++) {
    const x = ((i * 137 + tsec * (3 + i)) % (W + 120)) - 60;
    ellipse(g, x, 30 + i * 13, 26 - i * 3, 5, TOWN.cloud[i % 2 ? BASE : SH]);
    ellipse(g, x - 8, 28 + i * 13, 14, 4, TOWN.cloud[LT]);
  }
  let x = -14, seed = 5;
  while (x < W + 20) {
    seed = (seed * 43 + 19) % 109;
    const w = 34 + seed % 40, h = 46 + seed % 70;
    px(g, x, H - 40 - h, w, h + 40, '#241F38'); px(g, x, H - 40 - h, w, 2, '#3A3152');
    for (let i = 5; i < w - 5; i += 9) for (let j = 9; j < h - 8; j += 13) if ((seed + i + j * 3) % 5 < 2) px(g, x + i, H - 40 - h + j, 4, 6, '#FFD98A');
    x += w + 5;
  }
  px(g, 0, H - 40, W, 40, '#12101E'); dither(g, 0, H - 40, W, 14, null, '#1D1A2E', 6);
}

export function panel(g, x, y, w, h, tone) {
  px(g, x - 2, y - 2, w + 4, h + 4, '#05060C'); px(g, x - 1, y - 1, w + 2, h + 2, tone || '#4A5070'); px(g, x - 1, y - 1, w + 2, 1, '#8A93B8'); px(g, x, y, w, h, '#12141F');
}

export function title(g, str, x, y, scale, color) {
  text(g, str, x, y, { scale: scale || 3, align: 'center', color: color || '#FFE86A', outline: '#3A0A1E', shadow: '#B02F72', shadowDy: 2 });
}

/* a vertical menu: items [{ label, note?, off? }]; returns the rectangles so a click can find an item */
export function menuRects(items, x, y, rowH, w) { return items.map((it, i) => ({ x: x - w / 2, y: y + i * rowH - 2, w, h: rowH - 2, i })); }
export function drawMenu(g, items, sel, x, y, rowH, tsec, opts) {
  const o = opts || {}, scale = o.scale || 2, w = o.w || 200;
  items.forEach((it, i) => {
    const on = i === sel, yy = y + i * rowH;
    if (on) { px(g, x - w / 2, yy - 2, w, rowH - 2, '#2A3366'); px(g, x - w / 2, yy - 2, w, 1, '#8A93B8'); px(g, x - w / 2 - 6 - (Math.sin(tsec * 8) > 0 ? 1 : 0), yy + 2, 4, 6, '#FFE86A'); }
    text(g, it.label, x, yy, { scale, align: 'center', color: it.off ? '#8A8FA8' : on ? '#FFFFFF' : '#C8D0F0', outline: on ? '#1E2A5A' : null });
    if (it.note && on) text(g, it.note, x, yy + scale * 8 + 1, { scale: 1, align: 'center', color: '#FFD98A' });
  });
}
export const hitRect = (r, mx, my) => mx >= r.x && mx < r.x + r.w && my >= r.y && my < r.y + r.h;

/* a fighter standing in the stage's light: the real pose engine on a stand-in fighter, so the select and versus screens show the same figure the fight does */
const dummies = new WeakMap();
export function previewOf(def) {
  if (!dummies.has(def)) dummies.set(def, { state: 'idle', x: 0, y: 0, z: 0, facing: 1, hp: 100, maxHp: 120, def, statuses: [], move: null, mf: 0, walk: 0, crouch: false, guard: false, stun: 0, hurtFlash: 0, slot: 0 });
  return dummies.get(def);
}
export function drawFigure(g, f, pose, x, y, flip, tsec, tint) {
  const b = buffer('fig' + f.slot, 240, 200);
  b.g.save(); b.g.translate(120, 184); SPRITES[f.def.sprite](b.g, pose, f, tsec); b.g.restore();
  stamp(g, b, { x, y, ox: 120, oy: 184, flip: flip || 1, outline: FX.ink, thickOutline: true, shadow: { color: '#000000', alpha: 0.3, skew: 0.9, squash: 0.26 }, tint: tint ? { color: tint, alpha: 0.3 } : null });
}
export function drawIdle(g, def, x, y, flip, tsec, dt, mode) {
  const f = previewOf(def);
  f.state = mode || 'idle';
  const pose = fighterPose(f, tsec, dt || 16);
  drawFigure(g, f, pose, x, y, flip, tsec, def.tint);
}
export { text, textWidth, px, GROUND_Y };
