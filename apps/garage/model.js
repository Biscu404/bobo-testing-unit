/* What the Garage keeps in its head: the rows the grid shows, the grid a note
   snaps to, and undo and redo. Nothing here touches the screen or the speaker. */

/* VGA16 numbers, for the tracks' colours */
export const HEX = ['#000000', '#0000AA', '#00AA00', '#00AAAA', '#AA0000', '#AA00AA', '#AA5500', '#AAAAAA',
  '#555555', '#5555FF', '#55FF55', '#55FFFF', '#FF5555', '#FF55FF', '#FFFF55', '#FFFFFF'];
export const TRACK_COLORS = [12, 10, 11, 14, 13, 9, 6, 3, 5, 2, 4, 1, 8, 15, 7, 0];
export const DRUM_ROWS = [['crash', 'CRASH'], ['ride', 'RIDE'], ['openhat', 'OPEN HAT'], ['hat', 'HI-HAT'], ['clap', 'CLAP'], ['snare', 'SNARE'],
  ['stick', 'STICK'], ['hitom', 'HI TOM'], ['midtom', 'MID TOM'], ['lotom', 'LO TOM'], ['kick', 'KICK'], ['cowbell', 'COWBELL'], ['tamb', 'TAMBOUR.'], ['shaker', 'SHAKER']];

/* the groups the instrument picker shows, with a short line on each */
export const FAMILIES = [
  ['KEYS', 'PIANOS & ORGANS'], ['MALLETS', 'TUNED PERCUSSION'], ['GUITARS', 'PLUCKED STRINGS'], ['BASS', 'LOW END'],
  ['STRINGS', 'BOWED STRINGS'], ['WINDS', 'BLOWN'], ['VOICES', 'CHOIR'], ['FUN', 'BELLS & DRUMS'], ['DRUMS', 'THE DRUM KIT']
];
export const BLURB = {
  piano: 'CONCERT GRAND', epiano: 'WARM TINES', harpsichord: 'BAROQUE PLUCK', organ: 'CHURCH PIPES', musicbox: 'LULLABY COMB', marimba: 'WOODEN BARS',
  xylophone: 'BRIGHT BARS', vibes: 'SHIMMERING METAL', glock: 'SPARKLE TOP END', steeldrum: 'ISLAND PAN', kalimba: 'THUMB PIANO',
  nylon: 'SOFT CLASSICAL', steelgtr: 'ACOUSTIC STRUM', eguitar: 'CLEAN ELECTRIC', harp: 'GLISSANDO', pizz: 'PLUCKED STRINGS',
  bass: 'ELECTRIC FINGER BASS', upright: 'JAZZ STANDUP', violin: 'LEAD STRING', cello: 'DEEP BOWED', strings: 'FULL SECTION',
  flute: 'AIRY', clarinet: 'WOODY AND ROUND', trumpet: 'BRASS LEAD', sax: 'SMOKY', ocarina: 'BREATHY WHISTLE',
  choir: 'AAH VOWEL', bells: 'TUBULAR BELLS', timpani: 'ORCHESTRAL DRUM', woodblock: 'DRY CLICK', drums: 'THE STUDIO KIT'
};

export const MAX_TRACKS = 16, UNDO_MAX = 80;

/* the grids a note can snap to, in beats (a beat is a quarter note); null is "one bar" */
export const SNAPS = [['BAR', null], ['1/2', 2], ['1/4', 1], ['1/8', 0.5], ['1/16', 0.25], ['1/32', 0.125], ['1/8T', 1 / 3], ['1/16T', 1 / 6], ['OFF', 0]];
export const snapBeats = (song, i) => { const v = SNAPS[i][1]; return v == null ? song.beats : v; };
export const snapTo = (v, step) => step > 0 ? Math.round(v / step) * step : v;

/* the notes a pitched grid shows: top row is the highest */
export function rowsFor(lang, song, lo, hi, magic) {
  const all = magic ? lang.scaleNotes(song.key, song.scale, lo, hi) : lang.scaleNotes('C', 'chromatic', lo, hi);
  return all.reverse();
}
export const isRoot = (lang, song, n) => ((n - (lang.noteToMidi(song.key + '4') % 12)) % 12 + 12) % 12 === 0;
export const isBlack = n => [1, 3, 6, 8, 10].indexOf(((n % 12) + 12) % 12) >= 0;

/* undo and redo: snapshots of the whole song, which is small. `can()` is whether there is something to take back, `canRedo()` something to put again. */
export function makeHistory() {
  let stack = [], at = -1;
  return {
    push(song) {
      stack = stack.slice(0, at + 1);
      stack.push(JSON.stringify(song));
      if (stack.length > UNDO_MAX) stack.shift();
      at = stack.length - 1;
    },
    undo() { if (at <= 0) return null; at--; return JSON.parse(stack[at]); },
    redo() { if (at >= stack.length - 1) return null; at++; return JSON.parse(stack[at]); },
    can() { return at > 0; },
    canRedo() { return at < stack.length - 1; },
    reset(song) { stack = [JSON.stringify(song)]; at = 0; }
  };
}
