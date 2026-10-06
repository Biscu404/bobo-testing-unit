/* Drinking a measure, seen from the chair.

   Nobody is drawn. The glass leaves the table, comes up toward the screen (it is
   being brought to the face of whoever is sitting at the monitor, and so it grows
   as it nears) and is then tipped toward them: its mouth turns to face the viewer
   and the liquor, which stays level with the room, climbs the inside of it and runs
   over the edge nearest to them. None of that is scripted either. The glass is
   an object (glass3d.js); this file only says where it is, and the tipping does the
   rest: what the near edge cannot hold goes over it, and every fifth of a glass that
   goes is a swallow, which the machine feels. */
import { REST, NEAR } from './glass3d.js';
import { clamp, lerp, ease } from './physics.js';

export const DRINK_LEN = 4.6;
const T_UP = 1.15, T_TIP = 3.35;                 /* lifted by here; tipped back by here; down again at DRINK_LEN */
const TH_UP = 0.5, TH_MAX = 1.9;                 /* how far it is tipped on the way up, and at the most */

export const restPose = () => Object.assign({}, REST);

export function startDrink(S) {
  S.phase = 'drink'; S.t = 0; S.gulpAt = -9; S.gulps = 0; S.pending = 0; S.sipDrops = [];
}

export function drinkStep(S, dt, fx) {
  const G = S.gls, t = S.t += dt;
  let lift, th;
  if (t < T_UP) { const e = ease(t / T_UP); lift = e; th = TH_UP * e; }
  else if (t < T_TIP) { lift = 1; th = lerp(TH_UP, TH_MAX, ease((t - T_UP) / (T_TIP - T_UP))); }
  else { const e = ease((t - T_TIP) / (DRINK_LEN - T_TIP)); lift = 1 - e; th = TH_MAX * (1 - e); }
  /* a hand is not steady, and it is less steady the more there has been */
  const shake = Math.min(1, (window.Drunk ? window.Drunk.level : 0) * 1.4) * 2.2 * Math.min(1, lift * 2);
  const bob = (t - S.gulpAt) < 0.4 ? Math.sin((t - S.gulpAt) / 0.4 * Math.PI) * 3 : 0;
  const arc = Math.sin(Math.PI * Math.min(1, lift)) * (t < T_TIP ? 26 : 12);
  G.pose = {
    sx: lerp(REST.sx, NEAR.sx, lift) + Math.sin(t * 9) * shake,
    sy: lerp(REST.sy, NEAR.sy, lift) - arc + bob + Math.cos(t * 7) * shake,
    z: lerp(REST.z, NEAR.z, lift),
    th
  };
  /* a swallow for every fifth of the glass that goes over the edge */
  while (S.pending >= 0.17) {
    S.pending -= 0.17; S.gulps++; S.gulpAt = t;
    fx.sfx.gulp(S.gulps);
    if (window.Drunk && window.Drunk.gulp) window.Drunk.gulp();
  }
  if (t >= DRINK_LEN) { G.pose = restPose(); return true; }
  return false;
}
