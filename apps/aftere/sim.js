/* AfterEgypt — one run, as plain data and a step. No canvas, no DOM, no clock: `aftere_check.js` flies it in Node.
 *
 * The sky is 320 x 200. The ship sits at SHIP_X and only ever moves up and down; the world comes to it at `L.speed` pixels
 * a frame, 60 frames a second. A pillar is a gap (centre `cy`, height `gap`) in a column; a locust is a small thing that
 * crosses faster than the world; a gust leans on the ship for a second and a half, and says so a second before; a coin and
 * an ankh sit in a doorway. Everything that can be hit has a way past it that the ship can fly, and that is arranged here,
 * not hoped for: the next gap's middle is never further from the last than `maxShift`, and a locust is never loosed so that
 * it would arrive in a doorway as you do (`blocked`).
 */
export const W = 320, H = 200, SHIP_X = 30, RING = 7, GROUND = 186, LOCUSTS_MAX = 4;
const INV = 90, GUST_WARN = 60, GUST_LEN = 90, GUST_PUSH = 0.9;

const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* the furthest, in pixels, one gap's middle may sit from the one before it: what the ship can fly between two pillars,
   less the swing of both, times how far this tier is allowed to lean on that. */
export const maxShift = L => Math.max(0, L.follow * (L.space / L.speed) * L.wander - 2 * L.wobble);

export function createRun(L, rng = Math.random) {
  const r = { L, rng, t: 0, dist: 0, y: 100, vy: 0, aim: 100, dead: false, won: false, shield: 0, inv: 0, hits: 0, coins: 0,
              pillars: [], items: [], locusts: [], gust: null, nextGust: 300 + (rng() * 300 | 0), lastCy: 100, ev: [] };
  for (let i = 0; i < RING; i++) {
    const p = { x: 340 + i * L.space, cy: 100, gap: 0, ph: 0, off: false };
    arrange(r, p);
    r.pillars.push(p);
  }
  return r;
}

/* the gap at the middle of a pillar's life: how far into the run it will be when it reaches the ship decides how tight it is */
export function arrange(r, p) {
  const L = r.L, rng = r.rng;
  const arrive = r.dist + (p.x - SHIP_X);
  const prog = clamp(arrive / L.goal, 0, 1);
  p.off = arrive > L.goal - 60;
  p.ph = rng() * 6.283;
  if (L.centred) {                                   /* PILGRIM, as it was: always in the middle, 55 to 130 */
    p.gap = L.gap[0] + rng() * (L.gap[1] - L.gap[0]); p.cy = 100; p.base = 100; p.wob = 0;
    return;
  }
  const g = lerp(L.gap[1], L.gap[0], Math.pow(prog, 0.8)) * (1 - L.squeeze * prog) * (0.92 + rng() * 0.16);
  p.gap = Math.max(26, g);
  p.wob = L.wobble;
  const lo = p.gap / 2 + 14 + p.wob, hi = GROUND - 8 - p.gap / 2 - p.wob;
  p.base = clamp(r.lastCy + (rng() * 2 - 1) * maxShift(L), lo, hi);
  r.lastCy = p.base;
  p.cy = p.base;
  if (p.off) return;
  if (rng() < L.coins) r.items.push({ x: p.x + 8, y: p.base + (rng() - 0.5) * p.gap * 0.4, k: 'coin' });
  if (rng() < L.ankh) r.items.push({ x: p.x + 8, y: p.base, k: 'ankh' });
}

/* where the middle of a pillar's gap is right now */
export const centre = (r, p) => p.base + (p.wob ? p.wob * Math.sin(p.ph + r.t * 0.045) : 0);

/* would a locust loosed at height y reach the ship as a doorway does? */
function blocked(r, y, v) {
  const f = (W + 16 - SHIP_X) / v;
  for (const p of r.pillars) {
    if (p.off) continue;
    const x = p.x - r.L.speed * f;
    if (x > SHIP_X - 24 && x < SHIP_X + 30 && Math.abs(y - p.base) < p.gap / 2 + p.wob + 10) return true;
  }
  return false;
}

function hit(r, pushTo) {
  if (r.inv > 0 || r.dead || r.won) return;
  r.hits++;
  if (r.shield > 0) { r.shield--; r.inv = INV; r.ev.push('shield'); if (pushTo != null) r.y = pushTo; return; }
  r.dead = true; r.ev.push('dead');
}

/* one frame. `inp`: { aim } when the pointer moved (a y in the sky), { dir } -1 / 0 / 1 for the keys. */
export function stepRun(r, inp) {
  const L = r.L, rng = r.rng;
  r.ev.length = 0;
  if (r.dead || r.won) return r;
  r.t++;
  if (r.inv > 0) r.inv--;

  if (L.follow === Infinity) {                       /* the pointer is the ship; the keys are a little engine */
    if (inp.aim != null) { r.y = clamp(inp.aim, 10, 190); r.vy = 0; }
    r.vy += (inp.dir || 0) * 0.55;
    r.vy = r.vy * 0.9 + 0.1;
    r.y += r.vy;
  } else {                                           /* the pointer is a place to be; the ship goes there at its own pace */
    if (inp.aim != null) r.aim = clamp(inp.aim, 10, 190);
    if (inp.dir) r.aim = clamp(r.aim + inp.dir * L.follow, 10, 190);
    r.y += clamp(r.aim - r.y, -L.follow, L.follow);
  }

  if (L.wind) {
    if (r.gust) {
      r.gust.t++;
      if (r.gust.t > GUST_WARN) r.y += r.gust.dir * GUST_PUSH;
      if (r.gust.t > GUST_WARN + GUST_LEN) { r.gust = null; r.nextGust = r.t + 420 + (rng() * 420 | 0); }
    } else if (r.t >= r.nextGust) { r.gust = { dir: rng() < 0.5 ? -1 : 1, t: 0 }; r.ev.push('gust'); }
  }
  if (r.y < 8) { r.y = 8; r.vy = 0; }
  if (r.y > 192) { r.y = 192; r.vy = 0; }

  r.dist += L.speed;
  if (r.dist >= L.goal) { r.won = true; r.ev.push('win'); return r; }

  for (const p of r.pillars) {
    p.x -= L.speed;
    if (p.x < -30) { p.x += RING * L.space; arrange(r, p); }
    if (p.off) continue;
    /* PILGRIM keeps the window it always had; the others are hit exactly where the picture overlaps: the pillar's 16 pixels against the ship's 22 to 38 */
    if (L.centred ? p.x < 46 && p.x > 14 : p.x < 38 && p.x > 6) {
      const c = L.centred ? 100 : centre(r, p), top = c - p.gap / 2, bot = c + p.gap / 2;
      if (r.y < top || r.y > bot) hit(r, clamp(r.y, top + 4, bot - 4));
    }
  }

  for (let i = r.items.length - 1; i >= 0; i--) {
    const it = r.items[i];
    it.x -= L.speed;
    if (it.x < -20) { r.items.splice(i, 1); continue; }
    if (Math.abs(it.x - SHIP_X) < 10 && Math.abs(it.y - r.y) < 9) {
      r.items.splice(i, 1);
      if (it.k === 'coin') { r.coins++; r.ev.push('coin'); } else { r.shield = Math.min(2, r.shield + 1); r.ev.push('ankh'); }
    }
  }

  if (L.locust && r.dist > 400 && r.locusts.length < LOCUSTS_MAX && rng() < L.locust) {
    const v = L.speed + 1.4 + rng() * 1.2;
    for (let tries = 0; tries < 4; tries++) {
      const y = 22 + rng() * 156;
      if (!blocked(r, y, v)) { r.locusts.push({ x: W + 16, y, v, ph: rng() * 6.283 }); break; }
    }
  }
  for (let i = r.locusts.length - 1; i >= 0; i--) {
    const l = r.locusts[i];
    l.x -= l.v;
    if (l.x < -16) { r.locusts.splice(i, 1); continue; }
    if (Math.abs(l.x - SHIP_X) < 9 && Math.abs(l.y - r.y) < 6) { r.locusts.splice(i, 1); hit(r, null); }
  }
  return r;
}
