/* What a file says about itself: title, artist, album, genre, year, track number, and the picture on its cover, from whatever the file is: MP3 (ID3 v2.2, v2.3, v2.4, and
   the v1 tag), FLAC, Ogg Vorbis, Opus, MP4 / M4A / AAC, WAV. Nothing here decodes audio and nothing throws: a tag that cannot be read is a tag that is not there, and the
   disc is named after its file. `readTags(blob)` is what the Stack imports with; `hifiTags(arraybuffer)` is the old synchronous call, MP3 only (pure apart from Blob). */
import { ascii, clean } from './tags_util.js';
import { parseID3, parseID3v1, id3Size } from './tags_id3.js';
import { readFlac, readOgg, readMp4, readWav } from './tags_cont.js';

const rd = async (blob, a, b) => new Uint8Array(await blob.slice(a, Math.min(blob.size, b)).arrayBuffer());
const blank = () => ({ title: '', artist: '', album: '', genre: '', year: null, track: null, art: null });
const fill = (a, b) => { ['title', 'artist', 'album', 'genre'].forEach(k => { if (!a[k]) a[k] = b[k] || ''; }); if (!a.year) a.year = b.year; if (a.track == null) a.track = b.track; if (!a.art) a.art = b.art; return a; };

export async function readTags(blob) {
  let out = blank();
  try {
    const head = await rd(blob, 0, 16);
    if (ascii(head, 0, 3) === 'ID3') {
      const size = id3Size(head);
      out = parseID3(await rd(blob, 0, Math.min(size, 24 * 1048576)));
      const next = await rd(blob, size, size + 4);                       /* a FLAC with an ID3 tag in front of it */
      if (ascii(next, 0, 4) === 'fLaC') out = fill(out, await readFlac(blob, size));
    } else if (ascii(head, 0, 4) === 'fLaC') out = await readFlac(blob, 0);
    else if (ascii(head, 0, 4) === 'OggS') out = await readOgg(blob);
    else if (ascii(head, 4, 4) === 'ftyp') out = await readMp4(blob);
    else if (ascii(head, 0, 4) === 'RIFF' && ascii(head, 8, 4) === 'WAVE') out = await readWav(blob);
    if (!out.title && !out.artist && blob.size > 128) out = fill(out, parseID3v1(await rd(blob, blob.size - 128, blob.size)));
  } catch (e) { /* a file this cannot read is a file with no tags */ }
  ['title', 'artist', 'album', 'genre'].forEach(k => { out[k] = clean(out[k]); });
  return out;
}

/* the old call: an ArrayBuffer of the start of an MP3 -> { title, artist, art } */
export function hifiTags(ab) {
  const u = new Uint8Array(ab), t = parseID3(u);
  return { title: t.title || null, artist: t.artist || null, art: t.art };
}
export { parseID3, parseID3v1 };
