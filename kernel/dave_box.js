/* Dave's farewell: a small box he leaves on the desktop when the shop window shuts, which has to outlive that window, so it is the
   machine's and not the app's. The words are kernel/dave_farewell.js (which depends on what you bought from him), the babble under them
   kernel/dave_plan.js and kernel/dave_voice.js. `Cos.boot()` (kernel/cos.js) starts the watch.

   It is driven by `wins-changed` (kernel/wm.js) and by nothing in the shop: a shop window going from none to one snapshots what you own,
   and from one to none shows the box. So it never shows on a fresh boot, or for a shop that was never opened, or with the set switched
   off, or twice for one visit; a second box replaces the first; opening the shop again takes it down. It types its line out a letter at a
   time with the babble under each, stays a few seconds, and goes. A click skips to the end of the line, and then closes it. It never takes
   the keyboard, never covers more than its own corner, and the motion in it (his mouth, a bob) stops under prefers-reduced-motion. */
import { openWins } from './wm.js';
import { Cos, COS_CATS } from './cos.js';
import { CRT } from './hardware.js';
import { Snd } from './snd.js';
import { summarize, pickFarewell } from './dave_farewell.js';
import { voicePlan } from './dave_plan.js';
import { Voice } from './dave_voice.js';
import { sys } from './trophy_hook.js';

export const HOLD_MS = 2800;             /* how long the whole line stays, once it is all said */
export const SKIP_HOLD_MS = 1800;        /* ... and after a click that skipped to the end of it */

const shops = () => openWins.filter(r => r.appId === 'shop').length;
const reduced = () => { try { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { return false; } };
const owned = () => { const o = {}; Object.keys(COS_CATS).forEach(c => { o[c] = Cos.owned(c); }); return o; };
const lists = () => { const o = {}; Object.keys(COS_CATS).forEach(c => { o[c] = COS_CATS[c].list; }); return o; };

export const DaveBox = {
  el: null, typed: null, rest: null, cur: null, port: null, canvas: null,
  timer: null, holdTimer: null, draw: null,
  open: false, visit: null, last: null, watching: false,
  typing: false, idx: 0, plan: null, text: '', up: false,
  shown: 0,                                /* how many boxes have been shown (a check reads this) */

  watch() {
    if (this.watching) return;
    this.watching = true;
    this.open = shops() > 0;
    window.addEventListener('wins-changed', () => this.sync());
  },
  sync() {
    const now = shops() > 0;
    if (now === this.open) return;
    this.open = now;
    if (now) this.opened(); else this.closed();
  },
  opened() {
    this.dismiss();
    this.visit = { t: Date.now(), before: owned() };
  },
  closed() {
    const vis = this.visit;
    this.visit = null;
    if (!vis) return;
    this.show(summarize(vis.before, owned(), lists(), Date.now() - vis.t));
  },

  /* show the box for this visit (kernel/dave_farewell.js `summarize`); false if it could not */
  show(v) {
    this.dismiss();
    const shell = document.getElementById('shell');
    if (!CRT.on || !shell || getComputedStyle(shell).display === 'none') return false;       /* switched off, or not yet on the desktop */
    const pick = pickFarewell(v, null, this.last);
    sys.mark('farewells', pick.tier); sys.emit('farewell', { tier: pick.tier });
    this.last = pick.text;
    this.text = pick.text;
    this.plan = voicePlan(pick.text, null, pick.voice);
    this.build(shell, pick);
    this.shown++;
    if (Snd.blip) Snd.blip();
    this.typing = true;
    this.idx = 0;
    this.step();
    return true;
  },

  build(shell, pick) {
    const el = document.createElement('div');
    el.id = 'davebox';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-label', 'Crazy Dave says: ' + pick.text);
    el.dataset.tier = pick.tier;
    el.innerHTML = '<div class="dbtitle"><span>CRAZY DAVE</span><span class="dbhint">CLICK</span></div>' +
      '<div class="dbbody"><div class="dbport"><canvas width="48" height="48"></canvas></div>' +
      '<div class="dbsay" aria-hidden="true"><span class="dbtyped"></span><span class="dbcur">_</span><span class="dbrest"></span></div></div>';
    el.addEventListener('mousedown', ev => {
      ev.stopPropagation();
      ev.preventDefault();
      if (this.typing) this.skip(); else this.dismiss();
    });
    shell.appendChild(el);
    this.el = el;
    this.typed = el.querySelector('.dbtyped');
    this.rest = el.querySelector('.dbrest');
    this.cur = el.querySelector('.dbcur');
    this.port = el.querySelector('.dbport');
    this.canvas = el.querySelector('canvas');
    this.rest.textContent = pick.text;             /* the whole line is there from the start, unseen, so the box does not grow as it is typed */
    this.mouth(false);
    /* Dave is drawn by the shop (apps/shop/thumbs.js): fetched, not imported, so the kernel never depends on an app being there */
    const mine = this.el;
    import('../apps/shop/thumbs.js').then(m => { this.draw = m.drawDave; if (this.el === mine) this.mouth(false); }).catch(() => { if (this.canvas) this.canvas.style.display = 'none'; });
  },

  /* his mouth: drawDave opens the grin on half of its clock and shuts it on the other half */
  mouth(open) {
    if (!this.draw || !this.canvas) return;
    if (reduced() && open) open = false;
    this.draw(this.canvas, open ? 0.55 + Math.random() * 0.5 : 1.7 + Math.random() * 0.7);
  },

  /* one letter: show it, babble under it, and wait as long as it takes for the next */
  step() {
    clearTimeout(this.timer);
    this.timer = null;
    if (!this.el || !this.typing) return;
    if (!CRT.on) { this.dismiss(); return; }       /* the set was switched off in the middle of a sentence */
    const e = this.plan.events[this.idx];
    this.typed.textContent = this.text.slice(0, this.idx + 1);
    this.rest.textContent = this.text.slice(this.idx + 1);
    if (e.sound) Voice.play(e.sound);
    this.mouth(!!e.sound);
    if (e.sound && !reduced() && this.port) { this.up = !this.up; this.port.classList.toggle('up', this.up); }
    this.idx++;
    if (this.idx >= this.plan.events.length) { this.finish(HOLD_MS); return; }
    this.timer = setTimeout(() => this.step(), e.ms);
  },

  /* all of it said (or skipped to): it stays a moment, then goes */
  finish(hold) {
    clearTimeout(this.timer);
    this.timer = null;
    this.typing = false;
    if (!this.el) return;
    this.typed.textContent = this.text;
    this.rest.textContent = '';
    this.cur.style.display = 'none';
    if (this.port) this.port.classList.remove('up');
    this.mouth(false);
    clearTimeout(this.holdTimer);
    this.holdTimer = setTimeout(() => this.dismiss(), hold);
  },
  skip() { if (this.typing) this.finish(SKIP_HOLD_MS); },

  dismiss() {
    clearTimeout(this.timer);
    clearTimeout(this.holdTimer);
    this.timer = this.holdTimer = null;
    this.typing = false;
    if (this.el) this.el.remove();
    this.el = this.typed = this.rest = this.cur = this.port = this.canvas = null;
  }
};

window.DaveBox = DaveBox;
