/* node apps/hifi/palette_check.js -- the face wears the label (pure Node): a red label gives a red face, a two-colour label gives two colours, grey gives a pale neutral, an empty
   or transparent picture does not crash, and no ink is ever too dim to read on the panel it sits on. */
import { paletteOf, themeFrom, palOfNamed, NAMED, hsv, rgb, mix, hex, contrast, lerpTheme, fromHsv } from './palette.js';
import { HFP } from './discs.js';

let bad = 0, n = 0;
const ok = (c, m) => { n++; if (!c) { bad++; console.log('FAIL ' + m); } };
const img = (w, h, f) => { const px = new Uint8ClampedArray(w * h * 4); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const c = f(x, y); px.set([c[0], c[1], c[2], c.length > 3 ? c[3] : 255], (y * w + x) * 4); } return px; };
const hue = c => hsv(...rgb(c))[0];
const near = (a, b, d) => { const x = Math.abs(a - b); return Math.min(x, 360 - x) <= d; };

let p = paletteOf(img(20, 20, () => [200, 20, 30]));
ok(near(hue(p.a), 355, 12) && !p.gray, 'a red label is a red accent: ' + p.a);
p = paletteOf(img(20, 20, (x) => (x < 10 ? [20, 90, 220] : [250, 200, 20])));
ok(!p.gray && near(hue(p.a), 220, 20) !== near(hue(p.a2), 220, 20), 'a blue-and-yellow label gives both: ' + p.a + ' ' + p.a2);
ok(Math.abs(hue(p.a) - hue(p.a2)) > 40, 'and they are not the same hue');
p = paletteOf(img(20, 20, (x, y) => { const v = 40 + ((x + y) * 5) % 190; return [v, v, v]; }));
ok(p.gray && hsv(...rgb(p.a))[1] < 0.2, 'a grey picture is a pale neutral accent: ' + p.a);
p = paletteOf(img(20, 20, () => [0, 0, 0, 0]));
ok(p.gray && /^#[0-9a-f]{6}$/.test(p.a), 'a transparent picture gives a colour, not an error');
p = paletteOf(new Uint8ClampedArray(0)); ok(p.gray, 'no pixels at all');
p = paletteOf(img(20, 20, (x, y) => ((x + y) % 2 ? [255, 0, 0] : [0, 0, 255])));
ok(!p.gray && /^#[0-9a-f]{6}$/.test(p.a2), 'a red and blue check has two accents');
p = paletteOf(img(20, 20, (x, y) => (y < 2 ? [0, 255, 0] : [12, 12, 12])));
ok(p.gray || near(hue(p.a), 120, 20), 'a mostly black picture with a green line: ' + p.a + ' (' + p.gray + ')');

/* every ink is legible on the panel, for every kind of label */
const labels = [[200, 20, 30], [20, 90, 220], [250, 200, 20], [30, 200, 60], [120, 10, 160], [255, 255, 255], [10, 10, 10], [90, 90, 90], [255, 120, 0]].map(c => paletteOf(img(16, 16, () => c)));
Object.keys(NAMED).forEach(k => labels.push(palOfNamed(k)));
labels.forEach((pal, i) => {
  const t = themeFrom(pal, HFP);
  [['amber', t.amber, t.panel], ['lcdOn', t.lcdOn, t.lcd], ['cyan', t.cyan, '#000000'], ['brushHi', t.brushHi, t.case_], ['white', t.white, t.case_], ['brushHi on the brushed metal', t.brushHi, t.panel]].forEach(([k, ink, bg]) => ok(contrast(ink, bg) >= 4.5, 'label ' + i + ': ' + k + ' ' + ink + ' on ' + bg + ' reads at ' + contrast(ink, bg).toFixed(1)));
  ok(contrast(t.brushHi, t.panelHi) >= 3, 'label ' + i + ': brushHi still reads over the thin lighter stripes of the metal (' + contrast(t.brushHi, t.panelHi).toFixed(1) + ')');
  ok(contrast(t.lcdDim, t.lcd) >= 1.5, 'label ' + i + ': the dim LCD ink is still a different colour from the glass');
  ok(Object.values(t).every(v => /^#[0-9a-f]{6}$/.test(v)), 'label ' + i + ': every ink is a colour');
});
const t0 = themeFrom(palOfNamed('amber'), HFP), t1 = themeFrom(palOfNamed('cyan'), HFP);
ok(hue(t0.amber) < 60 && near(hue(t1.amber), 190, 15), 'an amber disc has an amber face and a cyan one a cyan face');
const mid = lerpTheme(t0, t1, 0.5); ok(mid.amber !== t0.amber && mid.amber !== t1.amber, 'a change of disc fades through the colours in between');
ok(lerpTheme(null, t1, 0.5).amber === t1.amber, 'the first disc simply is its colours');
ok(mix('#000000', '#ffffff', 0.5) === '#808080' && hex(255, 0, 0) === '#ff0000' && fromHsv(0, 1, 1) === '#ff0000', 'the colour arithmetic');
console.log(bad ? bad + ' of ' + n + ' checks FAILED' : 'all ' + n + ' checks pass');
process.exit(bad ? 1 : 0);
