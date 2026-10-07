/* What the run is asking of the music, as five numbers from 0 to 1, read off a run (the sim) and never written to it. Pure: no clock, no audio;
 * `music_check.js` flies it in Node and `music.js` rides the layers of the tune with it.
 *
 *   build   the way across is going: it comes in over the first fifth to the first half of the flight, and stays
 *   edge    the ship is in the mouth of a gap and close to the stone (or the doorway is coming and it is close to the edge of it)
 *   swarm   locusts are on the screen
 *   gust    the wind has been announced, and while it blows (the warning is a swell: a quarter rising to three quarters, a whole when the push begins)
 *   gate    the last fifth of the flight: the temple is in sight
 * `FEEL` is how quickly each comes in and goes out, in seconds: the heartbeat arrives at once and leaves slowly, the wind arrives over the
 * second it is announced, the locusts stay a while after the last one has gone by so a swarm is one swell and not a stutter.
 */
import { SHIP_X, GUST_WARN, centre } from './sim.js';

export const LAYER_KEYS = ['build', 'edge', 'swarm', 'gust', 'gate'];
export const FEEL = { build: [2.4, 4], edge: [0.12, 0.7], swarm: [0.25, 2.4], gust: [0.45, 1.6], gate: [1.2, 3] };
const clamp01 = v => Math.max(0, Math.min(1, v));
const smooth = v => { v = clamp01(v); return v * v * (3 - 2 * v); };
/* the stone is one doorway wide: how near the ship is to the edge of the nearest one that is on it or about to be, 0 (far) to 1 (touching) */
export const REACH = 80, CLOSE = 14, SLACK = 3;

export function edgeOf(r) {
  let best = null;
  for (const p of r.pillars) {
    if (p.off || p.x < SHIP_X - 12 || p.x > SHIP_X + 16 + REACH) continue;
    if (!best || p.x < best.x) best = p;
  }
  if (!best) return 0;
  const c = r.L.centred ? 100 : centre(r, best);
  const clear = best.gap / 2 - Math.abs(r.y - c);                 /* pixels of room to the nearer edge: negative is in the stone */
  const near = clamp01(1 - Math.max(0, best.x - (SHIP_X + 16)) / REACH);
  return clamp01(1 - (clear - SLACK) / CLOSE) * near;
}
export const buildOf = r => smooth((r.dist / r.L.goal - 0.2) / 0.3);
export const gateOf = r => smooth((r.dist / r.L.goal - 0.8) / 0.1);
export const swarmOf = r => r.locusts.length ? clamp01(0.7 + 0.15 * r.locusts.length) : 0;
export const gustOf = r => r.gust ? (r.gust.t <= GUST_WARN ? 0.25 + 0.5 * smooth(r.gust.t / GUST_WARN) : 1) : 0;

/* the five at this moment */
export function heat(r) {
  return { build: buildOf(r), edge: edgeOf(r), swarm: swarmOf(r), gust: gustOf(r), gate: gateOf(r) };
}
/* one step of a level coming in (fast) or going out (slow) toward what it is asked for, `dt` seconds */
export const lean = (e, target, dt, feel) => e + (target - e) * (1 - Math.exp(-dt / (target > e ? feel[0] : feel[1])));
