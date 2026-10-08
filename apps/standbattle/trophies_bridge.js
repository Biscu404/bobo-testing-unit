/* The Arena's trophies, watched through the hook bus (spec 16). `wireTrophies(fight, info, sink)` subscribes to the fight's dispatcher the way audio.js and fx.js do: bus.on() is a
   read-only observer, so nothing here can change a fight, and there is no trophy-specific code anywhere in the engine. It keeps one match's counters for the player (slot 0) and,
   when the match is decided, says `fight-end` with all of them; a card for a trophy waits (hold) until then. The run-level calls below are one line each from flow.js.
   Nothing in this file can throw into the game. */
import { trophies } from '../trophy_scope.js';

const TR = trophies('standbattle');
let OUT = TR;                                  /* the checks swap in a recording sink */
export const setSink = s => { OUT = s || TR; };
const guard = f => { try { return f(); } catch (e) { return undefined; } };

export function wireTrophies(fight, info, sink) {
  sink = sink || OUT;
  info = info || {};
  const d = fight.bus, F = fight.fighters, me = F[0];
  const c = { ended: false, held: false, maxCombo: 0, breaks: 0, dodges: 0, throws: 0, counters: 0, blocks: 0, splats: 0, launches: 0, bounces: 0, specials: 0, detonates: 0, drowns: 0, rolls: 0, rounds: [], hpLost: 0, maxHit: 0 };
  const safe = f => (...a) => { try { f(...a); } catch (x) { /* a trophy never gets into a fight */ } };
  const hold = () => { if (!c.held) { c.held = true; sink.hold(); } };
  const free = () => { if (c.held) { c.held = false; sink.release(); } };
  sink.drain(); hold();

  d.on('onHit', safe(e => {
    if (e.slot === 0) {
      if (e.counter) { c.counters++; sink.emit('counter', {}); }
      if (e.move && e.move.special) { c.specials++; sink.emit('special', { move: e.move.id }); }
      if (e.kind === 'detonate') { c.detonates++; sink.emit('detonate', { who: me.id }); }
      if (e.kind === 'throw' && e.move && e.move.status) sink.emit('status', { id: e.move.status.id });
      c.maxHit = Math.max(c.maxHit, e.dmg);
    }
  }));
  d.on('onThrow', safe(e => { if (e.slot === 0) { c.throws++; sink.emit('throw', {}); } }));
  d.on('onThrowBreak', safe(e => { if (e.slot === 0) { c.breaks++; sink.emit('throw-break', {}); } }));
  d.on('onSidestepDodge', safe(e => { if (e.slot === 0) { c.dodges++; sink.emit('dodge', {}); } }));
  d.on('onBlock', safe(e => { if (e.target === 0) c.blocks++; }));
  d.on('onLaunch', safe(e => { if (e.slot === 1) { c.launches++; sink.emit('launch', { kind: e.kind }); } }));
  d.on('onBounce', safe(e => { if (e.slot === 1) { c.bounces++; sink.emit('bounce', {}); } }));
  d.on('onWallSplat', safe(e => { if (e.slot === 1) { c.splats++; sink.emit('wall-splat', {}); } }));
  d.on('onWake', safe(e => { if (e.slot === 0 && e.kind === 'roll') { c.rolls++; sink.emit('roll', {}); } }));
  d.on('onCombo', safe(e => { if (e.slot === 0) { c.maxCombo = Math.max(c.maxCombo, e.hits); sink.emit('combo', { hits: e.hits, dmg: e.dmg, juggles: e.juggles }); } }));
  d.on('onRoundStart', safe(e => { if (e.final) sink.emit('final-round', {}); }));
  d.on('onRoundEnd', safe(e => {
    const r = e.result, prev = c.rounds.length ? c.rounds[c.rounds.length - 1].clock : 0, secs = (r.clock - prev) / 60;
    c.rounds.push({ clock: r.clock });
    sink.emit('round-end', { won: r.winner === 0, draw: r.winner < 0, lost: r.winner === 1, how: r.how, secs, hpLeft: Math.round(r.hp[0]), full: r.hp[0] >= me.maxHp, ring: r.how === 'ring' });
  }));

  return {
    counters: c,
    end() {
      if (c.ended) return; c.ended = true;
      guard(() => {
        const m = fight.match || { winner: -1, rounds: 0, wins: [0, 0] };
        sink.emit('fight-end', {
          won: m.winner === 0, enemy: info.enemy || F[1].id, mode: info.mode || 'training', tier: info.tier || 'normal', mirror: !!info.mirror, secs: fight.clock / 60,
          rounds: m.rounds, lostRound: m.wins ? m.wins[1] > 0 : false, hpLeft: Math.round(me.hp), damageTaken: Math.round(me.stats.taken), maxCombo: c.maxCombo, breaks: c.breaks,
          dodges: c.dodges, throws: c.throws, counters: c.counters, splats: c.splats, bounces: c.bounces, specials: c.specials, who: me.id, shake: info.shake !== false, pad: !!info.pad
        });
      });
      free();
    },
    stop: free
  };
}

/* the run-level calls: one line each from flow.js and the scenes */
export const emit = (name, p) => guard(() => OUT.emit(name, p || {}));
export const mark = (set, id) => guard(() => OUT.mark(set, id));
export const debugOn = () => emit('debug-on');
