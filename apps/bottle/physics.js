/* The small physics the table runs on. */
export const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const ease = x => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
export const GRAV = 520;                      /* px/s^2: the stream's arc */

/* how full a measure leaves things */
export const JAG_FULL = 700, JAG_SHOT = 40;
export const BOT_FULL = 0.88;                            /* how much of the inside a full bottle fills: to the foot of the neck */
export const SHOT_FRAC = (JAG_SHOT / JAG_FULL) * BOT_FULL;   /* of the bottle's inside, per measure */
export const POURED_FILL = 0.8;                          /* how high one measure fills the tumbler */

/* The surface of a liquid in something that is being moved does not stay level:
   it lags. This is that lag, a spring that is pushed by the container's
   sideways acceleration and its turning, and settles back to flat. `a` is the
   surface's angle in the room (clockwise positive). */
export function makeSlosh() { return { a: 0, w: 0, x: 0, y: 0, vx: 0, th: 0, tw: 0, ready: false }; }

export function stepSlosh(s, x, y, th, dt, gain) {
  if (!s.ready || dt <= 0) { s.x = x; s.y = y; s.th = th; s.vx = 0; s.tw = 0; s.ready = true; return; }
  const vx = (x - s.x) / dt, tw = (th - s.th) / dt;
  const ax = clamp((vx - s.vx) / dt, -4000, 4000), aw = clamp((tw - s.tw) / dt, -80, 80);
  s.x = x; s.y = y; s.th = th; s.vx = vx; s.tw = tw;
  const target = clamp((Math.atan(ax / 3000) + aw * 0.0025) * (gain == null ? 1 : gain), -0.2, 0.2);
  const k = 95, c = 6.5;
  s.w += (k * (target - s.a) - c * s.w) * dt;
  s.a = clamp(s.a + s.w * dt, -0.22, 0.22);
}

/* where a stream goes: leaves the lip at (x, y) with velocity (vx, vy), falls under gravity
   to height `floor`. Returns the time it takes and where it lands. */
export function arc(x, y, vx, vy, floor) {
  const dy = Math.max(6, floor - y);
  const t = (-vy + Math.sqrt(vy * vy + 2 * GRAV * dy)) / GRAV;
  return { t, x: x + vx * t, dy };
}
