/* The containers that keep tags somewhere other than an ID3 block: FLAC, Ogg (Vorbis and Opus), MP4 / M4A, and WAV. Each reads only what it needs from a Blob
   by slices, so a two-hundred-megabyte file is never read whole (pure apart from Blob). */
import { u32be, u32le, ascii, text, clean, genreName, yearOf, trackOf, picture, flacPicture, comments, fromComments, GENRES } from './tags_util.js';
import { parseID3 } from './tags_id3.js';

const MAX = 48 * 1048576;
const rd = async (blob, a, b) => new Uint8Array(await blob.slice(a, Math.min(blob.size, b)).arrayBuffer());
const blank = () => ({ title: '', artist: '', album: '', genre: '', year: null, track: null, art: null });

/* ---- FLAC: metadata blocks in a row, the last one marked ---- */
export async function readFlac(blob, at) {
  let o = (at || 0) + 4, out = blank(), pics = [];
  for (let n = 0; n < 64; n++) {
    const h = await rd(blob, o, o + 4);
    if (h.length < 4) break;
    const last = h[0] & 0x80, type = h[0] & 0x7F, len = (h[1] << 16) | (h[2] << 8) | h[3];
    o += 4;
    if (len > MAX) { o += len; if (last) break; continue; }
    if (type === 4) out = Object.assign(out, fromComments(comments(await rd(blob, o, o + len), 0)), { art: out.art });
    else if (type === 6) { const p = flacPicture(await rd(blob, o, o + len)); if (p) pics.push(p); }
    o += len;
    if (last) break;
  }
  const p = pics.find(x => x.type === 3) || pics[0];
  if (p) out.art = picture(p.data, p.mime);
  return out;
}

/* ---- Ogg: pages of segments; the second packet holds the comments, and a cover makes it span many pages ---- */
export async function readOgg(blob) {
  const u = await rd(blob, 0, 8 * 1048576);
  let o = 0, packets = [], cur = [];
  while (o + 27 <= u.length && ascii(u, o, 4) === 'OggS' && packets.length < 2) {
    const nseg = u[o + 26]; let p = o + 27 + nseg;
    for (let i = 0; i < nseg; i++) {
      const l = u[o + 27 + i];
      cur.push(u.subarray(p, p + l)); p += l;
      if (l < 255) { let n = 0; cur.forEach(c => { n += c.length; }); const b = new Uint8Array(n); let k = 0; cur.forEach(c => { b.set(c, k); k += c.length; }); packets.push(b); cur = []; if (packets.length >= 2) break; }
    }
    o = p;
  }
  const c = packets[1];
  if (!c) return blank();
  if (c[0] === 3 && ascii(c, 1, 6) === 'vorbis') return fromComments(comments(c, 7));
  if (ascii(c, 0, 8) === 'OpusTags') return fromComments(comments(c, 8));
  return blank();
}

/* ---- MP4: atoms within atoms; the tags are moov > udta > meta > ilst, and moov may be at the end ---- */
const atoms = (u, a, b) => {
  const out = [];
  for (let o = a; o + 8 <= b;) {
    let size = u32be(u, o); const type = ascii(u, o + 4, 4); let head = 8;
    if (size === 1) { size = u32be(u, o + 12); head = 16; } else if (size === 0) size = b - o;
    if (size < head || o + size > b) break;
    out.push({ type, a: o + head, b: o + size });
    o += size;
  }
  return out;
};
export async function readMp4(blob) {
  let o = 0, moov = null;
  for (let n = 0; n < 200 && o + 8 <= blob.size; n++) {
    const h = await rd(blob, o, o + 16);
    let size = u32be(h, 0), head = 8;
    const type = ascii(h, 4, 4);
    if (size === 1) { size = u32be(h, 12); head = 16; } else if (size === 0) size = blob.size - o;
    if (size < head) break;
    if (type === 'moov') { if (size > MAX) return blank(); moov = await rd(blob, o + head, o + size); break; }
    o += size;
  }
  if (!moov) return blank();
  const out = blank(), find = (a, b, t) => atoms(moov, a, b).find(x => x.type === t);
  const udta = find(0, moov.length, 'udta'), meta = udta && find(udta.a, udta.b, 'meta');
  const ilst = meta && find(meta.a + 4, meta.b, 'ilst');
  if (!ilst) return out;
  atoms(moov, ilst.a, ilst.b).forEach(item => {
    const d = atoms(moov, item.a, item.b).find(x => x.type === 'data');
    if (!d || d.b - d.a < 8) return;
    const kind = moov[d.a + 3], v = moov.subarray(d.a + 8, d.b), t = item.type;
    const str = () => clean(text(v, 3));
    if (t === '©nam') out.title = str();
    else if (t === '©ART') out.artist = str();
    else if (t === 'aART') { if (!out.artist) out.artist = str(); }
    else if (t === '©alb') out.album = str();
    else if (t === '©gen') out.genre = genreName(str());
    else if (t === 'gnre' && v.length >= 2) out.genre = GENRES[((v[0] << 8) | v[1]) - 1] || '';
    else if (t === '©day') out.year = yearOf(str());
    else if (t === 'trkn' && v.length >= 4) out.track = (v[2] << 8) | v[3] || null;
    else if (t === 'covr' && !out.art) out.art = picture(v, kind === 14 ? 'image/png' : 'image/jpeg');
  });
  return out;
}

/* ---- WAV: RIFF chunks; an 'id3 ' chunk is an ID3 tag, a LIST INFO is the plain old fields ---- */
export async function readWav(blob) {
  let o = 12, out = blank();
  for (let n = 0; n < 400 && o + 8 <= blob.size; n++) {
    const h = await rd(blob, o, o + 12), id = ascii(h, 0, 4), len = u32le(h, 4);
    if (id === 'id3 ' || id === 'ID3 ') { if (len < MAX) out = Object.assign(out, parseID3(await rd(blob, o + 8, o + 8 + len))); }
    else if (id === 'LIST' && ascii(h, 8, 4) === 'INFO' && len < 1048576) {
      const u = await rd(blob, o + 12, o + 8 + len);
      for (let p = 0; p + 8 <= u.length;) {
        const k = ascii(u, p, 4), l = u32le(u, p + 4), s = clean(text(u.subarray(p + 8, p + 8 + l), 3));
        if (k === 'INAM' && !out.title) out.title = s; else if (k === 'IART' && !out.artist) out.artist = s; else if (k === 'IPRD' && !out.album) out.album = s;
        else if (k === 'IGNR' && !out.genre) out.genre = genreName(s); else if (k === 'ICRD' && !out.year) out.year = yearOf(s); else if (k === 'ITRK' && out.track == null) out.track = trackOf(s);
        p += 8 + l + (l & 1);
      }
    }
    o += 8 + len + (len & 1);
  }
  return out;
}
