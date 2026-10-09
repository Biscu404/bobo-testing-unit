/* The app shell (spec 2, 11): the canvas, the devices, the save, the music, and the scene machine. A scene is a factory `(app) => { enter(args), update(dtMs), draw(g, W, H, tsec, dtMs),
   leave(), hint(), click(x, y), hover(x, y) }`; `app.go(name, args)` leaves one and enters the next. Everything the app starts (the animation frame, the observer, the listeners on
   the canvas) is stopped by `destroy()`; window listeners go through scopedListeners as the contract asks. */

import { createSaveStore } from './save.js';
import { createDevices } from './input.js';
import { musicStart, musicSet, musicStep, musicStop } from './music.js';
import { scopedListeners } from '../lifecycle.js';
import { SCENES } from './scene_registry.js';

export const W = 480, H = 270;

export async function createApp(root, ctx, boot) {
  const store = createSaveStore(ctx);
  const meta = await store.loadMeta();
  const dev = createDevices(meta.keymap);

  const pane = document.createElement('div');
  pane.className = 'gamepane sbpane';
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H; cv.className = 'gamecv sbcanvas'; cv.dataset.fit = 'int'; cv.tabIndex = 0;
  pane.appendChild(cv);
  const bar = document.createElement('div');
  bar.className = 'appbar';
  const shakeBtn = document.createElement('button'); shakeBtn.className = 'appbtn';
  const debugBtn = document.createElement('button'); debugBtn.className = 'appbtn';
  const info = document.createElement('span'); info.className = 'godword sbinfo';
  bar.appendChild(shakeBtn); bar.appendChild(debugBtn); bar.appendChild(info);
  root.appendChild(pane); root.appendChild(bar);

  const g = cv.getContext('2d');
  g.imageSmoothingEnabled = false;

  const app = {
    ctx, store, meta, dev, cv, g, W, H, scene: null, sceneName: '', tsec: 0, debug: false, session: null, hooks: {},
    saveMeta() { return store.saveMeta(meta); },
    toast(msg) { if (ctx.toast) ctx.toast(msg); },
    go(name, args) {
      if (!SCENES[name]) throw new Error('[standbattle] no scene ' + name);
      if (app.scene && app.scene.leave) app.scene.leave();
      dev.clearNav();
      app.sceneName = name;
      app.scene = SCENES[name](app);
      app.scene.enter(args || {});
    },
    /* how hard it is (0 explore, 1 combat, 2 tension) and, when it changes, where we are (menu, select, a stage, boss): music.js */
    music(level, place) { musicSet(level, place); },
    debugOn: null
  };
  dev.single = true;

  /* integer scale only (§11): fit both axes, never a fractional blow-up */
  function resize() {
    const aw = Math.max(W, pane.clientWidth || W), ah = Math.max(H, pane.clientHeight || H);
    const scale = Math.max(1, Math.floor(Math.min(aw / W, ah / H)));
    cv.style.width = (W * scale) + 'px'; cv.style.height = (H * scale) + 'px';
  }
  const ro = new ResizeObserver(resize);
  ro.observe(pane); resize();

  const updateShake = () => { shakeBtn.textContent = 'SHAKE: ' + (meta.shakeEnabled ? 'ON' : 'OFF'); };
  const updateDebug = () => { debugBtn.textContent = 'BOXES: ' + (app.debug ? 'ON' : 'OFF'); };
  updateShake(); updateDebug();
  shakeBtn.addEventListener('mousedown', ev => {
    ev.stopPropagation(); meta.shakeEnabled = !meta.shakeEnabled; updateShake(); app.saveMeta();
    if (app.scene && app.scene.shake) app.scene.shake(meta.shakeEnabled);
    if (window.Snd) window.Snd.click();
  });
  debugBtn.addEventListener('mousedown', ev => {
    ev.stopPropagation(); app.debug = !app.debug; updateDebug();
    if (app.debug && app.hooks.debugOn) app.hooks.debugOn();
    if (window.Snd) window.Snd.click();
  });

  const canvasXY = ev => { const r = cv.getBoundingClientRect(); return { mx: (ev.clientX - r.left) * (W / r.width), my: (ev.clientY - r.top) * (H / r.height) }; };
  cv.addEventListener('keydown', ev => { if (dev.keyDown(ev.code, ev.repeat)) { ev.preventDefault(); ev.stopPropagation(); } });
  cv.addEventListener('keyup', ev => { dev.keyUp(ev.code); });
  cv.addEventListener('mousedown', ev => { ev.stopPropagation(); cv.focus(); const p = canvasXY(ev); if (app.scene && app.scene.click) app.scene.click(p.mx, p.my, ev.button); });
  cv.addEventListener('mousemove', ev => { const p = canvasXY(ev); if (app.scene && app.scene.hover) app.scene.hover(p.mx, p.my); });
  cv.addEventListener('contextmenu', ev => ev.preventDefault());
  const on = scopedListeners(pane).on;
  on(window, 'blur', () => dev.release());
  setTimeout(() => cv.focus(), 0);

  let raf = null, t0 = performance.now(), dead = false;
  function frame(now) {
    if (dead) return;
    raf = requestAnimationFrame(frame);
    const dt = Math.min(50, now - t0);
    t0 = now; app.tsec += dt / 1000;
    dev.poll();
    musicStep();
    if (app.scene) {
      app.scene.update(dt);
      if (app.scene) { app.scene.draw(g, W, H, app.tsec, dt); info.textContent = app.scene.hint ? app.scene.hint() : ''; }
    }
  }
  raf = requestAnimationFrame(frame);
  musicStart(ctx.studio);
  musicSet(0, 'menu');

  app.destroy = () => {
    dead = true; cancelAnimationFrame(raf); ro.disconnect(); musicStop();
    if (app.scene && app.scene.leave) app.scene.leave();
    app.scene = null;
  };
  if (boot) boot(app);
  return app;
}
