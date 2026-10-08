/* The key poses of every kind of strike (spec 14). A style is data: where the joints are at the WIND-UP, at the STRIKE, and (for a few) the follow-through.
   pose_fighter.js places them on the move's own frames: the wind-up spans frames 1 .. startup-1, the strike is held across the active frames, the recovery
   eases back over `recovery` frames. Nothing here has a duration.

   Angles are the rig's (anim.js): 0 hangs straight down, positive swings forward, so a punch straight out is about 1.55.
   `s` is the striking limb (an arm [shoulder, elbow] or a leg [hip, knee], whichever the move's button names), `o` the other limb of the same kind;
   every other key is a pose field (chestRot, hipRot, hipX, hipY, headRot, armFront, armRear, legFront, legRear, bodyRot, squashX). A key left out stays where the stance had it. */

export const STYLES = {
  /* ---- punches ---- */
  jab:      { kind: 'arm', wind: { s: [-0.95, 1.95], o: [0.55, 1.55], chestRot: -0.2, hipRot: -0.1, headRot: -0.08 },
                          strike: { s: [1.52, 0.05], o: [0.7, 1.7], chestRot: 0.32, hipRot: 0.15, hipX: 2.4, headRot: 0.12 } },
  cross:    { kind: 'arm', wind: { s: [-0.7, 2.0], o: [-0.2, 1.4], chestRot: -0.38, hipRot: -0.3, hipX: -1.5, hipY: 1.6 },
                          strike: { s: [1.62, 0.03], o: [0.1, 1.9], chestRot: 0.55, hipRot: 0.32, hipX: 3.2, headRot: 0.15, legRear: [-0.5, -0.2] } },
  hook:     { kind: 'arm', wind: { s: [-1.3, 1.7], o: [0.5, 1.6], chestRot: -0.35, hipRot: -0.28, hipY: 1.8 },
                          strike: { s: [1.35, 1.0], o: [0.7, 1.7], chestRot: 0.62, hipRot: 0.38, hipX: 2.8 } },
  elbow:    { kind: 'arm', wind: { s: [-0.4, 2.5], o: [0.5, 1.6], chestRot: -0.25 },
                          strike: { s: [1.15, 2.3], o: [0.6, 1.7], chestRot: 0.45, hipX: 3.4, hipRot: 0.2 } },
  uppercut: { kind: 'arm', wind: { s: [0.35, 0.55], o: [0.5, 1.6], chestRot: -0.15, hipY: 5.2, legFront: [0.7, -1.0], legRear: [-0.6, -0.8] },
                          strike: { s: [2.65, 0.3], o: [0.5, 1.6], chestRot: 0.1, hipY: -1.2, hipX: 1.8, headRot: -0.2, legFront: [0.3, -0.1], legRear: [-0.2, -0.1] } },
  gutpunch: { kind: 'arm', wind: { s: [0.2, 0.6], o: [0.5, 1.6], hipY: 5, chestRot: 0.2, legFront: [0.8, -1.2], legRear: [-0.5, -1.0] },
                          strike: { s: [1.2, 0.15], o: [0.5, 1.6], hipY: 6, chestRot: 0.55, hipX: 2.4 } },
  backfist: { kind: 'arm', wind: { s: [0.1, 0.5], o: [0.5, 1.6], chestRot: -0.5, hipRot: -0.45 },
                          strike: { s: [1.5, 0.2], o: [0.5, 1.6], chestRot: 0.7, hipRot: 0.5, hipX: 2.6 } },
  lunge:    { kind: 'arm', wind: { s: [-0.9, 1.9], o: [0.5, 1.6], chestRot: -0.1, hipY: 3 },
                          strike: { s: [1.6, 0.05], o: [0.5, 1.6], chestRot: 0.7, hipX: 7, legFront: [0.75, -0.1], legRear: [-0.85, -0.5] } },
  finger:   { kind: 'arm', wind: { s: [0.3, 0.4], o: [0.5, 1.6], chestRot: -0.1 },
                          strike: { s: [1.55, 0.0], o: [0.5, 1.6], chestRot: 0.3, hipX: 2.8 } },
  barrage:  { kind: 'arm', alt: true, wind: { s: [-0.9, 1.9], o: [-0.9, 1.9], chestRot: -0.2 },
                          strike: { s: [1.5, 0.1], o: [1.5, 0.1], chestRot: 0.35, hipX: 2.6 } },
  thrust:   { kind: 'arm', wind: { s: [-0.2, 1.2], o: [0.5, 1.6], chestRot: -0.3, hipX: -2, legFront: [0.7, -0.6], legRear: [-0.7, -0.3] },
                          strike: { s: [1.55, 0.0], o: [0.5, 1.6], chestRot: 0.45, hipX: 7, hipY: 3, legFront: [1.0, -0.2], legRear: [-1.0, -0.6] } },
  /* ---- kicks ---- */
  frontkick:  { kind: 'leg', wind: { s: [0.85, -1.9], o: [-0.2, -0.2], chestRot: 0.05 },
                            strike: { s: [1.35, -0.05], o: [-0.15, -0.15], chestRot: -0.15, hipY: 0.4, hipX: 1.5 } },
  roundhouse: { kind: 'leg', wind: { s: [-0.2, -1.6], o: [-0.2, -0.2], chestRot: 0.1, hipRot: -0.2 },
                            strike: { s: [1.65, -0.15], o: [-0.15, -0.15], chestRot: -0.55, hipRot: 0.6, headRot: -0.2, hipX: 1 } },
  sidekick:   { kind: 'leg', wind: { s: [0.9, -1.8], o: [-0.2, -0.2], chestRot: -0.1, hipRot: 0.3 },
                            strike: { s: [1.4, 0.0], o: [-0.15, -0.15], chestRot: -0.75, hipRot: 0.5, hipX: 2.4 } },
  knee:       { kind: 'leg', wind: { s: [-0.55, -1.0], o: [-0.2, -0.2], chestRot: -0.18, hipY: 2 },
                            strike: { s: [1.55, -1.6], o: [-0.15, -0.15], chestRot: 0.3, hipY: -1, hipX: 3 } },
  spinheel:   { kind: 'leg', wind: { s: [-0.3, -1.2], o: [-0.2, -0.2], chestRot: 0.4, hipRot: -0.5, squashX: 0.9 },
                            strike: { s: [1.7, -0.1], o: [-0.15, -0.15], chestRot: -0.6, hipRot: 0.9, hipX: 2, squashX: 1.1 } },
  lowkick:    { kind: 'leg', wind: { s: [0.4, -1.0], o: [-0.4, -0.9], hipY: 5, chestRot: 0.25 },
                            strike: { s: [1.3, 0.0], o: [-0.4, -1.0], hipY: 6, chestRot: 0.3, hipX: 2 } },
  sweep:      { kind: 'leg', wind: { s: [-0.4, -0.8], o: [0.6, -1.4], hipY: 11, chestRot: 0.45 },
                            strike: { s: [1.5, 0.0], o: [0.6, -1.4], hipY: 12, chestRot: 0.3, hipRot: 0.5, hipX: 3 } },
  stomp:      { kind: 'leg', wind: { s: [0.9, -1.7], o: [-0.2, -0.2], chestRot: 0.1 },
                            strike: { s: [0.5, -0.1], o: [-0.2, -0.3], chestRot: 0.45, hipY: 6 } },
  /* ---- grabs ---- */
  throw:      { kind: 'arm', wind: { s: [0.6, 1.0], o: [0.6, 1.0], chestRot: 0.1 },
                            strike: { s: [1.5, 0.3], o: [1.45, 0.3], chestRot: 0.4, hipX: 3 },
                            toss: { s: [3.0, 0.4], o: [2.9, 0.4], chestRot: -0.4, hipX: 1 } }
};
