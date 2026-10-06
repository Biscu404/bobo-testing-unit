/* The meter's weather: sparks, embers and confetti in the sixteen colours, whole pixels only,
   on a canvas laid over the picture; and the frame of light that comes up round the screen. How
   much of either there is depends on the rank: nothing at the bottom, a few embers rising from
   the middle ranks, sparks thrown across from the high ones, and at HAPPY BIRTHDAY a rain of
   confetti the width of the screen. Off for anyone who has asked for less motion. */
const COL = ['#FFFF55', '#55FF55', '#55FFFF', '#FF55FF', '#FF5555', '#FFFFFF'];
const CAP = 260;
const calm = () => !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

export const Fx = {
  cv: null, g: null, rim: null, tube: null, parts: [], W: 0, H: 0, acc: 0, K: 4,

  attach(tube) {
    if (this.cv || !tube) return;
    this.tube = tube;
    this.cv = document.createElement('canvas'); this.cv.id = 'sm-fx';
    this.rim = document.createElement('div'); this.rim.id = 'sm-rim';
    tube.appendChild(this.rim); tube.appendChild(this.cv);
    this.g = this.cv.getContext('2d');
  },
  size() {
    const w = Math.max(80, Math.round(this.tube.clientWidth / this.K)), h = Math.max(60, Math.round(this.tube.clientHeight / this.K));
    if (w !== this.W || h !== this.H) { this.W = this.cv.width = w; this.H = this.cv.height = h; }
  },
  spawn(p) { if (this.parts.length < CAP) this.parts.push(p); },

  /* a hit: sparks off the meter, more of them for a bigger pile and a higher rank */
  burst(n, tier) {
    if (!this.cv || calm() || tier < 1) return;
    this.size();
    const k = Math.min(70, 4 + tier * 4 + Math.round(n / 3)), x0 = this.W - 18, y0 = 22 + tier * 3;
    for (let i = 0; i < k; i++) {
      const a = Math.PI * (0.55 + Math.random() * 0.9), sp = 20 + Math.random() * (40 + tier * 12);
      this.spawn({ x: x0 + (Math.random() - 0.5) * 20, y: y0 + Math.random() * 14, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 10, g: 40, life: 0, max: 0.5 + Math.random() * 0.7, c: COL[(Math.random() * COL.length) | 0], s: 1 + (tier > 4 ? 1 : 0) });
    }
  },

  /* once a frame: ambient weather by rank, the particles, the frame of light */
  frame(dt, tier, top, col) {
    if (!this.cv) return;
    const live = tier >= 0 && !calm();
    this.rim.classList.toggle('live', tier >= 3 && !calm());
    this.rim.classList.toggle('pulse', tier >= 4);
    this.rim.classList.toggle('fast', tier >= 6);
    this.rim.style.setProperty('--rim', String(Math.max(0, tier - 2) * 0.85));
    this.rim.style.setProperty('--sm-col', col);
    this.cv.classList.toggle('live', live && (tier >= 3 || this.parts.length > 0));
    if (!live) { this.parts.length = 0; return; }
    this.size();
    const W = this.W, H = this.H, g = this.g;
    /* the weather */
    this.acc += dt;
    const rate = tier >= 7 ? 90 : tier >= 5 ? 22 : tier >= 3 ? 7 : 0;
    while (rate > 0 && this.acc > 1 / rate) {
      this.acc -= 1 / rate;
      if (tier >= 7) this.spawn({ x: Math.random() * W, y: -2, vx: (Math.random() - 0.5) * 16, vy: 14 + Math.random() * 22, g: 0, life: 0, max: 5 + Math.random() * 3, c: COL[(Math.random() * COL.length) | 0], s: 2, sway: Math.random() * 6 });
      else this.spawn({ x: W - 40 + Math.random() * 38, y: 30 + tier * 6 + Math.random() * 20, vx: -6 - Math.random() * 12 * (tier - 3), vy: -10 - Math.random() * 18, g: -4, life: 0, max: 1 + Math.random() * 1.4, c: COL[(Math.random() * COL.length) | 0], s: 1 });
    }
    if (rate === 0) this.acc = 0;
    /* the particles */
    g.clearRect(0, 0, W, H);
    for (let i = this.parts.length - 1; i >= 0; i--) {
      const p = this.parts[i];
      p.life += dt; p.vy += p.g * dt; p.x += (p.vx + (p.sway ? Math.sin(p.life * 4 + p.sway) * 10 : 0)) * dt; p.y += p.vy * dt;
      if (p.life > p.max || p.y > H + 4 || p.x < -4 || p.x > W + 4) { this.parts.splice(i, 1); continue; }
      /* the last part of its life, it flickers */
      if (p.life > p.max * 0.7 && ((p.life * 24) | 0) % 2) continue;
      g.fillStyle = p.c; g.fillRect(p.x | 0, p.y | 0, p.s, p.s);
    }
  },
  clear() {
    this.parts.length = 0;
    if (this.cv) { this.cv.classList.remove('live'); this.rim.classList.remove('live', 'pulse', 'fast'); }
  }
};
