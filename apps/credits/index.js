/* CREDITS.EXE -- the credit screen, opened by CREDITS in the terminal. The creator stands in the middle, in a halo of
   light; the three playtesters stand in a row along the bottom, each with a cross behind. Four portraits, pressed to
   the sixteen colours (assets/credits/, made by scripts/make-credit-art.py). The canvas is fixed and fits the window
   in whole pixels (kernel/canvas_fit.js). Where each stands comes from the size of its picture (layout.js), so a wider
   crop at 96 or 128 pixels is simply drawn at the multiple that suits its box. */
import { INK, PAL_CSS, sky, cross } from './draw.js';
import { W, H, CAST, place, haloOf, crossOf, wordsOf } from './layout.js';

const load = id => new Promise(done => {
  const im = new Image();
  im.onload = () => done(im);
  im.onerror = () => done(null);
  im.src = 'assets/credits/' + id + '.png';
});

let live = null;                                                  /* the one open window's token: a picture that arrives after the window closed is not drawn */

export default {
  id: 'credits',
  title: 'CREDITS.EXE',
  width: 700,
  height: 640,
  resizable: true,
  fluid: true,
  mount(root, ctx) {
    root.style.background = '#000000';
    root.style.display = 'flex';
    root.style.alignItems = 'center';
    root.style.justifyContent = 'center';
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    cv.dataset.fit = 'int';                       /* the window manager fits the picture to the pane (kernel/canvas_fit.js) */
    cv.style.imageRendering = 'pixelated';
    root.appendChild(cv);
    const g = cv.getContext('2d');
    g.imageSmoothingEnabled = false;
    const font = px => px + 'px VT323, monospace';
    const me = live = {};

    /* the pictures first (their sizes decide where everything stands), then the ground and the light, the crosses behind the playtesters, the portraits, the words */
    Promise.all(CAST.map(c => load(c.id))).then(ims => {
      if (live !== me) return;
      const sizes = {};
      CAST.forEach((c, i) => { if (ims[i]) sizes[c.id] = [ims[i].naturalWidth, ims[i].naturalHeight]; });
      const at = place(sizes);
      sky(g, haloOf(at.teiteotei));
      CAST.slice(1).forEach(c => { const x = crossOf(at[c.id]); cross(g, x.cx, x.top, x.height, x.armW, x.armY); });
      g.textAlign = 'center';
      g.font = font(26); g.fillStyle = PAL_CSS(INK.yellow);
      g.fillText('CREDITS', W / 2, 26);
      CAST.forEach((c, i) => {
        const p = at[c.id];
        if (ims[i]) g.drawImage(ims[i], p.x, p.y, p.w, p.h);                     /* a whole multiple of its pixels, never smoothed */
        wordsOf(p).forEach(w => { g.font = font(w.px); g.fillStyle = PAL_CSS(INK[w.ink]); g.fillText(w.t, p.cx, w.y); });
      });
    });
  },
  unmount() { live = null; }
};
