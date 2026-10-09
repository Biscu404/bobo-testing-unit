/* Labels: turning a picture into what the Stack needs (a 96-pixel square for the little pictures, the whole picture at up to 512 pixels for the disc, the colours it is
   about, and a small blob that goes in the vault), and painting it on a disc three ways: CROP (the middle square fills the disc: what it always did), FIT (the whole picture
   inside the disc, the spare room in the picture's own dark average) and STRETCH (the picture pulled to fill the disc whatever shape it is). */
import { paletteOf, mix } from './palette.js';

export const MODES = ['fill', 'fit', 'stretch'];
export const MODE_NAME = { fill: 'CROP', fit: 'FIT', stretch: 'STRETCH' };
export const nextMode = m => MODES[(MODES.indexOf(m) + 1) % MODES.length];

const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
const load = blob => new Promise((res, rej) => {
  const url = URL.createObjectURL(blob), im = new Image();
  im.onload = () => { URL.revokeObjectURL(url); res(im); };
  im.onerror = () => { URL.revokeObjectURL(url); rej(new Error('not a picture')); };
  im.src = url;
});
const toBlob = (c, type, q) => new Promise(res => { try { c.toBlob(b => res(b), type, q); } catch (e) { res(null); } });

/* a picture (a Blob) -> { label (the picture, canvas), thumb (96 x 96, cropped), pal, blob (what the vault keeps) }; rejects when it is not a picture */
export async function labelFrom(blob) {
  const im = await load(blob), w = im.naturalWidth || im.width, h = im.naturalHeight || im.height;
  if (!w || !h) throw new Error('empty picture');
  const k = Math.min(1, 512 / Math.max(w, h)), W = Math.max(1, Math.round(w * k)), H = Math.max(1, Math.round(h * k));
  const label = canvas(W, H), g = label.getContext('2d');
  g.drawImage(im, 0, 0, W, H);
  const thumb = canvas(96, 96), s = Math.min(w, h);
  thumb.getContext('2d').drawImage(im, (w - s) / 2, (h - s) / 2, s, s, 0, 0, 96, 96);
  const sm = canvas(32, 32).getContext('2d'); sm.drawImage(im, 0, 0, 32, 32);
  const pal = paletteOf(sm.getImageData(0, 0, 32, 32).data);
  const out = await toBlob(label, W * H > 40000 ? 'image/jpeg' : 'image/png', 0.86);
  return { label, thumb, pal, blob: out };
}
export async function labelFromDataURL(url) { return labelFrom(await (await fetch(url)).blob()); }

/* what two covers have in common when they are the same cover: size and a few bytes of it */
export async function coverKey(blob) {
  const u = new Uint8Array(await blob.slice(0, 96).arrayBuffer()); let h = 2166136261;
  for (let i = 0; i < u.length; i++) { h ^= u[i]; h = Math.imul(h, 16777619); }
  return blob.size + ':' + (h >>> 0);
}

/* paint a label on a disc centred at the origin of `g` (the caller has translated and rotated), leaving the hub clear */
export function drawLabel(g, t, rad, hole, mode) {
  const src = t.label || t.art;
  if (!src) return false;
  g.save();
  g.beginPath(); g.arc(0, 0, rad - 1, 0, Math.PI * 2); g.arc(0, 0, hole, 0, Math.PI * 2, true); g.clip('evenodd');
  const w = src.width, h = src.height, d = rad * 2;
  if (mode === 'stretch') g.drawImage(src, -rad, -rad, d, d);
  else if (mode === 'fit') {
    g.fillStyle = t.pal ? mix(t.pal.avg, '#000000', 0.55) : '#101014'; g.fillRect(-rad, -rad, d, d);
    const k = d / Math.hypot(w, h);
    g.drawImage(src, -w * k / 2, -h * k / 2, w * k, h * k);
  } else { const s = Math.min(w, h); g.drawImage(src, (w - s) / 2, (h - s) / 2, s, s, -rad, -rad, d, d); }
  g.restore();
  return true;
}

/* a blob: URL for the little picture of a disc, for the parts of the Stack made of elements. It is made once per picture (the discs of an album share one) and kept: until it
   is ready the answer is '' and `cb` is called with it. */
const THUMBS = new WeakMap();
export function thumbUrl(t, cb) {
  const c = t.art; if (!c || !c.toBlob) return '';
  let e = THUMBS.get(c);
  if (!e) THUMBS.set(c, e = { url: '', busy: false, cbs: [] });
  if (e.url) return e.url;
  if (cb) e.cbs.push(cb);
  if (!e.busy) {
    e.busy = true;
    try { c.toBlob(b => { e.busy = false; if (b) { e.url = URL.createObjectURL(b); e.cbs.splice(0).forEach(f => f(e.url)); } }); } catch (err) { e.busy = false; }
  }
  return '';
}
/* a disc's picture changed (or the disc went): nothing to let go of, the picture's own thumbnail lives as long as the picture does */
export const dropThumb = t => { void t; };
