/* node apps/standbattle/framedata_check.js — the frame data in the movelists, held to the sim (spec 5). Every move of every fighter is performed in a
   real fight, by the inputs a player would press (input_plan.js), against a real defender, and what happened is compared with the row:

     whiff   the move is over, and its fighter free, `total` frames after frame 1
     contact the first hit connects on its `startup` frame
     hit     the fighter on the receiving end is free `onHit` frames after the attacker is (launchers, knockdowns and bounces: the reaction they name)
     block   the same, guarding, for `onBlock`
     late    a hit that connects k frames after the first active frame leaves an advantage of the table's plus k
     throw   a grab lands after BREAK frames; the break button separates both with no damage and no advantage

   Frames are the fight's CLOCK (hit-stop freezes it, for both). This is the "on-hit and on-block numbers match what the sim produces" check. */

import { createFight } from './fight.js';
import { defOf, ROSTER } from './roster.js';
import { createRng } from './rng.js';
import { planInputs } from './input_plan.js';
import { BIT, RULES } from './rules.js';

const OWN = 300;
let checks = 0, fails = [];
const eq = (a, b, msg) => { checks++; if (a !== b) fails.push(msg + ': expected ' + b + ', the sim gave ' + a); };

function arena(aId, dId, mode) {
  const fight = createFight({ defs: [defOf(aId, { walk: { f: 0, b: 0 } }), defOf(dId, { walk: { f: 0, b: 0 } })], stage: { id: 'street', rule: 'walls' }, rng: createRng('fd:' + aId), training: true });
  const [A, D] = fight.fighters;
  A.x = OWN; D.x = OWN + 400;
  fight.events = [];
  ['onHit', 'onBlock'].forEach(k => fight.bus.on(k, e => fight.events.push({ k, e, mf: A.mf, clock: fight.clock, tick: fight.tick })));
  return { fight, A, D };
}
const guardBits = (D, crouch) => (D.facing > 0 ? BIT.LEFT : BIT.RIGHT) | (crouch ? BIT.DOWN : 0);
function dist(m) { return m.h === 't' ? 34 : 34; }

/* run a move to its end against a defender at `dx`; returns what happened */
function perform(aId, m, o) {
  const { fight, A, D } = arena(aId, o.defender || 'jotaro');
  const guard = o.kind === 'block' ? guardBits(D, m.h === 'l') : 0;
  if (m.stance === 'down') { A.state = 'down'; A.t = RULES.DOWN_FRAMES + 1; }
  if (o.kind === 'block') for (let k = 0; k < 10; k++) fight.step(0, guard);
  D.x = A.x + (o.far ? 400 : o.late ? 400 : dist(m));
  const chain = []; for (let c = m; c; c = c.cmd.kind === 'chain' ? A.ml.byId.get(c.cmd.parent) : null) chain.unshift(c);
  let startClock = null, step = (b) => { fight.step(b, guard); if (startClock === null && A.state === 'attack' && A.mf === 1 && A.move === m) startClock = fight.clock; };
  planInputs(chain[0], 1).forEach(step);
  for (let k = 1; k < chain.length; k++) {
    const par = chain[k - 1], at = par.last.f + par.last.n;
    let guardn = 0;
    while (!(A.move === par && A.mf === at - 1) && guardn++ < 200) step(0);
    step(chain[k].cmd.buttons);
  }
  let lateDone = !o.late, last = null, freeA = null, freeD = null, contacts = 0, n = 0;
  while (n++ < 400) {
    if (o.late && !lateDone && A.state === 'attack' && A.mf === m.startup) { D.x = A.x + dist(m); lateDone = true; }
    step(0);
    const ev = fight.events.filter(e => e.e.move === m);
    if (ev.length > contacts) { contacts = ev.length; last = ev[ev.length - 1]; }
    const hit = last && (m.hits.length === 1 || last.e.hitIndex === m.hits.length - 1);
    if (hit && freeA === null && A.state === 'idle') freeA = fight.clock;
    if (hit && freeD === null && D.state === 'idle') freeD = fight.clock;
    if (hit && freeA !== null && freeD !== null) break;
    if (!last && A.state === 'idle' && startClock !== null && o.far) { freeA = fight.clock; break; }
  }
  return { fight, A, D, startClock, last, freeA, freeD, contacts };
}

function checkMove(aId, m) {
  const tag = aId + '.' + m.id;
  if (m.h === 't') return checkThrow(aId, m, tag);
  const w = perform(aId, m, { kind: 'whiff', far: true });
  eq(w.freeA - w.startClock, m.total, tag + ' total frames');
  const kinds = [['hit', 'hit'], ['block', 'block']];
  kinds.forEach(([kind, key]) => {
    if (kind === 'hit' && m.launching) return;
    if (kind === 'block' && m.stance === 'down') { /* the rising kicks are blocked like any other */ }
    const r = perform(aId, m, { kind });
    eq(r.last ? r.last.k : 'nothing', kind === 'hit' ? 'onHit' : 'onBlock', tag + ' ' + kind + ' connects');
    if (!r.last) return;
    const first = r.fight.events.filter(e => e.e.move === m)[0];
    eq(first.mf, m.startup, tag + ' first contact frame');
    eq(r.freeD - r.freeA, m.adv[key], tag + ' on ' + kind);
  });
  if (m.launching) {
    const r = perform(aId, m, { kind: 'hit' });
    const e = r.fight.events.filter(x => x.e.move === m).pop();
    eq(e && e.e.reaction, m.reaction, tag + ' reaction');
  }
  if (m.hits.length === 1 && m.active > 1 && m.stance !== 'down' && !m.launching) {
    for (const key of ['hit', 'block']) {
      const r = perform(aId, m, { kind: key, late: true });
      eq(r.last ? r.freeD - r.freeA : 'no contact', m.adv[key] + 1, tag + ' late (1 frame into the active window) on ' + key);
    }
  }
}

function checkThrow(aId, m, tag) {
  const w = perform(aId, m, { kind: 'whiff', far: true });
  eq(w.freeA - w.startClock, m.total, tag + ' total frames');
  /* lands */
  let { fight, A, D } = arena(aId, 'jotaro');
  D.x = A.x + dist(m);
  const hp0 = D.hp;
  planInputs(m, 1).forEach(b => fight.step(b, 0));
  let contact = null; fight.bus.on('onThrow', () => { contact = A.mf; });
  for (let k = 0; k < 40 && D.state !== 'down' && D.state !== 'air'; k++) fight.step(0, 0);
  eq(contact === null ? A.mf : contact, m.startup, tag + ' grab frame');
  eq(D.hp, hp0 - m.dmg, tag + ' damage, unscaled');
  /* broken */
  ({ fight, A, D } = arena(aId, 'jotaro'));
  D.x = A.x + dist(m);
  const brk = m.throw.brk === 'RP' ? BIT.RP : BIT.LP;
  planInputs(m, 1).forEach(b => fight.step(b, 0));
  const hp1 = D.hp;
  for (let k = 0; k < 4; k++) fight.step(0, 0);
  fight.step(0, brk);
  eq(D.hp, hp1, tag + ' broken: no damage');
  let fa = null, fd = null;
  for (let k = 0; k < 40; k++) { fight.step(0, 0); if (fa === null && A.state === 'idle') fa = fight.clock; if (fd === null && D.state === 'idle') fd = fight.clock; }
  eq(fd - fa, 0, tag + ' broken: no advantage for either');
}

export function checkFrameData(ids) {
  checks = 0; fails = [];
  (ids || Object.keys(ROSTER)).forEach(id => defOf(id).ml.list.forEach(m => checkMove(id, m)));
  return { checks, fails };
}

if (typeof process !== 'undefined' && import.meta.url === 'file://' + process.argv[1]) {
  const ids = process.argv[2] ? [process.argv[2]] : null;
  const { checks: n, fails: f } = checkFrameData(ids);
  f.forEach(x => console.log('FAIL - ' + x));
  const moves = (ids || Object.keys(ROSTER)).reduce((s, id) => s + defOf(id).ml.list.length, 0);
  console.log(f.length ? f.length + ' of ' + n + ' checks failed' : 'All ' + n + ' checks pass: the sim reproduces the table for all ' + moves + ' moves.');
  process.exit(f.length ? 1 : 0);
}
