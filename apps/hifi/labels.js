/* Which picture goes on which disc (pure: Node runs it in labels_check.js). Two jobs: the labels a person drops in by the dozen are matched to albums, folders, discs
   and artists by what the picture is called ("Nevermind.jpg" is the album Nevermind; "04 - Lithium.png" is the disc Lithium); and in a folder of music the picture that is
   the cover (cover, folder, front, album art) is the one every disc beside it wears. The rest of the pictures are left for a person to place, and said to be. */
import { fold } from './shelf.js';

export const norm = s => fold(String(s == null ? '' : s).trim().replace(/\.[a-z0-9]{2,5}$/i, '')).replace(/^\d{1,3}\s*[-_. )]+\s*/, '').replace(/[\s_.\-,'"!?()\[\]{}:;&\/\\~+*]+/g, ' ').trim();

/* 0..1: how much two names are the same name */
export function score(a, b) {
  a = norm(a); b = norm(b);
  if (!a || !b) return 0;
  if (a === b) return 1;
  const sh = Math.min(a.length, b.length), lg = Math.max(a.length, b.length);
  if (sh >= 3 && (a.indexOf(b) >= 0 || b.indexOf(a) >= 0)) return 0.62 + 0.3 * (sh / lg);
  const A = new Set(a.split(' ').filter(w => w.length > 1)), B = new Set(b.split(' ').filter(w => w.length > 1));
  if (!A.size || !B.size) return 0;
  let both = 0; A.forEach(w => { if (B.has(w)) both++; });
  return both ? 0.8 * both / (A.size + B.size - both) : 0;
}

const WEIGHT = { album: 1, folder: 0.98, track: 0.94, artist: 0.9 };
export const NEEDS = 0.6;
/* images: [{ name }]; groups: [{ id, kind, name }] -> [{ image, group (a group or null), score }], one row per image, in the images' order */
export function match(images, groups) {
  return images.map((im, image) => {
    let best = null, bs = 0;
    groups.forEach(g => { const s = score(im.name, g.name) * (WEIGHT[g.kind] || 0.9); if (s > bs + 1e-9) { bs = s; best = g; } });
    return bs >= NEEDS ? { image, group: best, score: bs } : { image, group: null, score: bs };
  });
}

/* numbers inside names count as numbers: 2 comes before 10 */
export const natural = (a, b) => String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });

/* as many pictures as discs, one each, the pictures in name order and the discs in the order given */
export function inOrder(images, tracks) {
  const order = images.map((im, i) => i).sort((x, y) => natural(images[x].name, images[y].name));
  return order.slice(0, tracks.length).map((image, k) => ({ image, track: tracks[k] }));
}

/* the picture that is the cover of a folder of music, from the names of the pictures in it; -1 when none is */
const COVER = [/^(cover|front|folder|albumart|album ?art|artwork|album|thumb|poster|label)\b/i, /(cover|front|folder|art(work)?)\b/i];
export function pickCover(names) {
  for (const re of COVER) { const i = names.findIndex(n => re.test(String(n).replace(/\.[a-z0-9]{2,5}$/i, ''))); if (i >= 0) return i; }
  return names.length === 1 ? 0 : -1;
}
export const IMAGE = /\.(jpe?g|png|gif|webp|bmp)$/i;
export const isImage = f => /^image\//.test(f.type || '') || IMAGE.test(f.name || '');
