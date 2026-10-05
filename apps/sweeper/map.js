/* The map. Drawn the way a cartographer who has been underground too long
   would draw it: ink on dark vellum, each region a hand-cut blot, rooms as
   little boxes joined by corridors, a pin where there is a bench, a skull
   where there is a guardian, and a ghost where you left your geo. */
import { REGIONS, NODES, MODS, CHARM } from './data.js';
import { rng } from './gfx.js';
import { mix, mask, vessel, geo, bench, skull, shade, notch } from './art.js';

const MX = 30, MY = 112;                       /* where map space starts on the sheet */
const INK = '#c9d2c8', VELLUM = '#0a0d12';

export const nodeOpen = (camp, n) => n.req.every(r => camp.cleared[r] != null);
export const regionOpen = (camp, rg) => rg.nodes.some(n => nodeOpen(camp, n));

export function createMap(env) {
  const camp = env.camp;
  const M = { sel: camp.last && NODES[camp.last] ? camp.last : firstOpen(camp), hits: [] };
  const R = rng(4242), dots = Array.from({ length: 260 }, () => [R() * 960, R() * 640, R()]);
  const pos = id => id.indexOf('bench:') === 0 ? benchAt(id.slice(6)) : NODES[id].at;
  const benchAt = rid => REGIONS.find(r => r.id === rid).bench;

  M.draw = (G, now) => {
    G.fill('#000'); G.R(0, 0, 960, 640, VELLUM);
    dots.forEach(d => { G.a(0.05 + d[2] * 0.07); G.R(d[0], d[1], 2, 2, '#c9d2c8'); }); G.a(1);
    M.hits = [];
    /* the frame, doubled */
    G.R(8, 8, 944, 2, INK); G.R(8, 630, 944, 2, INK); G.R(8, 8, 2, 624, INK); G.R(950, 8, 2, 624, INK);
    G.R(14, 14, 932, 1, '#5d665f'); G.R(14, 625, 932, 1, '#5d665f'); G.R(14, 14, 1, 612, '#5d665f'); G.R(945, 14, 1, 612, '#5d665f');
    header(G, camp, now);
    REGIONS.forEach(rg => blob(G, rg, regionOpen(camp, rg)));
    REGIONS.forEach(rg => rg.nodes.forEach(n => n.req.forEach(r => corridor(G, NODES[r].at, n.at, camp.cleared[r] != null))));
    REGIONS.forEach(rg => { if (regionOpen(camp, rg)) benchPin(G, M, rg, camp, M.sel === 'bench:' + rg.id, now); });
    REGIONS.forEach(rg => rg.nodes.forEach(n => room(G, M, n, camp, M.sel === n.id, now)));
    compass(G);
    card(G, M.sel, camp);
    G.T('ARROWS: MOVE    ENTER: ENTER / REST    C: CHARMS    ESC: BACK', 480, 612, '#7d877f', 20, 'center');
  };

  const open = id => id.indexOf('bench:') === 0 ? regionOpen(camp, REGIONS.find(r => r.id === id.slice(6))) : nodeOpen(camp, NODES[id]);
  const go = id => {
    if (!open(id)) { env.snd.err(); return; }
    env.snd.click();
    if (id.indexOf('bench:') === 0) env.openBench(id.slice(6)); else { camp.last = id; env.openRoom(NODES[id]); }
  };
  M.mouse = (type, ev, lx, ly) => {
    const h = M.hits.find(q => lx >= q.x && lx <= q.x + q.w && ly >= q.y && ly <= q.y + q.h);
    if (type === 'move') { if (h && open(h.id)) M.sel = h.id; return; }
    if (type === 'down' && h) { M.sel = h.id; go(h.id); }
  };
  M.key = ev => {
    const k = ev.key;
    if (k === 'Enter') { go(M.sel); return true; }
    if (k === 'c' || k === 'C') { env.openBench(camp.bench); return true; }
    const dir = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[k];
    if (!dir) return false;
    const [cx, cy] = pos(M.sel);
    let best = null, bd = 1e9;
    const ids = Object.keys(NODES).concat(REGIONS.map(r => 'bench:' + r.id)).filter(i => i !== M.sel && open(i));
    ids.forEach(i => {
      const [x, y] = pos(i), dx = x - cx, dy = y - cy, along = dx * dir[0] + dy * dir[1];
      if (along <= 4) return;
      const across = Math.abs(dx * dir[1]) + Math.abs(dy * dir[0]);
      const d = along + across * 2.2;
      if (d < bd) { bd = d; best = i; }
    });
    if (best) { M.sel = best; env.snd.click(); }
    return true;
  };
  return M;
}

function firstOpen(camp) {
  for (const id in NODES) if (nodeOpen(camp, NODES[id]) && camp.cleared[id] == null) return id;
  return 'stair';
}

function header(G, camp, now) {
  G.T('THE SUNKEN KINGDOM', 480, 52, '#e8e2d4', 46, 'center');
  G.R(300, 62, 360, 2, INK); G.R(468, 58, 24, 10, VELLUM); G.R(474, 60, 12, 6, INK);
  vessel(G, 56, 52, 22, camp.soul / 99, now);
  for (let i = 0; i < camp.maxHp; i++) mask(G, 94 + i * 30, 24, 2.6, i < camp.hp ? 'full' : 'empty');
  geo(G, 800, 28, 3.6); G.T(String(camp.geo), 936, 50, '#f2e2b0', 28, 'right');
  for (let n = 0; n < camp.notches; n++) notch(G, 800 + n * 18, 62, 3, n < camp.notchUsed);
}

function blob(G, rg, known) {
  const p = rg.pal, a = known ? 1 : 0.3;
  rg.blob.forEach(b => {
    const x = MX + b[0], y = MY + b[1], w = b[2], h = b[3], R = rng(rg.id.charCodeAt(1) * 31 + w);
    G.a(a);
    G.R(x + 8, y, w - 16, h, mix(VELLUM, p.c, 0.5)); G.R(x, y + 8, w, h - 16, mix(VELLUM, p.c, 0.5));
    G.R(x + 4, y + 4, w - 8, h - 8, mix(VELLUM, p.c, 0.5));
    /* a ragged edge: the cave wall is never straight */
    for (let k = 0; k < w; k += 6) { const j = R() < 0.4 ? 3 : 0; G.R(x + 8 + k, y - j, 6, 2 + j, p.ink); G.R(x + 8 + k, y + h - 2, 6, 2 + (R() < 0.4 ? 3 : 0), p.ink); }
    for (let k = 0; k < h; k += 6) { const j = R() < 0.4 ? 3 : 0; G.R(x - j, y + 8 + k, 2 + j, 6, p.ink); G.R(x + w - 2, y + 8 + k, 2 + (R() < 0.4 ? 3 : 0), 6, p.ink); }
    G.R(x + 4, y + 4, 6, 2, p.ink); G.R(x + 4, y + 4, 2, 6, p.ink); G.R(x + w - 10, y + 4, 6, 2, p.ink); G.R(x + w - 6, y + 4, 2, 6, p.ink);
    G.R(x + 4, y + h - 6, 6, 2, p.ink); G.R(x + 4, y + h - 10, 2, 6, p.ink); G.R(x + w - 10, y + h - 6, 6, 2, p.ink); G.R(x + w - 6, y + h - 10, 2, 6, p.ink);
    G.a(known ? 0.9 : 0.35);
    G.T(known ? rg.name : '?  ?  ?', x + w / 2, y + h - 12, p.ink, 20, 'center');
    G.a(1);
  });
}
function corridor(G, a, b, done) {
  const c = done ? '#b9c4bd' : '#4a524c';
  const x0 = MX + a[0], y0 = MY + a[1], x1 = MX + b[0], y1 = MY + b[1];
  G.R(Math.min(x0, x1), y0 - 1, Math.abs(x1 - x0) + 2, 3, c);
  G.R(x1 - 1, Math.min(y0, y1), 3, Math.abs(y1 - y0) + 2, c);
}
function room(G, M, n, camp, sel, now) {
  const x = MX + n.at[0], y = MY + n.at[1], op = nodeOpen(camp, n), done = camp.cleared[n.id] != null;
  const w = n.boss ? 34 : 26, h = n.boss ? 26 : 18, pal = REGIONS.find(r => r.id === n.region).pal;
  G.R(x - w / 2 - 2, y - h / 2 - 2, w + 4, h + 4, VELLUM);
  G.R(x - w / 2, y - h / 2, w, h, done ? mix(pal.c, pal.glow, 0.45) : op ? mix(pal.b, pal.c, 0.6) : '#161a1f');
  const pulse = op && !done && Math.sin(now / 300) > 0;
  const edge = sel ? '#fff' : done ? pal.glow : op ? (pulse ? '#fff' : pal.ink) : '#3a423c';
  G.R(x - w / 2, y - h / 2, w, 2, edge); G.R(x - w / 2, y + h / 2 - 2, w, 2, edge); G.R(x - w / 2, y - h / 2, 2, h, edge); G.R(x + w / 2 - 2, y - h / 2, 2, h, edge);
  if (n.boss) skull(G, x - 12, y - 8, 3, done ? '#fff' : op ? '#e6dcc0' : '#4a524c');
  else if (done) { G.R(x - 6, y, 4, 4, '#fff'); G.R(x - 3, y + 3, 4, 4, '#fff'); G.R(x + 1, y - 5, 4, 10, '#fff'); }
  if (camp.shade && camp.shade.node === n.id) shade(G, x - 12, y - h / 2 - 22 + Math.round(Math.sin(now / 400) * 2), 3, '#9bb0ff');
  if (camp.last === n.id) mask(G, x - 13, y - h / 2 - 22, 2.6, 'full');
  M.hits.push({ id: n.id, x: x - w / 2 - 4, y: y - h / 2 - 4, w: w + 8, h: h + 8 });
}
function benchPin(G, M, rg, camp, sel, now) {
  const x = MX + rg.bench[0], y = MY + rg.bench[1];
  G.R(x - 14, y - 10, 28, 20, VELLUM);
  bench(G, x - 12, y - 8, 2, sel ? '#fff' : camp.bench === rg.id ? '#ffd68c' : '#b9c4bd');
  if (sel) { G.R(x - 15, y - 11, 30, 2, '#fff'); G.R(x - 15, y + 9, 30, 2, '#fff'); }
  M.hits.push({ id: 'bench:' + rg.id, x: x - 16, y: y - 12, w: 32, h: 24 });
}
function compass(G) {
  const x = 70, y = 540;
  G.R(x - 1, y - 28, 3, 56, INK); G.R(x - 28, y - 1, 56, 3, INK);
  G.R(x - 6, y - 6, 12, 12, VELLUM); G.R(x - 3, y - 3, 6, 6, INK);
  G.T('N', x, y - 34, INK, 20, 'center');
}
function card(G, sel, camp) {
  G.R(660, 462, 276, 134, '#05070a'); G.R(660, 462, 276, 2, INK); G.R(660, 594, 276, 2, INK);
  if (sel.indexOf('bench:') === 0) {
    const rg = REGIONS.find(r => r.id === sel.slice(6));
    G.T('A BENCH', 676, 494, '#ffd68c', 28); G.T(rg.name, 676, 520, INK, 22);
    G.T('REST. MEND YOUR MASKS.', 676, 548, '#cfd8e0', 20); G.T('CHANGE YOUR CHARMS.', 676, 570, '#cfd8e0', 20);
    return;
  }
  const n = NODES[sel], rg = REGIONS.find(r => r.id === n.region);
  G.T(n.name, 676, 490, n.boss ? '#ffb0a0' : '#e8e2d4', 26);
  G.T(rg.name + (n.boss ? '  / GUARDIAN' : ''), 676, 512, rg.pal.ink, 18);
  G.T(n.c + ' x ' + n.r + '   ' + n.m + ' LARVAE', 676, 536, '#cfd8e0', 20);
  G.T(n.mod ? MODS[n.mod].name : 'PLAIN GROUND', 676, 558, n.mod ? rg.pal.glow : '#8794aa', 20);
  const best = camp.cleared[n.id];
  G.T(best != null ? 'BEST ' + best + 's' : 'PAYS ' + n.geo + ' GEO' + (n.shard ? '  + A MASK SHARD' : ''), 676, 582, best != null ? '#9fe0ff' : '#f2e2b0', 20);
}
