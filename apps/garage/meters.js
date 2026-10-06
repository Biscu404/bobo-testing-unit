/* Little level meters, drawn with fillRect. A meter is a canvas; what goes through it is a
   peak 0..1 (and the peak that was held), on a scale of dB so it reads the way an ear does. */
export const toDb = x => x <= 1e-5 ? -100 : 20 * Math.log10(x);
/* -60 dB at the bottom, 0 dBFS at the top */
const pos = x => Math.max(0, Math.min(1, (toDb(x) + 60) / 60));

export function vmeter(cv, peak, hold) {
  const g = cv.getContext('2d'), w = cv.width, h = cv.height;
  g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
  const y = pos(peak), hh = Math.round(h * y);
  for (let i = 0; i < hh; i += 3) {
    const f = i / h;
    g.fillStyle = f > 0.93 ? '#FF5555' : f > 0.75 ? '#FFFF55' : '#55FF55';
    g.fillRect(0, h - i - 2, w, 2);
  }
  if (hold > 0) { g.fillStyle = '#FFFFFF'; g.fillRect(0, h - Math.round(h * pos(hold)) - 1, w, 2); }
}
/* a rolling peak hold: it stays where the loudest thing was for a moment, then falls */
export function holder() {
  let v = 0, t = 0;
  return { feed(x, now) { if (x >= v) { v = x; t = now; } else if (now - t > 900) v = Math.max(x, v * 0.97); return v; } };
}
/* the spectrum, in 40 bars from 40 Hz to 16 kHz, so the low end is not squashed into the first pixel */
export function spectrum(cv, an, sr) {
  const g = cv.getContext('2d'), w = cv.width, h = cv.height;
  g.fillStyle = '#000'; g.fillRect(0, 0, w, h);
  if (!an) { g.fillStyle = '#888'; g.font = '15px VT323, monospace'; g.fillText('PLAY TO SEE THE SPECTRUM', 8, h / 2); return; }
  const d = new Uint8Array(an.frequencyBinCount), bins = d.length, N = 40;
  an.getByteFrequencyData(d);
  const bw = w / N;
  for (let i = 0; i < N; i++) {
    const f0 = 40 * Math.pow(400, i / N), f1 = 40 * Math.pow(400, (i + 1) / N);
    const a = Math.max(0, Math.floor(f0 / (sr / 2) * bins)), b = Math.min(bins - 1, Math.max(a, Math.floor(f1 / (sr / 2) * bins)));
    let m = 0; for (let k = a; k <= b; k++) m = Math.max(m, d[k]);
    const bh = Math.round(h * m / 255);
    g.fillStyle = i < 6 ? '#FF5555' : i < 26 ? '#55FF55' : '#55FFFF';
    g.fillRect(Math.round(i * bw) + 1, h - bh, Math.max(2, Math.round(bw) - 2), bh);
  }
}
