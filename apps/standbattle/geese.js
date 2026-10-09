/* Stand Battle's sky, now and then (Thea's present, once the credits have given you one): a goose crossing the far side of the stage, sometimes two or three in a V, every few minutes and no
   more, honking, quietly, as it goes. It is part of the picture and of nothing else: it is drawn over the sky (and the clouds) and under the town, the fighters and everything the sim has
   a say in, it does not touch the sim's dice or its clock (the picture's own `tsec` keeps its time), and a game with no goose has none. It is tinted into the stage's own light so it is far away. */
import { passage, stepPassage, flierFrame } from '../goose_life.js';
import { drawGoose } from '../goose_art.js';
import { gifts } from '../gifts_scope.js';
import { playHonk } from '../goose_voice.js';

/* what the digits of a goose are on a warm evening and on a night stage */
const DUSK = ['#3A1E40', '#000000', '#000000', '#000000', '#B03040', '#000000', '#9A6A4A', '#C79AA8', '#000000', '#000000', '#000000', '#000000', '#000000', '#000000', '#E8C078', '#FFE6D2'];
const NIGHT = ['#0B1030', '#000000', '#000000', '#000000', '#B03040', '#000000', '#7A6A50', '#7C88B0', '#000000', '#000000', '#000000', '#000000', '#000000', '#000000', '#B8A468', '#B8C4E8'];
const G = () => gifts();
let p = null, last = null;
export const flying = () => !!(p && p.flock);                 /* for the checks: is one in the sky now */

export function drawFlyover(g, W, H, tsec, camX, kind) {
  if (!G().has('goose')) { p = null; return; }
  const view = { w: W, top: 32, bottom: Math.round(H * 0.2), margin: 50, gap: 30 };     /* a goose's underside is somewhere in the strip above the roofs */
  if (!p) p = passage();
  const dt = last == null ? 0 : Math.max(0, Math.min(0.1, tsec - last));
  last = tsec;
  const plan = stepPassage(p, dt, Math.random, view, 1);
  if (plan) playHonk(plan);
  if (!p.flock) return;
  const pal = kind === 'park' || kind === 'store' ? NIGHT : DUSK, shift = Math.round(camX * 0.03);
  const R = (x, y, w, h, c) => { g.fillStyle = pal[c]; g.fillRect(x, y, w, h); };
  p.flock.forEach(f => drawGoose(R, Math.round(f.x) - shift, Math.round(f.y), flierFrame(f), 1, f.dir < 0));
}
