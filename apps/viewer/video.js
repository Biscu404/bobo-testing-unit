import { ditherVGA } from '../../kernel/imaging.js';

const VID = {
  maxDim: 320,   /* longest edge of the dithered picture */
  fps: 15        /* the tube is not going to do sixty */
};
const MODES = ['RGB', 'VGA16', 'GREEN'];

/* The video itself is only ever an offscreen decode source -- what's on
   screen is a canvas the frames get crushed onto, the same as any other
   picture on this machine. No native <video> element means no native
   player chrome either: no browser context menu, no picture-in-picture.
   Returns a function that stops it. */
export function playVideo(pane, bar, src) {
  pane.className = 'imgpane vidpane';
  const cv = document.createElement('canvas');
  cv.className = 'vidcv';
  const work = document.createElement('canvas');
  pane.appendChild(cv);

  const video = document.createElement('video');
  video.src = src;
  video.loop = true;
  video.muted = true;
  video.playsInline = true;
  video.setAttribute('playsinline', '');

  const mk = (label, fn) => {
    const b = document.createElement('button');
    b.className = 'appbtn';
    b.textContent = label;
    b.addEventListener('mousedown', ev => {
      ev.stopPropagation();
      if (window.Snd && window.Snd.click) window.Snd.click();
      fn(b);
    });
    bar.appendChild(b);
    return b;
  };
  const status = document.createElement('span');
  status.className = 'godword';

  let mode = 1;   /* 0 raw, 1 VGA16 dither, 2 mono phosphor */
  mk('PAUSE', b => {
    if (video.paused) { video.play().catch(() => {}); b.textContent = 'PAUSE'; }
    else { video.pause(); b.textContent = 'PLAY'; }
  });
  mk('DITHER: VGA16', b => {
    mode = (mode + 1) % 3;
    b.textContent = 'DITHER: ' + MODES[mode];
  });
  mk('LOOP', b => { video.loop = !video.loop; b.textContent = video.loop ? 'LOOP' : 'ONCE'; });
  bar.appendChild(status);

  let alive = true, raf = null;
  let sized = false;
  const size = () => {
    const W = video.videoWidth || 320, H = video.videoHeight || 240;
    const s = Math.min(1, VID.maxDim / Math.max(W, H));
    cv.width = work.width = Math.max(2, Math.round(W * s));
    cv.height = work.height = Math.max(2, Math.round(H * s));
    sized = true;
  };

  video.addEventListener('loadedmetadata', () => { size(); video.play().catch(() => {}); });
  video.addEventListener('error', () => {
    status.textContent = 'CANNOT DECODE THIS ONE';
    if (window.Snd && window.Snd.err) window.Snd.err();
  });

  let last = 0, frames = 0, fpsAt = 0, shown = 0;
  const tick = ts => {
    if (!alive || !document.body.contains(cv)) { alive = false; return; }
    raf = requestAnimationFrame(tick);
    if (!sized && video.videoWidth) size();
    if (!sized || video.readyState < 2) return;
    if (ts - last < 1000 / VID.fps) return;
    last = ts;
    const g = work.getContext('2d');
    const o = cv.getContext('2d');
    if (!g || !o) return;
    try { g.drawImage(video, 0, 0, work.width, work.height); }
    catch (e) { return; }
    if (mode === 1) {
      ditherVGA(g, work.width, work.height);
    } else if (mode === 2) {
      const id = g.getImageData(0, 0, work.width, work.height);
      const d = id.data;
      for (let i = 0; i < d.length; i += 4) {
        const y = (d[i] * 0.30 + d[i + 1] * 0.59 + d[i + 2] * 0.11);
        const q = y > 190 ? [85, 255, 85] : y > 120 ? [0, 170, 0] : y > 60 ? [0, 90, 0] : [0, 0, 0];
        d[i] = q[0]; d[i + 1] = q[1]; d[i + 2] = q[2];
      }
      g.putImageData(id, 0, 0);
    }
    o.drawImage(work, 0, 0);
    frames++;
    if (ts - fpsAt > 1000) { shown = frames; frames = 0; fpsAt = ts; }
    status.textContent = cv.width + 'x' + cv.height + '  ' + shown + ' FPS';
  };
  raf = requestAnimationFrame(tick);

  return () => {
    alive = false;
    if (raf) cancelAnimationFrame(raf);
    try { video.pause(); video.src = ''; } catch (e) {}
  };
}
