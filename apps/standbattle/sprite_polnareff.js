/* Jean Pierre Polnareff — the fencer. One more build on the shared painter in sprite_enemy.js (new art, same rig): lean and tall, a tower of silver hair, a teal
   vest over a pale shirt, and the rapier in the lead hand, which follows the forearm so a thrust is drawn as a thrust. */

import { paint } from './sprite_enemy.js';
import { poly, place, line } from './draw.js';
import { POLNAREFF as P, S, SH, BASE, LT, RIM } from './palette.js';

const BUILD = {
  spec: {
    hipH: 46, spineL: 30, neckL: 12, neckW: 6.5,
    thigh: 24, shin: 21, upper: 19.5, fore: 18.5,
    shoulderW: 20, shoulderPad: 4, chestW: 24, waistW: 19, hipW: 14,
    shoulderDrop: 1.8, footLen: 14, footH: 5, headScale: 1.08, height: 104
  },
  cloth: P.vest, shirt: P.shirt, pants: P.pants, shoe: P.boot, skin: P.skin, collar: false,
  face: { ink: '#10090C', white: '#F4F6FF', iris: '#3A7C9A', brow: '#9AA2B4', tongue: '#8A3A46' },
  hair(g, cx, cy, ang, k, pose) {
    const Q = pts => place(pts, cx, cy, ang, k), f = pose.hairFlow;
    /* the tower: a tall silver flat-top, swept slightly back with the movement */
    poly(g, Q([[-7.4, -5.6], [-6.4, -16], [-1, -21 + f * 2], [6, -19.5 + f * 2], [8.4, -13], [8.6, -6.4], [5, -8], [-3, -8.4]]), P.hair[BASE]);
    poly(g, Q([[-6.2, -15], [-1, -19.8 + f * 2], [5, -18.4 + f * 2], [6.6, -13.6], [1.5, -15.4], [-4, -13.2]]), P.hair[LT]);
    poly(g, Q([[0, -20 + f * 2], [4.6, -18.6 + f * 2], [6, -16], [2.4, -17.6]]), P.hair[RIM]);
    poly(g, Q([[-7.6, -5.4], [-4.8, -6.4], [-6.2 - f * 3, 1], [-8.6 - f * 4, 4.4]]), P.hair[SH]);
    poly(g, Q([[-6.6, -5], [5, -4.2], [6.6, -3.4], [1, -2.8], [-6, -3.4]]), P.hair[S]);
  },
  /* the rapier: along the lead forearm, a cross-guard at the hand, the blade 44 px out */
  after(g, sk, pose) {
    const w = sk.armFront.wrist, a = sk.armFront.foreAng, ux = Math.sin(a), uy = Math.cos(a);
    const reach = pose.telegraph > 0 || pose.smear > 0 ? 46 : 38;
    const hx = w.x + ux * 3, hy = w.y + uy * 3;
    line(g, hx, hy, hx + ux * reach, hy + uy * reach, 2, P.steel[SH]);
    line(g, hx, hy, hx + ux * reach, hy + uy * reach, 1, P.steel[LT]);
    line(g, hx - uy * 5, hy + ux * 5, hx + uy * 5, hy - ux * 5, 2, P.steel[BASE]);
    poly(g, [[hx - 2, hy - 2], [hx + 2, hy - 2], [hx + 2, hy + 2], [hx - 2, hy + 2]], P.vest[LT]);
  }
};

export function drawPolnareff(g, pose) { return paint(g, pose, BUILD); }
export const POLNAREFF_SPEC = BUILD.spec;
