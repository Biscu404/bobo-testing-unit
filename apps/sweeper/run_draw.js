/* What a room looks like. Everything goes through G.R / G.T so it lands on
   whole device pixels at any window size. */
import { backdrop, weather, mask, vessel, geo, notch, charmIcon, mix } from './art.js';
import { CHARM, SPELLS, SPELL_HINT, MODS } from './data.js';
import { around } from './board.js';

/* secondary text and a switched-off control: both read on the near-black of the bars (WCAG 4.5:1 or better) */
const DIM = '#98a2b8', OFF = '#7b86a0';
const NUM = ['', '#7fb8ff', '#8fe8b0', '#ffffff', '#c3a6ff', '#ffc35c', '#ff9040', '#ff4d5e', '#e0203a'];
const hashOf = i => (i * 2654435761) >>> 0;

export const CLASSIC_REGION = { id: 'classic', pal: { a: '#080b14', b: '#10162a', c: '#222a40', ink: '#9fb4d8', glow: '#7fb8ff', mote: '#8aa7d6' } };

export function drawRun(G, S, regionOf, now) {
  const rg = regionOf, p = rg.pal, b = S.b, T = S.tile;
  G.fill('#000');
  const sh = S.shake > 0 ? [Math.round((Math.random() - 0.5) * 12 * S.shake), Math.round((Math.random() - 0.5) * 12 * S.shake)] : [0, 0];
  if (S.shake > 0) S.shake = Math.max(0, S.shake - 0.03);
  G.g.save(); G.g.translate(sh[0], sh[1]);
  backdrop(G, rg); weather(G, rg, now);

  hud(G, S, rg, now);
  /* the slab the board sits on, with a thin filigree edge */
  const bw = T * b.c, bh = T * b.r;
  G.a(0.82); G.R(S.bx - 10, S.by - 10, bw + 20, bh + 20, '#05060c'); G.a(1);
  G.R(S.bx - 12, S.by - 12, bw + 24, 2, p.ink); G.R(S.bx - 12, S.by + bh + 10, bw + 24, 2, p.ink);
  G.R(S.bx - 12, S.by - 12, 2, bh + 24, p.ink); G.R(S.bx + bw + 10, S.by - 12, 2, bh + 24, p.ink);
  [[-16, -16], [bw + 8, -16], [-16, bh + 8], [bw + 8, bh + 8]].forEach(c => { G.R(S.bx + c[0], S.by + c[1], 8, 8, p.ink); G.R(S.bx + c[0] + 2, S.by + c[1] + 2, 4, 4, '#05060c'); });

  const hover = S.over ? -1 : S.hover;
  for (let i = 0; i < b.n; i++) tile(G, S, rg, i, hover, now);
  if (S.hasMod('lantern')) darkness(G, S, hover);
  if (S.has('compass') && S.started) tallies(G, S);
  if (S.target && hover >= 0) {
    const rad = S.target === 'dive' ? S.diveRad() : 0;
    around(b, hover, rad).forEach(j => {
      const x = S.bx + (j % b.c) * T, y = S.by + Math.floor(j / b.c) * T;
      G.a(0.35); G.R(x, y, T, T, '#9fe0ff'); G.a(1);
    });
  }
  particles(G, S);
  if (S.flash) { G.a(Math.abs(S.flash) * 0.35); G.R(0, 0, 960, 640, S.flash > 0 ? '#b01030' : '#fff'); G.a(1); S.flash = S.flash > 0 ? Math.max(0, S.flash - 0.04) : Math.min(0, S.flash + 0.05); }
  bottom(G, S, now);
  G.g.restore();
  if (S.over) overlay(G, S, rg, now);
}

function hud(G, S, rg, now) {
  const p = rg.pal;
  G.a(0.7); G.R(0, 0, 960, 76, '#04050a'); G.a(1);
  G.R(0, 76, 960, 2, p.ink);
  if (S.camp) {
    vessel(G, 50, 40, 26, S.soul / 99, now);
    G.T(String(S.soul), 50, 76, '#cfe6ff', 20, 'center');
    for (let i = 0; i < S.hpMax; i++) mask(G, 94 + i * 38, 14, 3.4, i < S.hp ? 'full' : 'empty');
    for (let i = 0; i < S.blue; i++) mask(G, 94 + (S.hpMax + i) * 38, 14, 3.4, 'blue');
    geo(G, 856, 12, 4); G.T(String(S.camp.geo), 944, 36, '#f2e2b0', 30, 'right');
    for (let n = 0; n < S.camp.notches; n++) notch(G, 800 + n * 20, 50, 3.5, n < used(S));
    G.T(S.node.name, 478, 30, '#e8e2d4', 28, 'center');
    const md = S.mods.length ? '  ' + S.mods.map(m => MODS[m] ? MODS[m].name : m).join('+') : '';
    G.T('LARVAE ' + S.left() + '   ' + clock(S) + md, 478, 58, p.glow, 22, 'center');
  } else {
    mask(G, 20, 10, 5, 'full');
    G.R(20, 14, 0, 0, '#000');
    G.T(String(Math.max(0, S.left())).padStart(3, '0'), 100, 52, '#ff4d5e', 40);
    G.T(clock(S), 944, 52, '#7fb8ff', 40, 'right');
    G.T(S.lv.name, 478, 40, '#e8e2d4', 30, 'center');
  }
}
const used = S => S.camp.equipped.reduce((a, id) => a + CHARM[id].n, 0);
const clock = S => {
  const secs = !S.started ? 0 : Math.floor(((S.over ? S.endT : Date.now()) - S.t0) / 1000);
  return String(Math.min(999, secs)).padStart(3, '0') + 's';
};

function tile(G, S, rg, i, hover, now) {
  const b = S.b, T = S.tile, p = rg.pal;
  const x = S.bx + (i % b.c) * T, y = S.by + Math.floor(i / b.c) * T;
  const rt = b.rev[i], shown = rt && now >= rt, h = hashOf(i);
  if (!shown) {
    const lift = i === hover;
    const face = lift ? mix(p.c, p.ink, 0.22) : mix(p.b, p.c, 0.7);
    G.R(x, y, T - 1, T - 1, face);
    G.R(x, y, T - 1, 2, mix(face, p.ink, 0.35)); G.R(x, y, 2, T - 1, mix(face, p.ink, 0.35));
    G.R(x, y + T - 3, T - 1, 2, '#05060c'); G.R(x + T - 3, y, 2, T - 1, '#05060c');
    G.a(0.14); G.R(x + T * 0.15, y + T * 0.3, T * 0.6, 1, p.ink); G.R(x + T * 0.3, y + T * 0.6, T * 0.45, 1, p.ink); G.a(1);
    if (b.thorn[i]) thorns(G, x, y, T);
    if (b.web[i]) web(G, x, y, T);
    if (b.flag[i]) flag(G, x, y, T);
    if (b.flag[i] && !b.mine[i] && S.flagHint && now - S.flagHint < 8000) { G.R(x + 4, y + 4, T - 11, 3, '#ff4d5e'); G.R(x + 4, y + T - 9, T - 11, 3, '#ff4d5e'); }
    if (S.over && !S.won && !S.dead && S.classic && b.mine[i] && !b.flag[i] && now > S.hatch + (i % 40) * 40) { floor(G, x, y, T, p); larva(G, x, y, T, true); }
    if (S.over && !S.won && S.classic && b.flag[i] && !b.mine[i]) { G.R(x + 6, y + 6, T - 14, 3, '#ff4d5e'); G.R(x + 6, y + T - 10, T - 14, 3, '#ff4d5e'); }
    return;
  }
  const age = Math.min(1, (now - rt) / 90);
  G.a(0.35 + age * 0.65);
  floor(G, x, y, T, p, h);
  if (b.def[i]) larva(G, x, y, T, true);
  else if (b.mine[i]) larva(G, x, y, T, S.over && !S.won);
  else if (b.cells[i] && !b.fog[i]) G.T(String(b.cells[i]), x + T / 2, y + T * 0.78, NUM[b.cells[i]], Math.round(T * 0.88), 'center');
  if (b.fog[i]) spore(G, x, y, T);
  G.a(1);
}
function floor(G, x, y, T, p, h) {
  G.R(x, y, T - 1, T - 1, mix('#04050a', p.b, 0.45));
  G.R(x + 1, y + 1, T - 3, T - 3, mix('#04050a', p.b, 0.62));
  if (h == null) return;
  if ((h & 15) === 0) { G.R(x + T * 0.3, y + 1, 1, T * 0.35, mix(p.b, p.ink, 0.2)); }
  else if ((h & 15) === 3) { G.R(x + T * 0.15, y + T * 0.8, T * 0.35, 1, mix(p.b, p.ink, 0.15)); }
  else if ((h & 31) === 7) { G.a(0.2); G.R(x + T * 0.35, y + T * 0.35, T * 0.28, T * 0.28, p.glow); G.a(1); }
}
function larva(G, x, y, T, hatched) {
  const cx = x + T / 2, cy = y + T / 2, s = T / 26;
  G.R(cx - 8 * s, cy - 6 * s, 16 * s, 12 * s, hatched ? '#3a1420' : '#221826');
  G.R(cx - 7 * s, cy - 5 * s, 14 * s, 4 * s, hatched ? '#7a2030' : '#2e2233');
  for (let k = 0; k < 4; k++) G.R(cx - 6 * s + k * 4 * s, cy - 5 * s, 2 * s, 10 * s, hatched ? '#c8354a' : '#3a2c42');
  G.R(cx + 3 * s, cy - 3 * s, 2 * s, 2 * s, hatched ? '#ff5566' : '#5a3a4a');
}
function flag(G, x, y, T) {
  const cx = x + T / 2, s = T / 26;
  G.R(cx - s, y + 5 * s, 2 * s, 15 * s, '#8794aa');
  G.R(cx - 7 * s, y + 5 * s, 8 * s, 6 * s, '#e8e2d4'); G.R(cx - 7 * s, y + 8 * s, 8 * s, 3 * s, '#c2b8a4');
  G.R(cx - 4 * s, y + 19 * s, 8 * s, 2 * s, '#5c6478');
}
function thorns(G, x, y, T) {
  for (let k = 1; k < 5; k++) { G.R(x + k * T / 5, y + T * 0.15, 2, T * 0.7, '#2f7a40'); G.R(x + k * T / 5 - 3, y + T * 0.3 + (k % 2) * 8, 8, 2, '#8fe8a0'); }
  G.R(x + T * 0.15, y + T / 2, T * 0.7, 2, '#2f7a40');
}
function web(G, x, y, T) {
  G.a(0.8);
  G.line(x + 2, y + 2, x + T - 3, y + T - 3, '#d8e4ee', 1); G.line(x + T - 3, y + 2, x + 2, y + T - 3, '#d8e4ee', 1);
  G.line(x + T / 2, y + 2, x + T / 2, y + T - 3, '#d8e4ee', 1); G.line(x + 2, y + T / 2, x + T - 3, y + T / 2, '#d8e4ee', 1);
  G.R(x + T / 2 - 3, y + T / 2 - 3, 6, 6, '#d8e4ee'); G.a(1);
}
function spore(G, x, y, T) {
  G.a(0.85);
  for (let k = 0; k < 5; k++) G.R(x + T * (0.15 + (k % 3) * 0.25), y + T * (0.2 + (k % 2) * 0.35 + k * 0.03), T * 0.28, T * 0.24, k % 2 ? '#8a4ed0' : '#c58bff');
  G.a(1);
}

/* the dark: the nearer the lantern, the clearer the ground */
function darkness(G, S, hover) {
  const b = S.b, T = S.tile, hx = hover >= 0 ? hover % b.c : -99, hy = hover >= 0 ? Math.floor(hover / b.c) : -99;
  for (let i = 0; i < b.n; i++) {
    const d = Math.hypot((i % b.c) - hx, Math.floor(i / b.c) - hy);
    const a = Math.min(0.94, Math.max(0, (d - 2.2 - (S.has('lens') ? 2 : 0)) / 2.6));
    if (a < 0.03) continue;
    G.a(Math.round(a * 8) / 8 * 0.97); G.R(S.bx + (i % b.c) * T, S.by + Math.floor(i / b.c) * T, T, T, '#000');
  }
  G.a(1);
}
function tallies(G, S) {
  const b = S.b, T = S.tile, col = [], row = [];
  for (let i = 0; i < b.n; i++) {
    const x = i % b.c, y = Math.floor(i / b.c);
    if (b.mine[i]) { col[x] = (col[x] || 0) + 1; row[y] = (row[y] || 0) + 1; }
    if (b.flag[i]) { col[x] = (col[x] || 0) - 1; row[y] = (row[y] || 0) - 1; }
  }
  const sz = Math.max(12, Math.min(20, T * 0.5));
  for (let x = 0; x < b.c; x++) if (col[x] > 0) G.T(String(col[x]), S.bx + x * T + T / 2, S.by - 14, '#ffd68c', sz, 'center');
  for (let y = 0; y < b.r; y++) if (row[y] > 0) G.T(String(row[y]), S.bx - 16, S.by + y * T + T / 2 + sz / 3, '#ffd68c', sz, 'center');
}
function particles(G, S) {
  const dt = 1 / 60;
  S.parts = S.parts.filter(p => (p.life -= dt) > 0);
  S.parts.forEach(p => { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 260 * dt; G.R(p.x, p.y, 3, 3, p.c); });
  S.floats = S.floats.filter(f => (f.t += dt) < 1.1);
  S.floats.forEach(f => { G.a(1 - f.t / 1.1); G.T(f.txt, f.x, f.y - f.t * 30, f.c, 24, 'center'); G.a(1); });
}

function bottom(G, S, now) {
  G.a(0.7); G.R(0, 604, 960, 36, '#04050a'); G.a(1);
  if (S.camp) {
    const keys = [['F', 'focus', S.focusCost()], ['Q', 'scry', S.cost('scry')], ['E', 'dive', S.cost('dive')]];
    keys.forEach((k, i) => {
      const x = 14 + i * 150, known = S.learnt(k[1]), ok = known && S.soul >= k[2] && S.started, on = S.target && SPELLS[S.target].key === k[0];
      G.R(x, 610, 142, 24, on ? '#9fe0ff' : ok ? '#2c3a52' : known ? '#1a2030' : '#0c0e14');
      if (!known) { G.R(x, 610, 142, 1, '#3a4256'); G.R(x, 633, 142, 1, '#3a4256'); }
      G.T(known ? '[' + k[0] + '] ' + SPELLS[k[1]].name + ' ' + k[2] : '[' + k[0] + '] LOCKED', x + 8, 629, on ? '#000' : ok ? '#e8e2d4' : known ? OFF : '#8a94ac', 22);
    });
  }
  const m = S.msg[S.msg.length - 1], tip = S.camp && S.barHover >= 0 ? ['focus', 'scry', 'dive'][S.barHover] : null;
  if (tip) G.T(S.learnt(tip) ? SPELLS[tip].text : 'LOCKED: ' + SPELL_HINT[tip], 470, 629, S.learnt(tip) ? '#cfe6ff' : '#ffd68c', 22, 'left');
  else if (m && now - m.at < 4200) { G.a(Math.min(1, (4200 - (now - m.at)) / 800)); G.T(m.t, 470, 629, m.c, 24, 'left'); G.a(1); }
  else G.T('ESC: LEAVE   R: ' + (S.camp ? 'RESTART ROOM' : 'NEW GAME'), 946, 629, DIM, 20, 'right');
}

function overlay(G, S, rg, now) {
  const t = Math.min(1, (now - S.overAt) / 1200);
  if (S.dead) {
    G.a(t * 0.92); G.R(0, 0, 960, 640, '#000'); G.a(1);
    if (t > 0.5) {
      G.T('YOU HAVE FALLEN', 480, 270, '#e8e2d4', 64, 'center');
      const lost = S.env.shadeGeo(S);
      G.T(lost ? 'YOUR SHADE KEEPS ' + lost + ' GEO IN ' + S.node.name + '.' : 'YOU HAD NOTHING TO LOSE.', 480, 320, '#9bb0ff', 28, 'center');
      G.T('CLICK OR ENTER: WAKE AT THE BENCH', 480, 380, DIM, 24, 'center');
    }
    return;
  }
  if (S.won && S.pay) {
    const P = S.pay, two = P.geo.length > 0, tr = P.trophies || [], extra = tr.length ? Math.min(3, tr.length) * 28 + 40 : 0;
    const top = (two ? 96 : 150) - Math.round(extra / 2), hgt = (two ? 444 : 290) + extra;
    G.a(0.82 * t); G.R(two ? 110 : 180, top, two ? 740 : 600, hgt, '#05060c'); G.a(1);
    if (t < 1) return;
    const x0 = two ? 110 : 180, w = two ? 740 : 600;
    G.R(x0, top, w, 3, rg.pal.ink); G.R(x0, top + hgt - 3, w, 3, rg.pal.ink);
    let y = top + 60;
    G.T(S.camp ? 'ROOM CLEARED' : 'THE CHAMBER IS QUIET', 480, y, '#e8e2d4', 52, 'center'); y += 36;
    G.T(P.secs.toFixed(1) + ' SECONDS', 480, y, rg.pal.glow, 26, 'center'); y += 30;
    if (two) {
      const near = S.hits === 0 ? 'OVER ' + P.par + 'S' : 'A LARVA HATCHED';
      G.T(P.perfect ? 'PERFECT' : 'NOT PERFECT: ' + near, 480, y, P.perfect ? '#ffd68c' : DIM, P.perfect ? 30 : 22, 'center'); y += 40;
      G.T('GEO', 150, y, rg.pal.ink, 24); G.T('SUN', 500, y, '#f2e2b0', 24); G.R(150, y + 6, 310, 2, '#3a4256'); G.R(500, y + 6, 310, 2, '#3a4256'); y += 32;
      let yl = y, yr = y;
      P.geo.forEach(l => { G.T(l[0], 150, yl, '#cfd8e0', 26); G.T(l[1], 460, yl, l[2] || '#f2e2b0', 26, 'right'); yl += 28; });
      P.sun.forEach(l => { G.T(l[0], 500, yr, '#cfd8e0', 26); G.T(l[1], 810, yr, l[2] || '#f2e2b0', 26, 'right'); yr += 28; });
      y = Math.max(yl, yr) + 6;
      G.R(500, y - 18, 310, 2, '#3a4256');
      G.T('TOTAL', 500, y + 12, '#e8e2d4', 28); G.T('+' + P.total + ' SUN', 810, y + 12, '#ffd68c', 30, 'right'); y += 46;
      (P.news || []).forEach(n => { G.T(n, 480, y, '#9fe0ff', 24, 'center'); y += 26; });
      trophyRows(G, tr, 150, y - 6, 660);
      G.T('CLICK OR ENTER TO CONTINUE', 480, top + hgt - 14, DIM, 22, 'center');
    } else {
      y += 18;
      P.sun.forEach(l => { G.T(l[0], 250, y, '#cfd8e0', 28); G.T(l[1], 710, y, l[2] || '#f2e2b0', 28, 'right'); y += 32; });
      G.R(250, y - 20, 460, 2, '#3a4256');
      G.T('TOTAL', 250, y + 8, '#e8e2d4', 28); G.T('+' + P.total + ' SUN', 710, y + 8, '#ffd68c', 30, 'right');
      trophyRows(G, tr, 250, y + 44, 460);
      G.T('CLICK OR ENTER FOR ANOTHER', 480, top + hgt - 14, DIM, 22, 'center');
    }
  } else if (S.over && !S.won && S.classic) {
    G.a(0.55 * t); G.R(240, 250, 480, 100, '#05060c'); G.a(1);
    if (t > 0.6) { G.T('THE HIVE STIRS', 480, 305, '#ff8090', 44, 'center'); G.T('CLICK, ENTER OR R: TRY AGAIN   ESC: LEAVE', 480, 336, DIM, 22, 'center'); }
  }
}

/* the trophies this room earned: TROPHY: <NAME> and what each paid (three, then how many more) */
const TIER_INK = { B: '#d9a066', S: '#dfe6ee', G: '#ffd68c' };
function trophyRows(G, rows, x, y, w) {
  if (!rows.length) return;
  G.R(x, y - 18, w, 2, '#3a4256');
  rows.slice(0, 3).forEach(r => {
    G.T('TROPHY: ' + r.name, x, y + 8, TIER_INK[r.tier] || '#ffd68c', 24);
    if (r.pay) G.T('+' + r.pay + ' SUN', x + w, y + 8, '#ffd68c', 24, 'right');
    y += 28;
  });
  if (rows.length > 3) G.T('AND ' + (rows.length - 3) + ' MORE IN TROPHIES.EXE', x, y + 8, '#a3adc2', 20);
}
