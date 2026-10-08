/* The Arena's trophies, watched through the hook bus. `wireTrophies(combat, info)` subscribes to the combat's dispatcher the way audio.js and fx.js do: bus.on() is a read-only observer,
   called once with the final context after every effect has resolved, so nothing here can change a fight, and there is no trophy-specific code anywhere in the engine (the one thing added
   to combat.js is `combat.frames`, a counter of whole sim frames, which is also what "under five seconds" is measured in). It keeps one fight's counters and, when the fight is decided,
   says `fight-end` with all of them; a card for a trophy waits (hold) until then. The run-level calls below are one line each in index.js. Nothing in this file can throw into the game. */
import { trophies } from '../trophy_scope.js';

const TR = trophies('standbattle');
const COMBO_GAP_FRAMES = 60;                       /* a hit within this many frames of the last, with nothing landing on the player, goes on the combo */
const FRAME_HZ = 60;

export function wireTrophies(combat, info, sink) {
  sink = sink || TR;
  info = info || {};
  const d = combat.dispatcher, p = combat.player, e = combat.enemy;
  const c = { dodges: 0, perfectClashes: 0, staggers: 0, guardHits: 0, guardBroke: false, damageTaken: 0, maxMomentum: 0, chain: 0, maxCombo: 0, lastHit: -1e9, types: [], finishedBy: null, ended: false, held: false };
  const frame = () => combat.frames || 0;
  const safe = f => (...a) => { try { f(...a); } catch (x) { /* a trophy never gets into a fight */ } };
  const hold = () => { if (!c.held) { c.held = true; sink.hold(); } };
  const free = () => { if (c.held) { c.held = false; sink.release(); } };
  sink.drain(); hold();

  d.on('onHit', safe(h => {
    const f = frame();
    c.chain = f - c.lastHit <= COMBO_GAP_FRAMES ? c.chain + 1 : 1;
    c.lastHit = f; c.maxCombo = Math.max(c.maxCombo, c.chain);
    c.maxMomentum = Math.max(c.maxMomentum, p.momentum || 0);
    if (c.types.indexOf(h.moveType) < 0) c.types.push(h.moveType);
    if (h.finishing) c.finishedBy = h.moveType;
  }));
  d.on('onKill', safe(() => { if (!c.finishedBy) c.finishedBy = 'clash'; }));
  d.on('onDamageTaken', safe(x => {
    if (x.dmg > 0) c.damageTaken += x.dmg;
    if (p.guarding) c.guardHits++;
    c.chain = 0;
  }));
  d.on('onDodgeSuccess', safe(() => { c.dodges++; }));
  d.on('onPerfectClash', safe(() => { c.perfectClashes++; sink.emit('perfect', {}); }));
  d.on('onStaggerStart', safe(x => { if (x.entity === e) c.staggers++; }));
  d.on('onGuardBreak', safe(() => { c.guardBroke = true; }));
  d.on('onPhaseTransition', safe(() => { sink.emit('phase', {}); }));

  return {
    counters: c,
    /* the fight has been decided: tell the ledger once */
    end() {
      if (c.ended) return; c.ended = true;
      try {
        c.maxMomentum = Math.max(c.maxMomentum, p.momentum || 0);
        sink.emit('fight-end', {
          won: combat.outcome === 'win', enemy: info.enemyId || (e.def && e.def.id) || null, node: info.nodeId || null, modifier: info.modifier || null, shake: info.shake !== false,
          secs: frame() / FRAME_HZ, hpLeft: Math.round(p.hp), damageTaken: c.damageTaken, maxCombo: c.maxCombo, maxMomentum: c.maxMomentum, dodges: c.dodges,
          perfectClashes: c.perfectClashes, staggers: c.staggers, guardHits: c.guardHits, guardBroke: c.guardBroke, moveTypes: c.types.slice(), finishedBy: c.finishedBy
        });
      } catch (x) { /* never */ }
      free();
    },
    stop: free
  };
}

/* ---- the run, one line each from index.js ---- */
const guard = f => { try { return f(); } catch (e) { return undefined; } };
export const eventChoice = (choice, buffId) => guard(() => { if (buffId) TR.mark('buffs', buffId); TR.emit('event-choice', { pet: choice.kind === 'buff', buff: buffId || null }); });
export const runEnd = (cleared, buffs) => guard(() => TR.emit('run-end', { cleared: !!cleared, buffs: buffs || [] }));
export const debugOn = () => guard(() => TR.emit('debug-on', {}));
