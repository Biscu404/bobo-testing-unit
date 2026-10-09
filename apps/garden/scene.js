/* GARDEN — one frame of the garden: the sky, the hedge, the rack, twelve pots with what is growing in them, the weather of the
   room, and the tabs over the top. Reads the model; changes nothing in it (it does bounce a plant that was just touched). */
import { dimCol, drawPot, drawPlant, drawSunToken, gardenSky } from './art.js';
import { ROOM_DEFS, drawRoomEffects } from './rooms.js';
import { POTS_PER_ROOM } from './synergy.js';
import * as M from './model.js';

export const W = 700, H = 436;
export const potAt = i => { const col = i % 4, row = (i / 4) | 0; return { x: 40 + col * 184, y: 150 + row * 96, cx: 40 + col * 184 + 33, w: 66, h: 46 }; };
export const roomTabAt = i => { const tw = 74, gap = 4, total = ROOM_DEFS.length * (tw + gap) - gap; return { x: W - total - 10 + i * (tw + gap), y: 6, w: tw, h: 20 }; };

export function createAmbience() {
  const a = { motes: [], flies: [], leaves: [], pops: [] };
  for (let i = 0; i < 26; i++) a.motes.push({ x: Math.random() * W, y: Math.random() * H, v: 0.1 + Math.random() * 0.25, s: Math.random() * 6 });
  for (let i = 0; i < 14; i++) a.flies.push({ x: Math.random() * W, y: 120 + Math.random() * 280, p: Math.random() * 6.3, r: 8 + Math.random() * 20 });
  return a;
}

/* the small squares above a pot that say what is helping it: gold for ROOTED, green for its home or its pot, aqua for a bed, pink for mates */
const PIPS = { 'ROOTED': '#ffd84a', 'HOME ROOM': '#7ad06a', 'KIN POT': '#7ad06a', 'ROOM SET': '#c8a0ff' };
const pipColour = tag => PIPS[tag] || (/OF ITS KIND/.test(tag) ? '#5ad6d6' : /MATE/.test(tag) ? '#ff8ac8' : '#ffffff');

function ground(g, gk, V) {
  const D = c => dimCol(c, gk);
  g.fillStyle = D('#3c5a2c');
  for (let x = -10; x < W + 20; x += 26) { const h = 26 + ((x * 37) % 18); g.fillRect(x, 118 - h, 30, h + 22); }
  g.fillStyle = D('#4e7038');
  for (let x = 4; x < W + 20; x += 26) { const h = 18 + ((x * 53) % 14); g.fillRect(x, 120 - h, 18, 6); }
  g.fillStyle = D('#2c4420'); g.fillRect(0, 134, W, 8);
  g.fillStyle = D('#4a6630'); g.fillRect(0, H - 42, W, 42);
  g.fillStyle = D('#5c7a3c'); g.fillRect(0, H - 42, W, 4);
  for (let x = 0; x < W; x += 7) { g.fillStyle = D((x % 14) ? '#3e5828' : '#628040'); g.fillRect(x, H - 40 + ((x * 29) % 9), 2, 5); }
  g.fillStyle = D('#4a3a24'); g.fillRect(14, 132, 12, H - 160); g.fillRect(W - 26, 132, 12, H - 160);
  g.fillStyle = D('#6b5434'); g.fillRect(14, 132, 3, H - 160); g.fillRect(W - 26, 132, 3, H - 160);
  const drip = V.st.rooms[V.st.active].drip;
  for (let row = 0; row < 3; row++) {
    const y = 150 + row * 96 + 46;
    g.fillStyle = D('#4a3a24'); g.fillRect(14, y, W - 28, 9);
    g.fillStyle = D('#7a6038'); g.fillRect(14, y, W - 28, 3);
    g.fillStyle = D('#2e2416'); g.fillRect(14, y + 9, W - 28, 3);
    if (drip) {                                          /* a drip line along the shelf: a pipe, and a bead running down it now and then */
      g.fillStyle = D('#3a6ea8'); g.fillRect(26, y - 38, W - 52, 2);
      g.fillStyle = D('#8fc8ff');
      for (let i = 0; i < 4; i++) { const bx = 40 + i * 184 + 33; g.fillRect(bx, y - 36, 2, 3 + ((V.tsec * 8 + i * 3) % 12 | 0)); }
    }
  }
}

function potsAndPlants(g, V, gk, night) {
  const { st, w, ri, now, tsec, dt } = V, room = st.rooms[ri], dry = [];
  const skin = V.skin(ri);
  for (let i = 0; i < POTS_PER_ROOM; i++) {
    const q = potAt(i), p = room.pots[i], isWet = !p || M.isWet(w, st, ri, p, now);
    if (p && !isWet) dry.push(i);
    drawPot(g, q.x, q.y, skin, 1.5, gk);
    if (V.hover === i) { g.fillStyle = 'rgba(255,255,255,0.22)'; g.fillRect(q.x - 3, q.y - 54, q.w + 6, q.h + 60); }
    if (!p) continue;
    const sp = w.species(p.sp), stage = M.stage(w, p);
    if (p.wig > 0) p.wig = Math.max(0, p.wig - dt * 2.2);
    drawPlant(g, q.cx, q.y + 5, sp, stage, tsec, 1.9, p.wig, night);
    const s = M.stats(w, st, ri, i);
    /* what is helping the plant (and that it is thirsty) sits in a little plate at the foot of its pot, not up in the air over the
       leaves: one pip a helper, centred on the pot, and a sand-coloured hollow one at the end when the plant is dry */
    const pips = s.tags.map(pipColour);
    if (!isWet) pips.push(null);
    if (pips.length) {
      const pw = pips.length * 6 + 1, px = q.x + ((q.w - pw) >> 1), py = q.y + q.h - 11;
      g.fillStyle = 'rgba(8,6,2,0.62)'; g.fillRect(px, py, pw, 7);
      pips.forEach((c, k) => {
        if (c) { g.fillStyle = c; g.fillRect(px + 1 + k * 6, py + 2, 4, 4); return; }
        g.fillStyle = '#e8d496'; g.fillRect(px + 1 + k * 6, py + 2, 4, 4);
        g.fillStyle = '#5a4a28'; g.fillRect(px + 2 + k * 6, py + 3, 2, 2);
      });
    }
    const n = p.tok || 0, shown = Math.min(n, 6);
    for (let k = 0; k < shown; k++) drawSunToken(g, q.x + 4 + k * 9, q.y + q.h + 4 + Math.round(Math.sin(tsec * 3 + k) * 1.5), 9);
    if (n > shown) { g.fillStyle = '#fff4a0'; g.font = '12px "VT323", monospace'; g.fillText('+' + (n - shown), q.x + 4 + shown * 9, q.y + q.h + 14); }
  }
  return dry;
}

function air(g, V, gk, night) {
  const { motes, flies, leaves, pops } = V.amb, { dt, tsec } = V;
  if (night) {
    flies.forEach(f => {
      f.p += dt * 1.4;
      const x = f.x + Math.cos(f.p) * f.r, y = f.y + Math.sin(f.p * 1.3) * f.r * 0.5, a = 0.35 + 0.65 * Math.abs(Math.sin(f.p * 0.7));
      g.fillStyle = 'rgba(180,255,120,' + a.toFixed(2) + ')'; g.fillRect(Math.round(x), Math.round(y), 2, 2);
      g.fillStyle = 'rgba(180,255,120,' + (a * 0.25).toFixed(2) + ')'; g.fillRect(Math.round(x) - 2, Math.round(y) - 2, 6, 6);
    });
  } else {
    motes.forEach(m => {
      m.x += m.v * 0.6; m.y += Math.sin(tsec * 0.7 + m.s) * 0.18;
      if (m.x > W) { m.x = -4; m.y = Math.random() * H; }
      g.fillStyle = 'rgba(255,248,214,0.5)'; g.fillRect(Math.round(m.x), Math.round(m.y), 2, 2);
    });
  }
  if (leaves.length < 2 && Math.random() < 0.004) leaves.push({ x: -12, y: 60 + Math.random() * 240, r: 0, v: 24 + Math.random() * 30 });
  for (let i = leaves.length - 1; i >= 0; i--) {
    const L = leaves[i];
    L.x += L.v * dt; L.y += Math.sin(L.x * 0.02) * 12 * dt; L.r += dt * 2.4;
    if (L.x > W + 20) { leaves.splice(i, 1); continue; }
    const wd = Math.abs(Math.cos(L.r)) * 7 + 2;
    g.fillStyle = dimCol('#b8783a', gk); g.fillRect(Math.round(L.x), Math.round(L.y), Math.round(wd), 4);
    g.fillStyle = dimCol('#d89a52', gk); g.fillRect(Math.round(L.x), Math.round(L.y), Math.round(wd), 1);
  }
  for (let i = pops.length - 1; i >= 0; i--) {
    const p = pops[i];
    p.t += dt;
    if (p.t > 1.1) { pops.splice(i, 1); continue; }
    g.fillStyle = 'rgba(255,244,140,' + (1 - p.t / 1.1).toFixed(2) + ')';
    g.font = '16px "VT323", monospace';
    g.fillText('+' + p.n + (p.x2 ? '  x' + p.x2.toFixed(2) : ''), p.x, p.y - p.t * 26);
  }
}

function tabs(g, V) {
  g.textAlign = 'center';
  ROOM_DEFS.forEach((rd, i) => {
    const t = roomTabAt(i), room = V.st.rooms[i], active = i === V.st.active;
    g.fillStyle = active ? 'rgba(255,244,140,0.94)' : room.unlocked ? 'rgba(10,10,10,0.68)' : 'rgba(10,10,10,0.42)';
    g.fillRect(t.x, t.y, t.w, t.h);
    g.strokeStyle = active ? '#fff4a0' : room.unlocked ? '#cfcfcf' : '#888888';
    g.lineWidth = 1; g.strokeRect(t.x + 0.5, t.y + 0.5, t.w - 1, t.h - 1);
    g.fillStyle = active ? '#3a2c08' : room.unlocked ? '#e8e2d4' : '#e0e0e0';
    g.font = '10px monospace';
    g.fillText(room.unlocked ? rd.name : (rd.price + ' SUN'), t.x + t.w / 2, t.y + 14);
    if (room.unlocked && room.drip) { g.fillStyle = active ? '#2a5a98' : '#6aa8e8'; g.fillRect(t.x + t.w - 6, t.y + 3, 3, 3); }
    if (room.unlocked && V.st.up.gather && M.tokens(room) >= M.cap(V.st) * 0.5) { g.fillStyle = '#ffd84a'; g.fillRect(t.x + 3, t.y + 3, 3, 3); }
  });
  g.textAlign = 'left';
}

/* returns the list of dry pots, for the line under the garden */
export function paint(g, V) {
  const { st, now, light, night } = V, rd = ROOM_DEFS[st.active];
  g.drawImage(gardenSky(W, H, light), 0, 0);
  if (V.flyover) { V.flyover.step(V.dt); V.flyover.draw(g); }        /* Thea's geese, now and then, over the sky and under everything else */
  const gk = 0.35 + light * 0.65;
  ground(g, gk, V);
  const dry = potsAndPlants(g, V, gk, night);
  air(g, V, gk, night);
  if (night) {
    const a = rd.buff.night ? Math.max(0.3, (0.34 - light) / 0.34 * 0.45) : (0.34 - light) / 0.34 * 0.45;
    g.fillStyle = 'rgba(6,8,24,' + Math.max(0, a).toFixed(2) + ')'; g.fillRect(0, 0, W, H);
  }
  drawRoomEffects(g, W, H, rd.id, V.tsec, V.dt);
  if (rd.tint) { g.fillStyle = rd.tint; g.fillRect(0, 0, W, H); }
  tabs(g, V);
  void now;
  return dry;
}
