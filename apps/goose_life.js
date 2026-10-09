/* What a goose does (Thea's present), as plain data stepped by dt seconds: no canvas, no clock, no sound, so Node can hold all of it (node scripts/check-geese.mjs). Every place that has geese
   keeps a few of these and draws them with goose_art.js; the numbers that make them feel the same everywhere are here.
     a swimmer   floats about a body of water (`inside(x, y)` says where it may be), now and then puts its head under, and keeps away from whoever walks up to it;
     a flier     crosses a picture with the wing going round, gliding for a second or two now and then;
     a passage   the *rare* fly-past in the background of the Garden and of Stand Battle: a goose, sometimes two or three in a V, every few minutes;
     a sitter    the one that drops onto Dave's head one time in twenty and stays till the shop is shut;
     a honker    the clock of the noise: every 6 to 22 seconds, never loud. */
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const lerp = (a, b, k) => a + (b - a) * k;

/* ---- the voice ------------------------------------------------------------------------------------------------------------------------------ */
export const HONK_MIN = 6, HONK_MAX = 22;            /* seconds between one honk and the next, whatever the place */
export const HONK_VOL = 0.02;                         /* one voice of a honk; the whole of one adds up to less than a key click */
export const honkIn = r => lerp(HONK_MIN, HONK_MAX, clamp(r, 0, 1));

/* a honk or a quack as the tones to play, Snd.tone's own arguments: a nasal saw that drops, with a square a fifth up to make it thin. Three in ten are quacks (short, higher, in twos and threes). */
export function honkPlan(r1 = Math.random(), r2 = Math.random(), r3 = Math.random()) {
  const quack = r2 < 0.3, base = (quack ? 520 : 360) + r1 * 90;
  const n = quack ? (r3 < 0.4 ? 3 : 2) : (r3 < 0.35 ? 2 : 1), out = [];
  for (let i = 0; i < n; i++) {
    const delay = i * (quack ? 0.12 : 0.26), ms = quack ? 70 : 190 - i * 25, hz = base * (1 - i * 0.05), vol = HONK_VOL * (1 - i * 0.12);
    out.push({ hz, to: hz * (quack ? 0.72 : 0.8), ms, type: 'sawtooth', vol, delay });
    out.push({ hz: hz * 1.5, to: hz * 1.2, ms: ms * 0.8, type: 'square', vol: vol * 0.35, delay });
  }
  return out;
}
export const honkLength = plan => plan.reduce((m, n) => Math.max(m, n.delay + n.ms / 1000), 0);

/* the clock of a place's honking: `step` is told the time, and answers with a plan when it is time (and keeps `open`, how long the bill of whoever honked stays apart, up to date) */
export const honker = (r = Math.random()) => ({ left: honkIn(r), open: 0 });
export function stepHonker(h, dt, rng = Math.random) {
  if (h.open > 0) h.open = Math.max(0, h.open - dt);
  h.left -= dt;
  if (h.left > 0) return null;
  h.left = honkIn(rng());
  const plan = honkPlan(rng(), rng(), rng());
  h.open = clamp(honkLength(plan) + 0.15, 0.3, 1.2);
  return plan;
}

/* ---- afloat ---------------------------------------------------------------------------------------------------------------------------------- */
/* o: { vmax (units a second), dabbleEvery: [min, max] seconds }; x, y in the place's own units */
export function swimmer(rng, x, y, o = {}) {
  return { x, y, hx: x, hy: y, vx: 0, vy: 0, face: rng() < 0.5 ? -1 : 1, turn: 0.5 + rng() * 3, dab: 0, dabIn: lerp(10, 30, rng()), honk: 0, t: rng() * 20,
           vmax: o.vmax || 10, dabbleEvery: o.dabbleEvery || [14, 36], afraid: 0 };
}
/* the shape a swimmer is in: 'dabble' (head down), 'honk' (bill open) or 'swim' */
export const swimFrame = w => (w.dab > 0 ? 'dabble' : w.honk > 0 ? 'honk' : 'swim');
/* `fear` is { x, y, r } of whoever is too close: the goose swims away from it, quicker, for a moment */
export function stepSwimmer(w, dt, inside, rng = Math.random, fear = null) {
  w.t += dt;
  if (w.honk > 0) w.honk = Math.max(0, w.honk - dt);
  if (w.dab > 0) { w.dab = Math.max(0, w.dab - dt); w.vx = w.vy = 0; return w; }
  w.dabIn -= dt; w.turn -= dt;
  let hurry = 1;
  if (fear) {
    const dx = w.x - fear.x, dy = w.y - fear.y, d = Math.hypot(dx, dy);
    if (d < fear.r) { w.vx = (dx / (d || 1)) * w.vmax * 1.5; w.vy = (dy / (d || 1)) * w.vmax * 0.9; w.turn = 1.2; w.afraid = 1.2; hurry = 1; }
  }
  if (w.afraid > 0) w.afraid -= dt;
  else if (w.dabIn <= 0) { w.dab = 1.5 + rng() * 0.7; w.dabIn = lerp(w.dabbleEvery[0], w.dabbleEvery[1], rng()); return w; }
  if (w.turn <= 0) {
    w.turn = lerp(2.5, 7, rng());
    if (rng() < 0.28) { w.vx = w.vy = 0; }                                 /* sit still a while */
    else {
      const toHome = rng() < 0.35, a = toHome ? Math.atan2(w.hy - w.y, w.hx - w.x) + (rng() - 0.5) * 1.2 : rng() * Math.PI * 2, sp = lerp(0.35, 1, rng()) * w.vmax;
      w.vx = Math.cos(a) * sp; w.vy = Math.sin(a) * sp * 0.45;            /* they go along the water more than across it */
    }
  }
  const nx = w.x + w.vx * dt * hurry, ny = w.y + w.vy * dt * hurry;
  if (inside(nx, ny)) { w.x = nx; w.y = ny; }
  else if (inside(nx, w.y)) { w.x = nx; w.vy = -w.vy; }
  else if (inside(w.x, ny)) { w.y = ny; w.vx = -w.vx; }
  else { w.vx = -w.vx; w.vy = -w.vy; w.turn = Math.min(w.turn, 1.5); }
  if (Math.abs(w.vx) > 0.15 * w.vmax) w.face = w.vx < 0 ? -1 : 1;
  return w;
}

/* ---- in the air ------------------------------------------------------------------------------------------------------------------------------ */
export const FLAP_HZ = 2.1;                           /* wing beats a second: a heavy bird */
/* o: { x, y, dir (1 right, -1 left), speed (units a second), size (the scale to draw at) } */
export function flier(rng, o) {
  return { x: o.x, y: o.y, y0: o.y, dir: o.dir || 1, speed: o.speed || 30, size: o.size || 1, t: rng() * 8, ph: rng() * Math.PI * 2, amp: lerp(2, 7, rng()) * (o.size || 1), wing: rng(), glide: 0, honk: 0 };
}
export function stepFlier(f, dt, rng = Math.random) {
  f.t += dt; f.x += f.dir * f.speed * dt;
  f.y = f.y0 + Math.sin(f.t * 0.7 + f.ph) * f.amp;
  if (f.honk > 0) f.honk = Math.max(0, f.honk - dt);
  if (f.glide > 0) f.glide -= dt;
  else { f.wing = (f.wing + dt * FLAP_HZ) % 1; if (rng() < dt * 0.1) f.glide = lerp(1, 2.6, rng()); }
  return f;
}
export const flierFrame = f => (f.glide > 0 ? 'mid' : ['up', 'mid', 'down', 'mid'][Math.floor(f.wing * 4) % 4]);

/* ---- the rare fly-past ----------------------------------------------------------------------------------------------------------------------- */
export const PASS_FIRST = [40, 240], PASS_GAP = [180, 420];     /* seconds until the first, and between one and the next: a few a quarter of an hour at the most */
export const passage = (rng = Math.random) => ({ left: lerp(PASS_FIRST[0], PASS_FIRST[1], rng()), flock: null });
/* a flock of one (6 in 10), two (a quarter) or three, in a loose V behind the leader */
export function flock(rng, view, size = 1) {
  const n = rng() < 0.6 ? 1 : rng() < 0.62 ? 2 : 3, dir = rng() < 0.5 ? -1 : 1, speed = lerp(0.045, 0.075, rng()) * view.w;
  const y = lerp(view.top, view.bottom, rng()), x = dir > 0 ? -view.margin : view.w + view.margin, out = [];
  for (let k = 0; k < n; k++) {
    const row = Math.ceil(k / 2), side = k % 2 ? 1 : -1;
    out.push(flier(rng, { x: x - dir * row * view.gap, y: y + (k ? side * row * view.gap * 0.45 : 0), dir, speed, size }));
  }
  return out;
}
/* `view`: { w, top, bottom (the band they may fly in), margin (how far past the edge they start and end), gap (the V's spacing) }; answers the plans of any honks, quietly */
export function stepPassage(p, dt, rng, view, size = 1) {
  let plan = null;
  if (!p.flock) {
    p.left -= dt;
    if (p.left <= 0) { p.flock = flock(rng, view, size); p.honk = honker(rng()); }
    return plan;
  }
  p.flock.forEach(f => stepFlier(f, dt, rng));
  plan = stepHonker(p.honk, dt, rng);
  if (plan) { const g = p.flock[Math.floor(rng() * p.flock.length)]; g.honk = p.honk.open; }
  if (p.flock.every(f => (f.dir > 0 ? f.x > view.w + view.margin : f.x < -view.margin))) { p.flock = null; p.left = lerp(PASS_GAP[0], PASS_GAP[1], rng()); }
  return plan;
}

/* ---- on Dave's head -------------------------------------------------------------------------------------------------------------------------- */
export const PERCH_ODDS = 20;                         /* one shop in twenty */
export const perches = (rng = Math.random) => rng() * PERCH_ODDS < 1;
export const ARRIVE = 1.1;                            /* seconds from the top of the window to his head */
export function sitter(rng = Math.random) {
  return { t: 0, honk: honker(rng()), tilt: 0, tiltIn: lerp(3, 8, rng()), tiltFor: 0, blinkIn: lerp(2, 5, rng()) };
}
/* the shape and where it is: 0..1 along the way down while it arrives (a curve that slows at the end), then 1 */
export const arrival = s => { const k = clamp(s.t / ARRIVE, 0, 1); return 1 - (1 - k) * (1 - k); };
export const sitFrame = s => (s.t < ARRIVE ? ['up', 'mid', 'down', 'mid'][Math.floor(s.t * FLAP_HZ * 4) % 4] : s.honk.open > 0 ? 'sitHonk' : 'sit');
export function stepSitter(s, dt, rng = Math.random) {
  s.t += dt;
  if (s.t < ARRIVE) return null;
  s.tiltIn -= dt;
  if (s.tiltFor > 0) s.tiltFor -= dt;
  if (s.tiltIn <= 0) { s.tiltFor = 0.4; s.tiltIn = lerp(3, 8, rng()); }
  return stepHonker(s.honk, dt, rng);
}
