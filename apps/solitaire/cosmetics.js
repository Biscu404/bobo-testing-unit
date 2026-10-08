/* What Solitaire's trophies give you (the list of trophies is trophies.js; this is what each one hands over). Every one of the fourteen is a thing for the table: a card
   back, a table to play on, or a way for a win to end. They are not for sale: Dave's SOLITAIRE shelf shows them (`earn` is the trophy that opens it), and the game wears
   whichever you pick. Pure: drawing is on a 2D context handed in, nothing here touches the DOM or the machine, so `node apps/solitaire/cosmetics_check.js` can hold it. */

export const BASE_BACKS = [{ id: 'hex', name: 'HEXTECH' }, { id: 'silk', name: 'SILK' }, { id: 'rune', name: 'RUNE' }];

/* sub: back | table | win. earn: the trophy (apps/solitaire/trophies.js) that gives it. */
export const ITEMS = [
  { id: 'back_blood', sub: 'back', name: 'BLOODMOON', earn: 'sol_first', blurb: 'A red moon over a dark deck. First blood.' },
  { id: 'back_crown', sub: 'back', name: 'THE CROWN', earn: 'sol_chall', blurb: 'Gold on navy. Forty wins earns the right to wear it.' },
  { id: 'back_arrow', sub: 'back', name: 'ONE PASS', earn: 'sol_onepass', blurb: 'A single arrow. Never go round twice.' },
  { id: 'back_skins', sub: 'back', name: 'SKINSHEET', earn: 'sol_skins', blurb: 'All three backs, stitched into one.' },
  { id: 'table_iron', sub: 'table', name: 'IRON PLATE', earn: 'sol_iron', blurb: 'Riveted grey plate. Heavy. Quiet.' },
  { id: 'table_blueprint', sub: 'table', name: 'BLUEPRINT', earn: 'sol_tight', blurb: 'A cyan grid. Every move measured.' },
  { id: 'table_rift', sub: 'table', name: 'THE RIFT', earn: 'sol_team', blurb: 'Three lanes of green water and a river down the middle.' },
  { id: 'table_lanes', sub: 'table', name: 'THREE LANES', earn: 'sol_lane', blurb: 'The map, from above, in the colours of the four lanes.' },
  { id: 'table_void', sub: 'table', name: 'THE VOID', earn: 'sol_auto', blurb: 'Deep violet and slow stars. The board plays itself from here.' },
  { id: 'win_gold', sub: 'win', name: 'GOLD RUSH', earn: 'sol_gold', blurb: 'The cards leave in a spray of gold.' },
  { id: 'win_spiral', sub: 'win', name: 'CLEAN SPIRAL', earn: 'sol_clean', blurb: 'The deck winds out of the middle of the table.' },
  { id: 'win_flash', sub: 'win', name: 'FLASHBANG', earn: 'sol_flash', blurb: 'A white flash, and the cards burst out of it.' },
  { id: 'win_fountain', sub: 'win', name: 'FOUNTAIN', earn: 'sol_spree', blurb: 'Four fountains, one for each lane.' },
  { id: 'win_heavy', sub: 'win', name: 'HEAVY CARDS', earn: 'sol_bounce', blurb: 'The cards fall straight down and stay where they land.' }
];
export const bySub = sub => ITEMS.filter(i => i.sub === sub);

/* ---- the backs: base colour, then the art inside the border (clipped to the inner rectangle by the caller) ---------------- */
export const BACK_BASE = { hex: '#16283c', silk: '#2a2030', rune: '#20261c', back_blood: '#2a0a0e', back_crown: '#101830', back_arrow: '#1c2418', back_skins: '#14141c' };
export function drawBackArt(g, id, x, y, CW, CH) {
  const R = (a, b, w, h, c) => { g.fillStyle = c; g.fillRect(x + a, y + b, w, h); };
  if (id === 'back_blood') {
    g.strokeStyle = '#5a1018';
    for (let i = 1; i < 6; i++) { g.beginPath(); g.arc(x + CW / 2, y + CH / 2, 8 + i * 8, 0, 7); g.stroke(); }
    g.fillStyle = '#c8283c'; g.beginPath(); g.arc(x + CW / 2, y + CH / 2, 17, 0, 7); g.fill();
    g.fillStyle = '#2a0a0e'; g.beginPath(); g.arc(x + CW / 2 + 7, y + CH / 2 - 4, 15, 0, 7); g.fill();
  } else if (id === 'back_crown') {
    g.strokeStyle = 'rgba(232,194,71,0.25)';
    for (let i = -CH; i < CW; i += 10) { g.beginPath(); g.moveTo(x + i, y + CH); g.lineTo(x + i + CH, y); g.stroke(); }
    g.fillStyle = '#e8c247';
    g.beginPath(); g.moveTo(x + 18, y + 70); g.lineTo(x + 18, y + 42); g.lineTo(x + 30, y + 54); g.lineTo(x + 40, y + 36); g.lineTo(x + 50, y + 54);
    g.lineTo(x + 62, y + 42); g.lineTo(x + 62, y + 70); g.closePath(); g.fill();
    R(18, 72, 44, 6, '#b8860b'); R(26, 58, 4, 4, '#c8283c'); R(38, 52, 4, 4, '#55c8ff'); R(50, 58, 4, 4, '#c8283c');
  } else if (id === 'back_arrow') {
    R(0, 0, CW, CH, '#1c2418');
    g.fillStyle = '#c8d86a';
    g.beginPath(); g.moveTo(x + CW / 2, y + 22); g.lineTo(x + CW / 2 + 20, y + 52); g.lineTo(x + CW / 2 + 8, y + 52); g.lineTo(x + CW / 2 + 8, y + 92); g.lineTo(x + CW / 2 - 8, y + 92); g.lineTo(x + CW / 2 - 8, y + 52); g.lineTo(x + CW / 2 - 20, y + 52); g.closePath(); g.fill();
  } else if (id === 'back_skins') {
    const w = Math.ceil(CW / 3);
    ['hex', 'silk', 'rune'].forEach((b, i) => { g.save(); g.beginPath(); g.rect(x + i * w, y, w, CH); g.clip(); g.fillStyle = BACK_BASE[b]; g.fillRect(x + i * w, y, w, CH); drawBackArt(g, b, x, y, CW, CH); g.restore(); });
  }
}

/* ---- the tables ---------------------------------------------------------------------------------------------------------------- */
export const TABLE_BASE = { slate: '#0f1218' };
export function drawTable(g, id, W, H, t) {
  t = t || 0;
  const F = (c, x, y, w, h) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
  if (id === 'table_iron') {
    F('#14161a', 0, 0, W, H);
    for (let y = 0; y < H; y += 96) for (let x = 0; x < W; x += 96) {
      F('#1c1f25', x + 2, y + 2, 92, 92); F('#0e0f12', x, y, 96, 2); F('#0e0f12', x, y, 2, 96);
      [[8, 8], [82, 8], [8, 82], [82, 82]].forEach(p => { F('#2a2e36', x + p[0], y + p[1], 5, 5); F('#08090b', x + p[0] + 3, y + p[1] + 3, 2, 2); });
    }
  } else if (id === 'table_blueprint') {
    F('#06223a', 0, 0, W, H);
    for (let x = 0; x < W; x += 16) F(x % 64 ? 'rgba(90,200,255,0.12)' : 'rgba(90,200,255,0.3)', x, 0, 1, H);
    for (let y = 0; y < H; y += 16) F(y % 64 ? 'rgba(90,200,255,0.12)' : 'rgba(90,200,255,0.3)', 0, y, W, 1);
    g.strokeStyle = 'rgba(90,200,255,0.35)'; g.strokeRect(6, 6, W - 12, H - 12);
  } else if (id === 'table_rift') {
    F('#0b1f1a', 0, 0, W, H);
    F('rgba(30,110,120,0.35)', 0, H / 2 - 30 + Math.round(Math.sin(t / 40) * 3), W, 60);
    for (let i = 0; i < 3; i++) F('rgba(120,200,120,0.06)', 0, 40 + i * 190, W, 90);
    for (let x = 0; x < W; x += 48) F('rgba(255,255,255,0.025)', x, 0, 2, H);
  } else if (id === 'table_lanes') {
    F('#0f1218', 0, 0, W, H);
    const c = ['rgba(200,40,60,0.10)', 'rgba(196,80,28,0.10)', 'rgba(63,106,158,0.10)', 'rgba(74,48,96,0.16)'];
    for (let i = 0; i < 4; i++) F(c[i], 434 + i * 108 - 6, 0, 92, H);
    for (let x = 0; x < 432; x += 108) F('rgba(255,255,255,0.025)', x + 8, 0, 92, H);
  } else if (id === 'table_void') {
    F('#07030f', 0, 0, W, H);
    F('rgba(110,60,190,' + (0.10 + 0.04 * Math.sin(t / 60)) + ')', 0, H * 0.35, W, H * 0.3);
    let s = 7; for (let i = 0; i < 90; i++) { s = (s * 1103515245 + 12345) & 0x7fffffff; const x = s % W; s = (s * 1103515245 + 12345) & 0x7fffffff; const y = s % H; F((i + Math.floor(t / 30)) % 7 ? '#8a7ad0' : '#ffffff', x, y, 2, 2); }
  } else return false;
  return true;
}
export function drawSlate(g, W, H) {
  g.fillStyle = '#0f1218'; g.fillRect(0, 0, W, H);
  g.fillStyle = '#131722'; for (let y = 0; y < H; y += 8) g.fillRect(0, y, W, 1);
  g.fillStyle = 'rgba(60,90,140,0.05)'; for (let x = 0; x < W; x += 64) g.fillRect(x, 0, 32, H);
}

/* ---- the ends of a win. A card is { x, y, vx, vy, age, live }; launch sets it off, step moves it and says if it is still on the glass ------------ */
export const WIN_FX = {
  win_gold: {
    launch: b => { b.vx = (Math.random() < 0.5 ? -1 : 1) * (1 + Math.random() * 4); b.vy = -(8 + Math.random() * 5); },
    step: (b, W, H) => { b.vy += 0.35; b.x += b.vx; b.y += b.vy; return b.y < H + 20 && b.x > -90 && b.x < W + 10; },
    deco: (g, b) => { g.fillStyle = (b.age >> 2) % 2 ? '#ffd68c' : '#e8c247'; g.fillRect(Math.round(b.x + 40 + Math.sin(b.age) * 30), Math.round(b.y + 56 + Math.cos(b.age * 0.7) * 30), 4, 4); }
  },
  win_spiral: {
    launch: (b, i, n, W, H) => { b.a = i * 0.45; b.r = 0; b.cx = W / 2; b.cy = H / 2; },
    step: (b, W, H) => { b.a += 0.1; b.r += 2.6; b.x = b.cx + Math.cos(b.a) * b.r - 40; b.y = b.cy + Math.sin(b.a) * b.r * 0.7 - 56; return b.r < W * 0.75; }
  },
  win_flash: {
    launch: (b, i, n) => { const a = (i / n) * Math.PI * 2 + Math.random() * 0.3; b.vx = Math.cos(a) * (7 + Math.random() * 4); b.vy = Math.sin(a) * (6 + Math.random() * 3); b.x = 400; b.y = 250; },
    step: (b, W, H) => { b.x += b.vx; b.y += b.vy; return b.x > -90 && b.x < W + 10 && b.y > -130 && b.y < H + 20; },
    overlay: (g, W, H, age) => { if (age < 14) { g.fillStyle = 'rgba(255,255,255,' + (0.9 * (1 - age / 14)).toFixed(2) + ')'; g.fillRect(0, 0, W, H); } }
  },
  win_fountain: {
    launch: b => { b.vx = (Math.random() - 0.5) * 3; b.vy = -(13 + Math.random() * 4); },
    step: (b, W, H) => { b.vy += 0.5; b.x += b.vx; b.y += b.vy; return b.y < H + 20; }
  },
  win_heavy: {
    launch: b => { b.vx = (Math.random() - 0.5) * 1.4; b.vy = 0; b.rest = 0; },
    step: (b, W, H) => {
      b.vy += 0.6; b.x += b.vx; b.y += b.vy;
      const floor = H - 112 - (b.slot || 0);
      if (b.y > floor) { b.y = floor; b.vy = -b.vy * 0.15; b.vx *= 0.6; if (Math.abs(b.vy) < 0.9) { b.vy = 0; b.rest++; } }
      return b.rest < 240;
    }
  }
};
export const winFx = id => WIN_FX[id] || null;
