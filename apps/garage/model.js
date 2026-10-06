/* What the Garage keeps in its head: which song, which track, undo, and the
   rows the grid shows. Nothing here touches the screen or the speaker. */

/* VGA16 numbers, for the tracks' colours */
export const HEX = ['#000000', '#0000AA', '#00AA00', '#00AAAA', '#AA0000', '#AA00AA', '#AA5500', '#AAAAAA',
  '#555555', '#5555FF', '#55FF55', '#55FFFF', '#FF5555', '#FF55FF', '#FFFF55', '#FFFFFF'];
export const TRACK_COLORS = [12, 10, 11, 14, 13, 9, 6, 3];
export const DRUM_ROWS = [['crash', 'CRASH'], ['ride', 'RIDE'], ['openhat', 'OPEN HAT'], ['hat', 'HI-HAT'], ['clap', 'CLAP'], ['snare', 'SNARE'],
  ['stick', 'STICK'], ['hitom', 'HI TOM'], ['midtom', 'MID TOM'], ['lotom', 'LO TOM'], ['kick', 'KICK'], ['cowbell', 'COWBELL'], ['tamb', 'TAMBOUR.'], ['shaker', 'SHAKER']];

/* the groups the instrument picker shows, with a one-line description a child can read */
export const FAMILIES = [
  ['KEYS', 'PIANOS & ORGANS'], ['MALLETS', 'TINKLY & BONGY'], ['GUITARS', 'PLUCKED STRINGS'], ['BASS', 'DEEP & LOW'],
  ['STRINGS', 'BOWED STRINGS'], ['WINDS', 'BLOWN'], ['VOICES', 'SINGERS'], ['FUN', 'BELLS & DRUMS'], ['DRUMS', 'THE DRUM KIT']
];
export const BLURB = {
  piano: 'THE BIG ONE', epiano: 'SMOOTH AND SOFT', harpsichord: 'PLINKY, FROM LONG AGO', organ: 'A WHOLE CHURCH', musicbox: 'A LULLABY',
  marimba: 'WOODEN BONGS', xylophone: 'BRIGHT TAPS', vibes: 'SHIMMERY', glock: 'LIKE SPARKLES', steeldrum: 'ISLAND SUN', kalimba: 'THUMB PIANO',
  nylon: 'SOFT GUITAR', steelgtr: 'CAMPFIRE GUITAR', eguitar: 'CLEAN ROCK GUITAR', harp: 'ANGEL STRINGS', pizz: 'PLUCKED VIOLINS',
  bass: 'THE BOOM', upright: 'JAZZY AND WARM', violin: 'SINGING STRING', cello: 'DEEP SINGING', strings: 'A WHOLE ORCHESTRA',
  flute: 'AIRY BIRD', clarinet: 'WOODY AND ROUND', trumpet: 'HERE COMES THE KING', sax: 'SMOOTH AND SMOKY', ocarina: 'A LITTLE WHISTLE',
  choir: 'AAAAH', bells: 'DING DONG', timpani: 'THUNDER DRUM', woodblock: 'TOK TOK', drums: 'BOOM TSS KAH'
};

export const MAX_TRACKS = 8, UNDO_MAX = 40;

/* the notes a pitched grid shows: top row is the highest */
export function rowsFor(lang, song, lo, hi, magic) {
  const all = magic ? lang.scaleNotes(song.key, song.scale, lo, hi) : lang.scaleNotes('C', 'chromatic', lo, hi);
  return all.reverse();
}
export const isRoot = (lang, song, n) => ((n - (lang.noteToMidi(song.key + '4') % 12)) % 12 + 12) % 12 === 0;

/* undo: snapshots of the whole song, which is small */
export function makeHistory() {
  const stack = [];
  return {
    push(song) { stack.push(JSON.stringify(song)); if (stack.length > UNDO_MAX) stack.shift(); },
    pop() { return stack.length > 1 ? (stack.pop(), JSON.parse(stack[stack.length - 1])) : null; },
    can() { return stack.length > 1; },
    reset(song) { stack.length = 0; stack.push(JSON.stringify(song)); }
  };
}

/* a note at (start, midi) in a track, or -1 */
export function noteAt(track, start, midi) {
  return track.notes.findIndex(n => n[2] === midi && start >= n[0] - 1e-6 && start < n[0] + n[1] - 1e-6);
}
export function hitAt(track, start, key) {
  return (track.hits || []).findIndex(h => h[1] === key && Math.abs(h[0] - start) < 1e-6);
}
export const sortTrack = t => { t.notes.sort((a, b) => a[0] - b[0]); if (t.hits) t.hits.sort((a, b) => a[0] - b[0]); };
