/* AfterEgypt — the picture. A run and a little UI state in, a 320 x 200 canvas out. Sixteen colours, whole pixels. */
import { W, H, SHIP_X, GROUND, centre } from './sim.js';
import { secs } from './levels.js';

export const VGA16 = [
  [0, 0, 0], [0, 0, 170], [0, 170, 0], [0, 170, 170], [170, 0, 0], [170, 0, 170], [170, 85, 0], [170, 170, 170],
  [85, 85, 85], [85, 85, 255], [85, 255, 85], [85, 255, 255], [255, 85, 85], [255, 85, 255], [255, 255, 85], [255, 255, 255]
];
export const C = i => 'rgb(' + VGA16[i].join(',') + ')';

export function makeStars() {
  const s = [];
  for (let i = 0; i < 40; i++) s.push({ x: Math.random() * W, y: Math.random() * H, s: 0.4 + Math.random() * 1.6 });
  return s;
}

const panel = (g, x, y, w, h) => { g.fillStyle = C(0); g.fillRect(x, y, w, h); g.fillStyle = C(15); g.fillRect(x, y, w, 1); g.fillRect(x, y + h - 1, w, 1); g.fillRect(x, y, 1, h); g.fillRect(x + w - 1, y, 1, h); };
const say = (g, txt, y, col) => { g.fillStyle = C(col); g.textAlign = 'center'; g.fillText(txt, W / 2, y); g.textAlign = 'left'; };

function ship(g, r) {
  const y = Math.round(r.y);
  g.fillStyle = C(11); g.fillRect(22, y - 2, 14, 4);
  g.fillStyle = C(15); g.fillRect(34, y - 1, 4, 2);
  g.fillStyle = C(12); g.fillRect(16, y - 1, 6, 2);
  if (r.t % 3) { g.fillStyle = C(14); g.fillRect(12, y, 4, 1); }
  if (r.shield > 0 || (r.inv > 0 && (r.t >> 2) % 2)) {                  /* an ankh's ring, or the flicker after a blow */
    g.fillStyle = r.shield > 0 ? C(11) : C(15);
    g.fillRect(10, y - 7, 32, 1); g.fillRect(10, y + 6, 32, 1); g.fillRect(10, y - 6, 1, 12); g.fillRect(41, y - 6, 1, 12);
    if (r.shield > 1) { g.fillRect(8, y - 9, 36, 1); g.fillRect(8, y + 8, 36, 1); }
  }
}

function pillar(g, r, p) {
  const c = r.L.centred ? 100 : centre(r, p), top = c - p.gap / 2, bot = c + p.gap / 2, x = Math.round(p.x);
  g.fillStyle = C(7); g.fillRect(x, 0, 16, top); g.fillRect(x, bot, 16, H - bot);
  g.fillStyle = C(15); g.fillRect(x, 0, 3, top); g.fillRect(x, bot, 3, H - bot);
  g.fillStyle = C(8); g.fillRect(x + 13, 0, 3, top); g.fillRect(x + 13, bot, 3, H - bot);
  g.fillStyle = C(14); g.fillRect(x - 2, top - 5, 20, 5); g.fillRect(x - 2, bot, 20, 5);
}

function things(g, r) {
  r.items.forEach(it => {
    const x = Math.round(it.x), y = Math.round(it.y), b = (r.t >> 3) % 2;
    if (it.k === 'coin') {
      g.fillStyle = C(6); g.fillRect(x - 3, y - 4, 6, 8);
      g.fillStyle = C(14); g.fillRect(x - 2, y - 3 + b, 4, 6 - b);
      g.fillStyle = C(15); g.fillRect(x - 1, y - 2, 1, 2);
    } else {                                                            /* an ankh */
      g.fillStyle = C(11); g.fillRect(x - 1, y - 2, 3, 9); g.fillRect(x - 4, y + 1, 9, 2); g.fillRect(x - 3, y - 7, 7, 1); g.fillRect(x - 3, y - 6, 1, 4); g.fillRect(x + 3, y - 6, 1, 4); g.fillRect(x - 2, y - 3, 5, 1);
    }
  });
  r.locusts.forEach(l => {
    const x = Math.round(l.x), y = Math.round(l.y), f = (r.t >> 1) % 2;
    g.fillStyle = C(2); g.fillRect(x - 4, y - 1, 8, 3);
    g.fillStyle = C(10); g.fillRect(x - 5, y - 2, 2, 2); g.fillRect(x - 2, y - 3 - f, 5, 1);
    g.fillStyle = C(4); g.fillRect(x - 6, y, 1, 1);
  });
  if (r.gust) {                                                         /* arrows in the sky: a second of warning, then the push */
    const warn = r.gust.t <= 60, d = r.gust.dir;
    g.fillStyle = warn && (r.t >> 3) % 2 ? C(8) : C(7);
    for (let i = 0; i < 5; i++) {
      const x = 60 + i * 50, y = d < 0 ? 170 - ((r.t * 2 + i * 23) % 120) : 30 + ((r.t * 2 + i * 23) % 120);
      g.fillRect(x, y, 1, 6); g.fillRect(x - 2, y + (d < 0 ? 2 : 3), 5, 1); g.fillRect(x - 1, y + (d < 0 ? 1 : 4), 3, 1);
    }
  }
}

export function draw(g, r, ui) {
  const L = r.L, running = ui.mode === 'run';
  g.fillStyle = 'rgba(0,0,0,' + (0.30 + (1 - ui.phos) * 0.6) + ')';
  g.fillRect(0, 0, W, H);
  ui.stars.forEach(s => {
    if (running) s.x -= s.s;
    if (s.x < 0) { s.x = W; s.y = Math.random() * H; }
    g.fillStyle = s.s > 1.2 ? C(15) : C(8);
    g.fillRect(s.x | 0, s.y | 0, 1, 1);
  });
  g.fillStyle = C(6); g.fillRect(0, GROUND, W, H - GROUND);
  g.fillStyle = C(14);
  for (let x = 0; x < W; x += 8) g.fillRect(x, GROUND + ((x + (r.dist | 0)) % 3), 3, 1);
  r.pillars.forEach(p => { if (!p.off) pillar(g, r, p); });

  const tx = 330 + (L.goal - r.dist) * 0.42;
  if (tx < 330) {
    g.fillStyle = C(14);
    for (let s = 0; s < 5; s++) g.fillRect(tx - s * 6, 150 - s * 8, 12 + s * 12, 8);
    g.fillRect(tx + 10, 100, 4, 12); g.fillRect(tx + 6, 103, 12, 4);
    g.fillStyle = C(3); g.fillRect(tx - 6, 158, 48, 28);
    g.fillStyle = C(7);
    for (let c = 0; c < 5; c++) g.fillRect(tx - 4 + c * 10, 158, 5, 28);
  }
  things(g, r);
  if (!r.dead) ship(g, r);
  else { g.fillStyle = C(4 + (r.t >> 2) % 2 * 8); g.fillRect(20, Math.round(r.y) - 4, 16, 8); }

  g.font = '10px monospace';
  g.fillStyle = C(15);
  const pct = Math.min(100, Math.round(r.dist / L.goal * 100));
  g.fillText(L.name + '  ' + pct + '%', 6, 12);
  if (r.coins) { g.fillStyle = C(14); g.textAlign = 'right'; g.fillText(r.coins + ' COIN' + (r.coins > 1 ? 'S' : ''), W - 6, 12); g.textAlign = 'left'; }
  g.fillStyle = C(8); g.fillRect(6, 16, 100, 2); g.fillStyle = C(14); g.fillRect(6, 16, pct, 2);

  if (ui.mode === 'ready') {
    panel(g, 40, 54, 240, 96);
    say(g, L.name, 70, 14);
    say(g, L.blurb.length > 44 ? L.blurb.slice(0, L.blurb.lastIndexOf(' ', 44)) : L.blurb, 84, 7);
    if (L.blurb.length > 44) say(g, L.blurb.slice(L.blurb.lastIndexOf(' ', 44) + 1), 95, 7);
    say(g, Math.round(secs(L)) + ' SECONDS  -  ' + L.pay + ' SUN' + (L.coin ? ' + COINS' : ''), 110, 10);
    say(g, ui.best ? 'BEST ' + ui.best + '%' + (ui.cleared ? '  -  CLEARED' : '') : 'NOT FLOWN YET', 123, 7);
    say(g, 'CLICK OR PRESS SPACE TO FLY', 140, 15);
  } else if (ui.mode === 'dead' || ui.mode === 'won') {
    const p = ui.pay, lines = [];
    if (ui.mode === 'won') { lines.push(['YOU REACHED THE THIRD TEMPLE.', 14]); lines.push(['+' + p.base + ' SUN', 10]); }
    else lines.push(['YOU DID NOT ARRIVE.  ' + pct + '%', 12]);
    if (p.coins) lines.push(['+' + p.coins + ' FOR COINS', 14]);
    if (p.flawless) lines.push(['+' + p.flawless + ' FLAWLESS', 11]);
    if (p.first) lines.push(['+' + p.first + ' FIRST CLEAR', 13]);
    if (ui.unlocked) lines.push(['NEW WAY ACROSS: ' + ui.unlocked, 15]);
    lines.push(['SPACE TO FLY AGAIN', 7]);
    const h = 14 + lines.length * 13;
    panel(g, 50, 100 - h / 2, 220, h);
    lines.forEach((l, i) => say(g, l[0], 100 - h / 2 + 18 + i * 13, l[1]));
  }
}
