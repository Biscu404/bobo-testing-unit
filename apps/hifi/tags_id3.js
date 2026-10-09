/* ID3 tags: v2.2, v2.3 and v2.4 (with the unsynchronisation of either, and extended headers), and the v1 tag at the end of a file (pure). */
import { u32be, syncsafe, ascii, text, clean, genreName, yearOf, trackOf, picture, GENRES } from './tags_util.js';

const unsync = u => { const o = []; for (let i = 0; i < u.length; i++) { o.push(u[i]); if (u[i] === 0xFF && u[i + 1] === 0) i++; } return Uint8Array.from(o); };
const FRAMES = { TT2: 'title', TIT2: 'title', TP1: 'artist', TPE1: 'artist', TP2: 'albumartist', TPE2: 'albumartist', TAL: 'album', TALB: 'album', TCO: 'genre', TCON: 'genre', TYE: 'year', TYER: 'year', TDRC: 'year', TRK: 'track', TRCK: 'track' };

/* the length of an ID3v2 tag including its header, from the first ten bytes; 0 if there is none */
export const id3Size = u => (u.length >= 10 && ascii(u, 0, 3) === 'ID3' ? 10 + syncsafe(u, 6) + ((u[5] & 0x10) ? 10 : 0) : 0);

/* `u` starts at the 'ID3' and holds at least the whole tag */
export function parseID3(u) {
  const out = { title: '', artist: '', album: '', genre: '', year: null, track: null, art: null };
  if (u.length < 10 || ascii(u, 0, 3) !== 'ID3') return out;
  const major = u[3], flags = u[5], total = Math.min(u.length, 10 + syncsafe(u, 6));
  let body = u.subarray(10, total);
  if ((flags & 0x80) && major < 4) body = unsync(body);
  let p = 0;
  if ((flags & 0x40) && body.length > 4) p = major === 4 ? syncsafe(body, 0) : 4 + u32be(body, 0);          /* an extended header: skip it */
  const idLen = major === 2 ? 3 : 4, hdr = major === 2 ? 6 : 10;
  const albumartist = [];
  let pic = null;
  while (p + hdr <= body.length) {
    const id = ascii(body, p, idLen);
    if (!/^[A-Z0-9]{3,4}$/.test(id)) break;
    let size = major === 2 ? ((body[p + 3] << 16) | (body[p + 4] << 8) | body[p + 5]) : major === 4 ? syncsafe(body, p + 4) : u32be(body, p + 4);
    const fl = major >= 3 ? body[p + 9] : 0, fh = major >= 3 ? body[p + 8] : 0;
    if (size <= 0 || p + hdr + size > body.length) break;
    let f = body.subarray(p + hdr, p + hdr + size);
    p += hdr + size;
    if (major === 4) { if (fl & 0x0C) continue; if (fl & 0x01) f = f.subarray(4); if (fl & 0x02) f = unsync(f); }      /* encrypted, compressed, or with a length in front */
    else if (major === 3 && (fh & 0xC0)) continue;
    if (FRAMES[id] && f.length > 1) {
      const enc = f[0], parts = [];
      const t = f.subarray(1);
      /* v2.4 separates several values with a NUL; the two-byte encodings with two */
      let cut = 0; const w = enc === 1 || enc === 2 ? 2 : 1;
      for (let i = 0; i + w <= t.length; i += w) if (w === 1 ? t[i] === 0 : (t[i] === 0 && t[i + 1] === 0)) { if (i > cut) parts.push(text(t.subarray(cut, i), enc)); cut = i + w; }
      if (cut < t.length) parts.push(text(t.subarray(cut), enc));
      const val = parts.map(x => clean(x)).filter(Boolean);
      const key = FRAMES[id];
      if (!val.length) continue;
      if (key === 'title' && !out.title) out.title = val[0];
      else if (key === 'artist' && !out.artist) out.artist = val.join(' / ');
      else if (key === 'albumartist') albumartist.push(val[0]);
      else if (key === 'album' && !out.album) out.album = val[0];
      else if (key === 'genre' && !out.genre) out.genre = genreName(val[0]);
      else if (key === 'year' && !out.year) out.year = yearOf(val[0]);
      else if (key === 'track' && out.track == null) out.track = trackOf(val[0]);
    } else if ((id === 'APIC' || id === 'PIC') && f.length > 8) {
      const enc = f[0]; let q = 1, mime = '';
      if (id === 'PIC') { mime = ascii(f, 1, 3).toLowerCase() === 'png' ? 'image/png' : 'image/jpeg'; q = 4; }
      else { let e = q; while (e < f.length && f[e] !== 0) e++; mime = ascii(f, q, e - q); q = e + 1; }
      const type = f[q]; q++;
      if (enc === 1 || enc === 2) { while (q + 1 < f.length && !(f[q] === 0 && f[q + 1] === 0)) q += 2; q += 2; } else { while (q < f.length && f[q] !== 0) q++; q++; }
      if (q < f.length && (!pic || (type === 3 && pic.type !== 3))) pic = { type, data: f.subarray(q), mime };
    }
  }
  if (!out.artist && albumartist.length) out.artist = albumartist[0];
  if (pic) out.art = picture(pic.data, pic.mime);
  return out;
}

/* the 128 bytes at the end of an old file */
export function parseID3v1(u) {
  const out = { title: '', artist: '', album: '', genre: '', year: null, track: null, art: null };
  if (u.length < 128 || ascii(u, u.length - 128, 3) !== 'TAG') return out;
  const t = u.subarray(u.length - 125), s = (a, n) => clean(text(t.subarray(a, a + n), 0));
  out.title = s(0, 30); out.artist = s(30, 30); out.album = s(60, 30); out.year = yearOf(ascii(t, 90, 4));
  if (t[122] === 0 && t[123] !== 0) out.track = t[123];
  out.genre = GENRES[t[124]] || '';
  return out;
}
