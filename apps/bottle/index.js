import { Snd } from '../../kernel/snd.js';
import { makeSfx } from './sfx.js';
import { makeArt, BW, BH, C, GEOM } from './art.js';

const JAG_KEY = 'templeos.bottle.v1';
const JAG_FULL = 700, JAG_SHOT = 40;
const JAG_LINES = [
  'GOOD.', 'STILL GOOD.', 'THAT IS THE ONE THAT WORKS.',
  'YOU ARE HAVING A LOVELY TIME.', 'THE ROOM IS SLIGHTLY WIDER NOW.',
  'YOU HAVE OPINIONS ABOUT THE MENUBAR.', 'YOU TELL THE MACHINE YOU LOVE IT.',
  'THE MACHINE SAYS NOTHING BACK.', 'PERHAPS SOME WATER.',
  'DRINK SOME WATER. THIS IS NOT A SUGGESTION.'
];
/* the pour, in seconds */
const POUR = { lift: 0.5, tip: 0.95, flow0: 0.9, flow1: 3.1, back: 3.55, down: 4.2 };
const DRINK_LEN = 1.9;
const ease = x => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

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

    const S = {
      ml: JAG_FULL, drunk: 0, bottles: 1, glass: 0, phase: 'idle', t: 0, note: '', noteT: 0,
      pose: { tilt: 0, tx: 0, ty: 0, level: 1, wob: 0, capOn: true },
      glassFill: 0, drinkPose: null, stream: 0, mouth: { x: 0, y: 0 }, surfY: 280, landX: 328,
      glugPh: 0, glugIn: 0, slosh: 0, bubbles: [], fizz: [], rings: [], drops: [], ringIn: 0, ml0: 0, dripIn: 0
    };
    try {
      const raw = JSON.parse(localStorage.getItem(JAG_KEY) || 'null');
      if (raw) { S.ml = raw.ml == null ? JAG_FULL : raw.ml; S.drunk = raw.drunk || 0;
                 S.bottles = raw.bottles || 1; S.glass = raw.glass || 0; }
    } catch (e) {}
    S.glassFill = S.glass;
    S.pose.level = S.ml / JAG_FULL;
    const save = () => { try { localStorage.setItem(JAG_KEY,
      JSON.stringify({ ml: S.ml, drunk: S.drunk, bottles: S.bottles, glass: S.glass })); } catch (e) {} };
    const say = t => { S.note = t; S.noteT = 3; };

    /* ---- the picture ---------------------------------------------------- */
    function draw(ts) {
      A.table();
      if (!S.pose.capOn) A.capOnBar();
      A.bottle(S, ts);
      A.stream(S, ts);
      A.glass(S, ts);
      /* what is thrown up when the stream lands, and the drops that leave the lip */
      S.drops.forEach(p => R(p.x, p.y, p.r || 2, p.r || 2, p.c));
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
                 : S.glass > 0.9 ? 'CLICK THE GLASS'
                 : S.ml < JAG_SHOT ? 'THE BOTTLE IS EMPTY'
                 : 'CLICK THE BOTTLE';
      T(S.note || hint, 190, 350, S.note ? C.label : C.dim, 8, 'center');
      g.globalAlpha = 0.06;
      const gr = g.createLinearGradient(0, 0, BW, BH);
      gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.5, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.fillRect(0, 0, BW, BH);
      g.globalAlpha = 1;
    }

    /* ---- what a click does ---------------------------------------------- */
    function pour() {
      if (S.phase !== 'idle') return;
      if (S.glass > 0.01) { say('THE GLASS IS ALREADY FULL.'); sfx.deny(); return; }
      if (S.ml < JAG_SHOT) { say('EMPTY. BUY ANOTHER ONE.'); sfx.deny(); return; }
      S.phase = 'pour'; S.t = 0; S.ml0 = S.ml; S.glugIn = 0.1; S.dripIn = 0;
      S.pose.capOn = false; sfx.cap();
    }
    function drink() {
      if (S.phase !== 'idle' || S.glass < 0.9) return;
      S.phase = 'drink'; S.t = 0;
      sfx.drink();
    }
    cv.addEventListener('mousedown', ev => {
      ev.stopPropagation(); cv.focus();
      const r = cv.getBoundingClientRect();
      const x = (ev.clientX - r.left) * (cv.width / r.width);
      const y = (ev.clientY - r.top) * (cv.height / r.height);
      const G = GEOM.glass;
      if (x > G.x - 10 && x < G.x + G.w + 10 && y > G.y - 10 && y < G.y + G.h + 10) { S.glass > 0.9 ? drink() : pour(); return; }
      S.glass > 0.9 ? drink() : pour();
    });
    cv.addEventListener('keydown', ev => {
      if (ev.key === ' ' || ev.key === 'Enter') { ev.preventDefault(); S.glass > 0.9 ? drink() : pour(); }
    });
    bBuy.addEventListener('click', () => {
      if (S.phase !== 'idle') return;
      S.ml = JAG_FULL; S.bottles++; S.pose.level = 1; save(); sfx.cork();
      say('A NEW BOTTLE. THE SAME AS THE LAST ONE.');
      cv.focus();
    });

    /* ---- the simulation --------------------------------------------------- */
    const sin = Math.sin, cos = Math.cos;
    function updatePour(dt) {
      const t = S.t, P = POUR, p = S.pose;
      /* the bottle: up and over, hangs, tips a little further, comes back */
      let tilt;
      if (t < P.lift) tilt = ease(t / P.lift) * 0.9;
      else if (t < P.tip) tilt = 0.9 + ease((t - P.lift) / (P.tip - P.lift)) * 0.3;
      else if (t < P.flow1) tilt = 1.2 + 0.09 * ease((t - P.tip) / (P.flow1 - P.tip));
      else if (t < P.back) tilt = 1.29 - ease((t - P.flow1) / (P.back - P.flow1)) * 0.56;
      else tilt = 0.73 * (1 - ease((t - P.back) / (P.down - P.back)));
      const away = t < P.back ? ease(t / P.lift) : 1 - ease((t - P.back) / (P.down - P.back));
      p.tilt = tilt; p.tx = 6 * away; p.ty = -12 * away;
      p.wob = 1.5 * Math.abs(sin(t * 6)) * (t < P.flow1 ? 1 : Math.max(0, 1 - (t - P.flow1) * 2));
      if (t > P.down - 0.15 && !p.capOn) { p.capOn = true; sfx.cap(); }

      /* the flow: starts as a thread, runs, then thins to drops */
      const on = ease((t - P.flow0) / 0.25) * (1 - ease((t - (P.flow1 - 0.1)) / 0.35));
      const prog = clamp((t - P.flow0) / (P.flow1 - P.flow0), 0, 1);
      S.stream = on;
      if (on > 0.01 && !S.pouring) { S.pouring = true; sfx.pourStart(); }
      if (S.pouring) sfx.pourSet(on, S.glassFill);
      if (S.pouring && on < 0.02 && t > P.flow1) { S.pouring = false; sfx.pourEnd(); }
      S.glassFill = ease(prog);
      S.glass = S.glassFill;
      p.level = (S.ml0 - JAG_SHOT * 1.35 * ease(prog)) / JAG_FULL;

      /* where the lip is, and where the surface is */
      S.mouth.x = GEOM.base[0] + p.tx + 224 * sin(tilt);
      S.mouth.y = GEOM.base[1] + p.ty - 224 * cos(tilt);
      const G = GEOM.glass;
      S.surfY = G.y + G.h - 5 - Math.round((G.h - 10) * S.glassFill) - 1;

      /* glugs: air going in, a pulse in the stream, a bubble up the bottle */
      if (on > 0.3) {
        S.glugIn -= dt;
        S.glugPh += dt * 22;
        if (S.glugIn <= 0) {
          S.glugIn = 0.17 + Math.random() * 0.13;
          sfx.glug(S.glassFill);
          S.glugPh = 1.2;
          for (let k = 0; k < 2 + Math.floor(Math.random() * 2); k++)
            S.bubbles.push({ x: Math.random() * 8 - 4, y: -216 + Math.random() * 6, r: 2 + Math.floor(Math.random() * 3), vx: -sin(tilt) * (22 + Math.random() * 14), vy: -cos(tilt) * (22 + Math.random() * 14) - 8 });
        }
        /* the landing: ripples, spray, and little bubbles carried down */
        S.ringIn -= dt;
        if (S.ringIn <= 0) { S.ringIn = 0.13; S.rings.push({ x: S.landX, r: 2, t: 0, life: 0.7 }); }
        for (let k = 0; k < 2; k++) S.drops.push({ x: S.landX + (Math.random() - 0.5) * 6, y: S.surfY, vx: (Math.random() - 0.5) * 70, vy: -30 - Math.random() * 70, life: 0.45, c: Math.random() < 0.5 ? C.liquidHi : C.foam });
        if (Math.random() < 0.7) S.fizz.push({ x: S.landX + (Math.random() - 0.5) * 14, y: S.surfY + 4 + Math.random() * 10, r: 1 + (Math.random() < 0.3 ? 1 : 0), vy: -24 - Math.random() * 20 });
        S.slosh = Math.min(1, S.slosh + dt * 3);
      } else S.slosh = Math.max(0, S.slosh - dt * 1.4);
      /* the last of it: beads off the lip */
      if (t > P.flow1 - 0.05 && t < P.back + 0.2) {
        S.dripIn -= dt;
        if (S.dripIn <= 0) { S.dripIn = 0.12 + Math.random() * 0.1; S.drops.push({ x: S.mouth.x + 1, y: S.mouth.y + 1, vx: 8, vy: 0, life: 0.5, c: C.liquid, r: 3, drip: true }); sfx.drip(); }
      }
      if (t >= P.down) {
        S.phase = 'idle'; S.glassFill = 1; S.glass = 1; S.stream = 0;
        p.tilt = 0; p.tx = 0; p.ty = 0; p.capOn = true;
        S.ml = Math.max(0, S.ml0 - JAG_SHOT); p.level = S.ml / JAG_FULL;
        sfx.clink(); save();
        say('ONE MEASURE. FORTY MILLILITRES.');
      }
    }
    function updateDrink(dt) {
      const t = S.t, e1 = ease(t / 0.45), tip = ease((t - 0.35) / 0.55), back = ease((t - (DRINK_LEN - 0.5)) / 0.5);
      const hold = 1 - back;
      S.drinkPose = { x: -105 * e1 * hold, y: -58 * e1 * hold, r: -1.3 * tip * hold };
      S.glassFill = t < 0.6 ? 1 : clamp(1 - (t - 0.6) / 0.8, 0, 1); S.glass = S.glassFill;
      S.slosh = t > 0.5 && t < 1.5 ? 1 : 0;
      if (t >= DRINK_LEN) {
        S.phase = 'idle'; S.glass = 0; S.glassFill = 0; S.drinkPose = null; S.drunk++;
        save();
        if (window.Drunk) window.Drunk.add(0.18);
        say(JAG_LINES[Math.min(JAG_LINES.length - 1, Math.floor(S.drunk / 3))]);
      }
    }
    function updateBits(dt) {
      S.bubbles = S.bubbles.filter(b => { b.x += b.vx * dt; b.y += b.vy * dt; return b.y > -214 && b.x > -34 && b.x < 34 && b.y < -4; });
      S.fizz = S.fizz.filter(f => { f.y += f.vy * dt; return f.y > S.surfY + 1 && S.glassFill > 0.02; });
      S.rings.forEach(r => { r.t += dt; r.r += dt * 26; });
      S.rings = S.rings.filter(r => r.t < r.life);
      S.drops = S.drops.filter(d => {
        d.life -= dt; d.x += d.vx * dt; d.y += d.vy * dt; d.vy += 420 * dt;
        if (d.drip) return d.life > 0 && d.y < GEOM.glass.y + 20;
        return d.life > 0 && d.y < S.surfY + 2;
      });
    }

    let alive = true, raf = null, last = 0;
    function frame(ts) {
      if (!alive || !document.body.contains(cv)) {
        alive = false; if (raf) cancelAnimationFrame(raf); sfx.pourEnd(); return;
      }
      raf = requestAnimationFrame(frame);
      const t = ts / 1000, dt = Math.min(0.1, t - last || 0); last = t;
      if (S.noteT > 0) { S.noteT -= dt; if (S.noteT <= 0) S.note = ''; }
      if (S.phase === 'pour') { S.t += dt; updatePour(dt); }
      else if (S.phase === 'drink') { S.t += dt; updateDrink(dt); }
      else { S.stream = 0; S.slosh = Math.max(0, S.slosh - dt); S.pose.wob = 0; }
      updateBits(dt);
      draw(t);
    }
    raf = requestAnimationFrame(frame);
    const watch = setInterval(() => {
      if (document.body.contains(cv)) return;
      clearInterval(watch); alive = false; if (raf) cancelAnimationFrame(raf); sfx.pourEnd();
    }, 900);
    info.textContent = 'CLICK THE BOTTLE TO POUR · CLICK THE GLASS TO DRINK';
    setTimeout(() => cv.focus(), 40);
  }
};
