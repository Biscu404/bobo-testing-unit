/* The trophies you have pulled out of the box (apps/trophybox) and left on the desktop: small objects with weight and a hitbox.
   They fall under gravity, bounce a little (a heavy one less), slide and stop on the floor of the desktop, stand on each other, stand on the top edge of a window
   (a one-way platform: they land on it from above and fall off when it moves away), hit the walls, and can be picked up and thrown. A gold cup is light, a mastery seal heavy:
   a seal landing on a cup shoves it. They sleep when they are at rest (no frame is spent on them) and wake when anything moves under them.
   They sit under the windows and over the icons, like the elephant. What is saved is which are out and where. Double-click one to put it back in the box.
   The simulation is `stepWorld` (pure: no DOM), held by `node scripts/check-drop.mjs`. */
import { cupUrl, wearOf } from '../apps/trophy_art.js';

const KEY = 'templeos.trophyprops.v1';
export const G = 2400, MAXV = 2200;
const SIZE = { B: 36, S: 42, G: 48, secret: 44, meta: 60 };
const REST = { B: 0.42, S: 0.38, G: 0.34, secret: 0.36, meta: 0.14 };
const MASS = { B: 0.7, S: 1, G: 1.4, secret: 1.2, meta: 3 };

/* ---- the pure part: bodies { x, y, w, h, vx, vy, m, e, drag, sleep, rest, py } in a box W x H, with one-way platforms [{ x, y, w }] -------------- */
export function stepWorld(bodies, W, H, plats, dt) {
  for (const b of bodies) {
    if (b.drag || b.sleep) continue;
    b.py = b.y + b.h; b.px = b.x;
    b.vy = Math.min(MAXV, b.vy + G * dt);
    b.x += b.vx * dt; b.y += b.vy * dt;
    b.ground = false;
    if (b.x < 0) { b.x = 0; b.vx = Math.abs(b.vx) * b.e; }
    if (b.x + b.w > W) { b.x = W - b.w; b.vx = -Math.abs(b.vx) * b.e; }
    if (b.y < -b.h) { b.y = -b.h; b.vy = 0; }
    if (b.y + b.h >= H) { b.y = H - b.h; land(b); }
    else for (const p of plats) {
      if (b.vy >= 0 && b.py <= p.y + 3 && b.y + b.h >= p.y && b.x + b.w > p.x + 6 && b.x < p.x + p.w - 6) { b.y = p.y - b.h; land(b); break; }
    }
  }
  /* bodies against bodies: push apart along the shallower axis, share the speed by mass */
  const order = bodies.slice().sort((p, q) => (q.y + q.h) - (p.y + p.h));          /* the lowest first, so a pile is solved from the floor up */
  for (let pass = 0; pass < 6; pass++) {
    for (let i = 0; i < order.length; i++) for (let j = i + 1; j < order.length; j++) {
      const a = order[i], c = order[j];
      const ox = Math.min(a.x + a.w, c.x + c.w) - Math.max(a.x, c.x), oy = Math.min(a.y + a.h, c.y + c.h) - Math.max(a.y, c.y);
      if (ox <= 0 || oy <= 0) continue;
      if (a.sleep && c.sleep) continue;
      /* a hard hit wakes the sleeper; a gentle touch (one resting on the other) leaves it asleep, and a sleeper does not give way */
      if (Math.hypot(a.vx - c.vx, a.vy - c.vy) > 80) { a.sleep = false; c.sleep = false; a.rest = 0; c.rest = 0; }
      const fixedA = a.drag || a.sleep, fixedC = c.drag || c.sleep;
      if (fixedA && fixedC) continue;
      let wA = fixedA ? 0 : 1 / a.m, wC = fixedC ? 0 : 1 / c.m;
      if (ox >= oy) {                                  /* stacked: whatever stands on the floor does not give way */
        if (a.y > c.y ? a.y + a.h >= H - 1 : false) wA = 0;
        if (c.y > a.y ? c.y + c.h >= H - 1 : false) wC = 0;
        if (a.y > c.y && a.ground && a.rest > 0.1) wA = 0;
        if (c.y > a.y && c.ground && c.rest > 0.1) wC = 0;
      }
      const wT = wA + wC || 1;
      if (ox < oy) {                                   /* side by side */
        const dir = (a.x + a.w / 2) < (c.x + c.w / 2) ? -1 : 1;
        a.x += dir * ox * (wA / wT); c.x -= dir * ox * (wC / wT);
        const va = a.vx, vc = c.vx, e = Math.min(a.e, c.e);
        if ((va - vc) * dir < 0) { const j2 = -(1 + e) * (va - vc) / wT; if (!fixedA) a.vx += j2 * wA; if (!fixedC) c.vx -= j2 * wC; }
      } else {                                         /* one on top of the other */
        const dir = (a.y + a.h / 2) < (c.y + c.h / 2) ? -1 : 1;     /* -1: a is above */
        a.y += dir * oy * (wA / wT); c.y -= dir * oy * (wC / wT);
        const va = a.vy, vc = c.vy, e = Math.min(a.e, c.e) * 0.6;
        if ((va - vc) * dir < 0) { const j2 = -(1 + e) * (va - vc) / wT; if (!fixedA) a.vy += j2 * wA; if (!fixedC) c.vy -= j2 * wC; }
        const top = dir < 0 ? a : c; top.ground = true;
        /* the one on top slides a little with the one below */
        const bot = dir < 0 ? c : a; if (!top.drag) top.vx += (bot.vx - top.vx) * 0.2;
      }
    }
  }
  for (const b of bodies) {
    if (b.drag || b.sleep) continue;
    /* the stack may have pushed something into the floor or a wall: put it back, and take the speed out of the push */
    if (b.y + b.h > H) { b.y = H - b.h; if (b.vy > 0) b.vy = 0; b.ground = true; }
    if (b.x < 0) b.x = 0; if (b.x + b.w > W) b.x = W - b.w;
    if (b.ground) b.vx *= Math.max(0, 1 - 9 * dt);
    if (Math.abs(b.vx) < 8 && Math.abs(b.vy) < 110 && b.ground) { b.rest += dt; if (b.rest > 0.45) { b.sleep = true; b.vx = 0; b.vy = 0; } } else b.rest = 0;
  }
}
function land(b) {
  b.ground = true;
  if (b.vy > 90) b.vy = -b.vy * b.e; else b.vy = 0;
  b.vy = Math.abs(b.vy) < 40 ? 0 : b.vy;
}

/* ---- the machine part ---------------------------------------------------------------------------------------------------------------------------- */
let layer = null, raf = 0, last = 0, hash = '', bodies = [], saved = { out: [] }, subs = [], hooked = false;
const T = () => window.Trophies;
const desk = () => document.getElementById('desktop');
const load = () => { try { const j = JSON.parse(localStorage.getItem(KEY)); if (j && Array.isArray(j.out)) saved = j; } catch (e) { /* none yet */ } };
const store = () => { try { saved.out = bodies.map(b => ({ id: b.id, x: Math.round(b.x), y: Math.round(b.y) })); localStorage.setItem(KEY, JSON.stringify(saved)); } catch (e) { /* no storage */ } subs.forEach(f => { try { f(); } catch (e) {} }); };
const platforms = () => {
  const o = desk().getBoundingClientRect(), out = [];
  document.querySelectorAll('#desktop .win').forEach(w => {
    if (w.classList.contains('hidden') || w.style.display === 'none') return;
    const r = w.getBoundingClientRect();
    out.push({ x: r.left - o.left, y: r.top - o.top, w: r.width });
  });
  return out;
};
const platHash = () => platforms().map(p => Math.round(p.x) + ',' + Math.round(p.y) + ',' + Math.round(p.w)).join(';');

function ensureLayer() {
  if (layer && layer.isConnected) return layer;
  const d = desk(); if (!d) return null;
  layer = document.createElement('div'); layer.id = 'trophyprops';
  d.appendChild(layer);
  if (!hooked) {
    hooked = true;
    window.addEventListener('resize', () => { wakeAll(); });
    setInterval(() => { if (!bodies.length) return; const h = platHash(); if (h !== hash) { hash = h; wakeAll(); } }, 350);
  }
  return layer;
}
function wakeAll() { bodies.forEach(b => { b.sleep = false; b.rest = 0; }); start(); }
function start() { if (!raf && bodies.length) { last = 0; raf = requestAnimationFrame(frame); } }
function frame(ts) {
  raf = 0;
  const d = desk(); if (!d) return;
  const dt = Math.min(1 / 30, last ? (ts - last) / 1000 : 1 / 60); last = ts;
  const W = d.clientWidth, H = d.clientHeight;
  stepWorld(bodies, W, H, platforms(), dt);
  let awake = false;
  for (const b of bodies) {
    b.el.style.transform = 'translate(' + Math.round(b.x) + 'px,' + Math.round(b.y) + 'px)';
    if (!b.sleep) awake = true;
    if (b.wasAwake && b.sleep) store();
    b.wasAwake = !b.sleep;
  }
  if (awake) raf = requestAnimationFrame(frame);
}

function make(id, x, y) {
  const defn = T() && T().get(id); if (!defn || !ensureLayer()) return null;
  const wear = wearOf(defn), s = SIZE[wear] || 44;
  const el = document.createElement('div'); el.className = 'tprop w-' + wear; el.dataset.id = id;
  el.style.width = s + 'px'; el.style.height = s + 'px'; el.style.backgroundImage = 'url("' + cupUrl(wear, false) + '")';
  el.title = T().plainName(defn) + '  (double-click: back in the box)';
  layer.appendChild(el);
  const b = { id, el, x, y, w: s, h: s, vx: 0, vy: 0, m: (MASS[wear] || 1) * (s / 44), e: REST[wear] || 0.3, sleep: false, rest: 0, drag: false, wasAwake: true };
  bodies.push(b); wire(b);
  return b;
}

function wire(b) {
  let samples = [], moved = false, off = { x: 0, y: 0 };
  const rect = () => desk().getBoundingClientRect();
  const down = (ev, grabbed) => {
    b.drag = true; b.sleep = false; moved = !!grabbed; samples = [];
    const o = rect(); off = grabbed ? { x: b.w / 2, y: b.h / 2 } : { x: ev.clientX - o.left - b.x, y: ev.clientY - o.top - b.y };
    b.el.classList.add('held'); wakeAll();
    const mv = e => {
      const o2 = rect();
      if (!moved && Math.hypot(e.clientX - ev.clientX, e.clientY - ev.clientY) > 4) moved = true;
      if (!moved) return;
      b.x = e.clientX - o2.left - off.x; b.y = e.clientY - o2.top - off.y; b.vx = b.vy = 0;
      samples.push({ t: performance.now(), x: b.x, y: b.y }); if (samples.length > 6) samples.shift();
      b.el.style.transform = 'translate(' + Math.round(b.x) + 'px,' + Math.round(b.y) + 'px)';
    };
    const up = e => {
      document.removeEventListener('pointermove', mv); document.removeEventListener('pointerup', up); document.removeEventListener('pointercancel', up);
      b.drag = false; b.el.classList.remove('held');
      if (!moved) { const d = T() && T().get(b.id); if (d && window.toast) window.toast(T().plainName(d)); wakeAll(); return; }
      /* let go over the box: back in; let go inside a window: stand on top of it */
      const hit = document.elementsFromPoint(e.clientX, e.clientY);
      if (hit.some(n => n.classList && n.classList.contains('tbox'))) { TrophyProps.put(b.id); return; }
      const a = samples[0], z = samples[samples.length - 1];
      if (a && z && z.t > a.t) { b.vx = Math.max(-MAXV, Math.min(MAXV, (z.x - a.x) / ((z.t - a.t) / 1000))); b.vy = Math.max(-MAXV, Math.min(MAXV, (z.y - a.y) / ((z.t - a.t) / 1000))); }
      const cx = b.x + b.w / 2;
      platforms().forEach(p => { if (cx > p.x && cx < p.x + p.w && b.y + b.h > p.y + 4 && b.y < p.y + 24 + b.h) { b.y = p.y - b.h; b.vy = Math.min(b.vy, 0); } });
      wakeAll(); store();
    };
    document.addEventListener('pointermove', mv); document.addEventListener('pointerup', up); document.addEventListener('pointercancel', up);
  };
  b.grab = down;
  b.el.addEventListener('pointerdown', ev => { if (ev.button !== 0) return; ev.stopPropagation(); ev.preventDefault(); down(ev, false); });
  b.el.addEventListener('mousedown', ev => ev.stopPropagation());
  b.el.addEventListener('dblclick', ev => { ev.stopPropagation(); TrophyProps.put(b.id); });
}

export const TrophyProps = {
  isOut: id => bodies.some(b => b.id === id),
  outIds: () => bodies.map(b => b.id),
  onChange(f) { subs.push(f); return () => { const i = subs.indexOf(f); if (i >= 0) subs.splice(i, 1); }; },
  /* the trophies that earn a place in the box: gold ones and the seals (a mirror of a game's own achievement does not) */
  bigList() { const t = T(); if (!t) return []; return t.earnedList(d => !d.legacy && (d.tier === 'G' || d.mastery)); },
  /* picked up out of the box by the pointer that is already down: the trophy is under it and held */
  pickup(id, ev) {
    if (this.isOut(id) || !ensureLayer()) return false;
    const o = desk().getBoundingClientRect();
    const b = make(id, ev.clientX - o.left - 24, ev.clientY - o.top - 24); if (!b) return false;
    b.x = ev.clientX - o.left - b.w / 2; b.y = ev.clientY - o.top - b.h / 2;
    b.grab(ev, true); store();
    return true;
  },
  /* set down by name (the box's "all out"): dropped from above in a row */
  out(id, x, y) { if (this.isOut(id) || !ensureLayer()) return false; const b = make(id, x, y); if (!b) return false; start(); store(); return true; },
  put(id) {
    const i = bodies.findIndex(b => b.id === id); if (i < 0) return false;
    bodies[i].el.remove(); bodies.splice(i, 1); wakeAll(); store(); return true;
  },
  boot() {
    load();
    (saved.out || []).forEach(p => { if (T() && T().get(p.id) && T().earned(p.id)) make(p.id, p.x, p.y); });
    wakeAll();
  }
};
if (typeof window !== 'undefined') window.TrophyProps = TrophyProps;
