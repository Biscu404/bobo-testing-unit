/* The geese in the elephant's window (Thea's present, once the credits have given you one): three afloat on the oasis, four crossing the sky. Made of apps/goose_art.js (the bird),
   goose_life.js (what it does) and goose_voice.js (the honk, which is only ever a little louder than a key click). `R` is the window's rectangle painter, in the sixteen. Nothing is
   saved: they are simply there whenever the place is, and gone when you leave it. */
import { drawGoose } from '../goose_art.js';
import { gifts } from '../gifts_scope.js';
import { swimmer, stepSwimmer, swimFrame, flier, stepFlier, flierFrame, honker, stepHonker } from '../goose_life.js';
import { playHonk } from '../goose_voice.js';

const POOL = { cx: 240, cy: 216, rx: 132, ry: 15 };            /* where a goose's underside may be: well inside the oval the pool is drawn as (rx 156, ry 27) */
const LANES = [{ y0: 201, y1: 210, s: 1 }, { y0: 203, y1: 212, s: 1 }, { y0: 220, y1: 231, s: 2 }];   /* two far off, one near: the near one is twice the size */
const inPool = (x, y) => ((x - POOL.cx) / POOL.rx) ** 2 + ((y - POOL.cy) / POOL.ry) ** 2 <= 1;
const rnd = (a, b) => a + Math.random() * (b - a);

export function createGeese(R) {
  const G = gifts();
  let where = null, birds = [], clock = honker(Math.random());
  const paint = (cx, by, name, s, flip) => drawGoose((x, y, w, h, c) => R(x, y, w, h, c), cx, by, name, s, flip);

  function setup(id) {
    where = id; birds = []; clock = honker(Math.random());
    if (id === 'oase') {
      LANES.forEach((l, i) => {
        const x = POOL.cx + (i - 1) * 90 + rnd(-30, 30), y = (l.y0 + l.y1) / 2;
        const w = swimmer(Math.random, x, y, { vmax: 6 + l.s * 3 });
        w.lane = l;
        w.inside = (px, py) => inPool(px, py) && py >= l.y0 && py <= l.y1;
        birds.push(w);
      });
    } else if (id === 'sky') {
      for (let i = 0; i < 4; i++) {
        const near = i % 2 === 1, dir = i % 2 ? -1 : 1;
        birds.push(flier(Math.random, { x: rnd(-40, 520), y: rnd(26, near ? 150 : 120), dir, speed: near ? rnd(28, 44) : rnd(16, 28), size: near ? 2 : 1 }));
      }
    }
  }

  return {
    /* a place's own clock: called every frame with the seconds since the last, and the id of the place he is in */
    step(dt, id) {
      if (!G.has('goose') || (id !== 'oase' && id !== 'sky')) { if (where) { where = null; birds = []; } return; }
      if (where !== id) setup(id);
      birds.forEach(b => {
        if (id === 'oase') stepSwimmer(b, dt, b.inside);
        else {
          stepFlier(b, dt);
          const out = b.dir > 0 ? b.x > 540 : b.x < -60;
          if (out) { b.x = b.dir > 0 ? -50 : 530; b.y0 = rnd(26, b.size > 1 ? 150 : 120); b.speed = b.size > 1 ? rnd(28, 44) : rnd(16, 28); }
        }
      });
      const plan = stepHonker(clock, dt);
      if (plan) { playHonk(plan); const b = birds[Math.floor(Math.random() * birds.length)]; if (b) b.honk = clock.open; }
    },
    /* the geese of this place, farthest first (called from inside the place's own picture, so what is in front of them is drawn over them) */
    draw(id) {
      if (where !== id) return;
      if (id === 'oase') {
        birds.slice().sort((a, b) => a.y - b.y).forEach(b => {
          const s = b.lane.s, name = swimFrame(b), flip = b.face < 0, bx = Math.round(b.x), by = Math.round(b.y + (Math.sin(b.t * 1.8) > 0.4 ? 1 : 0));
          R(bx - 15 * s, by, 30 * s, 1, 11); R(bx - 9 * s, by + s, 18 * s, 1, 3);                          /* the water it sits in, a ripple round its belly */
          paint(bx, by, name, s, flip);
        });
      } else if (id === 'sky') {
        birds.slice().sort((a, b) => a.size - b.size).forEach(b => paint(Math.round(b.x), Math.round(b.y), flierFrame(b), b.size, b.dir < 0));
      }
    }
  };
}
