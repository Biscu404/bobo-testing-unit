/* The practice song of the Studio Course: SUNDAY MORNING. Four tracks with fixed ids (p_mel, p_chd, p_bas, p_drm), so the course can
   follow them whatever you rename them. It is flawed on purpose: the tune is an octave too low, so the first real job (transpose it up)
   has an audible reason, and the strings and the bass are in each other's way, so the EQ chapter has one too. */
export const PRACTICE_TITLE = 'SUNDAY MORNING';

export function practiceSong(L) {
  const prog = ['C', 'Am', 'F', 'G', 'C', 'Am', 'F', 'G'];
  const s = L.buildSong({ title: PRACTICE_TITLE, bpm: 92, key: 'C', scale: 'major', bars: 8, tracks: [
    { name: 'MELODY', inst: 'piano', vol: 0.8, reverb: 0.2, notes: 'E3:q G3 C4 G3 | A3:q C4 E4:h | A3:q C4 F4 C4 | B3:q D4 G4:h | E4:q C4 G3 E3 | A3:q C4 E4 C4 | F3:q A3 C4 A3 | G3:q B3 D4:h' },
    { name: 'CHORDS', inst: 'strings', vol: 0.6, reverb: 0.15, notes: L.chordLine(prog, 4, 'pad', 52) },
    { name: 'BASS', inst: 'upright', vol: 0.8, reverb: 0.02, notes: L.bassLine(prog, 4, 'root') },
    { name: 'DRUMS', drums: { kick: 'x...x...x...x...', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.x.' }, vol: 0.6 }] });
  ['p_mel', 'p_chd', 'p_bas', 'p_drm'].forEach((id, i) => { s.tracks[i].id = id; });
  s.course = 'practice';
  return s;
}
