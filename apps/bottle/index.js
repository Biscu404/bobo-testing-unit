import { Snd } from '../../kernel/snd.js';
import { makeSfx } from './sfx.js';
import { makeArt, BW, BH, C, GLS, BOT } from './art.js';
import { makeContainer } from './raster.js';
import { clamp, makeSlosh, stepSlosh, JAG_FULL, JAG_SHOT, POURED_FILL, BOT_FULL } from './physics.js';
import { startPour, pourStep } from './pour.js';
import { startDrink, drinkStep, glassRim, glassRest } from './drink.js';
import { scopedListeners, whenGone } from '../lifecycle.js';

const JAG_KEY = 'templeos.bottle.v1';
const JAG_LINES = [
  'GOOD.', 'STILL GOOD.', 'THAT IS THE ONE THAT WORKS.',
  'YOU ARE HAVING A LOVELY TIME.', 'THE ROOM IS SLIGHTLY WIDER NOW.',
  'YOU HAVE OPINIONS ABOUT THE MENUBAR.', 'YOU TELL THE MACHINE YOU LOVE IT.',
  'THE MACHINE SAYS NOTHING BACK.', 'PERHAPS SOME WATER.',
  'DRINK SOME WATER. THIS IS NOT A SUGGESTION.'
];
const REST_C = [BOT.rest[0], BOT.rest[1] - BOT.cy];
const GCX = GLS.rest[0], FLOOR = GLS.rest[1] - 6;

export default {
  id: 'bottle',
  title: 'THE BOTTLE',
  width: 430,
  height: 480,
  resizable: true,
  mount(root, ctx) {
    const body = root;
    const wrap = document.createElement('div');
    wrap.className = 'gamepane jagpane';
    const cv = document.createElement('canvas');
    cv.width = BW; cv.height = BH;
    cv.className = 'gamecv jagcv';
    cv.tabIndex = 0;
    wrap.appendChild(cv);
    const bar = document.createElement('div');
    bar.className = 'appbar';
    const bBuy = document.createElement('button'); bBuy.className = 'appbtn'; bBuy.textContent = 'BUY A NEW BOTTLE';
    const info = document.createElement('span'); info.className = 'godword';
    bar.appendChild(bBuy); bar.appendChild(info);
    body.appendChild(wrap); body.appendChild(bar);

    const g = cv.getContext('2d');
    if (!g) { info.textContent = 'NO CANVAS.'; return; }
    g.imageSmoothingEnabled = false;
    const A = makeArt(g), { R, T } = A;
    const sfx = makeSfx(Snd);
    const botC = makeContainer(A.bottleSpec), glsC = makeContainer(A.glassSpec), handC = makeContainer(A.handSpec);
    const liq = C.liquid;

    const S = {
      ml: JAG_FULL, drunk: 0, bottles: 1, phase: 'idle', t: 0, note: '', noteT: 0, queue: 0,
      bot: { c: REST_C.slice(), a: 0, vol: BOT_FULL, capOn: true, surf: null, n0: botC.n0, slosh: makeSlosh() },
      gls: { c: glassRest(), a: 0, vol: 0, hand: false, slosh: makeSlosh() },
      face: null, stream: 0, q: 0, lip: null, glassSurf: FLOOR, glassVol: 0, glugPh: 0, glugIn: 0, dripIn: 0,
      bubbles: [], fizz: [], rings: [], drops: [], flight: [], ringIn: 0, foam: 0, poured: 0, swallowed: 0, pending: 0
    };
    let wasFull = 0;
    const L = scopedListeners(root);
    try {
      const raw = JSON.parse(localStorage.getItem(JAG_KEY) || 'null');
      if (raw) { S.ml = raw.ml == null ? JAG_FULL : raw.ml; S.drunk = raw.drunk || 0; S.bottles = raw.bottles || 1; wasFull = raw.glass || 0; }
    } catch (e) {}
    S.bot.vol = (S.ml / JAG_FULL) * BOT_FULL;
    S.gls.vol = wasFull ? POURED_FILL : 0;
    const save = () => { try { localStorage.setItem(JAG_KEY,
      JSON.stringify({ ml: S.ml, drunk: S.drunk, bottles: S.bottles, glass: S.gls.vol > 0.55 ? 1 : 0 })); } catch (e) {} };
    const say = t => { S.note = t; S.noteT = 3; };
    const full = () => S.gls.vol > 0.55;
    const fx = { sfx, get glassSurf() { return S.glassSurf; } };
    let pouringSnd = false;

    /* ---- the picture ---------------------------------------------------- */
    function drawStream(ts) {
      const L = S.lip;
      if (!L || S.stream < 0.03) return;
      const tEnd = Math.max(0.05, (Math.sqrt(L.vy * L.vy + 2 * 520 * Math.max(6, S.glassSurf - L.y)) - L.vy) / 520);
      let px = L.x, py = L.y;
      for (let t = 0.011; t < tEnd + 0.011; t += 0.011) {
        const tt = Math.min(t, tEnd);
        const x = L.x + L.vx * tt + Math.sin(ts * 31 + tt * 40) * 0.4, y = L.y + L.vy * tt + 260 * tt * tt;
        const spd = Math.hypot(L.vx, L.vy + 520 * tt);
        /* continuity: the faster it falls the thinner it gets, but it never quite vanishes */
        const w = Math.max(2, Math.round(S.q / Math.max(30, spd) * 1.5));
        const dx = x - px, dy = y - py;
        const c = (x0, y0, ww, hh, col) => R(x0, y0, ww, hh, col);
        if (Math.abs(dy) >= Math.abs(dx)) {
          c(Math.min(px, x) - w / 2, Math.min(py, y), w, Math.abs(dy) + 1, C.liquidHi);
          c(Math.min(px, x) - w / 2 + 1, Math.min(py, y), Math.max(1, w - 2), Math.abs(dy) + 1, '#d98a32');
          c(Math.min(px, x) - w / 2, Math.min(py, y), 1, Math.abs(dy) + 1, '#f0b868');
        } else {
          c(Math.min(px, x), Math.min(py, y) - w / 2, Math.abs(dx) + 1, w, C.liquidHi);
          c(Math.min(px, x), Math.min(py, y) - w / 2 + 1, Math.abs(dx) + 1, Math.max(1, w - 2), '#d98a32');
          c(Math.min(px, x), Math.min(py, y) - w / 2, Math.abs(dx) + 1, 1, '#f0b868');
        }
        px = x; py = y;
      }
      const w0 = Math.max(2, Math.round(S.q / 60 * 1.5));
      S.landX = px;
      R(S.landX - w0 / 2 - 2, S.glassSurf - 1, w0 + 4, 2, '#f0b868');
    }

    function draw(ts) {
      const B = S.bot, G = S.gls;
      A.table();
      A.shadow(GLS.rest[0], 293, 84);
      if (S.phase === 'idle' || (S.phase === 'pour' && S.sub === 'return' && B.c[1] > REST_C[1] - 6)) A.shadow(70, 246, 86);
      if (!B.capOn) A.capOnBar();
      const bpose = { x: B.c[0], y: B.c[1], a: B.a };
      const rb = botC.render(g, bpose, { frac: B.vol, slope: Math.tan(B.slosh.a), layer: B.capOn ? 0 : 1, wave: S.phase === 'pour' ? 0.9 : 0, phase: ts * 9 });
      B.surf = { c: rb.c, slope: rb.slope, c0: rb.c0 };
      /* air going in as the liquor comes out */
      S.bubbles.forEach(b => { if (botC.inside(bpose, b.x, b.y)) { g.globalAlpha = 0.75; R(b.x, b.y, b.r, b.r, '#d8f0d0'); } });
      g.globalAlpha = 1;
      if (S.face) {
        const hx = 258 - 51, hy = 150 - 70 + S.face.dy;
        A.face(hx, hy, S.face);
      }
      if (G.hand) { A.arm(G.c[0] + 10, G.c[1] - 6 + 10); }
      const gpose = { x: G.c[0], y: G.c[1], a: G.a };
      const rim = glassRim(G.c, G.a);
      const moving = Math.abs(G.slosh.w) > 0.02;
      const rg = glsC.render(g, gpose, { frac: G.vol, slope: Math.tan(G.slosh.a), rim, layer: 0,
        wave: S.stream > 0.05 ? 1.6 : (moving ? 0.8 : 0), phase: ts * 14, foam: S.foam > 0.1 ? Math.min(2.5, S.foam) : 0 });
      if (rg.spilled > 0 && S.phase === 'drink' && S.t > 0.62) { G.vol = Math.max(0, rg.kk / rg.n); S.pending += rg.spilled / rg.n; S.run = ts; }
      S.glassSurf = Math.min(FLOOR, rg.surfY(GCX)); S.glassVol = G.vol;
      if (G.hand) handC.render(g, gpose, { frac: 0, layer: 0 });
      /* the liquor running over the rim into a mouth */
      if (S.phase === 'drink' && S.run && ts - S.run < 0.12) {
        const r = rim[0]; R(r[0] - 7, r[1] + 1, 8, 3, '#e0903a'); R(r[0] - 7, r[1] + 1, 8, 1, '#f0c070');
      }
      drawStream(ts);
      /* what is thrown up when the stream lands, and the drops that leave the lip */
      S.rings.forEach(r => { g.globalAlpha = 1 - r.t / r.life; R(r.x - r.r, S.glassSurf - 1, r.r * 2, 1, C.foam); });
      g.globalAlpha = 1;
      S.fizz.forEach(f => R(f.x, f.y, f.r, f.r, f.y < S.glassSurf + 3 ? C.foam : '#c58a44'));
      S.drops.forEach(p => R(p.x, p.y, p.r || 2, p.r || 2, p.c === 'liq' ? liq : p.c));
      /* the reckoning */
      const frac = clamp(S.ml / JAG_FULL, 0, 1);
      const shots = Math.floor(S.ml / JAG_SHOT + 1e-6);
      T('JÄGERMEISTER', 190, 20, C.label, 13, 'center');
      T(S.ml.toFixed(0) + ' ML LEFT  ·  ' + shots + ' MEASURE' + (shots === 1 ? '' : 'S'), 190, 34, C.white, 9, 'center');
      R(136, 300, 108, 8, '#1a1008');
      R(137, 301, Math.round(106 * frac), 6, frac > 0.25 ? C.label : '#c8542a');
      T('BOTTLE ' + S.bottles, 190, 322, C.dim, 8, 'center');
      T('DRUNK: ' + S.drunk + ' MEASURE' + (S.drunk === 1 ? '' : 'S') +
        '  (' + (S.drunk * JAG_SHOT / 1000).toFixed(2) + ' L)', 190, 336, C.white, 8, 'center');
      const hint = S.phase === 'pour' ? 'POURING...'
                 : S.phase === 'drink' ? 'DOWN IT GOES...'
                 : full() ? 'CLICK TO DRINK'
                 : S.ml < JAG_SHOT ? 'THE BOTTLE IS EMPTY'
                 : 'CLICK TO POUR';
      T(S.note || hint, 190, 350, S.note ? C.label : C.dim, 8, 'center');
      if (S.queue > 0) T('x' + S.queue, 366, 350, C.label, 8, 'right');
      g.globalAlpha = 0.06;
      const gr = g.createLinearGradient(0, 0, BW, BH);
      gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.5, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.fillRect(0, 0, BW, BH);
      g.globalAlpha = 1;
    }

    /* ---- what a click does ----------------------------------------------- */
    function next() {
      if (full()) { startDrink(S); sfx.sip(); return true; }
      if (S.ml < JAG_SHOT) { say('EMPTY. BUY ANOTHER ONE.'); sfx.deny(); S.queue = 0; return false; }
      startPour(S); sfx.cap(); return true;
    }
    /* clicks while something is going on are kept and acted on in turn, and
       the more of them there are the faster everything goes: drinking a whole
       bottle in one go is a matter of not stopping */
    function request() {
      if (window.Drunk && window.Drunk.blackedOut && window.Drunk.blackedOut()) return;
      if (S.phase === 'idle') next(); else S.queue = Math.min(8, S.queue + 1);
    }
    cv.addEventListener('mousedown', ev => { ev.stopPropagation(); cv.focus(); if (ev.button === 0) request(); });
    cv.addEventListener('keydown', ev => {
      if (ev.key === ' ' || ev.key === 'Enter') { ev.preventDefault(); if (!ev.repeat) request(); }
    });
    bBuy.addEventListener('click', () => {
      if (S.phase !== 'idle') return;
      S.ml = JAG_FULL; S.bottles++; S.bot.vol = BOT_FULL; save(); sfx.cork();
      say('A NEW BOTTLE. THE SAME AS THE LAST ONE.');
      cv.focus();
    });

    function donePour() {
      S.phase = 'idle'; S.stream = 0; S.q = 0; S.lip = null;
      S.ml = Math.max(0, S.ml0 - JAG_SHOT);
      S.bot.vol = (S.ml / JAG_FULL) * BOT_FULL; S.bot.a = 0; S.bot.c = REST_C.slice(); S.bot.capOn = true;
      S.gls.vol = Math.min(0.95, (S.gls0 || 0) + POURED_FILL);
      S.foam = 2.4;
      sfx.clink(); save();
      say('ONE MEASURE. FORTY MILLILITRES.');
    }
    function doneDrink() {
      S.phase = 'idle'; S.drunk++;
      S.gls.vol = Math.min(S.gls.vol, 0.03); S.face = null;
      sfx.down(); sfx.ahh(); save();
      if (window.Drunk) { if (window.Drunk.drink) window.Drunk.drink(); else window.Drunk.add(0.18); }
      say(JAG_LINES[Math.min(JAG_LINES.length - 1, Math.floor(S.drunk / 3))]);
    }

    /* ---- the simulation --------------------------------------------------- */
    function step(rdt) {
      const speed = 1 + Math.min(S.queue, 6) * 0.5;
      const dt = rdt * speed;
      if (S.noteT > 0) { S.noteT -= rdt; if (S.noteT <= 0) S.note = ''; }
      let done = false;
      if (S.phase === 'pour') done = pourStep(S, dt, fx);
      else if (S.phase === 'drink') done = drinkStep(S, dt, fx);
      else { S.stream = 0; }
      /* what has landed in the glass */
      for (let i = S.flight.length - 1; i >= 0; i--) {
        if (S.flight[i].at <= S.t) { S.gls.vol = Math.min(0.95, S.gls.vol + S.flight[i].dv); S.flight.splice(i, 1); }
      }
      stepSlosh(S.bot.slosh, S.bot.c[0], S.bot.c[1], S.bot.a, dt, 0.4);
      stepSlosh(S.gls.slosh, S.gls.c[0], S.gls.c[1], S.gls.a, dt, 0.45);
      /* the stream's sound, and its splash */
      if (S.stream > 0.04 && !pouringSnd) { pouringSnd = true; sfx.pourStart(); }
      if (pouringSnd) sfx.pourSet(S.stream, S.gls.vol);
      if (pouringSnd && S.stream < 0.02) { pouringSnd = false; sfx.pourEnd(); }
      const lx = S.landX == null ? GCX : S.landX;
      if (S.stream > 0.1 && S.phase === 'pour') {
        S.ringIn -= dt;
        if (S.ringIn <= 0) { S.ringIn = 0.13; S.rings.push({ x: lx, r: 2, t: 0, life: 0.7 }); }
        for (let k = 0; k < 2; k++) S.drops.push({ x: lx + (Math.random() - 0.5) * 6, y: S.glassSurf, vx: (Math.random() - 0.5) * 70, vy: -30 - Math.random() * 70, life: 0.45, c: Math.random() < 0.5 ? '#f0b868' : C.foam });
        if (Math.random() < 0.7) S.fizz.push({ x: lx + (Math.random() - 0.5) * 14, y: S.glassSurf + 4 + Math.random() * 10, r: 1 + (Math.random() < 0.3 ? 1 : 0), vy: -24 - Math.random() * 20 });
        S.foam = Math.min(2.6, S.foam + dt * 3);
      } else S.foam = Math.max(0, S.foam - dt * 0.35);
      /* bits */
      S.bubbles = S.bubbles.filter(b => { b.y += b.vy * dt; return b.y > 0 && b.y > (S.bot.surf ? S.bot.surf.c + S.bot.surf.slope * b.x : 0); });
      S.fizz = S.fizz.filter(f => { f.y += f.vy * dt; return f.y > S.glassSurf + 1 && S.gls.vol > 0.05; });
      S.rings.forEach(r => { r.t += dt; r.r += dt * 26; });
      S.rings = S.rings.filter(r => r.t < r.life);
      S.drops = S.drops.filter(d => {
        d.life -= dt; d.x += d.vx * dt; d.y += d.vy * dt; d.vy += 420 * dt;
        return d.life > 0 && d.y < (d.drip ? S.glassSurf : S.glassSurf + 2);
      });
      if (done) {
        if (S.phase === 'pour') donePour(); else doneDrink();
        if (S.queue > 0) { S.queue--; next(); }
      }
    }

    /* coming round: whatever was queued is forgotten, and somebody has been tidying */
    L.on(window, 'blackout-end', () => {
      S.queue = 0;
      if (S.phase === 'idle') S.gls.vol = 0;
      say('YOU WAKE UP. THE TABLE IS TIDY. NOBODY WILL SAY WHO.');
    });

    let alive = true, raf = null, last = 0;
    function frame(ts) {
      if (!alive || !document.body.contains(cv)) {
        alive = false; if (raf) cancelAnimationFrame(raf); sfx.pourEnd(); return;
      }
      raf = requestAnimationFrame(frame);
      if (window.__jagTest && window.__jagTest.pause) return;
      /* a slow frame is taken as several short steps, so a pour lasts as long as
         it should on a machine that draws four frames a second, and the physics
         never sees a step it was not tuned for */
      const t = ts / 1000, total = Math.min(0.25, t - last || 0); last = t;
      const n = Math.max(1, Math.ceil(total / 0.04));
      for (let i = 0; i < n; i++) step(total / n);
      draw(t);
    }
    raf = requestAnimationFrame(frame);
    whenGone(cv, () => { alive = false; if (raf) cancelAnimationFrame(raf); sfx.pourEnd(); });
    info.textContent = 'CLICK TO POUR, CLICK AGAIN TO DRINK. KEEP CLICKING AND IT GETS FASTER.';
    setTimeout(() => cv.focus(), 40);
    if (window.__jagTest) window.__jagTest = { S, step, draw, request, g, cv, sfx, pause: false };
  }
};
