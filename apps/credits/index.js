/* CREDITS.EXE -- the credit screen, opened by CREDITS in the terminal. The creator stands in the middle, in a halo of
   light; the three playtesters stand in a row along the bottom, each with a cross behind. Four portraits, pressed to
   the sixteen colours (assets/credits/, made by scripts/make-credit-art.py). The canvas is fixed and fits the window
   in whole pixels (kernel/canvas_fit.js). Where each stands comes from the size of its picture (layout.js), so a wider
   crop at 96 or 128 pixels is simply drawn at the multiple that suits its box.
   Every time it is opened the visit is counted (kernel/gifts.js). The first time each of the four holds out one thing, in turn, and the fifth
   time four more (hands.js); what they have given you is in the tray along the bottom (tray.js). Click, or Space, and they are all given at once. */
import { INK, PAL_CSS, sky, cross } from './draw.js';
import { W, H, CAST, place, haloOf, crossOf, wordsOf, anchorsOf } from './layout.js';
import { gifts } from '../gifts_scope.js';
import { plan, stateOf, poseOf, lengthOf, drawBeat, SLEEVE, STAGE, BEAT } from './hands.js';
import { layout as trayLayout, shownOf, hit, drawTray, ROWS } from './tray.js';
import { css } from './sprites.js';

const load = id => new Promise(done => {
  const im = new Image();
  im.onload = () => done(im);
  im.onerror = () => done(null);
  im.src = 'assets/credits/' + id + '.png';
});

let live = null;                                                  /* the one open window's token: a picture that arrives after the window closed is not drawn */
let cleanup = null;                                               /* what the window does when it is closed in the middle of the hands: they give what is left */
const font = px => px + 'px VT323, monospace';

export default {
  id: 'credits',
  title: 'CREDITS.EXE',
  width: 700,
  height: 640,
  resizable: true,
  fluid: true,
  mount(root, ctx) {
    root.style.background = '#000000';
    root.style.display = 'flex';
    root.style.alignItems = 'center';
    root.style.justifyContent = 'center';
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    cv.dataset.fit = 'int';                       /* the window manager fits the picture to the pane (kernel/canvas_fit.js) */
    cv.style.imageRendering = 'pixelated';
    cv.tabIndex = 0;
    root.appendChild(cv);
    const g = cv.getContext('2d');
    g.imageSmoothingEnabled = false;
    const me = live = {};
    const G = gifts(), snd = (n, ...a) => { try { if (window.Snd && window.Snd[n]) window.Snd[n](...a); } catch (e) { /* silent */ } };

    /* this visit: counted, and which hands are held out (none, once everything has been given) */
    const visit = G.visit ? G.visit() : { n: 0, set: 0, items: [] };
    const calm = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    const base = document.createElement('canvas'); base.width = W; base.height = H;      /* the picture without the hands: painted once */
    let at = null, beats = [], cells = {}, anchors = {}, t0 = 0, raf = 0, hover = null, over = false;
    const arrived = new Set(G.given ? G.given().map(x => x.id) : []);
    visit.items.forEach(it => arrived.delete(it.id));                                    /* what is being given now has not arrived yet */
    const given = new Set();

    const lineOf = (it, name) => (it.from === 'teiteotei' ? 'THE CREATOR' : (CAST.find(c => c.id === it.from) || { name }).name) + ': ' + it.line;
    function plate(lines, high) {
      const w = 520, h = 18 + lines.length * 22, x = (W - w) / 2, y = high ? 36 : H - 44 - 14 - h;           /* over the top while a playtester gives, so it is not on them */
      g.fillStyle = css(0); g.fillRect(x, y, w, h);
      g.fillStyle = css(15); g.fillRect(x, y, w, 2); g.fillRect(x, y + h - 2, w, 2); g.fillRect(x, y, 2, h); g.fillRect(x + w - 2, y, 2, h);
      g.textAlign = 'center';
      lines.forEach((l, i) => { g.font = font(i ? 20 : 24); g.fillStyle = css(l.ink); g.fillText(l.t, W / 2, y + 22 + i * 22); });
    }
    const dimmer = (() => { const c = document.createElement('canvas'); c.width = c.height = 2; const k = c.getContext('2d'); k.fillStyle = '#000'; k.fillRect(0, 0, 1, 1); return g.createPattern(c, 'repeat'); })();

    function render(t) {
      g.drawImage(base, 0, 0);
      let active = null, k = 0;
      beats.forEach(b => { const st = stateOf(b, t), p = poseOf(st, anchors[b.from], cells[b.item.id] ? { x: cells[b.item.id].cx, y: cells[b.item.id].cy, s: 2 } : { x: W / 2, y: H - 30, s: 2 }); if (p) { active = { b, st, p }; k = Math.max(k, p.dim); } });
      if (active && k > 0.02) {
        g.fillStyle = dimmer; g.fillRect(0, 0, W, H - 54);                              /* what is not being handed over goes dim (a quarter of its pixels black: still the sixteen) */
        const p = at[active.b.from];                                                      /* ... but whoever is giving stays lit, and framed */
        g.drawImage(base, p.boxX - 8, p.boxY - 8, p.box + 16, p.box + 42, p.boxX - 8, p.boxY - 8, p.box + 16, p.box + 42);
        g.fillStyle = css(14); const fx = p.boxX - 8, fy = p.boxY - 8, fw = p.box + 16, fh = p.box + 42;
        g.fillRect(fx, fy, fw, 3); g.fillRect(fx, fy + fh - 3, fw, 3); g.fillRect(fx, fy, 3, fh); g.fillRect(fx + fw - 3, fy, 3, fh);
      }
      drawTray(g, cells, id => arrived.has(id), hover);
      if (active) {
        drawBeat(g, active.p, anchors[active.b.from], SLEEVE[active.b.from] || [4, 4], ROWS[active.b.item.id]);
        plate([{ t: active.b.item.name, ink: 14 }, { t: lineOf(active.b.item), ink: 15 }], active.b.from !== 'teiteotei');
      } else if (hover && G.has(hover)) {
        const it = (G.GIFTS || []).find(x => x.id === hover);
        if (it) plate([{ t: it.name, ink: 14 }, { t: it.where || '', ink: 11 }]);
      }
    }

    const GIFT_IDS = () => (G.given ? G.given().map(x => x.id) : []);
    function finish() {                                  /* everything given, the tray full, the hands gone */
      over = true; if (raf) cancelAnimationFrame(raf); raf = 0;
      if (visit.set && G.finish) G.finish(visit.set);
      GIFT_IDS().forEach(id => arrived.add(id));
      cells = trayLayout(W, H, shownOf(id => arrived.has(id)));
      render(1e9);
    }
    function frame(now) {
      if (live !== me) return;
      const t = (now - t0) / 1000;
      beats.forEach(b => {
        const st = stateOf(b, t);
        if (st.given && !given.has(b.item.id)) {                                         /* the hand has arrived: it is yours */
          given.add(b.item.id);
          if (G.give) G.give(b.item.id);
          snd('chime'); try { ctx.toast(b.item.name + '  --  ' + b.item.where); } catch (e) { /* no toast */ }
        }
        if (st.phase === 'done') arrived.add(b.item.id);
      });
      if (t >= lengthOf(beats)) { snd('fanfare'); finish(); return; }
      render(t);
      raf = requestAnimationFrame(frame);
    }

    /* the pictures first (their sizes decide where everything stands), then the ground and the light, the crosses behind the playtesters, the portraits, the words */
    Promise.all(CAST.map(c => load(c.id))).then(ims => {
      if (live !== me) return;
      const sizes = {};
      CAST.forEach((c, i) => { if (ims[i]) sizes[c.id] = [ims[i].naturalWidth, ims[i].naturalHeight]; });
      at = place(sizes);
      const b = base.getContext('2d'); b.imageSmoothingEnabled = false;
      sky(b, haloOf(at.teiteotei));
      CAST.slice(1).forEach(c => { const x = crossOf(at[c.id]); cross(b, x.cx, x.top, x.height, x.armW, x.armY); });
      b.textAlign = 'center';
      b.font = font(26); b.fillStyle = PAL_CSS(INK.yellow);
      b.fillText('CREDITS', W / 2, 26);
      CAST.forEach((c, i) => {
        const p = at[c.id];
        if (ims[i]) b.drawImage(ims[i], p.x, p.y, p.w, p.h);                      /* a whole multiple of its pixels, never smoothed */
        wordsOf(p).forEach(w => { b.font = font(w.px); b.fillStyle = PAL_CSS(INK[w.ink]); b.fillText(w.t, p.cx, w.y); });
      });
      anchors = anchorsOf(at, STAGE);
      const incoming = id => visit.items.some(it => it.id === id);
      cells = trayLayout(W, H, shownOf(id => arrived.has(id) || incoming(id)));
      if (visit.items.length && !calm) { beats = plan(visit.items); t0 = performance.now(); raf = requestAnimationFrame(frame); }
      else if (visit.items.length) { visit.items.forEach(it => { if (G.give) G.give(it.id); }); snd('fanfare'); try { ctx.toast(visit.items.map(i => i.name).join(', ')); } catch (e) { /* no toast */ } finish(); }
      else finish();
    });

    /* a click or a key and they are all given at once; with nothing to give, a hover tells what each thing in the tray is */
    const skip = () => { if (!over && beats.length) { visit.items.forEach(it => { if (G.give) G.give(it.id); }); finish(); } };
    const xy = ev => { const r = cv.getBoundingClientRect(); return { x: (ev.clientX - r.left) * W / r.width, y: (ev.clientY - r.top) * H / r.height }; };
    cv.addEventListener('mousedown', ev => { ev.stopPropagation(); cv.focus(); skip(); });
    cv.addEventListener('keydown', ev => { if (ev.key === ' ' || ev.key === 'Enter' || ev.key === 'Escape') { ev.preventDefault(); skip(); } });
    cv.addEventListener('mousemove', ev => {
      const p = xy(ev), h = hit(cells, p.x, p.y);
      if (h !== hover) { hover = h; if (over) render(1e9); }
    });
    cv.addEventListener('mouseleave', () => { if (hover) { hover = null; if (over) render(1e9); } });
    cleanup = () => { if (raf) cancelAnimationFrame(raf); if (visit.set && G.finish) G.finish(visit.set); };
  },
  unmount() { live = null; if (cleanup) { cleanup(); cleanup = null; } }
};
