/* CREDITS.EXE -- the credit screen, opened by CREDITS in the terminal. The creator stands in the middle, in a halo of
   light; the three playtesters stand in a row along the bottom, each with a cross behind. Four portraits, pressed to
   the sixteen colours (assets/credits/, made by scripts/make-credit-art.py). The canvas is fixed and fits the window
   in whole pixels (kernel/canvas_fit.js). */
import { W, H, TEMPLE, sky, cross, INK, PAL_CSS } from './draw.js';

/* the creator's portrait is the big one; the playtesters are in a row beneath, each two times its pixels */
const CAST = [
  { id: 'teiteotei', x: 224, y: 44, s: 3, name: 'TEITEOTEI', role: 'THE CREATOR' },
  { id: 'biscu',     x: 43,  y: 350, s: 2, name: 'BISCU' },
  { id: 'gheghe',    x: 256, y: 350, s: 2, name: 'GHEGHE' },
  { id: 'thea',      x: 469, y: 350, s: 2, name: 'THEA' }
];
const PORTRAIT = 64;

export default {
  id: 'credits',
  title: 'CREDITS.EXE',
  width: 700,
  height: 600,
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

    /* the ground and the light first, then the crosses behind the playtesters, then the portraits, then the words */
    sky(g, TEMPLE);
    CAST.slice(1).forEach(p => cross(g, p.x + PORTRAIT, p.y - 60, 198, 180, p.y - 28));
    const font = (px) => px + 'px VT323, monospace';
    g.textAlign = 'center';
    const words = () => {
      g.font = font(26); g.fillStyle = PAL_CSS(INK.yellow);
      g.fillText('CREDITS', W / 2, 26);
      CAST.forEach(p => {
        const cx = p.x + PORTRAIT * p.s / 2, below = p.y + PORTRAIT * p.s + 6;
        if (p.role) { g.font = font(26); g.fillStyle = PAL_CSS(INK.white); g.fillText(p.name, cx, below + 20); g.font = font(18); g.fillStyle = PAL_CSS(INK.yellow); g.fillText(p.role, cx, below + 38); }
        else { g.font = font(20); g.fillStyle = PAL_CSS(INK.white); g.fillText(p.name, cx, below + 20); }
      });
    };
    words();

    /* every portrait is drawn at a whole multiple of its pixels, never smoothed */
    Promise.all(CAST.map(p => new Promise(done => {
      const im = new Image();
      im.onload = () => { g.drawImage(im, p.x, p.y, PORTRAIT * p.s, PORTRAIT * p.s); done(); };
      im.onerror = () => done();
      im.src = 'assets/credits/' + p.id + '.png';
    })));
  },
  unmount() {}
};
