/* The Garden's sky, now and then (Thea's present, once the credits have given you one): a goose crossing the far side of the glass, sometimes two or three in a V, every few minutes
   and no more (goose_life.js: the first after 40 to 240 seconds, then one every 3 to 7 minutes), honking, quietly, as it goes. It is drawn over the sky and under the ground, the pots and
   the night, so the plants stand in front of it and the dark dims it with everything else. Nothing is saved. */
import { passage, stepPassage, flierFrame } from '../goose_life.js';
import { drawGoose, PAL16 } from '../goose_art.js';
import { gifts } from '../gifts_scope.js';
import { playHonk } from '../goose_voice.js';

const VIEW = { w: 700, top: 34, bottom: 112, margin: 60, gap: 34 };      /* where a goose's underside may be: the sprite is 24 high, over the far side of the glass */
export function createFlyover() {
  const G = gifts(), p = passage();
  return {
    step(dt) {
      if (!G.has('goose')) { p.flock = null; return; }
      const plan = stepPassage(p, dt, Math.random, VIEW, 1);
      if (plan) playHonk(plan);
    },
    draw(g) {
      if (!p.flock) return;
      const R = (x, y, w, h, c) => { g.fillStyle = PAL16[c]; g.fillRect(x, y, w, h); };
      p.flock.forEach(f => drawGoose(R, Math.round(f.x), Math.round(f.y), flierFrame(f), 1, f.dir < 0));
    },
    flying: () => !!p.flock
  };
}
