/* The Studio Course, part two: WRITE A SONG. You choose a genre and the course turns into that genre's recipe: the tempo, the scale,
   the drums, the bass, the chords, the tune, the one trick that makes it feel like itself, the form and the mix, each as a step with
   goals the course can see in your song (course_rules.js). All the advice is the genre's own (course_genres*.js), so a waltz teaches
   you the oom-pah-pah and a lo-fi track teaches you to humanize and roll off the top. */
import { POP, ROCK, LOFI } from './course_genres.js';
import { DANCE, WALTZ, LULLABY, EPIC } from './course_genres_b.js';
import { roles, noteCount, pc } from './course_util.js';

export const GENRES = [POP, ROCK, LOFI, DANCE, WALTZ, LULLABY, EPIC];
const SCALE_NAME = { major: 'MAJOR', minor: 'MINOR', pentatonic: 'MAGIC 5 (HAPPY)', pentaminor: 'MAGIC 5 (MOODY)', blues: 'BLUES', dorian: 'DORIAN' };
const KEY_NAME = { 'F#': 'F#', Eb: 'Eb', Bb: 'Bb' };
const list = a => a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' or ' + a[a.length - 1];

/* the bar-by-bar chords and their notes, for the {CHORDS} and {TONES} in the text */
export function chordText(L, song, g) {
  const ch = L.progression(song.key, song.scale, g.prog, Math.min(song.bars, 8));
  return ['> BAR  ' + ch.map((_, i) => String(i + 1).padStart(3)).join(' '), '> CHORD' + ch.map(c => c.padStart(4)).join('')];
}
export function toneText(L, song, g) {
  const seen = [], out = [];
  L.progression(song.key, song.scale, g.prog, Math.min(song.bars, 8)).forEach(c => { if (seen.indexOf(c) < 0) { seen.push(c); out.push('> ' + (c + ' ').padEnd(5) + L.chordNotes(c, 55).map(n => L.midiToName(n)).join(' ') + (/m7|maj7/.test(c) ? '' : '')); } });
  return ['> THE CHORDS IN YOUR KEY, BAR BY BAR: ' + L.progression(song.key, song.scale, g.prog, Math.min(song.bars, 8)).join(' ')].concat(out);
}
export function patternText(g) {
  return Object.keys(g.kit || {}).map(p => '> ' + p.toUpperCase().padEnd(8) + g.kit[p].split('').join(' '));
}

export function genreSteps(g) {
  const ctx = C => ({ L: C.L, R: roles(C.song, g), g });
  const wrap = rule => C => rule(C.song, ctx(C));
  const goals = key => (g.goals[key] || []).map(([t, f]) => [t, wrap(f)]);
  const P = key => g.parts[key] || [];
  const step = (id, title, o) => Object.assign({ id: 'w_' + g.id + '_' + id, title, genre: g.id, say: P(id) }, o);
  const NEW = 'btn:+ TRACK';
  const steps = [
    step('fresh', 'A BLANK PAGE', {
      say: ['We are going to write a ' + g.name + ' song from nothing, the way a producer would: tempo and key first, then the rhythm section, then the tune, then the polish. ' + g.blurb, 'Start from an empty song. NEW asks about anything unsaved first.'],
      goals: [['An empty song: one empty track and nothing else.', C => noteCount(C.song) === 0 && C.song.tracks.length <= 1]],
      action: [['NEW SONG', C => C.api.newSong()]], target: ['btn:NEW']
    }),
    step('tempo', 'TEMPO AND METER', {
      goals: [['Set BPM between ' + g.bpm[0] + ' and ' + g.bpm[1] + '.', C => C.song.bpm >= g.bpm[0] && C.song.bpm <= g.bpm[1]]]
        .concat(g.beats !== 4 ? [['Set BEATS to ' + g.beats + ' (the select next to TAP).', C => C.song.beats === g.beats]] : [])
        .concat(g.swing ? [['Set SWING to ' + Math.round(g.swing * 100) + '%.', C => (C.song.swing || 0) >= g.swing - 0.01]] : [])
        .concat([['Set BARS to ' + g.bars + '.', C => C.song.bars >= g.bars]]),
      target: ['css:.g-bpmbox', 'sel:BEATS IN A BAR', 'sel:THE OFF-BEAT', 'css:.g-barbox'],
      hint: 'Type the tempo into the BPM box and press Enter. The BEATS and SWING boxes are selects. BARS is in the second bar of buttons.'
    }),
    step('key', 'KEY AND SCALE', {
      goals: [['Pick the KEY: ' + list(g.keys.map(k => KEY_NAME[k] || k)) + '.', C => g.keys.indexOf(C.song.key) >= 0], ['Pick the SCALE: ' + list(g.scales.map(s => SCALE_NAME[s])) + '.', C => g.scales.indexOf(C.song.scale) >= 0], ['MAGIC NOTES on, so the roll hides the wrong notes.', C => C.G.magic]],
      target: ['sel:THE KEY', 'sel:THE SCALE', 'btn:MAGIC NOTES'],
      hint: 'KEY and SCALE are the two selects after BEATS. They change which rows of the roll are lit, not the notes you have already written.'
    })
  ];
  /* the rhythm section */
  if (g.noDrums) steps.push(step('drums', 'NO DRUMS, ON PURPOSE', { manual: true, target: ['btn:+ TRACK'] }));
  else steps.push(step('drums', g.id === 'epic' ? 'THE TIMPANI' : 'THE BEAT', { goals: goals('drums'), target: [NEW, 'zone:roll'], hint: g.id === 'epic' ? 'Pick TIMPANI under FUN. Draw with the DRAW tool: click a row in the roll for a note, drag its right edge to make it longer.' : 'The drum grid is a step sequencer: DRAW switches a cell on or off. Pick bar 1 on the ruler (drag along it) and press x4 to repeat it three more times. DUPLICATE copies a selected note instead of the stretch, so press Esc first.' }));
  steps.push(step('bass', 'THE BASS', { goals: goals('bass'), target: [NEW, 'zone:roll'], hint: 'Pick the track, then draw in the low rows of the roll. SNAP at 1/4 puts notes on beats.' }));
  steps.push(step('chords', 'THE CHORDS', { goals: goals('chords'), target: [NEW, 'zone:roll'], hint: 'Click three rows one above another at the same beat to stack a chord. Drag a note\'s right edge to hold it. CTRL+C and CTRL+V copy a bar of chords to the next.' }));
  steps.push(step('melody', 'THE TUNE', {
    goals: goals('melody').concat([['Press PLAY and hear all of it together.', C => !!C.api.player()]]), target: ['zone:roll', 'btn:PLAY'],
    hint: 'The first track (MELODY) is already there: press its instrument name to change the sound. With MAGIC NOTES on every row you can click is in the key.'
  }));
  steps.push(step('dyn', g.id === 'rock' ? 'THE FILL' : g.id === 'dance' ? 'THE BUILD' : g.id === 'lofi' ? 'MAKE IT CROOKED' : g.id === 'waltz' ? 'THE ACCENT' : g.id === 'lullaby' ? 'PLAY IT SOFTLY' : g.id === 'epic' ? 'THE CRESCENDO' : 'THE LIFT', {
    goals: goals('dyn'), target: ['btn:MORE', 'zone:roll', 'zone:vel'],
    hint: 'MORE has TRANSPOSE, HUMANIZE, LEGATO and HARDER/SOFTER. The strip at the bottom of the roll (the velocity lane) sets how hard each note is hit.'
  }));
  steps.push(step('form', 'FROM A PHRASE TO A SONG', {
    goals: goals('form'), target: ['zone:ruler', 'btn:DUPLICATE'],
    hint: 'Drag along the ruler to pick bars 1 to 8 (or double-click bar by bar). The strip of buttons that appears has DUPLICATE: it copies the stretch straight after itself (press Esc first if a note is selected: DUPLICATE copies selected notes in preference).'
  }));
  steps.push(step('mix', 'THE MIX', {
    goals: [['Open the MIXER: press the MIXER tab (or TAB).', C => C.G.dock === 'mixer']].concat(goals('mix')), target: ['btn:MIXER', 'css:.g-mixer'],
    hint: 'Each track has a strip: VOL, LO MID HI, PAN, COMP, DRIVE, ROOM, ECHO. The LIMITER is on the MASTER strip at the end.'
  }));
  steps.push(step('save', 'KEEP IT', {
    say: ['Songs live in HOME/SONGS once you save them. Name it and it is yours: you can open it again from OPEN, export it as a WAV or a MIDI file, or send it to the Stack as a disc.'],
    goals: [['Press SAVE and name your ' + g.name + ' song.', C => !!C.G.path && !C.G.dirty]], target: ['btn:SAVE']
  }));
  steps.push(step('end', 'YOU WROTE ONE', {
    manual: true, target: ['btn:EXPORT'],
    say: ['That is a ' + g.name + ' song, written by you: ' + g.feel + '.', 'You chose a tempo and a scale that suit the genre, built the beat, the bass and the chords the way that style does, wrote a tune of your own, added the one trick that makes it ' + g.name + ', stretched it into a song and mixed it.', 'EXPORT will bake it into a WAV. Or come back to the course and choose a different genre: each one asks for different things.']
  }));
  return steps;
}
export const genreById = id => GENRES.find(g => g.id === id) || null;
void pc;
