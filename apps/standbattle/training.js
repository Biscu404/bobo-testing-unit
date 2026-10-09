/* Training mode's brains (spec 11.7), pure: the dummy (stand, crouch, guard by what is coming, a seeded mix), the recorder (what player 1 pressed while it was the dummy, looped), the
   advantage meter (how many frames each side was stuck after the last exchange, measured from the real fight), and the reset. */

import { BIT, RULES, WORLD, LANE_Z } from './rules.js';
import { createInput } from './input_frames.js';

export const DUMMIES = ['STAND', 'CROUCH', 'BLOCK', 'RANDOM'];
export const MAX_REC = 600;

export function resetFight(fight, side) {
  const F = fight.fighters, mid = WORLD.MID, half = RULES.START_GAP / 2, left = side === 'left' ? 1 : 0;
  F.forEach((f, k) => {
    const slotLeft = (k === 0) !== (left === 1);
    f.x = mid + (slotLeft ? -half : half); f.lane = 0; f.z = LANE_Z[0]; f.facing = slotLeft ? 1 : -1;
    f.state = 'idle'; f.t = 0; f.move = null; f.mf = 0; f.stun = 0; f.slide = 0; f.vx = f.vy = f.y = 0; f.air = null; f.walk = 0; f.guard = false; f.crouch = false; f.hp = f.maxHp;
    f.statuses.length = 0; f.comboIn = { hits: 0, dmg: 0, juggles: 0, bounced: false, active: false, mult: 1 }; f.comboOut = { hits: 0, dmg: 0, shown: 0 }; f.inp = createInput();
  });
  fight.projectiles.length = 0; fight.hitstop = 0; fight.clock = fight.clock || 0;
}

export function createTrainer(fight, rng) {
  const me = fight.fighters[0], dm = fight.fighters[1];
  const r = rng.stream('dummy');
  const t = {
    dummy: 0, mode: 'live', rec: [], pos: 0, view: { kind: '', adv: null, text: '' }, meas: null, rand: { until: 0, bits: 0 },
    cycleDummy() { t.dummy = (t.dummy + 1) % DUMMIES.length; },
    /* the dummy's integer for this frame (the human's own bits drive it while recording) */
    bits(humanBits) {
      if (t.mode === 'record') { if (t.rec.length < MAX_REC) t.rec.push(humanBits); else t.mode = 'live'; return humanBits; }
      if (t.mode === 'play' && t.rec.length) { const b = t.rec[t.pos]; t.pos++; if (t.pos >= t.rec.length) { t.pos = 0; t.again = true; } return b; }
      const back = dm.facing > 0 ? BIT.LEFT : BIT.RIGHT;
      switch (DUMMIES[t.dummy]) {
        case 'CROUCH': return BIT.DOWN;
        case 'BLOCK': return blockBits(fight, me, dm, back);
        case 'RANDOM': {
          if (fight.tick >= t.rand.until) {
            const k = r.random(), up = dm.lane ? BIT.DOWN : BIT.UP;
            t.rand = { until: fight.tick + 14 + Math.floor(r.random() * 36), bits: k < 0.2 ? 0 : k < 0.4 ? BIT.DOWN : k < 0.6 ? back : k < 0.7 ? back | BIT.DOWN : k < 0.8 ? up : k < 0.9 ? BIT.LP : BIT.LP | BIT.RP };
            if (t.rand.bits === up) t.rand.until = fight.tick + 2;
            if (t.rand.bits & BIT.LP) t.rand.until = fight.tick + 2;
          }
          return t.rand.bits;
        }
        default: return 0;
      }
    },
    startRecord() { t.rec = []; t.mode = 'record'; t.pos = 0; },
    stopRecord() { if (t.mode === 'record') t.mode = 'live'; },
    play() { if (t.rec.length) { t.mode = 'play'; t.pos = 0; t.again = false; } },
    stop() { t.mode = 'live'; },
    /* called by the scene when the attacker's hit lands */
    contact(kind) { t.meas = { kind, freeA: null, freeD: null }; t.view = { kind, adv: null }; },
    tick() {
      const m = t.meas;
      if (!m) return;
      if (m.freeA == null && me.state === 'idle') m.freeA = fight.clock;
      if (m.freeD == null && dm.state === 'idle') m.freeD = fight.clock;
      if (m.freeA != null && m.freeD != null) { t.view = { kind: m.kind, adv: m.freeD - m.freeA }; t.meas = null; }
      else if (fight.clock - (m.at || (m.at = fight.clock)) > 200) { t.meas = null; }
    }
  };
  return t;
}

/* a dummy that guards what is coming, by the height of the move and the frame it is on */
function blockBits(fight, me, dm, back) {
  let threat = null;
  if (me.state === 'attack') {
    const m = me.move, next = m.hits.find((h, i) => !me.spent[i]);
    if (next && next.f - me.mf <= 6) threat = m;
    else if (me.mf <= m.last.f + m.last.n) threat = m;
  }
  fight.projectiles.forEach(p => { if (p.owner === 0 && Math.abs(p.x - dm.x) < 90) threat = p.move; });
  if (!threat || threat.h === 't') return dm.state === 'blockstun' ? back | (dm.crouch ? BIT.DOWN : 0) : 0;
  return back | (threat.h === 'l' ? BIT.DOWN : 0);
}
