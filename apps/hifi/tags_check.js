/* node apps/hifi/tags_check.js -- what a file says about itself (pure Node: Blob, TextEncoder and atob are all there is).
   Files are built byte by byte in every shape the Stack meets: MP3 with ID3v2.2 / v2.3 / v2.4 (UTF-16, UTF-8 and mis-labelled Latin-1 text, several values, genre
   numbers, a cover of every kind), an MP3 with only the v1 tag, FLAC, Ogg Vorbis and Opus with a cover that spans many pages, M4A with the moov first and last, WAV;
   then rubbish, which gives nothing and does not throw. The names are Japanese, Korean, Cyrillic and Greek on purpose. */
import { readTags, hifiTags } from './tags.js';
import { genreName, GENRES, mimeOf } from './tags_util.js';

let bad = 0, n = 0;
const ok = (c, m) => { n++; if (!c) { bad++; console.log('FAIL ' + m); } };
const T = new TextEncoder();
const bytes = (...p) => { const a = []; const add = v => { a.push(v); }; p.forEach(x => { if (typeof x === 'string') T.encode(x).forEach(add); else if (x instanceof Uint8Array || Array.isArray(x)) x.forEach(add); else a.push(x); }); return Uint8Array.from(a); };
const be32 = v => [(v >>> 24) & 255, (v >>> 16) & 255, (v >>> 8) & 255, v & 255], le32 = v => be32(v).reverse(), ss = v => [(v >> 21) & 127, (v >> 14) & 127, (v >> 7) & 127, v & 127];
const u16 = (s, bom) => { const o = bom ? [0xFF, 0xFE] : []; for (const ch of s) { const c = ch.codePointAt(0); const w = c > 0xFFFF ? [0xD800 + ((c - 0x10000) >> 10), 0xDC00 + ((c - 0x10000) & 0x3FF)] : [c]; w.forEach(x => o.push(x & 255, x >> 8)); } return o; };
const JPG = bytes([0xFF, 0xD8, 0xFF, 0xE0], new Array(60).fill(7)), PNG = bytes([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A], new Array(60).fill(9));
const blob = u => new Blob([u]);

/* ---- ID3v2 ---- */
const f3 = (id, body) => bytes(id, be32(body.length), [0, 0], body);
const f4 = (id, body) => bytes(id, ss(body.length), [0, 0], body);
const f2 = (id, body) => bytes(id, [(body.length >> 16) & 255, (body.length >> 8) & 255, body.length & 255], body);
const tag = (major, frames) => { const b = bytes(...frames); return bytes('ID3', major, 0, 0, ss(b.length), b); };
const txt = (enc, s) => bytes([enc], enc === 1 ? u16(s, true) : enc === 2 ? u16(s).reverse().length && (() => { const w = []; for (const ch of s) { const c = ch.charCodeAt(0); w.push(c >> 8, c & 255); } return w; })() : s);

{
  const t = tag(3, [f3('TIT2', txt(1, '夜に駆ける')), f3('TPE1', txt(0, 'YOASOBI')), f3('TALB', txt(1, 'THE BOOK')), f3('TCON', txt(0, '(17)')), f3('TYER', txt(0, '2019')), f3('TRCK', txt(0, '1/3')),
    f3('APIC', bytes([0], 'image/jpeg', 0, 3, 0, JPG))]);
  const r = await readTags(blob(bytes(t, new Array(500).fill(0))));
  ok(r.title === '夜に駆ける', 'v2.3: a Japanese title in UTF-16 comes out as written: ' + r.title);
  ok(r.artist === 'YOASOBI' && r.album === 'THE BOOK' && r.genre === 'Rock' && r.year === 2019 && r.track === 1, 'v2.3: artist, album, a genre number, the year and the track: ' + JSON.stringify([r.artist, r.album, r.genre, r.year, r.track]));
  ok(r.art && r.art.type === 'image/jpeg' && r.art.size === JPG.length, 'v2.3: the cover comes out as a jpeg of the right size');
  const old = hifiTags(bytes(t, new Array(100).fill(0)).buffer);
  ok(old.title === '夜に駆ける' && old.artist === 'YOASOBI' && old.art, 'the old hifiTags call still answers');
}
{
  const t = tag(4, [f4('TIT2', txt(3, '봄날')), f4('TPE1', bytes([3], 'BTS', 0, 'Jungkook')), f4('TCON', txt(3, 'Pop')), f4('TDRC', txt(3, '2017-02-13')), f4('TRCK', txt(3, '7')),
    f4('APIC', bytes([0], 'image/png', 0, 0, 0, PNG)), f4('APIC', bytes([0], 'image/jpeg', 0, 3, 0, JPG))]);
  const r = await readTags(blob(t));
  ok(r.title === '봄날', 'v2.4: a Korean title in UTF-8: ' + r.title);
  ok(r.artist === 'BTS / Jungkook', 'v2.4: two artists in one frame are both there: ' + r.artist);
  ok(r.genre === 'Pop' && r.year === 2017 && r.track === 7, 'v2.4: genre, year from a full date, track');
  ok(r.art && r.art.type === 'image/jpeg', 'v2.4: the front cover (type 3) is chosen over the other picture');
}
{
  const t = tag(2, [f2('TT2', txt(0, 'Тишина')), f2('TP1', txt(1, 'Кино')), f2('TAL', txt(0, 'Группа крови')), f2('PIC', bytes([0], 'PNG', 3, 0, PNG))]);
  const r = await readTags(blob(t));
  ok(r.title === 'Тишина' && r.artist === 'Кино' && r.album === 'Группа крови', 'v2.2: Cyrillic (mis-labelled as Latin-1 but UTF-8) and UTF-16: ' + [r.title, r.artist, r.album]);
  ok(r.art && r.art.type === 'image/png', 'v2.2: a PIC frame is a picture');
}
{
  const r = await readTags(blob(tag(3, [f3('TIT2', bytes([0, 0x43, 0x61, 0x66, 0xE9])), f3('TPE1', txt(0, 'Αλκίνοος'))])));
  ok(r.title === 'Café', 'Latin-1 bytes that are not UTF-8 are Latin-1: ' + r.title);
  ok(r.artist === 'Αλκίνοος', 'Greek in UTF-8 text that claims to be Latin-1');
}
{
  /* unsynchronisation in a v2.3 tag: the frame sizes are those of the decoded tag, and every FF is followed by an inserted 00 on the way out */
  const body = f3('TIT2', bytes([0], 'a', 0xFF, 'b')), enc = [];
  body.forEach(v => { enc.push(v); if (v === 0xFF) enc.push(0); });
  const raw = bytes('ID3', 3, 0, 0x80, ss(enc.length), enc);
  const r = await readTags(blob(raw));
  ok(r.title.length === 3 && r.title.charCodeAt(1) === 0xFF, 'unsynchronisation is undone: ' + JSON.stringify(r.title));
}
{
  /* a genre by number and by words, and the ones that mean nothing */
  ok(genreName('(17)') === 'Rock' && genreName('17') === 'Rock' && genreName('(17)Rock') === 'Rock' && genreName('Jazz') === 'Jazz', 'genre numbers and names');
  ok(genreName('(RX)') === '' && genreName('') === '' && genreName('(255)') === '', 'a remix flag or an empty genre is no genre');
  ok(GENRES.length === 148 && GENRES[0] === 'Blues' && GENRES[125] === 'Dance Hall' && GENRES[146] === 'JPop' && GENRES[147] === 'Synthpop', 'the genre table is the 148 of Winamp');
  ok(mimeOf(JPG) === 'image/jpeg' && mimeOf(PNG) === 'image/png' && mimeOf(bytes([1, 2, 3]), 'image/webp') === 'image/webp', 'a picture is known by its bytes, then by what it was called');
}
{
  const v1 = new Uint8Array(128); v1.set(T.encode('TAG'), 0); v1.set(T.encode('Old Song'), 3); v1.set(T.encode('Old Band'), 33); v1.set(T.encode('Old Album'), 63); v1.set(T.encode('1993'), 93); v1[126] = 4; v1[127] = 9;
  const r = await readTags(blob(bytes(new Array(3000).fill(0x55), v1)));
  ok(r.title === 'Old Song' && r.artist === 'Old Band' && r.album === 'Old Album' && r.year === 1993 && r.track === 4 && r.genre === 'Metal', 'ID3v1 at the end of a file: ' + JSON.stringify([r.title, r.artist, r.year, r.track, r.genre]));
}

/* ---- FLAC ---- */
const vcomment = list => { const parts = list.map(([k, v]) => { const b = T.encode(k + '=' + v); return bytes(le32(b.length), b); }); return bytes(le32(6), 'vendor', le32(list.length), ...parts); };
const flacPic = (type, data, mime) => bytes(be32(type), be32(mime.length), mime, be32(0), be32(1), be32(1), be32(24), be32(0), be32(data.length), data);
const block = (type, body, last) => bytes([(last ? 0x80 : 0) | type, (body.length >> 16) & 255, (body.length >> 8) & 255, body.length & 255], body);
{
  const flac = bytes('fLaC', block(0, new Array(34).fill(0)), block(4, vcomment([['title', 'ふるさと'], ['ARTIST', '岡野貞一'], ['Album', '唱歌'], ['GENRE', 'Classical'], ['DATE', '1914'], ['TRACKNUMBER', '2/10']])),
    block(6, flacPic(0, PNG, 'image/png')), block(6, flacPic(3, JPG, 'image/jpeg'), true), new Array(300).fill(0xAA));
  const r = await readTags(blob(flac));
  ok(r.title === 'ふるさと' && r.artist === '岡野貞一' && r.album === '唱歌' && r.genre === 'Classical' && r.year === 1914 && r.track === 2, 'FLAC: Vorbis comments, in any case of key: ' + JSON.stringify([r.title, r.artist, r.album, r.genre, r.year, r.track]));
  ok(r.art && r.art.type === 'image/jpeg' && r.art.size === JPG.length, 'FLAC: the front cover picture block');
  const withId3 = await readTags(blob(bytes(tag(3, [f3('TIT2', txt(0, 'Tagged'))]), flac)));
  ok(withId3.title === 'Tagged' && withId3.art && withId3.album === '唱歌', 'FLAC behind an ID3 tag: both are read and the FLAC fills in what ID3 lacks');
}

/* ---- Ogg ---- */
const crc = [0, 0, 0, 0];
const page = (type, seq, segs, data) => bytes('OggS', 0, type, new Array(8).fill(0), le32(1), le32(seq), crc, segs.length, segs, data);
const lace = len => { const s = []; let l = len; while (l >= 255) { s.push(255); l -= 255; } s.push(l); return s; };
const oggFile = (idPacket, commentPacket) => {
  const out = [page(2, 0, [idPacket.length], idPacket)];
  let rest = commentPacket, seq = 1, first = true;
  const all = lace(commentPacket.length);
  for (let i = 0; i < all.length; i += 200) {                          /* a page holds at most 255 segments: a cover makes several */
    const segs = all.slice(i, i + 200), take = segs.reduce((a, b) => a + b, 0);
    out.push(page(first ? 0 : 1, seq++, segs, rest.subarray(0, take))); rest = rest.subarray(take); first = false;
  }
  out.push(page(0, seq, [4], [1, 2, 3, 4]));
  return bytes(...out);
};
const b64 = u => { let s = ''; u.forEach(v => { s += String.fromCharCode(v); }); return btoa(s); };
{
  const big = bytes([0xFF, 0xD8, 0xFF], new Array(150000).fill(5));
  const comm = bytes(3, 'vorbis', vcomment([['TITLE', 'Тишина'], ['ARTIST', 'Кино'], ['ALBUM', 'Группа крови'], ['GENRE', 'Rock'], ['DATE', '1988'], ['METADATA_BLOCK_PICTURE', b64(flacPic(3, big, 'image/jpeg'))]]), 1);
  const r = await readTags(blob(oggFile(bytes(1, 'vorbis', new Array(23).fill(0)), comm)));
  ok(r.title === 'Тишина' && r.artist === 'Кино' && r.year === 1988 && r.genre === 'Rock', 'Ogg Vorbis: the comment packet: ' + JSON.stringify([r.title, r.artist, r.year]));
  ok(r.art && r.art.size === big.length, 'Ogg Vorbis: a cover of 150 KB that spans several pages comes out whole (' + (r.art && r.art.size) + ')');
  const op = await readTags(blob(oggFile(bytes('OpusHead', new Array(11).fill(0)), bytes('OpusTags', vcomment([['title', '봄날'], ['artist', 'BTS']])))));
  ok(op.title === '봄날' && op.artist === 'BTS', 'Opus: OpusTags are the same comments');
}

/* ---- MP4 ---- */
const atom = (type, ...body) => { const b = bytes(...body); return bytes(be32(8 + b.length), type.split('').map(c => c.charCodeAt(0)), b); };   /* a type is four single bytes: (c) is 0xA9, not its two UTF-8 bytes */
const item = (type, kind, payload) => atom(type, atom('data', [0, 0, 0, kind], [0, 0, 0, 0], payload));
{
  const ilst = atom('ilst', item('\u00A9nam', 1, T.encode('夜明けの歌')), item('\u00A9ART', 1, T.encode('tricot')), item('\u00A9alb', 1, T.encode('3')), item('\u00A9gen', 1, T.encode('Math Rock')), item('\u00A9day', 1, T.encode('2013-05-01')),
    item('trkn', 0, [0, 0, 0, 5, 0, 12, 0, 0]), item('covr', 14, PNG));
  const moov = atom('moov', atom('mvhd', new Array(100).fill(0)), atom('udta', atom('meta', [0, 0, 0, 0], atom('hdlr', new Array(30).fill(0)), ilst)));
  const ftyp = atom('ftyp', 'M4A ', [0, 0, 0, 0], 'M4A ', 'mp42');
  const mdat = atom('mdat', new Array(5000).fill(0x11));
  for (const [label, file] of [['moov last', bytes(ftyp, mdat, moov)], ['moov first', bytes(ftyp, moov, mdat)]]) {
    const r = await readTags(blob(file));
    ok(r.title === '夜明けの歌' && r.artist === 'tricot' && r.album === '3' && r.genre === 'Math Rock' && r.year === 2013 && r.track === 5, 'M4A (' + label + '): ' + JSON.stringify([r.title, r.artist, r.album, r.genre, r.year, r.track]));
    ok(r.art && r.art.type === 'image/png', 'M4A (' + label + '): covr is the cover');
  }
}

/* ---- WAV ---- */
{
  const info = bytes('INFO', 'INAM', le32(6), 'Hello', 0, 'IART', le32(4), 'Me', 0, 0, 'IGNR', le32(6), 'Dance', 0);
  const list = bytes('LIST', le32(info.length), info);
  const wav = bytes('RIFF', le32(4 + 24 + list.length + 8), 'WAVE', 'fmt ', le32(16), new Array(16).fill(0), list, 'data', le32(0));
  const r = await readTags(blob(wav));
  ok(r.title === 'Hello' && r.artist === 'Me' && r.genre === 'Dance', 'WAV: LIST INFO: ' + JSON.stringify([r.title, r.artist, r.genre]));
}

/* ---- rubbish gives nothing and does not throw ---- */
{
  const junk = [new Uint8Array(0), bytes('ID3', 3, 0, 0, ss(10), [1, 2, 3]), bytes('fLaC', [0x84, 0xFF, 0xFF, 0xFF]), bytes('OggS', new Array(40).fill(0xFF)), bytes(new Array(8).fill(0), 'ftyp', new Array(40).fill(0xFF)), bytes(new Array(5000).fill(0x42))];
  for (const j of junk) { let r, err = null; try { r = await readTags(blob(j)); } catch (e) { err = e; } ok(!err && r && r.title === '' && !r.art, 'rubbish of ' + j.length + ' bytes gives an empty tag, not an error' + (err ? ': ' + err.message : '')); }
}
console.log(bad ? bad + ' of ' + n + ' checks FAILED' : 'all ' + n + ' checks pass');
process.exit(bad ? 1 : 0);
