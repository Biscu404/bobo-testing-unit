/* Pouring a measure, the way a hand does it.

   The bottle is lifted, carried over the glass and tipped. Nothing about the
   flow is scripted: liquid leaves when the surface inside the turned bottle
   stands above the lower edge of the lip, in proportion to how far above it
   (a weir: flow goes as head to the 3/2), and the hand keeps tipping a little
   further to hold that head steady as the bottle empties -- until one measure
   has gone, when it tips back and the flow dies off to a few drops. The lip
   is steered so the stream lands in the middle of the glass. */
import { BOT, GLS } from './art.js';
import { rot } from './raster.js';
import { geometry, innerArea } from './shapes.js';
import { clamp, lerp, ease, arc, SHOT_FRAC, POURED_FILL, GRAV, sway, drift, lurch } from './physics.js';

const KQ = 46;                                   /* flow, px^2 per second, per px of head ^ 1.5, from the Jägermeister's bottle */
const N_JAG = innerArea(geometry('jag'));        /* how much that one holds, in pixels: another bottle's flow is in proportion */
const CARRY = 0.7, RETURN = 0.6;
export const POUR_MIN = 3.5;                       /* no pour is shorter than this, from any bottle: the pace of the journey is held to it (check-drunk.mjs) */
const REST_C = [BOT.rest[0], BOT.rest[1] - BOT.cy];
/* the lower lip, from the bottle's middle: every bottle has its own (shapes.js, handed over as `B.geo`); the Jägermeister's is BOT.lip */
const lipC = B => { const g = (B && B.geo) || BOT; return [g.lip[0], g.lip[1] + BOT.cy]; };
export const lipWorld = (C, a, B) => { const L = lipC(B), r = rot(L[0], L[1], a); return [C[0] + r[0], C[1] + r[1]]; };
const centreFor = (lip, a, B) => { const L = lipC(B), r = rot(L[0], L[1], a); return [lip[0] - r[0], lip[1] - r[1]]; };
const GCX = GLS.rest[0];

export function startPour(S) {
  S.phase = 'pour'; S.t = 0; S.ml0 = S.ml; S.poured = 0; S.flight = []; S.glugIn = 0.1; S.dripIn = 0;
  S.bot.head = 0; S.vol0 = S.bot.vol; S.gls0 = S.gls.vol; S.lx = lipWorld(REST_C, 0, S.bot)[0]; S.a1 = 0; S.sub = 'carry'; S.t1 = 0; S.handA = 0;
}

export function pourStep(S, dt, fx) {
  const B = S.bot;
  S.t += dt;
  const t = S.t;
  /* the hand: steady when sober, and less so with every measure; it drifts sideways and rocks the bottle */
  const lv = sway(), seed = S.drunk || 0;
  const handX = drift(t, seed) * lv * 15, handA = drift(t * 1.3 + 2, seed + 7) * lv * 0.16;
  const surfG = fx.glassSurf;                    /* where the liquor in the glass stands, from the last frame */
  /* how far the surface stands above the lower edge of the lip, a little smoothed: a
     real neck does not flicker open and shut a dozen times a second */
  if (B.surf) {
    const lw = lipWorld(B.c, B.a, B);
    const raw = lw[1] - B.surf.c0;
    B.head = (B.head || 0) + (raw - (B.head || 0)) * Math.min(1, dt / 0.09);
  } else B.head = 0;
  const head = B.head;
  const restLip = lipWorld(REST_C, 0, B);

  if (S.sub === 'carry') {
    const u = clamp(t / CARRY, 0, 1), e = ease(lurch(u, 0.6 * lv));
    if (t > 0.18 && B.capOn) { B.capOn = false; fx.sfx.cap(); }
    const lx = lerp(restLip[0], GCX - 46, e), ly = lerp(restLip[1], 150, e) - 54 * Math.sin(Math.PI * e);
    B.a = 1.0 * ease(clamp((u - 0.2) / 0.8, 0, 1)) + handA * u;
    B.c = centreFor([lx + handX * u, ly], B.a, B);
    S.handA = handA * u;
    S.lx = lx; S.ly = ly;
    if (u >= 1) { S.sub = 'pour'; S.t1 = t; }
  } else if (S.sub === 'pour' || S.sub === 'cut') {
    const cutting = S.sub === 'cut';
    const want = S.poured > SHOT_FRAC * 0.85 ? 3 : 4.5;
    if (!cutting) {
      B.a = clamp(B.a + clamp(2.2 * (want - head), -0.5, 0.9) * dt + (handA - (S.handA || 0)), 0, 2.7);
    S.handA = handA;
      if (S.poured >= SHOT_FRAC || t - S.t1 > 6) { S.sub = 'cut'; S.tc = t; }
    } else {
      B.a = Math.max(0.55, B.a - 1.5 * dt);
    }
    /* the stream: leaves the lip fast when the head is big, thin and slow when it is not */
    const speed = 26 + 22 * Math.sqrt(Math.max(head, 0));
    const phi = Math.max(0, B.a - Math.PI / 2) + 0.14;
    const vx0 = speed * Math.cos(phi), vy0 = speed * Math.sin(phi);
    const lw = lipWorld(B.c, B.a, B);
    const hit = arc(lw[0], lw[1], vx0, vy0, surfG);
    S.lx += ((GCX - vx0 * hit.t) - S.lx) * Math.min(1, 7 * dt);
    S.ly = lerp(S.ly, 156 - 10 * clamp(B.a - 1, 0, 1), Math.min(1, 3 * dt));
    B.c = centreFor([S.lx + handX, S.ly + Math.abs(handA) * 20], B.a, B);

    /* a bottle that holds less lets less through, so a measure takes as long from any of them */
    const kq = KQ * (B.n0 || N_JAG) / N_JAG;
    let Q = head > 0 ? Math.min(900 * kq / KQ, kq * Math.pow(head, 1.5)) : 0;
    if (Q > 0) { Q *= 1 - 0.5 * Math.max(0, Math.sin(S.glugPh)); }     /* the glug: air coming in cuts the flow */
    S.q = Q;
    S.stream = clamp(Q / 40, 0, 1);
    S.lip = { x: lw[0], y: lw[1], vx: vx0, vy: vy0, tHit: hit.t, w: clamp(Math.sqrt(Q) / 3.4, 0, 9) };
    const dv = Q * dt / B.n0;
    B.vol = Math.max(0, B.vol - dv);
    S.poured += dv;
    S.flight.push({ at: t + hit.t, dv: dv / SHOT_FRAC * POURED_FILL });
    S.ml = Math.max(0, S.ml0 - 40 * clamp(S.poured / SHOT_FRAC, 0, 1));
    if (cutting && (head < -0.5 || Q === 0) && t - S.tc > 0.3 && t >= POUR_MIN - RETURN && S.stream < 0.03) { S.sub = 'return'; S.tr = t; S.aR = B.a; S.cR = B.c.slice(); }
    /* the glug: air getting in, a pulse in the flow, a bubble up the bottle */
    if (Q > 20) {
      S.glugIn -= dt; S.glugPh += dt * 20;
      if (S.glugIn <= 0) {
        S.glugIn = 0.16 + Math.random() * 0.14; S.glugPh = 1.4;
        fx.sfx.glug(S.glassVol);
        const gu = B.geo || BOT, up = rot(gu.lipUp[0], gu.lipUp[1] + BOT.cy, B.a);
        for (let k = 0; k < 2 + Math.floor(Math.random() * 2); k++)
          S.bubbles.push({ x: B.c[0] + up[0] + (Math.random() - 0.5) * 6, y: B.c[1] + up[1] + 3, r: 2 + Math.floor(Math.random() * 2), vy: -(26 + Math.random() * 22) });
      }
    }
    /* the last of it: beads off the lip */
    if (cutting || S.poured > SHOT_FRAC * 0.97) {
      S.dripIn -= dt;
      if (S.dripIn <= 0 && head > -1.2 && head < 2.5) {
        S.dripIn = 0.13 + Math.random() * 0.1;
        S.drops.push({ x: lw[0] + 1, y: lw[1] + 1, vx: 6, vy: 0, life: 0.9, c: 'liq', r: 3, drip: true });
        fx.sfx.drip();
      }
    }
  } else if (S.sub === 'return') {
    const u = clamp((t - S.tr) / RETURN, 0, 1), e = ease(lurch(u, 0.6 * lv));
    B.a = lerp(S.aR, 0, e) + handA * (1 - u);
    const c = centreFor([lerp(S.lx + handX, restLip[0], e), lerp(S.ly, restLip[1], e) - 40 * Math.sin(Math.PI * e)], B.a, B);
    B.c = c;
    if (u > 0.82 && !B.capOn) { B.capOn = true; fx.sfx.cap(); }
    S.stream = Math.max(0, S.stream - dt * 6);
    if (u >= 1) return true;
  }
  return false;
}
