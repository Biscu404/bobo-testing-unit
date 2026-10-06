/* Songs that come with the Garage. They are written in the notation of
   kernel/songtext.js, which is also how new ones are written: a title, a key, a
   tempo, and for each track an instrument and its notes as text. The first
   three are old tunes anyone knows (so a first-timer can hear what the grid
   is doing); the rest are new. */
export function demoSongs(L) {
  const bass = (ch, mode) => L.bassLine(ch, 4, mode);
  const chords = (ch, mode, base) => L.chordLine(ch, 4, mode, base);
  const S = [];
  const add = (spec, extra) => {
    const song = L.buildSong(spec);
    (extra || []).forEach(t => song.tracks.push(L.newTrack(t)));
    S.push(song);
  };

  const tw = ['C', 'F', 'C', 'G', 'C', 'C', 'C', 'G', 'C', 'F', 'C', 'C'];
  add({ title: 'TWINKLE TWINKLE', bpm: 100, key: 'C', scale: 'major', bars: 12, tracks: [
    { name: 'MELODY', inst: 'musicbox', reverb: 0.35, notes: 'C5:q C5 G5 G5 | A5 A5 G5:h | F5:q F5 E5 E5 | D5 D5 C5:h | G5:q G5 F5 F5 | E5 E5 D5:h | G5:q G5 F5 F5 | E5 E5 D5:h | C5:q C5 G5 G5 | A5 A5 G5:h | F5:q F5 E5 E5 | D5 D5 C5:h' } ] },
  [{ name: 'HARP', inst: 'harp', notes: chords(tw, 'arp', 55), vol: 0.6, reverb: 0.4 },
   { name: 'CELLO', inst: 'cello', notes: bass(tw, 'root'), vol: 0.55, reverb: 0.2 }]);

  const ode = ['C', 'G', 'C', 'G', 'C', 'G', 'C', 'C'];
  add({ title: 'ODE TO JOY', bpm: 108, key: 'C', scale: 'major', bars: 8, tracks: [
    { name: 'TUNE', inst: 'clarinet', reverb: 0.25, notes: 'E4:q E4 F4 G4 | G4 F4 E4 D4 | C4 C4 D4 E4 | E4:q. D4:e D4:h | E4:q E4 F4 G4 | G4 F4 E4 D4 | C4 C4 D4 E4 | D4:q. C4:e C4:h' },
    { name: 'DRUMS', drums: { kick: 'x...x...x...x...', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.x.' }, vol: 0.7 } ] },
  [{ name: 'STRINGS', inst: 'strings', notes: chords(ode, 'pad', 55), vol: 0.5, reverb: 0.4 }, { name: 'BASS', inst: 'upright', notes: bass(ode, 'root5'), vol: 0.8, reverb: 0.02 }]);

  const lamb = ['C', 'C', 'G', 'C', 'C', 'C', 'G', 'C'];
  add({ title: 'MARY HAD A LAMB', bpm: 112, key: 'C', scale: 'major', bars: 8, tracks: [
    { name: 'TUNE', inst: 'xylophone', reverb: 0.2, notes: 'E4:q D4 C4 D4 | E4 E4 E4:h | D4:q D4 D4:h | E4:q G4 G4:h | E4:q D4 C4 D4 | E4 E4 E4 E4 | D4 D4 E4 D4 | C4:w' },
    { name: 'GUITAR', inst: 'nylon', notes: chords(lamb, 'strum', 52), vol: 0.6, reverb: 0.25 },
    { name: 'DRUMS', drums: { kick: 'x.......x.......', hat: 'x.x.x.x.x.x.x.x.', shaker: '..x...x...x...x.' }, vol: 0.5 } ] },
  [{ name: 'BASS', inst: 'bass', notes: bass(lamb, 'root'), vol: 0.7, reverb: 0.02 }]);

  const moon = ['F', 'Dm', 'F', 'C', 'F', 'Dm', 'C', 'F'];
  add({ title: 'SLEEPY MOON', bpm: 72, key: 'F', scale: 'pentatonic', bars: 8, tracks: [
    { name: 'MUSIC BOX', inst: 'musicbox', reverb: 0.45, notes: 'A4:q C5 D5 C5 | A4:h G4:h | F4:q G4 A4 C5 | A4:w | C5:q D5 F5 D5 | C5:h A4:h | G4:q A4 G4 F4 | F4:w' } ] },
  [{ name: 'HARP', inst: 'harp', notes: chords(moon, 'arp', 53), vol: 0.5, reverb: 0.5 },
   { name: 'CHOIR', inst: 'choir', notes: chords(moon, 'pad', 53).map(n => [n[0], n[1], n[2], 0.4]), vol: 0.35, reverb: 0.55 }]);

  const beach = ['G', 'G', 'C', 'D', 'G', 'Em', 'C', 'G'];
  add({ title: 'BEACH DAY', bpm: 108, swing: 0.5, key: 'G', scale: 'pentatonic', bars: 8, tracks: [
    { name: 'STEEL DRUM', inst: 'steeldrum', reverb: 0.3, notes: 'G4:e B4 D5:q D5:e B4 G4:q | A4:e B4 D5:q E5:h | D5:e B4 G4:q B4:e D5 E5:q | D5:h G4:h | E5:e D5 B4:q D5:e E5 G5:q | E5:e D5 B4:q A4:h | G4:e A4 B4:q D5:e B4 A4:q | G4:w' },
    { name: 'GUITAR', inst: 'steelgtr', notes: chords(beach, 'strum', 55), vol: 0.55, reverb: 0.2 },
    { name: 'DRUMS', drums: { kick: 'x.....x...x.....', shaker: 'x.x.x.x.x.x.x.x.', tamb: '....x.......x...' }, vol: 0.55 } ] },
  [{ name: 'BASS', inst: 'upright', notes: bass(beach, 'root5'), vol: 0.8, reverb: 0.02 }]);

  const robot = ['Am', 'F', 'C', 'G', 'Am', 'F', 'C', 'G'];
  add({ title: 'ROBOT PARTY', bpm: 124, key: 'A', scale: 'pentaminor', bars: 8, tracks: [
    { name: 'RIFF', inst: 'epiano', reverb: 0.2, notes: 'A4:e A4 C5 A4 E5:q D5:e C5 | A4:e A4 C5 A4 G4:q A4:q | A4:e A4 C5 A4 E5:q D5:e C5 | D5:e C5 A4 G4 E4:h | E5:e E5 D5 C5 D5:q C5:q | A4:e C5 D5 E5 G5:h | E5:e E5 D5 C5 D5:q C5:q | A4:w' },
    { name: 'DRUMS', drums: { kick: 'x...x...x...x...', clap: '....x.......x...', hat: '..x...x...x...x.', openhat: '.......x.......x' }, vol: 0.75 } ] },
  [{ name: 'BASS', inst: 'bass', notes: bass(robot, 'offbeat'), vol: 0.85, reverb: 0.02 }, { name: 'STABS', inst: 'strings', notes: chords(robot, 'stab', 55), vol: 0.4, reverb: 0.3 }]);

  const castle = ['Dm', 'Dm', 'Bb', 'Dm', 'Dm', 'Gm', 'C', 'Dm'];
  add({ title: 'THE CASTLE', bpm: 84, key: 'D', scale: 'pentaminor', bars: 8, tracks: [
    { name: 'HARPSICHORD', inst: 'harpsichord', reverb: 0.4, notes: 'D4:q F4 A4 D5 | C5:h A4:q G4 | F4:q G4 A4 C5 | D5:w | A4:q D5 F5 D5 | C5:q A4 G4:h | F4:q G4 F4 D4 | D4:w' },
    { name: 'STRINGS', inst: 'strings', notes: chords(castle, 'pad', 50), vol: 0.45, reverb: 0.45 },
    { name: 'DRUMS', drums: { kick: 'x...............', hat: '................' }, vol: 0.4 } ] },
  [{ name: 'CELLO', inst: 'cello', notes: bass(castle, 'root'), vol: 0.7, reverb: 0.3 },
   { name: 'TIMPANI', inst: 'timpani', notes: castle.flatMap((c, b) => [[b * 4, 2, L.chordNotes(c, 38)[0], 0.8]]), vol: 0.5, reverb: 0.3 }]);
  return S;
}
