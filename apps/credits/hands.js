/* The hands. When CREDITS.EXE has something to give, each of the four holds out one thing in turn: a gloved hand and an arm in the giver's sleeve come out of the portrait toward the
   middle of the screen, growing as they come (they are coming out of the glass), stop with the thing on the palm, and then the thing goes down to the tray at the bottom while the hand goes
   back. The timeline is pure arithmetic (credits_check.js holds it); drawing it is `drawBeat`. Nothing here knows about the machine: a gift is given when `plan` says the hand has arrived. */
import { HAND, drawGrid, sizeOf, css } from './sprites.js';

export const SLEEVE = { biscu: [9, 1], gheghe: [10, 2], thea: [13, 5], teiteotei: [14, 6] };     /* the colour each wears: the sleeve and its shade */
export const BEAT = { reach: 0.85, hold: 1.55, back: 0.8, step: 3.0 };                      /* seconds: out, holding it out, away; and the time between one hand and the next */
export const START = 0.7;                                                                  /* seconds before the first hand */
export const STAGE = { x: 320, y: 282 };                                                    /* where a hand holds out what it has: the middle of the picture */
export const HAND_SCALE = [2, 6];                                                          /* a pixel of the hand, when it starts and when it has come out */
export const ITEM_SCALE = 5;

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const ease = x => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
const easeOut = x => 1 - Math.pow(1 - clamp(x, 0, 1), 3);
const lerp = (a, b, t) => a + (b - a) * t;

/* items: [{ id, from, ... }] in the order they are given; `anchors` where each giver's arm begins (credits layout) */
export function plan(items, t0 = START) {
  return items.map((it, i) => ({ item: it, from: it.from, at: t0 + i * BEAT.step }));
}
export const lengthOf = beats => beats.length ? beats[beats.length - 1].at + BEAT.reach + BEAT.hold + BEAT.back + 0.4 : 0;

/* where a beat is at time t: phase (wait, reach, hold, back, done), how far through it (u), and when it is the moment the gift is given (`given`) */
export function stateOf(beat, t) {
  const r = t - beat.at;
  if (r < 0) return { phase: 'wait', u: 0, given: false };
  if (r < BEAT.reach) return { phase: 'reach', u: r / BEAT.reach, given: false };
  if (r < BEAT.reach + BEAT.hold) return { phase: 'hold', u: (r - BEAT.reach) / BEAT.hold, given: true };
  if (r < BEAT.reach + BEAT.hold + BEAT.back) return { phase: 'back', u: (r - BEAT.reach - BEAT.hold) / BEAT.back, given: true };
  return { phase: 'done', u: 1, given: true };
}

/* the pose of the hand and of the thing on it, from a beat's state: the wrist (where the arm ends), the size of a pixel of the hand, where the item is and how big */
export function poseOf(st, anchor, slot) {
  if (st.phase === 'wait' || st.phase === 'done') return null;
  let k;                                                     /* how far out the hand is: 0 at the portrait, 1 at the stage */
  if (st.phase === 'reach') k = easeOut(st.u); else if (st.phase === 'hold') k = 1; else k = 1 - ease(st.u);
  const bob = st.phase === 'hold' ? Math.sin(st.u * Math.PI * 4) * 3 : 0;
  const s = lerp(HAND_SCALE[0], HAND_SCALE[1], k), w = HAND[0].length * s, h = HAND.length * s;
  const wrist = { x: lerp(anchor.x, STAGE.x, k), y: lerp(anchor.y, STAGE.y + h * 0.45, k) + bob };       /* the bottom of the hand's sleeve */
  const hand = { x: wrist.x - w / 2, y: wrist.y - h + 2, s };
  /* the thing: on the palm while it is held, then down to its place in the tray while the hand goes back */
  const palm = { x: wrist.x, y: hand.y + h * 0.22 - ITEM_SCALE * 8 - 6 };
  let item = { x: palm.x, y: palm.y, s: lerp(2, ITEM_SCALE, st.phase === 'reach' ? k : 1), show: true };
  if (st.phase === 'back') { const m = ease(st.u); item = { x: lerp(palm.x, slot.x, m), y: lerp(palm.y, slot.y, m) - Math.sin(Math.PI * m) * 46, s: lerp(ITEM_SCALE, slot.s, m), show: true }; }
  return { hand, wrist, item, k, dim: st.phase === 'reach' ? Math.min(1, st.u * 3) : st.phase === 'back' ? 1 - ease(st.u) : 1 };
}

/* ---- drawing ---- */
/* a thick arm from the anchor to the wrist, in the sleeve's colour with a black edge, made of squares so that every pixel is one of the sixteen */
export function drawArm(g, anchor, wrist, thick, sleeve) {
  const n = Math.max(2, Math.ceil(Math.hypot(wrist.x - anchor.x, wrist.y - anchor.y) / 3));
  [[thick + 6, 0], [thick, sleeve[0]]].forEach(([size, col], pass) => {
    g.fillStyle = css(col);
    for (let i = 0; i <= n; i++) {
      const x = lerp(anchor.x, wrist.x, i / n), y = lerp(anchor.y, wrist.y, i / n);
      g.fillRect(Math.round(x - size / 2), Math.round(y - size / 2), size, size);
    }
    if (pass === 1) { g.fillStyle = css(sleeve[1]); for (let i = 0; i <= n; i += 2) { const x = lerp(anchor.x, wrist.x, i / n), y = lerp(anchor.y, wrist.y, i / n); g.fillRect(Math.round(x - thick / 2), Math.round(y - thick / 2), 3, thick); } }
  });
}
/* the hand, then what is on it */
export function drawBeat(g, pose, anchor, sleeve, itemRows) {
  drawArm(g, anchor, pose.wrist, Math.round(pose.hand.s * 6.4), sleeve);
  drawGrid(g, HAND, pose.hand.x, pose.hand.y, pose.hand.s, sleeve);
  if (pose.item.show) { const [iw, ih] = sizeOf(itemRows); drawGrid(g, itemRows, pose.item.x - iw * pose.item.s / 2, pose.item.y - ih * pose.item.s / 2, pose.item.s); }
}
