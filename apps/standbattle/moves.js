/* The row format of a movelist and what is built from it (spec 5). A fighter's moves live in char_<id>.js as ROWS:

     [id, name, command, height, startup, active, recovery, onHit, onBlock, damage, reach, anim, extras]

   `height` is 'h' high, 'm' mid, 'l' low or 't' throw. `startup` is the number of the first active frame (i10 hits on its tenth frame),
   `recovery` the frames after the last active frame, so  total = startup - 1 + active + recovery.  `onHit`/`onBlock` are frame advantages when the hit
   connects on its first frame; the sim derives the defender's stun from them (stunFor), which is why a check can hold the table to the sim.
   `anim` names a style in anim_styles.js; the limb is the one the command's button names (LP lead arm, RP rear arm, LK lead leg, RK rear leg).
   `extras` (all optional): track 'none'|'near'|'far'|'both', hit 'stagger'|'launch'|'down'|'bounce', ch 'launch' (a counter hit launches),
   juggle, splat, oki, hits [[frame, dmg], ...], push [hit, block], stop, lift, carry (sideways speed of a launch, trip or bounce), stance 'stand'|'run'|'down', stand (the Stand shows), proj {...},
   brk 'LP'|'RP'|'ANY' (a throw's break button), status {id, stacks}, limb, combo (a string meant to connect), note,
   proj {speed, life, r, kind, homing, x0} (the hit throws a projectile instead of touching), rev {from, to, dmg} (a counter: a hit that arrives in those frames is taken by the attacker),
   detonate {dmg} (blows a bomb on the other fighter; needs the mark). Nothing in the sim reads a move id. */

import { parseCmd } from './input_frames.js';
import { RULES, hitstopFor } from './rules.js';

const HEIGHT = { h: 'high', m: 'mid', l: 'low', t: 'throw' };
const LIMB = { LP: 'armFront', RP: 'armRear', LK: 'legFront', RK: 'legRear' };
const REACTIONS = ['stagger', 'launch', 'down', 'bounce'];
const SPEC_ORDER = ['df', 'db', 'f', 'b', 'd'];

export function buildMove(row, owner) {
  const [id, name, cmd, h, S, A, R, aHit, aBlk, dmg, reach, anim, x = {}] = row;
  if (!HEIGHT[h]) throw new Error('[moves] ' + owner + '.' + id + ': height "' + h + '"');
  const c = parseCmd(cmd);
  const hits = (x.hits || [[S, dmg]]).map(p => ({ f: p[0], n: 1, dmg: p[1] }));
  if (!x.hits) hits[0].n = A;
  const last = hits[hits.length - 1];
  const active = last.f + last.n - hits[0].f;
  const total = S - 1 + active + R;
  const reaction = x.hit || 'stagger';
  const launching = reaction !== 'stagger';
  const lead = c.buttons & 16 ? 'LP' : c.buttons & 32 ? 'RP' : c.buttons & 64 ? 'LK' : 'RK';
  const sum = hits.reduce((s, q) => s + q.dmg, 0);
  return {
    id, name, owner, cmd: c, height: HEIGHT[h], h, startup: S, active, recovery: R, total, rowActive: A,
    adv: { hit: aHit, block: aBlk }, dmg: sum, reach, anim, limb: x.limb || LIMB[lead], button: lead,
    hits, last, track: x.track || (h === 't' ? 'none' : 'none'), reaction, launching, ch: x.ch || null,
    juggle: !!x.juggle, splat: !!x.splat, oki: !!x.oki, throw: h === 't' ? { brk: x.brk || 'LP' } : null,
    stance: x.stance || (c.kind === 'dash' ? 'run' : 'stand'), stand: !!x.stand, proj: x.proj || null,
    push: x.push || [Math.max(5, Math.min(18, Math.round(4 + sum * 0.7))), Math.max(7, Math.min(20, Math.round(7 + sum * 0.7)))],
    stop: x.stop || hitstopFor(sum, launching), lift: x.lift || RULES.LAUNCH_VY, carry: x.carry || 0, status: x.status || null,
    combo: !!x.combo, note: x.note || '', rev: x.rev || null, detonate: x.detonate || null, special: c.kind === 'motion', chainOnly: c.kind === 'chain'
  };
}

export function buildMovelist(owner, rows) {
  const list = rows.map(r => buildMove(r, owner));
  const byId = new Map();
  list.forEach(m => { if (byId.has(m.id)) throw new Error('[moves] duplicate id ' + owner + '.' + m.id); byId.set(m.id, m); });
  const rank = m => (m.cmd.kind === 'motion' ? 40 : m.cmd.kind === 'dash' ? 30 : m.cmd.kind === 'dir' ? 20 - SPEC_ORDER.indexOf(m.cmd.dir) : 5);
  const byButtons = {}, chains = {};
  list.forEach(m => {
    if (m.cmd.kind === 'chain') { (chains[m.cmd.parent] = chains[m.cmd.parent] || []).push(m); return; }
    (byButtons[m.cmd.buttons] = byButtons[m.cmd.buttons] || []).push(m);
  });
  Object.keys(byButtons).forEach(k => byButtons[k].sort((a, b) => rank(b) - rank(a)));
  return { owner, list, byId, byButtons, chains };
}

/* the stun a hit puts on the defender (spec 5): authored advantage + the frames the attacker still has after the hit's OWN frame.
   A hit before the last of a string holds the defender just long enough for the next. A counter hit holds 3 longer. */
export function stunFor(m, hitIdx, kind, counter) {
  const hit = m.hits[hitIdx];
  const bonus = counter && kind === 'hit' ? RULES.COUNTER_STUN : 0;
  if (hitIdx < m.hits.length - 1) return m.hits[hitIdx + 1].f - hit.f + 1 + bonus;
  const adv = kind === 'hit' ? m.adv.hit : m.adv.block;
  return (adv == null ? 0 : adv) + (m.total - hit.f) + bonus;
}

/* the advantage the table promises for a hit that connects `late` frames after its first frame */
export function advAfter(m, kind, late) { return (kind === 'hit' ? m.adv.hit : m.adv.block) + (late || 0); }

export function validateMove(m) {
  const errs = [], tag = m.owner + '.' + m.id;
  if (m.rowActive !== m.active) errs.push(tag + ': the active column (' + m.rowActive + ') is not the active frames of its hits (' + m.active + ')');
  if (m.hits[0].f !== m.startup) errs.push(tag + ': startup is not the first hit');
  if (REACTIONS.indexOf(m.reaction) < 0) errs.push(tag + ': reaction ' + m.reaction);
  ['hit', 'block'].forEach(k => {
    if (k === 'hit' && (m.launching || m.h === 't')) return;
    const n = stunFor(m, m.hits.length - 1, k, false);
    if (n < 1) errs.push(tag + ': on ' + k + ' ' + m.adv[k] + ' leaves the defender ' + n + ' frames of stun (the attacker only has ' + (m.total - m.last.f) + ' left)');
  });
  if (m.total < m.startup) errs.push(tag + ': total < startup');
  if (m.h === 't' && m.adv.block != null && m.adv.block !== 0) errs.push(tag + ': a throw has no block advantage');
  return errs;
}
