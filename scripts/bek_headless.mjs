/* A just-enough browser for running apps/bekkedal under plain Node.
 *
 * Extracted from scripts/smoke.mjs when a second harness — the playtest
 * timer (scripts/bekkedal_playtest.mjs) — needed exactly the same stub. The
 * canvas 2D context is no-op draw calls, `document.createElement` hands back
 * a FakeEl that records its listeners, and `requestAnimationFrame` latches
 * the callback so a caller can step whole frames by hand at whatever dt it
 * wants. Nothing here mocks a game rule: the app's real mount()/frame() path
 * is what runs.
 */
import { pathToFileURL } from 'node:url';
import path from 'node:path';

export const ROOT = path.resolve(import.meta.dirname, '..');

function makeLocalStorage() {
  const m = new Map();
  return {
    getItem: k => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { m.set(k, String(v)); },
    removeItem: k => { m.delete(k); },
    clear: () => m.clear()
  };
}

function makeCtx2D() {
  const noop = () => {};
  return {
    fillStyle: '', font: '', globalAlpha: 1, lineWidth: 1, strokeStyle: '',
    fillRect: noop, fillText: noop, strokeRect: noop, clearRect: noop,
    drawImage: noop,
    beginPath: noop, moveTo: noop, lineTo: noop, closePath: noop, stroke: noop,
    rect: noop, clip: noop,
    fill: noop, arc: noop, save: noop, restore: noop, translate: noop,
    rotate: noop, scale: noop, setTransform: noop,
    createPattern: () => ({}),
    /* The local-light pass reads the canvas back and writes it again (see
       `lamp.js`), so the stub has to return a real buffer of the size asked
       for rather than a no-op: the pass indexes into `.data` directly and a
       shorter array would loop off the end. Nothing here checks the pixels —
       what these harnesses assert is that the frame path does not throw. */
    getImageData: (x, y, w, h) => ({ width: w, height: h,
                                     data: new Uint8ClampedArray(Math.max(0, w * h * 4)) }),
    putImageData: noop,
    createLinearGradient: () => ({ addColorStop: noop }),
    createRadialGradient: () => ({ addColorStop: noop }),
    measureText: () => ({ width: 0 })
  };
}

export let createdEls = [];
export class FakeEl {
  constructor(tag) {
    this.tagName = String(tag || 'div').toLowerCase();
    this.children = [];
    this.style = {};
    this.classList = { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false };
    this._listeners = Object.create(null);
    this.width = 0; this.height = 0;
    this.tabIndex = 0;
    this.textContent = '';
    createdEls.push(this);
  }
  appendChild(c) { this.children.push(c); c.parentNode = this; return c; }
  removeChild(c) { const i = this.children.indexOf(c); if (i >= 0) this.children.splice(i, 1); return c; }
  addEventListener(ev, fn) { (this._listeners[ev] = this._listeners[ev] || []).push(fn); }
  removeEventListener() {}
  setAttribute() {}
  focus() {}
  contains() { return false; }
  getContext(type) { return type === '2d' ? makeCtx2D() : null; }
  click(payload) { (this._listeners.click || []).forEach(fn => fn(payload || {})); }
  keydown(payload) { (this._listeners.keydown || []).forEach(fn => fn(payload)); }
  /* The app latches direction keys on keydown and clears them on keyup, so a
     harness that only ever presses would walk the player into a wall and
     leave them there. */
  keyup(payload) { (this._listeners.keyup || []).forEach(fn => fn(payload)); }
}

let rafCb = null;
export function setupGlobalEnv() {
  globalThis.window = globalThis;
  globalThis.localStorage = makeLocalStorage();
  globalThis.document = {
    createElement: tag => new FakeEl(tag),
    getElementById: () => null,
    body: new FakeEl('body'),
    documentElement: new FakeEl('html'),
    addEventListener: () => {}
  };
  globalThis.document.body.contains = () => true;
  /* applyScale() watches the canvas wrapper for resizes. Nothing here ever
     resizes, so the observer only has to exist and hold a reference — but
     without it mount() throws before a single frame is drawn. */
  globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
  globalThis.requestAnimationFrame = fn => { rafCb = fn; return 1; };
  globalThis.cancelAnimationFrame = () => {};
  globalThis.performance = globalThis.performance || { now: () => Date.now() };
}

export const importApp = async () => ({
  data: await import(pathToFileURL(path.join(ROOT, 'apps/bekkedal/data.js'))),
  app: (await import(pathToFileURL(path.join(ROOT, 'apps/bekkedal/index.js')))).default
});

export function findByText(tag, text) {
  return createdEls.find(el => el.tagName === tag && el.textContent === text);
}
export function findCanvas() {
  return createdEls.find(el => el.tagName === 'canvas');
}

export function freshCtx() {
  return {
    fs: { read: async () => null, write: async () => {}, list: async () => [], remove: async () => {} },
    save: async () => {}, load: async () => null,
    openWindow: () => {}, close: () => {}
  };
}

/* mounts a fresh instance of the app; returns handles used to drive it */
export function mountApp(app) {
  createdEls = [];
  rafCb = null;
  const root = new FakeEl('div');
  app.mount(root, freshCtx());
  const bSave = findByText('button', 'SAVE');
  if (!bSave) throw new Error('SAVE button not found after mount');
  return { root, bSave, tick: () => rafCb };
}
