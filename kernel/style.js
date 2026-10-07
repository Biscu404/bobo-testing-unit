import { Snd } from "./snd.js";
import { CRT, Vol } from "./hardware.js";
import "./style_sfx.js";
import { Rage } from "./rage.js";
import * as M from "./style_model.js";
import { Fx } from "./style_fx.js";
import { Glitch } from "./glitch.js";
import { StyleTrack, unlock } from "./style_track.js";
export { Rage };
/* ==========================================================================
   11.3d THE STYLE METER
   Deleting a file is not housekeeping, it is a performance, and the machine
   grades it. Points in, points always bleeding out; the letter follows the
   points. Nothing here is saved — every reload starts you back at nothing.
   The rules (how far each rank is, how fast it bleeds) are kernel/style_model.js;
   the look of it is kernel/smeter.css and kernel/style_fx.js; at the top rank the
   song plays (kernel/style_track.js), and if you keep it there the sound starts
   to come apart (kernel/glitch.js).
   ========================================================================== */
/* what the machine calls the act, as it stops being an act of maintenance */
const STYLE_VERBS = [
  'DELETED', 'SHREDDED', 'PURGED', 'VAPORISED',
  'OBLITERATED', 'UNMADE', 'ERASED FROM THE RECORD', 'UNWRAPPED'
];
/* the birthday rank cycles the whole palette, one colour per two frames */
const STYLE_PARTY = ['#FFFF55', '#55FF55', '#55FFFF', '#FF55FF', '#FF5555', '#FFFFFF'];
/* how big the meter is at each rank: every rank up it fills more of the screen */
const SCALE = [1, 1.12, 1.27, 1.45, 1.66, 1.9, 2.18, 2.5];
const GLITCH_AT = 60, GLITCH_RAMP = 90;       /* a minute at the top, then a minute and a half to the worst of it */
const LEAVE_GRACE = 1.5, LEAVE_FADE = 3.5;    /* the song waits this long for the meter to come back, then fades out over this */
const MASS = 20;                              /* a pile this big, after the glitch has begun, throws a burst of it */
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

export const Style = {
  run: M.newRun(),
  shown: -1,       /* the rank on screen: -1 is dormant, the meter is not on screen at all */
  lost: 0,         /* seconds since the meter was last at the top, while the song waits to see if it comes back */
  sung: false,     /* the birthday fanfare has been used this session */
  raf: null,
  prev: 0,
  el: null,
  get tier() { return this.run.tier; },
  get pts() { return this.run.pts; },
  get combo() { return this.run.combo; },

  mount() {
    if (this.el) return true;
    const root = document.getElementById('smeter');
    if (!root) return false;
    const bar = document.getElementById('sm-bar');
    bar.innerHTML = '';
    for (let i = 0; i < 16; i++) bar.appendChild(document.createElement('b'));
    this.el = {
      root: root,
      key: document.getElementById('sm-key'),
      name: document.getElementById('sm-name'),
      cells: Array.prototype.slice.call(bar.children),
      log: document.getElementById('sm-log')
    };
    Fx.attach(document.getElementById('tube'));
    return true;
  },

  now() { return performance.now() / 1000; },

  /* ---- scoring --------------------------------------------------------- */
  /* node may be null. n is how many files this action killed — pass the
     child count for a folder, or the list length for a bulk clear. */
  hit(node, n) {
    if (!CRT.on) return;
    if (!this.mount()) return;
    const count = Math.max(1, n || 1), bulk = count > 1;
    Snd.wake();
    if (Snd.sfx && !this.hooked) { this.hooked = true; Glitch.hook(Snd.sfx); }
    const r = M.hit(this.run, count, this.now());
    this.setTier(this.run.tier);
    const tier = Math.max(0, this.run.tier);
    if (tier >= 2) StyleTrack.warm();              /* the song is fetched and decoded before it is wanted */

    /* the verb, then the chain, then the pile if it was a pile */
    this.say(STYLE_VERBS[tier], true);
    if (bulk) this.say('MASS DELETION x' + count);
    else if (this.run.combo > 2) this.say('CHAIN x' + Math.floor(this.run.combo));

    this.el.root.classList.remove('hit');
    void this.el.root.offsetWidth;      /* restart the recoil */
    this.el.root.classList.add('hit');

    Snd.delT(tier);
    Fx.burst(count, tier);
    if (count >= MASS && this.run.atTop >= GLITCH_AT) Glitch.burst(count);
    Rage.tier = this.run.tier; Rage.sync();
    this.runLoop();
    return r;
  },

  setTier(t) {
    if (t === this.shown) return;
    const up = t > this.shown;
    this.shown = t;
    Rage.tier = t;
    if (t < 0) { this.hide(); return; }
    const r = M.RANKS[t], top = t === M.TOP;
    this.el.root.classList.add('live');
    this.el.root.style.setProperty('--sm-col', r.col);
    this.el.root.style.setProperty('--sm-k', String(SCALE[t]));
    this.el.root.dataset.t = String(t);
    this.el.key.textContent = r.key;
    this.el.name.textContent = r.name;
    this.el.root.classList.toggle('top', top);
    if (up) {
      this.el.root.classList.remove('up');
      void this.el.root.offsetWidth;
      this.el.root.classList.add('up');
      this.say(r.name, true);
      Snd.rankUp(t);
    }
    if (top) {
      if (!this.sung) { this.sung = true; Snd.birthday(); }
      unlock();
      this.onTop();
    }
    Rage.sync();
  },

  /* overwrite this later for cake, confetti, a window that opens itself */
  onTop() {},

  say(text, big) {
    const d = document.createElement('div');
    d.textContent = text;
    if (big) d.className = 'big';
    this.el.log.insertBefore(d, this.el.log.firstChild);
    while (this.el.log.children.length > 5) {
      this.el.log.removeChild(this.el.log.lastChild);
    }
    setTimeout(() => { if (d.parentNode) d.parentNode.removeChild(d); }, 1600);
  },

  /* ---- the bleed ------------------------------------------------------- */
  runLoop() {
    if (this.raf) return;
    this.prev = this.now();
    const loop = () => {
      this.raf = requestAnimationFrame(loop);
      this.frame();
    };
    this.raf = requestAnimationFrame(loop);
  },

  frame() {
    const t = this.now();
    const dt = Math.min(0.25, t - this.prev);
    this.prev = t;
    if (!CRT.on) { this.reset(); return; }

    M.frame(this.run, dt, t);
    if (this.run.tier !== this.shown) this.setTier(this.run.tier);
    if (this.run.tier < 0 && this.run.pts <= 0) { this.stop(); return; }

    /* the song plays for as long as the meter is at the top, and is let go (faded) a moment after it leaves */
    const wantTop = this.run.tier === M.TOP && Vol.mus > 0;
    if (wantTop) {
      this.lost = 0;
      if (!StyleTrack.on && !StyleTrack.failed) { StyleTrack.start(); Rage.hushed = true; Rage.sync(); }
      else if (StyleTrack.failed && Rage.hushed) { Rage.hushed = false; Rage.sync(); }      /* no song on this machine: the chiptune stays */
    } else if (StyleTrack.on) {
      this.lost += dt;
      if (this.lost > LEAVE_GRACE) { StyleTrack.fadeOut(LEAVE_FADE); Rage.hushed = false; Rage.sync(); }
    }
    /* a minute at the top, and the sound starts to go */
    Glitch.setLevel(clamp((this.run.atTop - GLITCH_AT) / GLITCH_RAMP, 0, 1));
    this.render(dt);
  },

  render(dt) {
    if (this.shown < 0) return;
    const r = M.RANKS[this.shown], top = this.shown === M.TOP;
    const next = M.RANKS[this.shown + 1];
    const span = next ? next.at - r.at : 1;
    const frac = next ? (this.run.pts - r.at) / span : 1;
    const lit = clamp(Math.round(frac * 16), 0, 16);
    for (let i = 0; i < 16; i++) this.el.cells[i].classList.toggle('on', i < lit);
    let col = r.col;
    if (top) {
      col = STYLE_PARTY[Math.floor(this.now() * 12) % STYLE_PARTY.length];
      this.el.root.style.setProperty('--sm-col', col);
    }
    Fx.frame(dt || 0.016, this.shown, top, col);
  },

  hide() {
    if (!this.el) return;
    this.el.root.classList.remove('live', 'top', 'up', 'hit');
    delete this.el.root.dataset.t;
    this.el.log.innerHTML = '';
    Fx.clear();
  },

  stop() {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = null;
    this.hide();
    this.shown = -1;
    StyleTrack.fadeOut(2.5); Rage.hushed = false;
    Glitch.setLevel(0);
    Rage.tier = -1; Rage.sync();
  },

  /* power cycle, or anything else that should wipe the run */
  reset() {
    this.run = M.newRun();
    this.lost = 0;
    StyleTrack.stop(); Rage.hushed = false;
    this.stop();
  }
};
