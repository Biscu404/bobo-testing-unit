/* THE SHED, the tab the owner's blueprint opens in the Cook. A shed with Jesse in it (as he looks at the end of El Camino, and talking the way he did on the show), things in it to click, and
   on the wall the blueprint of a little puzzle, THE BACKYARD PROJECT: ten gardens, a shed at the bottom of each, and parts to carry to it past the neighbours and the tax man. The rules
   are shed_model.js, the boards shed_levels.js, the pictures shed_draw.js / shed_hub.js / shed_ui.js and his words shed_lines*.js. This file is the one that holds them together: where you
   are (the shed, the blueprint, a board, a board won), what you pressed, what he says about it, and what is kept (`templeos.cook.shed.v1`: how far you have got, your best on each).
   It is given the Cook's own painters and sounds by index.js, so the page looks like the rest of the game; node apps/cook/shed_check.js plays all of it without a screen. */
import { LEVELS } from './shed_levels.js';
import { parse, fresh, step, ACTIONS } from './shed_model.js';
import { createShedDraw, tileAt } from './shed_draw.js';
import { createHub, spotAt, slotHit } from './shed_hub.js';
import { createUi } from './shed_ui.js';
import { shedPool, IN_ORDER } from './shed_say.js';
import { moodForShed } from './jesse_ec.js';

export const KEY = 'templeos.cook.shed.v1';
const blank = () => ({ v: 1, lv: 1, best: {}, medal: {}, said: {}, caught: 0 });
const pick = a => a[Math.floor(Math.random() * a.length)];
const MOVE = { ArrowUp: 'N', w: 'N', ArrowDown: 'S', s: 'S', ArrowLeft: 'W', a: 'W', ArrowRight: 'E', d: 'E' };

export function createShed(P) {
  const { R, wash, txt, g, Snd, blip, playBlip, wrapTo, leave } = P, calm = !!P.calm;               /* calm: prefers-reduced-motion (no flicker, no flash) */
  const board = createShedDraw(R, wash), hub = createHub({ R, wash, txt, g }), ui = createUi({ R, wash, txt, g, wrapTo });
  let SV = blank();
  try { const o = JSON.parse(localStorage.getItem(KEY) || 'null'); if (o && o.v === 1) SV = Object.assign(blank(), o); } catch (e) { /* a fresh shed */ }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(SV)); } catch (e) { /* kept for this sitting */ } };

  let scr = 'hub', kid = null, hot = null, sel = -1, radioT = 0, idle = 0, boomT = 0;
  const last = {};
  let ix = 0, wd = null, s = null, hist = [], tw = null, dead = null, won = null, wonT = 0, run = { undos: 0, caught: 0, resets: 0 }, hover = null, waits = 0;

  /* ---- sound ---------------------------------------------------------------------------------------------------------------- */
  const sfx = {
    step() { Snd.tone(300, 28, { type: 'square', vol: 0.012 }); },
    bump() { Snd.tone(90, 70, { type: 'triangle', vol: 0.03 }); },
    push() { Snd.noise(90, { freq: 300, q: 0.7, vol: 0.05 }); Snd.tone(110, 90, { type: 'triangle', to: 70, vol: 0.04 }); },
    part() { [660, 880].forEach((f, i) => Snd.tone(f, 90, { type: 'triangle', delay: i * 0.05, vol: 0.035 })); },
    coin() { Snd.tone(1320, 60, { type: 'square', vol: 0.02 }); Snd.tone(1760, 120, { type: 'square', delay: 0.06, vol: 0.02 }); },
    deliver() { [523, 659, 784].forEach((f, i) => Snd.tone(f, 160, { type: 'triangle', delay: i * 0.06, vol: 0.04 })); },
    caught() { Snd.noise(300, { freq: 500, q: 0.5, vol: 0.07 }); Snd.tone(220, 320, { type: 'sawtooth', to: 110, vol: 0.05 }); },
    win() { [294, 370, 440, 587, 740, 880].forEach((f, i) => Snd.tone(f, 900, { type: 'triangle', delay: i * 0.1, vol: 0.045 })); },
    undo() { Snd.tone(523, 80, { type: 'triangle', to: 392, vol: 0.03 }); },
    page() { Snd.noise(120, { freq: 1500, q: 0.5, vol: 0.03 }); },
    boom() { Snd.noise(520, { freq: 320, q: 0.4, vol: 0.09 }); Snd.tone(70, 700, { type: 'sawtooth', to: 38, vol: 0.06 }); [523, 659, 784, 1046, 1318].forEach((f, i) => Snd.tone(f, 500, { type: 'triangle', delay: 0.25 + i * 0.09, vol: 0.04 })); },
    radio() { Snd.noise(150, { freq: 2200, q: 0.8, vol: 0.03 }); [392, 440, 523, 440, 392, 330, 392, 262].forEach((f, i) => Snd.tone(f, 180, { type: 'square', delay: 0.18 + i * 0.2, vol: 0.02 })); }
  };

  /* ---- Jesse ---------------------------------------------------------------------------------------------------------------- */
  /* One thing at a time, never the same twice running. `hold`: the middle of the screen, read a click at a time (the first time in the shed, the end, the help); `then` runs after the last. */
  function say(tag, o) {
    o = o || {};
    const pool = shedPool(tag);
    if (!pool.length) return;
    if (o.once) { if (SV.said[tag]) return; SV.said[tag] = 1; save(); }
    const ordered = IN_ORDER.indexOf(tag) >= 0;
    let i = 0;
    if (!ordered) { i = Math.floor(Math.random() * pool.length); if (pool.length > 1 && i === last[tag]) i = (i + 1) % pool.length; last[tag] = i; }
    kid = { s: pool[i], t: 0, life: 3.6 + pool[i].length * 0.024, tag, mood: moodForShed(tag), sounded: 0 };
    if (o.hold) { kid.big = true; kid.hold = true; kid.life = 1e9; kid.queue = (o.queue || (ordered ? pool.slice(1) : [])).slice(); kid.page = 1; kid.pages = 1 + kid.queue.length; kid.then = o.then || null; }
    idle = 0;
  }
  /* a remark that is allowed to be dropped if he is still in the middle of one */
  const remark = (tag, p) => { if ((!kid || (!kid.hold && kid.t > kid.life * 0.55)) && Math.random() < (p == null ? 1 : p)) say(tag); };
  function kidNext() {
    if (!kid || !kid.hold) return false;
    const total = kid.s.length;
    if (Math.floor(kid.t * 36) < total) { kid.t = total / 36 + 0.02; kid.sounded = total; return true; }
    if (kid.queue.length) {
      kid.s = kid.queue.shift(); kid.lines = null; kid.t = 0; kid.sounded = 0; kid.page++; sfx.page();
      if (kid.s === shedPool('all')[1]) { boomT = calm ? 0.01 : 2.2; sfx.boom(); }                      /* the Thing goes off, on the second page of the ending */
      return true;
    }
    const then = kid.then; kid = null; sfx.page();
    if (then) then();
    return true;
  }

  /* ---- the shed and the blueprint --------------------------------------------------------------------------------------------- */
  function enter() {
    scr = 'hub'; hot = null; idle = 0;
    if (!SV.said.hub_first) { SV.said.hub_first = 1; save(); say('hub_first', { hold: true }); } else say('hub');
  }
  function clickSpot(p) {
    if (p.id === 'jesse') say('talk');
    else if (p.id === 'blueprint') { scr = 'list'; sfx.page(); say('blueprint'); }
    else { if (p.id === 'radio') { radioT = 4.2; sfx.radio(); } say(p.id); }
  }
  const medals = () => LEVELS.map(l => SV.medal[l.id] || 0), bests = () => LEVELS.map(l => SV.best[l.id] || 0);

  /* ---- a board --------------------------------------------------------------------------------------------------------------- */
  function begin(i) {
    ix = i; wd = parse(LEVELS[i]); s = fresh(wd); hist = []; tw = null; dead = null; won = null; hover = null; waits = 0;
    run = { undos: 0, caught: 0, resets: run.resets };
    scr = 'play'; sfx.page();
    const tag = 'intro_' + LEVELS[i].id;
    if (!SV.said[tag]) say(tag, { once: true }); else remark('intro_again', 0.4);
  }
  /* is there any move at all that you survive? */
  const anySafe = () => ACTIONS.some(a => { const r = step(wd, s, a); return !r.ev.blocked && !r.ev.dead; });
  /* a catch is shown for a moment and then taken back (the move did not happen); any key or click takes it back at once */
  function revert() { if (!dead) return; s = dead.back; hist.pop(); dead = null; tw = null; }
  function act(a) {
    if (scr !== 'play' || (kid && kid.hold)) return;
    if (dead) { revert(); return; }
    idle = 0;
    const r = step(wd, s, a), ev = r.ev;
    if (ev.blocked) { sfx.bump(); return; }
    if (!SV.said.step_first && (!kid || kid.t > kid.life * 0.55)) { SV.said.step_first = 1; save(); say('step_first'); }
    const prev = s;
    hist.push(prev); s = r.s;
    if (ev.moved) tw = { t: 0, dur: 0.09, from: [prev.x, prev.y], gn: prev.gn.map(q => q.slice()) };
    waits = a === 'wait' ? waits + 1 : 0;
    if (ev.dead) { dead = { why: ev.dead, t: 0, back: prev }; run.caught++; SV.caught++; save(); sfx.caught(); say(ev.dead); return; }
    if (ev.pushed) { sfx.push(); remark('push', 0.5); } else if (ev.moved) sfx.step();
    if (ev.part || ev.bought) { sfx.part(); remark(ev.bought ? 'bought' : 'part', 0.7); }
    if (ev.coin) { sfx.coin(); remark('coin', 0.6); }
    if (ev.sold) { sfx.coin(); remark('sold', 1); }
    if (ev.delivered) { sfx.deliver(); remark('deliver', 0.8); }
    if (waits === 2) remark('wait', 0.5);
    if (ev.won) { won = { moves: s.moves, par: LEVELS[ix].par, best: SV.best[LEVELS[ix].id], first: !SV.best[LEVELS[ix].id], last: ix === LEVELS.length - 1 }; finish(); return; }
    if (!anySafe()) say('cornered');
  }
  function finish() {
    const L = LEVELS[ix], moves = s.moves;
    SV.best[L.id] = SV.best[L.id] ? Math.min(SV.best[L.id], moves) : moves;
    SV.medal[L.id] = (SV.medal[L.id] || 0) | 1 | (moves <= L.par ? 2 : 0);
    if (ix + 1 < LEVELS.length) SV.lv = Math.max(SV.lv, ix + 2);
    save(); scr = 'won'; wonT = 0; sfx.win(); kid = null;
  }
  function afterWon() {
    if (wonT < 1.0) return;
    const L = LEVELS[ix], head = won.moves <= L.par ? 'win_par' : (won.first && !run.caught && !run.undos && !run.resets ? 'win_first' : 'win_over');
    const queue = [pick(shedPool('win_' + L.id))].concat(won.last ? shedPool('all') : []);
    const then = () => { if (won.last) { scr = 'hub'; won = null; say('hub'); } else begin(ix + 1); };
    say(head, { hold: true, queue, then });
  }
  function undo() {
    if (scr !== 'play' || (kid && kid.hold)) return;
    if (dead) { revert(); return; }
    if (!hist.length) return;
    s = hist.pop(); tw = null; run.undos++; sfx.undo(); remark('undo', 0.35);
  }
  function reset() { if (scr !== 'play' || (kid && kid.hold)) return; const r = run.resets + 1; begin(ix); run.resets = r; remark('reset', 0.4); }

  /* ---- input ----------------------------------------------------------------------------------------------------------------- */
  function key(k) {
    if (kid && kid.hold) { if (k === ' ' || k === 'Enter' || k === 'Escape') kidNext(); return true; }
    const low = k.length === 1 ? k.toLowerCase() : k;
    if (scr === 'hub') { if (k === 'Escape') { leave(); return true; } if (k === 'Enter' || k === 'b') { clickSpot({ id: 'blueprint' }); return true; } return false; }
    if (scr === 'list') {
      if (k === 'Escape') { scr = 'hub'; sfx.page(); return true; }
      const n = k === '0' ? 10 : +k;
      if (n >= 1 && n <= LEVELS.length && n <= SV.lv) begin(n - 1);
      return true;
    }
    if (scr === 'won') { if (k === ' ' || k === 'Enter') afterWon(); else if (k === 'Escape') { scr = 'list'; won = null; } return true; }
    if (MOVE[k] || MOVE[low]) { act(MOVE[k] || MOVE[low]); return true; }
    if (k === ' ' || k === '.' || low === 'x') { act('wait'); return true; }
    if (low === 'u') { undo(); return true; }
    if (low === 'r') { reset(); return true; }
    if (low === 'h' || k === '?') { say('help', { hold: true }); return true; }
    if (k === 'Escape') { scr = 'list'; sfx.page(); return true; }
    return false;
  }
  function mouse(type, mx, my) {
    if (type === 'move') {
      if (scr === 'hub') hot = spotAt(mx, my); else if (scr === 'list') sel = slotHit(mx, my, LEVELS.length); else if (scr === 'play') hover = tileAt(wd, mx, my);
      return;
    }
    if (kid && kid.hold) { kidNext(); return; }
    if (scr === 'hub') { const p = spotAt(mx, my); if (p) clickSpot(p); }
    else if (scr === 'list') { const i = slotHit(mx, my, LEVELS.length); if (i >= 0 && i + 1 <= SV.lv) begin(i); }
    else if (scr === 'won') afterWon();
    else if (scr === 'play') {
      if (dead) { revert(); return; }
      const t = tileAt(wd, mx, my);
      if (!t) return;
      const dx = t[0] - s.x, dy = t[1] - s.y;
      if (!dx && !dy) act('wait'); else if (Math.abs(dx) + Math.abs(dy) === 1) act(dx > 0 ? 'E' : dx < 0 ? 'W' : dy > 0 ? 'S' : 'N');
    }
  }

  /* ---- the frame ------------------------------------------------------------------------------------------------------------- */
  function tick(dt) {
    if (kid) {
      kid.t += dt;
      const rate = kid.big ? 36 : 44, shown = Math.min(kid.s.length, Math.floor(kid.t * rate));
      while (kid.sounded < shown) { const b = blip(kid.s, kid.sounded); kid.sounded++; if (b) playBlip(Snd, b); }
      if (!kid.hold && kid.t > kid.life) kid = null;
    }
    if (radioT > 0) radioT = Math.max(0, radioT - dt);
    if (boomT > 0) boomT = Math.max(0, boomT - dt);
    if (tw) { tw.t += dt; if (tw.t >= tw.dur) tw = null; }
    if (dead) { dead.t += dt; if (dead.t > 1.1) revert(); }
    if (scr === 'won') wonT += dt;
    if (!(kid && kid.hold)) { idle += dt; if (idle > 26 && (scr === 'play' || scr === 'hub')) { idle = 0; remark(scr === 'hub' ? 'idle_hub' : SV.caught >= 4 && run.caught >= 2 ? 'stuck' : 'idle'); } }
  }
  function draw(t, dt) {
    tick(dt);
    const talking = !!kid && Math.floor(kid.t * (kid.big ? 36 : 44)) < kid.s.length && Math.floor(kid.t * 9) % 2 === 0;
    if (scr === 'hub') {
      hub.draw(t, { calm, hot: hot && hot.id, radio: radioT, done: LEVELS.filter(l => SV.medal[l.id]).map(l => l.id - 1), mood: kid ? kid.mood : 'flat', talk: talking });
      if (!kid) { txt('click Jesse to talk  ·  the blueprint to play  ·  ESC back', 210, 300, 11, '10px monospace', 'center'); if (hot) txt(hot.name, 210, 284, 14, 'bold 11px monospace', 'center'); }
    } else if (scr === 'list') hub.list(t, SV.lv, bests(), medals(), LEVELS.map(l => l.name), sel);
    else {
      const L = LEVELS[ix];
      R(0, 0, 420, 320, 0); wash(0, 0, 420, 320, 8, 3);
      const k = tw ? tw.t / tw.dur : 1, o = { heldIx: s.delivered, dead: !!dead };
      const tween = tw ? { p: [tw.from[0] + (s.x - tw.from[0]) * k, tw.from[1] + (s.y - tw.from[1]) * k], gn: s.gn.map((q, i) => (tw.gn[i] ? [tw.gn[i][0] + (q[0] - tw.gn[i][0]) * k, tw.gn[i][1] + (q[1] - tw.gn[i][1]) * k] : q)) } : null;
      ui.hud(L, wd, s, o);
      board.board(wd, s, t, tween, o);
      if (hover && !dead && Math.abs(hover[0] - s.x) + Math.abs(hover[1] - s.y) <= 1) { const [x, y] = board.at(wd, hover[0], hover[1]); R(x, y, 30, 2, 14); R(x, y + 28, 30, 2, 14); R(x, y, 2, 30, 14); R(x + 28, y, 2, 30, 14); }
      if (dead) ui.caught(dead.why, dead.t);
      if (scr === 'won') ui.won(won, wonT);
    }
    if (boomT > 0) ui.boom(2.2 - boomT);
    ui.speech(kid);
  }
  const info = () => (scr === 'hub' ? 'the shed  ·  click things' : scr === 'list' ? 'the blueprint  ·  pick a board' : LEVELS[ix].name + '  ·  moves ' + (s ? s.moves : 0) + '/' + LEVELS[ix].par + '  ·  best ' + (SV.best[LEVELS[ix].id] || '—'));
  return { enter, draw, mouse, key, undo, reset, info, canUndo: () => scr === 'play' && hist.length > 0, playing: () => scr === 'play', state: () => ({ scr, ix, SV, boom: boomT > 0, held: !!(kid && kid.hold), says: kid ? kid.s : '', moves: s ? s.moves : 0, dead: !!dead, tile: s ? [s.x, s.y] : null }) };
}
