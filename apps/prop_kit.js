/* How a game lists its props: the pictures it is made of, as files. `apps/<id>/props.js` exports { NAME, FOLDER, props }, where `props()` answers a list of
     prop(name, w, h, draw, k)   a picture: `draw(g)` paints it on a w x h canvas (1:1, nothing blended); `k` is a whole-number enlargement the exporter applies,
                                 nearest-neighbour, so a ten-pixel sprite is a usable image and not a speck
     doc(name, text)             a text file (a README, a program)
   and kernel/trophy_props.js is what turns that list into the folder a mastered game leaves on the desktop. One prop that will not draw is left out, never allowed to
   take the rest with it. Everything here is browser-side (it makes canvases); the lists themselves are plain data. */
export const prop = (name, w, h, draw, k, o) => Object.assign({ name: name, w: w, h: h, draw: draw, k: k || 1 }, o || {});   /* o: { trim: true } crops to what was drawn */
export const doc = (name, text) => ({ name: name, text: text });
export const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; return [c, g]; };
/* a name for a file: capitals, no spaces */
export const fname = s => String(s).toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '');
/* draw a list into canvases: [{ name, canvas }] and [{ name, text }] */
export async function render(list) {
  const out = [];
  for (const p of list) {
    try {
      if (p.text != null) { out.push({ name: p.name, text: p.text }); continue; }
      const k = Math.max(1, p.k | 0);
      let [c, g] = canvas(p.w, p.h), w = p.w, h = p.h;
      p.draw(g);
      if (p.trim) {
        const d = g.getImageData(0, 0, w, h).data; let x0 = w, y0 = h, x1 = -1, y1 = -1;
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 8) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
        if (x1 >= x0) { const m = 2, nx = Math.max(0, x0 - m), ny = Math.max(0, y0 - m), nw = Math.min(w, x1 + m + 1) - nx, nh = Math.min(h, y1 + m + 1) - ny; const [t, tg] = canvas(nw, nh); tg.drawImage(c, nx, ny, nw, nh, 0, 0, nw, nh); c = t; w = nw; h = nh; }
      }
      if (k === 1) { out.push({ name: p.name + '.PNG', canvas: c }); continue; }
      const [big, bg] = canvas(w * k, h * k); bg.drawImage(c, 0, 0, w * k, h * k);
      out.push({ name: p.name + '.PNG', canvas: big });
    } catch (e) { /* a prop that will not draw is left out */ }
  }
  return out;
}
