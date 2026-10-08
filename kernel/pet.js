/* The elephant that lives on the desktop, once Dave's FREE RANGE has been bought and he has been let out of his window.
 *
 * He is a small side-view elephant (pet_art.js) in a corner of #desktop: under every window, over every icon. He stands about,
 * walks somewhere, lies down and sleeps (sooner and longer after eleven at night), says something, hops, and now and then
 * walks up to one of your icons and pushes it a cell or two along, which is his idea of tidying. A click gets his attention,
 * a drag picks him up, a right click is a small menu (one entry puts the last icon he moved back). He wears whatever the
 * wardrobe in the elephant's window says. All of it is slow and none of it costs a frame you would notice: one 80 x 60 canvas
 * redrawn twelve times a second, and a transform.
 *
 * What is saved is where he is, whether he is out, what he wears and the last icon he moved. */
import { drawMini, MINI_W, MINI_H } from './pet_art.js';
import { showMenu, hideMenus } from './menus.js';
import { petIcons, petMoveIcon } from './desktop.js';
import { openWindow, openWins } from './wm.js';
import { dressed as trophyDressed, event as trophy } from '../apps/elephant/trophy_calls.js';
import { ELEPHANT } from './cos_data.js';
import { pickTarget, VISIT_RATE, ENTER, WATCH, CHEER, BIG_CHEER, NAP, LEAVE, FOLLOW, OUT_WHEN_SHUT } from './pet_visit.js';
import { LINES, PUSH_LINES, GOODBYES_DAY, GOODBYES_NIGHT, WAKES, WAKES_NEAR, HOME_LINES, DOOR_LINES, choose } from './pet_lines.js';

const KEY = 'templeos.pet.v1', S = 2, SW = MINI_W * S, SH = MINI_H * S, FOOT = 56 * S;
const SPEED = 46, ICON_W = 84, ICON_H = 78;
/* the moment he is let back into his window: the big elephant there walks in from this side over ARRIVE_MS (apps/elephant reads arriving()) */
const ARRIVE_MS = 2600, ARRIVE = { side: 0, t0: 0 };
const SLOTS = ['head', 'face', 'neck', 'body', 'feet'];

let st = { out: false, wear: {}, x: 200, y: 260, last: null };
try { st = Object.assign(st, JSON.parse(localStorage.getItem(KEY)) || {}); st.wear = st.wear || {}; } catch (e) { /* a fresh one */ }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify({ out: st.out, wear: st.wear, x: Math.round(P.x), y: Math.round(P.y), last: st.last })); } catch (e) {} };

const P = { k: 2, x: st.x, y: st.y, dir: 1, mode: 'idle', t: 0, wait: 2, to: null, job: null, say: 0, lastPush: 0, down: null, near: false, jump: null, step: 0, snore: 0 };
/* a visit: he is inside the window `rec` (V.x, V.y are his top-left inside its frame), at one pixel to the pixel */
const V = { rec: null, x: 0, y: 0, to: null, sub: 'idle', t: 0, wait: 0, follow: 0, abs: null, look: 0 };
let el = null, cv = null, g = null, bub = null, raf = null, last = 0, drawAt = 0, ptr = { x: -999, y: -999 }, hooked = false;
const subs = [];
const desk = () => document.getElementById('desktop');
const owned = () => !!(window.Cos && window.Cos.has('elephant', 'pet'));
const tell = () => { subs.forEach(f => { try { f(); } catch (e) {} }); wardrobeNow(); };
/* the trophies ask what he wears and what is owned whenever either may have changed */
function wardrobeNow() { try { const all = ELEPHANT.filter(i => i.slot !== 'free' && !i.reward).every(i => window.Cos && window.Cos.has('elephant', i.id)); trophyDressed(st.wear, all); } catch (e) { /* never into the desk */ } }
const snd = (...a) => { try { window.Snd.tone(...a); } catch (e) {} };
const pick = a => a[Math.floor(Math.random() * a.length)];

/* ---- what he says. kernel/pet_lines.js is the words (in the voice of the elephant in his window); some of it knows the desk ---- */
const deskNow = () => ({ icons: petIcons().length, sun: window.Economy ? window.Economy.balance() : 0, wins: document.querySelectorAll('#desktop .win:not(.hidden)').length, hour: new Date().getHours() });
const recent = [];
/* a line from a pool, never one of the last few he has said */
function line(pool) {
  let txt = '', tries = 0;
  do { txt = choose(pool, Math.random, deskNow()); } while (recent.indexOf(txt) >= 0 && ++tries < 8);
  recent.push(txt); if (recent.length > 10) recent.shift();
  return txt;
}
const lateHour = () => { const h = new Date().getHours(); return h >= 23 || h < 6; };

let bubH = 40;
function speak(txt, secs) {
  if (!bub) return;
  bub.textContent = txt; bub.style.display = 'block'; P.say = secs || 4.5;
  bubH = bub.offsetHeight || 40;             /* it grows upward from his head, so how tall it is is wanted every frame */
}

/* ---- the world he walks in ----------------------------------------------------------------------------------------------- */
const room = () => { const d = desk(); return { w: d ? d.clientWidth : 800, h: d ? d.clientHeight : 600 }; };
const clampX = x => { const { w } = room(); return Math.max(-20, Math.min(w - SW + 20, x)); };
const clampY = y => { const { h } = room(); return Math.max(30, Math.min(h - SH - 4, y)); };
const goTo = (x, y, why) => { P.to = { x: clampX(x), y: clampY(y) }; P.mode = 'walk'; P.job = why || null; };

function pose() {
  if (P.mode === 'visit') return V.sub === 'walk' ? 'walk' : V.sub === 'cheer' ? 'hop' : V.sub === 'nap' ? 'sleep' : 'stand';
  if (P.mode === 'sleep') return 'sleep';
  if (P.mode === 'push') return 'push';
  if (P.mode === 'walk' || P.mode === 'home') return 'walk';
  if (P.mode === 'hop' || P.mode === 'jump' || P.mode === 'carried') return 'hop';
  return 'stand';
}

/* ---- what he decides to do next ------------------------------------------------------------------------------------------- */
function wander() {
  const { w, h } = room();
  const x = P.x + (Math.random() - 0.5) * 700, y = h * 0.35 + Math.random() * h * 0.55;
  goTo(Math.max(0, Math.min(w - SW, x)), y - SH / 2);
}
/* He says goodbye before he lies down (kernel/pet_lines.js: one set for the day, one for the late hours), yawns, and then goes to sleep. */
function goodbye() {
  P.mode = 'goodbye'; P.t = 0; P.wait = 4.4; P.job = null;
  speak(line(lateHour() ? GOODBYES_NIGHT : GOODBYES_DAY), 4.2);
  snd(330, 420, { type: 'triangle', to: 196, vol: 0.016 });
}
function sleep() { trophy('sleep'); P.mode = 'sleep'; P.t = 0; P.wait = 25 + Math.random() * 45; P.snore = 1; speak('...', 1.6); }
function talk() { P.mode = 'talk'; P.t = 0; P.wait = 5.6; speak(line(LINES)); }
function hop() { P.mode = 'hop'; P.t = 0; P.wait = 0.9; snd(660, 50, { type: 'triangle', to: 880, vol: 0.02 }); }
function pushIcon() {
  const list = petIcons();
  if (list.length < 3 || document.querySelector('#icons .icon.dragging')) return wander();
  const ic = pick(list);
  P.lastPush = performance.now();
  goTo(ic.x - SW + 34, ic.y + ICON_H - FOOT - 2, { kind: 'push', name: ic.name, ix: ic.x, iy: ic.y });
}
/* ---- going to where you are (kernel/pet_visit.js is who, and what he says) -------------------------------------------------------- */
const MW = () => MINI_W * P.k, MH = () => MINI_H * P.k;
function setScale(k) {
  P.k = k;
  if (!el) return;
  el.style.width = cv.style.width = MW() + 'px'; el.style.height = cv.style.height = MH() + 'px';
}
function recAbs(rec) {
  const d = desk();
  if (!d || !rec || !rec.win.isConnected) return null;
  const r = rec.win.getBoundingClientRect(), o = d.getBoundingClientRect(), bar = rec.win.querySelector('.titlebar');
  return { x: r.left - o.left, y: r.top - o.top, w: r.width, h: r.height, th: bar ? bar.offsetHeight : 20 };
}
const winsNow = () => openWins.map(r => ({ appId: r.appId, hidden: r.win.classList.contains('hidden'), active: r.btn.classList.contains('active'), z: +r.win.style.zIndex || 0, rec: r }));
const visitTarget = () => { const t = pickTarget(winsNow()); return t ? t.rec : null; };
const poolFor = (table, appId) => (table[appId] || []).concat(table._ || []);
function startVisit(rec) {
  const r = recAbs(rec);
  if (!r) return wander();
  const { w } = room(), mid = P.x + SW / 2;
  const fits = side => side < 0 ? r.x - SW >= -20 : r.x + r.w + SW <= w + 20;
  let side = mid < r.x + r.w / 2 ? -1 : 1;
  if (!fits(side) && fits(-side)) side = -side;
  const job = { kind: 'visit', rec: rec, side: side };
  /* a window as wide as the desk has no outside to walk round to: straight in */
  if (!fits(-1) && !fits(1)) { P.job = job; return enterWindow(rec, side); }
  const feet = Math.max(r.y + r.th + 40, Math.min(r.y + r.h - 12, P.y + FOOT));
  goTo(side < 0 ? r.x - SW + 4 : r.x + r.w - 4, feet - FOOT, job);
}
function enterWindow(rec, side) {
  const r = recAbs(rec);
  if (!r || !el || rec.win.classList.contains('hidden')) { P.mode = 'idle'; P.t = 0; P.wait = 2; P.job = null; return; }
  V.rec = rec; V.follow = 0; V.to = null; V.sub = 'idle'; V.t = 0; V.wait = 1.4;
  setScale(1);
  V.x = side < 0 ? 6 : r.w - MINI_W - 6; V.y = Math.max(r.th + 4, r.h - MINI_H - 8);
  P.mode = 'visit'; P.job = null; P.dir = side < 0 ? 1 : -1;
  el.style.pointerEvents = 'none';                     /* he is over the app now: a click goes through him to what you are playing */
  speak(line(poolFor(ENTER, rec.appId)), 4.5);
  snd(262, 90, { type: 'triangle', to: 392, vol: 0.016 });
}
function leaveVisit(say) {
  if (!V.rec) return;
  const a = V.abs || { x: P.x, y: P.y };
  V.rec = null; V.sub = 'idle';
  setScale(2);
  if (el) { el.style.pointerEvents = ''; el.style.zIndex = ''; }
  if (bub) bub.style.zIndex = '';
  P.x = a.x + MINI_W / 2 - SW / 2; P.y = a.y + 56 - FOOT;
  P.mode = 'idle'; P.t = 0; P.wait = 1 + Math.random() * 2; P.job = null;
  if (say) speak(line(say), 3.6);
}
function visitAction(r) {
  const late = lateHour();
  const w = [['walk', 5], ['say', 3.2], ['nap', late ? 3 : 0.35], ['hop', 0.7], ['stay', 2]];
  let x = Math.random() * w.reduce((a, b) => a + b[1], 0), c = 'stay';
  for (const [k, v] of w) { if ((x -= v) < 0) { c = k; break; } }
  V.t = 0;
  if (c === 'walk') {
    V.to = { x: 4 + Math.random() * Math.max(0, r.w - MINI_W - 8), y: Math.max(r.th + 4, r.h - MINI_H - 8 - (Math.random() < 0.3 ? Math.random() * Math.max(0, r.h * 0.35) : 0)) };
    V.sub = 'walk';
  } else if (c === 'say') { V.sub = 'idle'; V.wait = 5.5; speak(line(poolFor(WATCH, V.rec.appId)), 5); }
  else if (c === 'nap') { V.sub = 'nap'; V.wait = 18 + Math.random() * 30; speak(line(NAP), 3.6); }
  else if (c === 'hop') { V.sub = 'cheer'; V.wait = 0.9; snd(660, 50, { type: 'triangle', to: 880, vol: 0.014 }); }
  else { V.sub = 'idle'; V.wait = 3 + Math.random() * 5; }
}
function visitTick(dt) {
  const rec = V.rec, r = recAbs(rec);
  if (!r || rec.win.classList.contains('hidden')) return leaveVisit(r ? null : OUT_WHEN_SHUT);
  V.t += dt;
  const tgt = visitTarget();
  if (tgt && tgt !== rec) { V.follow += dt; if (V.follow > 3.5) { leaveVisit(FOLLOW); startVisit(tgt); return; } } else V.follow = 0;
  if (V.sub === 'walk' && V.to) {
    const dx = V.to.x - V.x, dy = V.to.y - V.y, d = Math.hypot(dx, dy);
    if (d < 2) { V.sub = 'idle'; V.t = 0; V.wait = 2 + Math.random() * 5; V.to = null; }
    else { V.x += dx / d * 30 * dt; V.y += dy / d * 30 * dt * 0.7; if (Math.abs(dx) > 1) P.dir = dx > 0 ? 1 : -1; }
  } else if (V.t > V.wait) {
    if (V.sub === 'nap') { V.sub = 'idle'; V.t = 0; V.wait = 1.5; speak('...back. what did i miss', 2.6); }
    else visitAction(r);
  }
  V.x = Math.max(4, Math.min(r.w - MINI_W - 4, V.x)); V.y = Math.max(r.th + 2, Math.min(r.h - MINI_H - 2, V.y));
  P.x = r.x + V.x; P.y = r.y + V.y; V.abs = { x: P.x, y: P.y };
  const z = (+rec.win.style.zIndex || 100) + 1;
  el.style.zIndex = z; if (bub) bub.style.zIndex = z + 1;
}
/* a trophy is earned while he is in the window: the card slides over the app, and he hops (a big one, a seal, a gold, makes him need a moment) */
try {
  window.addEventListener('trophy-earned', ev => {
    if (P.mode !== 'visit' || !el) return;
    const d = ev.detail || {};
    V.sub = 'cheer'; V.t = 0; V.wait = 1.6;
    speak(line(d.mastery || d.tier === 'G' ? BIG_CHEER : CHEER), 4.4);
    snd(523, 90, { type: 'triangle', to: 784, vol: 0.02 });
  });
} catch (e) { /* no window */ }

function think() {
  const sleepy = lateHour();
  { const tgt = visitTarget(); if (tgt && Math.random() < VISIT_RATE * (sleepy ? 0.6 : 1)) return startVisit(tgt); }
  const canPush = performance.now() - P.lastPush > 150000 && petIcons().length > 2;
  const w = [['walk', 5], ['sleep', sleepy ? 6 : 1.4], ['talk', 2.2], ['push', canPush ? 1.4 : 0], ['hop', 0.7], ['stay', 1.5]];
  let r = Math.random() * w.reduce((a, b) => a + b[1], 0), c = 'stay';
  for (const [k, v] of w) { if ((r -= v) < 0) { c = k; break; } }
  if (c === 'walk') wander(); else if (c === 'sleep') goodbye(); else if (c === 'talk') talk(); else if (c === 'push') pushIcon(); else if (c === 'hop') hop();
  else { P.mode = 'idle'; P.t = 0; P.wait = 2 + Math.random() * 4; }
}

/* ---- one frame -------------------------------------------------------------------------------------------------------------- */
function tick(ts) {
  raf = requestAnimationFrame(tick);
  if (!el) return;
  const dt = Math.min(0.1, (ts - (last || ts)) / 1000);
  last = ts;
  P.t += dt;
  if (P.say > 0) { P.say -= dt; if (P.say <= 0 && bub) bub.style.display = 'none'; }

  if (P.mode === 'walk' || P.mode === 'home') {
    const sp = P.mode === 'home' ? SPEED * 1.6 : SPEED, dx = P.to.x - P.x, dy = P.to.y - P.y, d = Math.hypot(dx, dy);
    if (d < 3) arrive();
    else {
      P.x += dx / d * sp * dt; P.y += dy / d * sp * dt * 0.7;
      if (Math.abs(dx) > 2) P.dir = dx > 0 ? 1 : -1;
      P.step += dt; if (P.step > 0.45) { P.step = 0; snd(62, 40, { type: 'triangle', vol: 0.012 }); }
    }
  } else if (P.mode === 'jump') {
    const k = Math.min(1, P.t / P.jump.len);
    P.x = P.jump.x0 + (P.jump.x1 - P.jump.x0) * k; P.y = P.jump.y0 + (P.jump.y1 - P.jump.y0) * k - Math.sin(k * Math.PI) * 90;
    if (k >= 1) { P.mode = 'idle'; P.t = 0; P.wait = 1.2; snd(80, 80, { type: 'triangle', to: 50, vol: 0.04 }); if (P.jump.say) speak(P.jump.say, 5); P.jump = null; save(); }
  } else if (P.mode === 'push') {
    if (P.job && !P.job.done && P.t > 0.7) { P.job.done = true; shove(); }
    if (P.t > 1.5) { P.mode = 'idle'; P.t = 0; P.wait = 2.5; P.job = null; }
  } else if (P.mode === 'sleep') {
    P.snore -= dt; if (P.snore <= 0) { P.snore = 3.2; snd(104, 700, { type: 'sine', to: 78, vol: 0.008 }); }
    const c = { x: P.x + SW / 2, y: P.y + SH / 2 };
    if (Math.hypot(ptr.x - c.x, ptr.y - c.y) < 80 && P.t > 3) { trophy('woken'); P.mode = 'idle'; P.t = 0; P.wait = 2; speak(line(WAKES_NEAR), 3.5); }
    else if (P.t > P.wait) { P.mode = 'idle'; P.t = 0; P.wait = 1.5; speak(line(WAKES), 3.2); }
  } else if (P.mode === 'goodbye') {
    if (P.t > P.wait) sleep();
  } else if (P.mode === 'visit') {
    visitTick(dt);
  } else if (P.mode === 'idle' || P.mode === 'talk' || P.mode === 'hop') {
    /* every few seconds, if there is a window in use, go and see it (he does not wait for his next big decision) */
    V.look += dt;
    if (V.look > 3) { V.look = 0; const tgt = visitTarget(); if (tgt && P.t > 0.8 && Math.random() < 0.55) { startVisit(tgt); return; } }
    if (P.t > P.wait) think();
  }
  if (!el) return;                                   /* he went in on this very frame */
  if (P.mode !== 'carried' && P.mode !== 'visit') { P.x = clampX(P.x); P.y = clampY(P.y); }

  el.style.transform = 'translate(' + Math.round(P.x) + 'px,' + Math.round(P.y) + 'px)';
  cv.style.transform = P.dir < 0 ? 'scaleX(-1)' : '';
  if (bub && bub.style.display !== 'none') bub.style.transform = 'translate(' + Math.round(Math.min(room().w - 240, Math.max(4, P.x + MW() / 2 - 40))) + 'px,' + Math.round(Math.max(2, P.y + 6 - bubH)) + 'px)';
  if (ts - drawAt > 80) { drawAt = ts; drawMini(g, { pose: pose(), t: ts / 1000, wear: st.wear, think: P.mode === 'talk' }); }
}

function arrive() {
  const j = P.job;
  if (P.mode === 'home') {
    /* at the side of his window: now he walks in, behind its edge (he lives under every window), and the big one starts walking in from that edge */
    if (j && j.kind === 'enter' && j.stage === 0) {
      j.stage = 1; P.dir = j.side < 0 ? 1 : -1;
      P.to = { x: j.side < 0 ? j.r.x + 4 : j.r.x + j.r.w - SW - 4, y: P.y };
      ARRIVE.side = j.side; ARRIVE.t0 = performance.now(); if (P.viaDoor) { P.viaDoor = false; trophy('door'); }
      st.out = false; save(); tell();
      return;
    }
    vanish(); return;
  }
  if (j && j.kind === 'visit') { enterWindow(j.rec, j.side); return; }
  if (j && j.kind === 'push') { P.dir = 1; P.mode = 'push'; P.t = 0; snd(120, 90, { type: 'triangle', to: 90, vol: 0.03 }); return; }
  P.mode = 'idle'; P.t = 0; P.wait = 1.5 + Math.random() * 4; P.job = null; save();
}
function shove() {
  const j = P.job, jx = j.ix + ICON_W * (1 + Math.floor(Math.random() * 2)), jy = j.iy + Math.round((Math.random() - 0.5) * 2) * ICON_H;
  const moved = petMoveIcon(j.name, jx, jy);
  if (moved) { st.last = { name: j.name, x: moved.from.x, y: moved.from.y }; speak(line(PUSH_LINES), 3.5); snd(180, 120, { type: 'triangle', to: 110, vol: 0.035 }); save(); }
}

/* ---- being handled --------------------------------------------------------------------------------------------------------------- */
function wire() {
  el.addEventListener('mousedown', ev => ev.stopPropagation());       /* the desktop under him must not hear it as a click on the desktop */
  el.addEventListener('pointerdown', ev => {
    if (ev.button !== 0) return;
    ev.stopPropagation(); hideMenus();
    el.setPointerCapture(ev.pointerId);
    P.down = { px: ev.clientX, py: ev.clientY, ox: ev.clientX - P.x, oy: ev.clientY - P.y, moved: false };
  });
  el.addEventListener('pointermove', ev => {
    const d = P.down; if (!d) return;
    if (!d.moved && Math.hypot(ev.clientX - d.px, ev.clientY - d.py) > 5) { d.moved = true; P.mode = 'carried'; P.job = null; speak('oh. put me down gently, pal. there we go', 3); snd(300, 60, { type: 'triangle', vol: 0.02 }); }
    if (d.moved) {
      const r = desk().getBoundingClientRect();
      P.x = ev.clientX - r.left - SW / 2; P.y = ev.clientY - r.top - SH / 2;
    }
  });
  const end = ev => {
    const d = P.down; if (!d) return;
    P.down = null;
    try { el.releasePointerCapture(ev.pointerId); } catch (e) { /* already let go */ }
    if (d.moved) { trophy('picked-up'); P.x = clampX(P.x); P.y = clampY(P.y); P.mode = 'hop'; P.t = 0; P.wait = 0.8; speak('thank you, friend', 2.5); save(); return; }
    if (P.mode === 'sleep') { P.mode = 'idle'; P.t = 0; P.wait = 2; speak('i wasn\'t asleep. i was thinking', 3.5); return; }
    trumpet(); hop(); speak(Math.random() < 0.4 ? 'hello, friend' : line(LINES), 4.5);
  };
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);
  el.addEventListener('contextmenu', ev => {
    ev.preventDefault(); ev.stopPropagation();
    showMenu(document.getElementById('ctxmenu'), ev.clientX, ev.clientY, [
      { label: 'SAY SOMETHING', run: () => { P.job = null; talk(); } },
      { label: 'LIE DOWN', run: () => { P.job = null; goodbye(); } },
      { label: 'TRUMPET', run: () => { trumpet(); hop(); } },
      { label: 'PUT THE LAST ICON BACK', off: !st.last, run: () => Pet.putBack() },
      { sep: true },
      { label: 'GO BACK INSIDE', run: () => Pet.home() }
    ]);
  });
}
function trumpet() { snd(196, 380, { type: 'sawtooth', to: 392, vol: 0.03 }); snd(392, 300, { type: 'triangle', delay: 0.16, vol: 0.03 }); }

/* ---- coming and going ------------------------------------------------------------------------------------------------------------ */
function build() {
  if (el) return;
  const d = desk(); if (!d) return;
  el = document.createElement('div'); el.id = 'pet';
  cv = document.createElement('canvas'); cv.width = MINI_W; cv.height = MINI_H;
  g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
  el.appendChild(cv);
  bub = document.createElement('div'); bub.id = 'petsay';
  d.appendChild(el); d.appendChild(bub);
  wire();
  if (!hooked) { hooked = true; document.addEventListener('mousemove', ev => { const r = desk().getBoundingClientRect(); ptr = { x: ev.clientX - r.left, y: ev.clientY - r.top }; }); }
  last = 0; raf = requestAnimationFrame(tick);
}
function vanish() {
  V.rec = null; P.k = 2;
  if (raf) cancelAnimationFrame(raf); raf = null;
  if (el) { el.remove(); bub.remove(); }
  el = cv = g = bub = null;
  st.out = false; save(); tell();
}
const elephantRec = () => openWins.find(r => r.appId === 'elephant' && r.win.querySelector('canvas.elecv')) || null;
const winRect = () => {
  const rec = elephantRec(), d = desk();
  if (!rec || !d || rec.win.classList.contains('hidden')) return null;
  const r = rec.win.getBoundingClientRect(), o = d.getBoundingClientRect();
  return { x: r.left - o.left, y: r.top - o.top, w: r.width, h: r.height };
};
/* the way in: to the side of the window nearer to him (the one that has room for him to stand), at a height inside it */
function walkIn(r) {
  const { w } = room(), mid = P.x + SW / 2;
  const fits = side => side < 0 ? r.x - SW >= -20 : r.x + r.w + SW <= w + 20;
  let side = mid < r.x + r.w / 2 ? -1 : 1;
  if (!fits(side) && fits(-side)) side = -side;
  const feet = Math.max(r.y + 50, Math.min(r.y + r.h - 16, P.y + FOOT));
  P.job = { kind: 'enter', side, r, stage: 0 };
  P.mode = 'home'; P.t = 0;
  P.to = { x: clampX(side < 0 ? r.x - SW + 4 : r.x + r.w - 4), y: clampY(feet - FOOT) };
  /* already wholly behind the window (it is as big as the desk, say): there is nothing to stage, straight in */
  if (P.x >= r.x && P.x + SW <= r.x + r.w && P.y >= r.y && P.y + SH <= r.y + r.h) P.to = { x: P.x, y: P.y };
}

export const Pet = {
  wear: () => Object.assign({}, st.wear),
  setWear(slot, id) {
    if (SLOTS.indexOf(slot) < 0) return false;
    if (id && !(window.Cos && window.Cos.has('elephant', id))) return false;
    if (id) st.wear[slot] = id; else delete st.wear[slot];
    save(); tell();
    return true;
  },
  isOut: () => st.out && owned(),
  /* returns the way to stop listening, for a window that has closed */
  onChange: f => { subs.push(f); return () => { const i = subs.indexOf(f); if (i >= 0) subs.splice(i, 1); }; },
  boot() {
    wardrobeNow();
    if (!st.out || !owned()) return;
    const { w, h } = room();
    P.x = Math.max(0, Math.min(w - SW, st.x)); P.y = Math.max(30, Math.min(h - SH - 4, st.y));
    build();
    P.mode = 'idle'; P.t = 0; P.wait = 1.5;
  },
  /* out of his window and onto the desktop: a jump from where the window is to a spot beside it */
  out() {
    if (!owned()) return false;
    if (st.out && el) return true;
    ARRIVE.t0 = 0;
    st.out = true;
    const { w, h } = room(), r = winRect() || { x: w / 2 - 200, y: h / 2 - 150, w: 400, h: 300 };
    build();
    const x0 = r.x + r.w / 2 - SW / 2, y0 = r.y + r.h - SH - 20;
    const right = r.x + r.w + SW + 60 < w;
    const x1 = right ? r.x + r.w + 20 : Math.max(0, r.x - SW - 20), y1 = Math.min(h - SH - 6, r.y + r.h - SH + 10);
    trophy('out'); P.x = x0; P.y = y0; P.dir = x1 >= x0 ? 1 : -1;
    P.mode = 'jump'; P.t = 0; P.jump = { x0, y0, x1: Math.max(0, Math.min(w - SW, x1)), y1: Math.max(30, y1), len: 1.0, say: 'outside. there is more of it than i thought' };
    snd(392, 120, { type: 'triangle', to: 660, vol: 0.03 });
    save(); tell();
    return true;
  },
  /* back in: he walks to his window, in behind its edge and is gone, and the big elephant in the window walks in from the same side
     (arriving() tells it). If the window is not open he opens it himself (the app is the door), waits for it, and then goes in;
     if it will not open he walks off the nearest edge as he always did */
  home() {
    if (!el) { st.out = false; save(); tell(); return; }
    if (P.mode === 'visit') leaveVisit(null);
    if (P.mode === 'home' || P.mode === 'door') return;
    P.job = null;
    const walkOff = () => {
      if (!el) return;
      const { w, h } = room();
      P.mode = 'home'; P.job = { kind: 'exit' };
      P.to = { x: P.x + SW / 2 < w / 2 ? -SW : w, y: Math.min(h - SH - 4, P.y) };
    };
    const go = () => { if (!el) return; const r = winRect(); if (r) walkIn(r); else walkOff(); };
    if (winRect()) { speak(line(HOME_LINES), 3.5); go(); return; }
    /* open but minimized: bring it back rather than opening a second one */
    const rec = elephantRec();
    if (rec) {
      P.mode = 'door'; P.t = 0; speak(line(DOOR_LINES), 3.2);
      rec.btn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
      setTimeout(go, 450);
      return;
    }
    P.mode = 'door'; P.t = 0; P.viaDoor = true;
    speak(line(DOOR_LINES), 3.2);
    snd(196, 90, { type: 'square', vol: 0.012 }); snd(196, 90, { type: 'square', delay: 0.14, vol: 0.012 });
    openWindow('elephant').catch(() => {}).then(() => setTimeout(go, 450));
  },
  /* set while the big elephant in his window is walking in: { side: -1 (from the left edge) | 1, t0 } or null */
  arriving: () => (ARRIVE.t0 && performance.now() - ARRIVE.t0 < ARRIVE_MS ? { side: ARRIVE.side, t0: ARRIVE.t0, ms: ARRIVE_MS } : null),
  putBack() {
    const l = st.last;
    if (!l) return false;
    if (petMoveIcon(l.name, l.x, l.y)) { trophy('put-back'); st.last = null; speak('put back. i was only helping, kiddo', 3.5); save(); return true; }
    st.last = null; save();
    return false;
  }
};
window.Pet = Pet;
try { window.addEventListener('cos-changed', wardrobeNow); } catch (e) { /* no window */ }
