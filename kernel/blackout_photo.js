/* The pictures behind the hallucinations: real photographs, pressed down to the
   sixteen colours and dithered, 320 pixels wide (assets/blackout/*.png, made by
   scripts/make-blackout-art.py). Each is taller than the screen, so the screen drifts
   up and down it while it is on: the second column is the highest the view may sit,
   the third the lowest. Pixels are never resampled, only moved by whole rows. */
import { W, H } from './blackout_draw.js';

const FILES = {
  city: ['assets/blackout/city.png', 10, 37],
  park: ['assets/blackout/park.png', 10, 50],
  boulder: ['assets/blackout/boulder.png', 40, 91],
  cd: ['assets/blackout/cd.png', 0, 1],
  turtle: ['assets/blackout/turtle.png', 0, 0],
  lol: ['assets/blackout/lol.png', 0, 0],
  ultrakill: ['assets/blackout/ultrakill.png', 0, 0]
};
const BANK = {};

export const hasPhoto = id => !!BANK[id];

/* started the moment the lights begin to go; the first picture is a couple of seconds away */
export function loadPhotos() {
  return Promise.all(Object.keys(FILES).map(id => BANK[id] || new Promise(done => {
    const [src, lo, hi] = FILES[id], im = new Image();
    im.onload = () => {
      const cv = document.createElement('canvas');
      cv.width = im.naturalWidth; cv.height = im.naturalHeight;
      const g = cv.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(im, 0, 0);
      BANK[id] = { cv, lo: Math.min(lo, cv.height - H), hi: Math.min(hi, cv.height - H) };
      done();
    };
    im.onerror = () => done();
    im.src = src;
  })));
}

export function photo(g, id, t) {
  g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  const p = BANK[id];
  if (!p) return;
  const y0 = Math.round(p.lo + (p.hi - p.lo) * (0.5 + 0.5 * Math.sin(t * 1.3)));
  g.drawImage(p.cv, 0, -y0);
}
