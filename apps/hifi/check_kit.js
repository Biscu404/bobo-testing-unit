/* Fixtures for the Stack's checks, made in pure Node so a machine with no audio tools can run them: a PNG of any size and colour, a WAV tone, and a WAV that carries an ID3
   tag (title, artist, album, genre, year, track, cover) in its 'id3 ' chunk, which is a file the Stack reads the tags of and the browser decodes. Dev-only, not packaged. */
import { deflateSync } from 'node:zlib';

const T = new TextEncoder();
const be32 = v => [(v >>> 24) & 255, (v >>> 16) & 255, (v >>> 8) & 255, v & 255], le32 = v => be32(v).reverse(), ss = v => [(v >> 21) & 127, (v >> 14) & 127, (v >> 7) & 127, v & 127];
const cat = (...p) => { const a = []; p.forEach(x => { if (typeof x === 'string') T.encode(x).forEach(v => a.push(v)); else if (typeof x === 'number') a.push(x); else x.forEach(v => a.push(v)); }); return Uint8Array.from(a); };

let table = null;
const crc32 = u => { if (!table) { table = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; table[n] = c >>> 0; } } let c = 0xFFFFFFFF; for (let i = 0; i < u.length; i++) c = table[(c ^ u[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
const chunk = (type, data) => { const td = cat(type, data); return cat(be32(data.length), td, be32(crc32(td))); };

/* a PNG, w by h, in one colour (or a function of x and y) */
export function png(w, h, colour) {
  const f = typeof colour === 'function' ? colour : () => colour;
  const raw = [];
  for (let y = 0; y < h; y++) { raw.push(0); for (let x = 0; x < w; x++) { const c = f(x, y); raw.push(c[0], c[1], c[2]); } }
  return cat([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A], chunk('IHDR', cat(be32(w), be32(h), [8, 2, 0, 0, 0])), chunk('IDAT', deflateSync(Uint8Array.from(raw))), chunk('IEND', []));
}

const utf16 = s => { const o = [0xFF, 0xFE]; for (let i = 0; i < s.length; i++) { const c = s.charCodeAt(i); o.push(c & 255, c >> 8); } return o; };
const frame = (id, body) => cat(id, be32(body.length), [0, 0], body);
export function id3({ title, artist, album, genre, year, track, art }) {
  const text = (id, v) => (v ? frame(id, cat([1], utf16(String(v)))) : []);
  const frames = [text('TIT2', title), text('TPE1', artist), text('TALB', album), text('TCON', genre), text('TYER', year), text('TRCK', track), art ? frame('APIC', cat([0], 'image/png', 0, 3, 0, art)) : []];
  const body = cat(...frames);
  return cat('ID3', 3, 0, 0, ss(body.length), body);
}

/* a mono 16-bit WAV: a sine tone, with an ID3 chunk when there are tags */
export function wav(secs, hz, tags) {
  const rate = 8000, n = Math.round(secs * rate), data = new Uint8Array(n * 2);
  for (let i = 0; i < n; i++) { const v = Math.round(Math.sin(2 * Math.PI * hz * i / rate) * 9000); data[i * 2] = v & 255; data[i * 2 + 1] = (v >> 8) & 255; }
  const tag = tags ? id3(tags) : null;
  const tagChunk = tag ? cat('id3 ', le32(tag.length), tag, tag.length & 1 ? [0] : []) : [];
  const fmt = cat('fmt ', le32(16), [1, 0, 1, 0], le32(rate), le32(rate * 2), [2, 0, 16, 0]);
  const dataChunk = cat('data', le32(data.length), data);
  const body = cat('WAVE', fmt, dataChunk, tagChunk);
  return cat('RIFF', le32(body.length), body);
}
