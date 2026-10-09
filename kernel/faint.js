/* One sip is enough: what the screen does in the 3.4 seconds between the first swallow and the lights going out, with LORE ACCURATE on. Pure arithmetic (node scripts/check-lore.mjs):
   `frame(p)` says, for p from 0 to 1, how the room is tilted, sunk, blurred and darkened and what is drawn over it. kernel/drunk.js applies it to #room and the overlay, and plays the
   sounds at the moments named here.

     0.00 - 0.35   the reel: the room leans the wrong way, a little, and comes closer; a drone
     0.35 - 0.62   the fall: it tips over to the right, faster and faster, and sinks
     0.62          the table: a white flash, a shake, a thud
     0.62 - 1.00   dark: the lids close from top and bottom, stars go round, ONE SIP. LORE ACCURATE.
   Then the blackout, as always (kernel/blackout.js). */
export const FAINT_SECS = 3.4;
export const AT = { fall: 0.35, thud: 0.62, ring: 0.7 };

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const sm = x => x * x * (3 - 2 * x);

export function frame(p) {
  p = clamp(+p || 0, 0, 1);
  const reel = sm(clamp(p / AT.fall, 0, 1)), fall = sm(clamp((p - AT.fall) / (AT.thud - AT.fall), 0, 1)), dark = sm(clamp((p - AT.thud) / (1 - AT.thud), 0, 1));
  const since = p - AT.thud, hit = since >= 0 && since < 0.12 ? 1 - since / 0.12 : 0;
  return {
    rot: -5 * Math.sin(reel * Math.PI) * (1 - fall) + 78 * fall * fall,         /* degrees, clockwise */
    ty: 230 * fall * fall,                                                        /* px down */
    tx: 40 * fall,
    zoom: 1 + 0.07 * reel * (1 - fall) - 0.03 * fall,
    blur: 3 * reel + 5 * fall + 2 * dark,
    bright: 1 - 0.55 * dark - 0.1 * fall,
    lids: clamp(dark * 1.25, 0, 1) * 50,                                          /* each lid, as a percentage of the height: both closed at 50 */
    shake: hit,                                                                   /* 1 at the thud, 0 a moment later: the screen jumps by this much */
    flash: hit > 0.55 ? (hit - 0.55) / 0.45 : 0,                                  /* the white of the thud */
    stars: p >= AT.thud + 0.02 && p < 0.96 ? clamp((p - AT.thud - 0.02) / 0.08, 0, 1) * clamp((0.96 - p) / 0.06, 0, 1) : 0,
    text: p >= 0.68 && p < 0.99 ? clamp((p - 0.68) / 0.06, 0, 1) * clamp((0.99 - p) / 0.04, 0, 1) : 0,
    done: p >= 1
  };
}

/* where the stars are, for stage `a` (radians, going round): an ellipse above the middle of the room, in fractions of its width and height */
export const starAt = (i, n, a) => ({ x: 0.5 + Math.cos(a + i * 2 * Math.PI / n) * 0.2, y: 0.34 + Math.sin(a + i * 2 * Math.PI / n) * 0.07 });
