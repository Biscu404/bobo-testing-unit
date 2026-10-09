/* Small things every tag reader needs (pure; Node runs it in tags_check.js). */
export const GENRES = ['Blues', 'Classic Rock', 'Country', 'Dance', 'Disco', 'Funk', 'Grunge', 'Hip-Hop', 'Jazz', 'Metal', 'New Age', 'Oldies', 'Other', 'Pop', 'R&B', 'Rap', 'Reggae', 'Rock', 'Techno', 'Industrial',
  'Alternative', 'Ska', 'Death Metal', 'Pranks', 'Soundtrack', 'Euro-Techno', 'Ambient', 'Trip-Hop', 'Vocal', 'Jazz+Funk', 'Fusion', 'Trance', 'Classical', 'Instrumental', 'Acid', 'House', 'Game', 'Sound Clip', 'Gospel', 'Noise',
  'AlternRock', 'Bass', 'Soul', 'Punk', 'Space', 'Meditative', 'Instrumental Pop', 'Instrumental Rock', 'Ethnic', 'Gothic', 'Darkwave', 'Techno-Industrial', 'Electronic', 'Pop-Folk', 'Eurodance', 'Dream', 'Southern Rock', 'Comedy', 'Cult',
  'Gangsta', 'Top 40', 'Christian Rap', 'Pop/Funk', 'Jungle', 'Native American', 'Cabaret', 'New Wave', 'Psychedelic', 'Rave', 'Showtunes', 'Trailer', 'Lo-Fi', 'Tribal', 'Acid Punk', 'Acid Jazz', 'Polka', 'Retro', 'Musical', 'Rock & Roll',
  'Hard Rock', 'Folk', 'Folk-Rock', 'National Folk', 'Swing', 'Fast Fusion', 'Bebop', 'Latin', 'Revival', 'Celtic', 'Bluegrass', 'Avantgarde', 'Gothic Rock', 'Progressive Rock', 'Psychedelic Rock', 'Symphonic Rock', 'Slow Rock', 'Big Band',
  'Chorus', 'Easy Listening', 'Acoustic', 'Humour', 'Speech', 'Chanson', 'Opera', 'Chamber Music', 'Sonata', 'Symphony', 'Booty Bass', 'Primus', 'Porn Groove', 'Satire', 'Slow Jam', 'Club', 'Tango', 'Samba', 'Folklore', 'Ballad', 'Power Ballad',
  'Rhythmic Soul', 'Freestyle', 'Duet', 'Punk Rock', 'Drum Solo', 'A Cappella', 'Euro-House', 'Dance Hall',
  /* Winamp's additions, 126 to 147 */
  'Goa', 'Drum & Bass', 'Club-House', 'Hardcore', 'Terror', 'Indie', 'BritPop', 'Punk', 'Polsk Punk', 'Beat', 'Christian Gangsta Rap', 'Heavy Metal', 'Black Metal', 'Crossover', 'Contemporary Christian', 'Christian Rock', 'Merengue', 'Salsa',
  'Thrash Metal', 'Anime', 'JPop', 'Synthpop'];

export const u32be = (u, o) => ((u[o] << 24) | (u[o + 1] << 16) | (u[o + 2] << 8) | u[o + 3]) >>> 0;
export const u32le = (u, o) => ((u[o + 3] << 24) | (u[o + 2] << 16) | (u[o + 1] << 8) | u[o]) >>> 0;
export const syncsafe = (u, o) => (u[o] << 21) | (u[o + 1] << 14) | (u[o + 2] << 7) | u[o + 3];
export const ascii = (u, o, n) => { let s = ''; for (let i = 0; i < n && o + i < u.length; i++) s += String.fromCharCode(u[o + i]); return s; };

const dec = (label, b) => { try { return new TextDecoder(label).decode(b); } catch (e) { return ''; } };
/* ID3 text: encoding 0 is "ISO-8859-1", which is what the spec says and not what taggers write: a tag with bytes above 127 that is valid UTF-8 is UTF-8 */
export function text(b, enc) {
  let s;
  if (enc === 1) s = dec('utf-16', b);                  /* the BOM says which way round */
  else if (enc === 2) s = dec('utf-16be', b);
  else if (enc === 3) s = dec('utf-8', b);
  else {
    let hi = false; for (let i = 0; i < b.length; i++) if (b[i] > 127) { hi = true; break; }
    if (hi) { try { s = new TextDecoder('utf-8', { fatal: true }).decode(b); } catch (e) { s = dec('windows-1252', b); } } else s = dec('utf-8', b);
  }
  return s.replace(/﻿/g, '');
}
export const clean = (s, max) => String(s == null ? '' : s).replace(/\0+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max || 200);

/* "(17)Rock", "(17)", "17", "Rock", "(RX)": the genre as a name */
export function genreName(raw) {
  let s = clean(raw);
  if (!s) return '';
  const paren = /^\((\d{1,3})\)\s*(.*)$/.exec(s);
  if (paren) s = paren[2] || GENRES[+paren[1]] || '';
  else if (/^\d{1,3}$/.test(s)) s = GENRES[+s] || '';
  else if (/^\((RX|CR)\)$/.test(s)) s = '';
  return clean(s);
}
export const yearOf = s => { const m = /(1[89]\d\d|20\d\d|21\d\d)/.exec(String(s || '')); return m ? +m[1] : null; };
export const trackOf = s => { const m = /^\s*(\d{1,3})/.exec(String(s || '')); return m ? +m[1] : null; };

export function mimeOf(u, hint) {
  if (u.length > 3 && u[0] === 0xFF && u[1] === 0xD8 && u[2] === 0xFF) return 'image/jpeg';
  if (u.length > 7 && u[0] === 0x89 && u[1] === 0x50 && u[2] === 0x4E && u[3] === 0x47) return 'image/png';
  if (ascii(u, 0, 4) === 'GIF8') return 'image/gif';
  if (ascii(u, 0, 4) === 'RIFF' && ascii(u, 8, 4) === 'WEBP') return 'image/webp';
  if (ascii(u, 0, 2) === 'BM') return 'image/bmp';
  const h = String(hint || '').toLowerCase();
  if (/^image\//.test(h) && h !== 'image/') return h === 'image/jpg' ? 'image/jpeg' : h;
  return /png/.test(h) ? 'image/png' : 'image/jpeg';
}
export const picture = (u, hint) => (u && u.length > 16 ? new Blob([u], { type: mimeOf(u, hint) }) : null);

/* a FLAC PICTURE block (also what Ogg carries in METADATA_BLOCK_PICTURE): { type, data } */
export function flacPicture(u) {
  try {
    let o = 4; const mlen = u32be(u, o); o += 4 + mlen;
    const dlen = u32be(u, o); o += 4 + dlen + 16;
    const n = u32be(u, o); o += 4;
    return { type: u32be(u, 0), data: u.subarray(o, o + n), mime: ascii(u, 8, mlen) };
  } catch (e) { return null; }
}

/* the Vorbis comment layout (FLAC, Ogg Vorbis, Opus): [ [KEY, value], ... ] */
export function comments(u, o) {
  const out = [];
  try {
    const vlen = u32le(u, o); o += 4 + vlen;
    const n = u32le(u, o); o += 4;
    for (let i = 0; i < n && o + 4 <= u.length; i++) {
      const l = u32le(u, o); o += 4;
      const kv = text(u.subarray(o, o + l), 3), eq = kv.indexOf('=');
      if (eq > 0) out.push([kv.slice(0, eq).toUpperCase(), kv.slice(eq + 1)]);
      o += l;
    }
  } catch (e) { /* a comment block that stops early is what there is */ }
  return out;
}

/* what the comments say, in the shape every reader returns */
export function fromComments(list) {
  const get = (...k) => { for (const key of k) { const f = list.find(c => c[0] === key); if (f && clean(f[1])) return clean(f[1]); } return ''; };
  const out = { title: get('TITLE'), artist: get('ARTIST', 'ALBUMARTIST', 'PERFORMER'), album: get('ALBUM'), genre: genreName(get('GENRE')), year: yearOf(get('DATE', 'YEAR', 'ORIGINALDATE')), track: trackOf(get('TRACKNUMBER', 'TRACK')), art: null };
  let best = null;
  list.filter(c => c[0] === 'METADATA_BLOCK_PICTURE').forEach(c => {
    try { const bin = atob(c[1].replace(/\s+/g, '')), b = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) b[i] = bin.charCodeAt(i); const p = flacPicture(b); if (p && (!best || p.type === 3)) best = p; } catch (e) { /* not base64 */ }
  });
  if (best) out.art = picture(best.data, best.mime);
  if (!out.art) { const f = list.find(c => c[0] === 'COVERART'); if (f) try { const bin = atob(f[1].replace(/\s+/g, '')), b = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) b[i] = bin.charCodeAt(i); out.art = picture(b, 'image/jpeg'); } catch (e) { /* no */ } }
  return out;
}
