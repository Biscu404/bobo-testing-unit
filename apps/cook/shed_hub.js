/* The inside of the shed, and the blueprint that lists the boards (the two screens of the shed tab that are not the puzzle itself). The shed is a wall of planks with the things in it you can click:
   the blueprint (it opens the list), a calendar that stopped, the keys of the car, a radio with one station, a plant called Gary, and Jesse, who talks. On the bench are the parts you have
   handed in, one for each board you have cleared. Everything is the sixteen colours except his face (jesse_ec.js). Pure drawing, handed the Cook's painters. */
import { drawJesseEC } from './jesse_ec.js';
import { PARTS, blit } from './shed_art.js';

export const SPOTS = [
  { id: 'jesse', name: 'JESSE', x: 262, y: 70, w: 150, h: 150 },
  { id: 'blueprint', name: 'THE BLUEPRINT', x: 18, y: 22, w: 138, h: 104 },
  { id: 'calendar', name: 'THE CALENDAR', x: 168, y: 26, w: 46, h: 58 },
  { id: 'keys', name: 'THE KEYS', x: 222, y: 30, w: 30, h: 46 },
  { id: 'radio', name: 'THE RADIO', x: 158, y: 96, w: 70, h: 40 },
  { id: 'plant', name: 'GARY', x: 24, y: 166, w: 48, h: 54 }
];
export const spotAt = (mx, my) => { for (let i = SPOTS.length - 1; i >= 0; i--) { const p = SPOTS[i]; if (mx >= p.x && mx < p.x + p.w && my >= p.y && my < p.y + p.h) return p; } return null; };
/* the boards on the blueprint: two rows of five, and where each square is */
export const slotAt = i => ({ x: 30 + (i % 5) * 72, y: 62 + Math.floor(i / 5) * 92, w: 66, h: 76 });
export const slotHit = (mx, my, n) => { for (let i = 0; i < n; i++) { const s = slotAt(i); if (mx >= s.x && mx < s.x + s.w && my >= s.y && my < s.y + s.h) return i; } return -1; };

export function createHub(P) {
  const { R, wash, txt, g } = P;
  const hash = (a, b) => { let h = (a * 374761393 + b * 668265263) >>> 0; h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

  function room(t, flick) {
    /* the wall: planks, a joint every so often, a knot or two */
    R(0, 0, 420, 214, 6);
    for (let i = 0; i < 30; i++) { R(i * 14, 0, 1, 214, 0); }
    for (let i = 0; i < 30; i++) for (let k = 0; k < 4; k++) { const y = Math.floor(hash(i, k) * 200); R(i * 14 + 1, y, 13, 1, 0); }
    wash(0, 0, 420, 214, 0, 3);
    for (let i = 0; i < 9; i++) { const x = Math.floor(hash(i, 40) * 400), y = 10 + Math.floor(hash(i, 41) * 190); R(x, y, 4, 3, 0); R(x + 1, y + 1, 2, 1, 8); }
    /* the floor */
    R(0, 214, 420, 106, 8); wash(0, 214, 420, 106, 0, 6);
    for (let i = 0; i < 9; i++) R(0, 214 + i * 13, 420, 1, 0);
    R(0, 212, 420, 3, 0);
    /* the light that hangs from a wire and does not quite make up its mind */
    R(209, 0, 2, 22, 0);
    R(204, 22, 12, 8, 7); R(206, 30, 8, 5, flick ? 14 : 6);
    wash(0, 0, 420, 214, 14, flick ? 2 : 1);
  }
  function blueprint(hot) {
    const p = SPOTS[1];
    R(p.x - 2, p.y - 2, p.w + 4, p.h + 4, 0);
    R(p.x, p.y, p.w, p.h, 1);
    for (let i = 1; i < 7; i++) R(p.x + i * 20, p.y, 1, p.h, 9);
    for (let i = 1; i < 5; i++) R(p.x, p.y + i * 20, p.w, 1, 9);
    R(p.x + 14, p.y + 54, 36, 30, 15); R(p.x + 18, p.y + 58, 28, 22, 1);                 /* a drawing of the shed */
    R(p.x + 56, p.y + 68, 40, 2, 15); R(p.x + 92, p.y + 64, 2, 10, 15);
    for (let i = 0; i < 5; i++) R(p.x + 60 + i * 14, p.y + 30 + (i % 2) * 6, 8, 8, 15);   /* boxes with arrows between them */
    R(p.x + 68, p.y + 34, 6, 1, 15); R(p.x + 82, p.y + 40, 6, 1, 15);
    txt('THE BACKYARD', p.x + 8, p.y + 6, 15, 'bold 10px monospace'); txt('PROJECT', p.x + 8, p.y + 18, 15, 'bold 10px monospace');
    [[2, 2], [p.w - 6, 2], [2, p.h - 6], [p.w - 6, p.h - 6]].forEach(([dx, dy]) => { R(p.x + dx, p.y + dy, 4, 4, 12); R(p.x + dx + 1, p.y + dy + 1, 1, 1, 15); });
    if (hot) { R(p.x - 4, p.y - 4, p.w + 8, 2, 14); R(p.x - 4, p.y + p.h + 2, p.w + 8, 2, 14); R(p.x - 4, p.y - 4, 2, p.h + 8, 14); R(p.x + p.w + 2, p.y - 4, 2, p.h + 8, 14); }
  }
  function calendar(hot) {
    const p = SPOTS[2];
    R(p.x - 1, p.y - 1, p.w + 2, p.h + 2, 0); R(p.x, p.y, p.w, p.h, 15); R(p.x, p.y, p.w, 12, 4);
    txt('JUNE', p.x + p.w / 2, p.y + 1, 15, 'bold 9px monospace', 'center');
    for (let j = 0; j < 4; j++) for (let i = 0; i < 5; i++) { R(p.x + 4 + i * 8, p.y + 17 + j * 9, 6, 6, 7); if (hash(i, j) < 0.2) R(p.x + 5 + i * 8, p.y + 18 + j * 9, 4, 4, 4); }
    R(p.x + 4 + 2 * 8 - 1, p.y + 17 + 2 * 9 - 1, 8, 8, 0); R(p.x + 4 + 2 * 8, p.y + 17 + 2 * 9, 6, 6, 14);
    if (hot) { R(p.x - 4, p.y - 4, p.w + 8, 2, 14); R(p.x - 4, p.y + p.h + 2, p.w + 8, 2, 14); R(p.x - 4, p.y - 4, 2, p.h + 8, 14); R(p.x + p.w + 2, p.y - 4, 2, p.h + 8, 14); }
  }
  function keys(hot) {
    const p = SPOTS[3];
    R(p.x + 12, p.y, 6, 6, 8); R(p.x + 14, p.y + 4, 2, 6, 7);
    R(p.x + 8, p.y + 10, 14, 14, 7); R(p.x + 10, p.y + 12, 10, 10, 6);               /* the ring */
    R(p.x + 2, p.y + 24, 8, 4, 14); R(p.x + 8, p.y + 26, 18, 3, 14); R(p.x + 22, p.y + 24, 4, 6, 14);   /* a key */
    R(p.x + 12, p.y + 28, 8, 12, 0); R(p.x + 13, p.y + 29, 6, 4, 4); txt('EC', p.x + 16, p.y + 34, 15, 'bold 8px monospace', 'center');
    if (hot) { R(p.x - 4, p.y - 4, p.w + 8, 2, 14); R(p.x - 4, p.y + p.h + 2, p.w + 8, 2, 14); R(p.x - 4, p.y - 4, 2, p.h + 8, 14); R(p.x + p.w + 2, p.y - 4, 2, p.h + 8, 14); }
  }
  function radio(hot, on, t) {
    const p = SPOTS[4];
    R(p.x - 8, p.y + 38, p.w + 16, 5, 0); R(p.x - 8, p.y + 38, p.w + 16, 2, 6);        /* the shelf */
    R(p.x, p.y + 6, p.w, 32, 0); R(p.x + 2, p.y + 8, p.w - 4, 28, 6); R(p.x + 2, p.y + 8, p.w - 4, 2, 14);
    R(p.x + 6, p.y + 14, 30, 18, 0); for (let i = 0; i < 6; i++) R(p.x + 8, p.y + 16 + i * 3, 26, 1, 8);   /* the speaker */
    R(p.x + 42, p.y + 14, 20, 6, 0); R(p.x + 44, p.y + 16, 16, 2, on ? 14 : 8); R(p.x + 44 + Math.floor(((t * 7) % 12)), p.y + 14, 2, 6, on ? 12 : 4);
    R(p.x + 44, p.y + 24, 6, 6, 7); R(p.x + 54, p.y + 24, 6, 6, 7);
    R(p.x + 56, p.y - 6, 1, 14, 7); R(p.x + 56, p.y - 8, 4, 2, 7);                    /* the aerial */
    if (on) for (let k = 0; k < 3; k++) wash(p.x - 6 - k * 5, p.y + 8, 5, 28, 14, 3 - k);
    if (hot) { R(p.x - 4, p.y - 10, p.w + 8, 2, 14); R(p.x - 4, p.y + 44, p.w + 8, 2, 14); R(p.x - 4, p.y - 10, 2, 56, 14); R(p.x + p.w + 2, p.y - 10, 2, 56, 14); }
  }
  function plant(hot, t) {
    const p = SPOTS[5], sway = Math.floor(Math.sin(t * 0.9) * 1.4);
    R(p.x + 8, p.y + 26, 32, 28, 6); R(p.x + 6, p.y + 24, 36, 5, 4); R(p.x + 8, p.y + 26, 32, 2, 12); R(p.x + 10, p.y + 52, 28, 2, 0);
    R(p.x + 22, p.y + 8, 3, 18, 2);
    R(p.x + 12 + sway, p.y + 10, 12, 4, 2); R(p.x + 8 + sway, p.y + 14, 8, 4, 2); R(p.x + 25 + sway, p.y + 6, 12, 4, 2); R(p.x + 33 + sway, p.y + 10, 8, 6, 2);
    R(p.x + 16 + sway, p.y + 8, 6, 2, 10); R(p.x + 28 + sway, p.y + 4, 6, 2, 10);
    R(p.x + 30, p.y + 38, 1, 1, 0); R(p.x + 18, p.y + 36, 12, 8, 0); R(p.x + 20, p.y + 38, 8, 2, 7);   /* a face on the pot, for company */
    if (hot) { R(p.x - 4, p.y - 2, p.w + 8, 2, 14); R(p.x - 4, p.y + p.h + 2, p.w + 8, 2, 14); R(p.x - 4, p.y - 2, 2, p.h + 4, 14); R(p.x + p.w + 2, p.y - 2, 2, p.h + 4, 14); }
  }
  /* the bench along the bottom of the wall, and what has been handed in so far */
  function bench(done) {
    R(226, 214, 194, 14, 0); R(228, 216, 190, 8, 6); R(228, 216, 190, 2, 14); R(236, 228, 8, 40, 0); R(404, 228, 8, 40, 0);
    wash(226, 228, 194, 40, 0, 8);
    done.forEach((ix, k) => { if (k < 10) blit(R, PARTS[ix % PARTS.length], 236 + k * 18, 200, 2); });
    if (done.length >= 10) { R(300, 176, 30, 24, 13); R(304, 170, 22, 8, 15); R(310, 160, 10, 12, 14); txt('THE THING', 315, 156, 15, 'bold 9px monospace', 'center'); }
  }
  function jesse(mood, talk, bobY) {
    R(262, 210, 150, 4, 0);
    drawJesseEC(g(), 284, 74 + bobY, 7, mood, talk);
  }
  function draw(t, st) {
    const flick = !st.calm && (Math.sin(t * 17) > 0.9 || Math.sin(t * 3.1) > 0.97);
    room(t, !flick);
    blueprint(st.hot === 'blueprint'); calendar(st.hot === 'calendar'); keys(st.hot === 'keys'); radio(st.hot === 'radio', st.radio > 0, t); plant(st.hot === 'plant', t);
    bench(st.done);
    jesse(st.mood, st.talk, Math.round(Math.sin(t * 1.6) * 1));
    if (st.hot === 'jesse') { const p = SPOTS[0]; R(p.x, p.y + p.h - 2, p.w, 2, 14); }
  }
  /* the blueprint unrolled: ten squares, the boards on it, what you have done on each */
  function list(t, lv, bests, medals, names, sel) {
    R(0, 0, 420, 320, 0); wash(0, 0, 420, 320, 8, 3);
    R(14, 10, 392, 238, 1); for (let i = 1; i < 20; i++) R(14 + i * 20, 10, 1, 238, 9); for (let i = 1; i < 12; i++) R(14, 10 + i * 20, 392, 1, 9);
    R(14, 10, 392, 2, 15); R(14, 246, 392, 2, 15); R(14, 10, 2, 238, 15); R(404, 10, 2, 238, 15);
    txt('THE BACKYARD PROJECT', 210, 22, 15, 'bold 15px monospace', 'center');
    txt('parts in, neighbours out, nobody the wiser', 210, 42, 11, '10px monospace', 'center');
    names.forEach((nm, i) => {
      const s = slotAt(i), open = i + 1 <= lv, hv = sel === i && open, m = medals[i] || 0;
      R(s.x - 1, s.y - 1, s.w + 2, s.h + 2, hv ? 14 : open ? 15 : 7); R(s.x, s.y, s.w, s.h, 0); wash(s.x, s.y, s.w, s.h, 1, 4);
      if (!open) for (let k = 0; k < s.w; k += 8) { R(s.x + k, s.y, 4, 2, 0); R(s.x + k, s.y + s.h - 2, 4, 2, 0); }        /* a board that is not open yet is hollow and dashed */
      txt(String(i + 1).padStart(2, '0'), s.x + 6, s.y + 5, open ? 14 : 7, 'bold 14px monospace');
      if (open) {
        const words = nm.split(' ');
        let line = '', row = 0;
        words.forEach(w => { if ((line + ' ' + w).trim().length > 9) { txt(line, s.x + 6, s.y + 26 + row * 11, 15, '9px monospace'); row++; line = w; } else line = (line + ' ' + w).trim(); });
        txt(line, s.x + 6, s.y + 26 + row * 11, 15, '9px monospace');
        txt(bests[i] ? bests[i] + ' moves' : 'not yet', s.x + 6, s.y + 62, bests[i] ? 10 : 7, '9px monospace');
        [['C', 1, 10], ['P', 2, 14]].forEach((md, k) => { const mx = s.x + 40 + k * 12, my = s.y + 4, got = m & md[1]; R(mx, my, 10, 12, got ? md[2] : 0); R(mx, my, 10, 1, got ? 15 : 8); R(mx, my + 11, 10, 1, 8); R(mx, my, 1, 12, got ? 15 : 8); R(mx + 9, my, 1, 12, 8); txt(md[0], mx + 5, my + 2, got ? 0 : 8, 'bold 8px monospace', 'center'); });
      } else txt('?', s.x + s.w / 2, s.y + 30, 7, 'bold 22px monospace', 'center');
    });
    txt('click a square  ·  ESC back to the shed', 210, 235, 11, '10px monospace', 'center');
  }
  return { draw, list };
}
