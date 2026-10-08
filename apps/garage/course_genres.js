/* Genres for the Studio Course, part one: POP, ROCK, LO-FI. A genre is what a person who makes that kind of music would tell you across a
   desk: the tempo, the scale, what the drums do, what the bass does, how the chords are played, what the tune is like, the one trick
   that makes it feel like the genre, and how it is mixed. `parts` is the help for each stage, with the goals that the course checks
   (course_rules.js), and `model(L)` is a whole song that passes every goal, so course_check.js can prove the course can be finished.
   In the text, {CHORDS} is the chords of the song as it is now, {TONES} their notes, and a line that begins with > is set in a block. */
import * as R from './course_rules.js';

const STR = ['strings', 'organ', 'epiano', 'synthpad', 'piano', 'choir'], BASS = ['bass', 'upright', 'synthbass', 'tuba', 'cello'];
const LEAD = ['piano', 'flute', 'musicbox', 'marimba', 'vibes', 'clarinet', 'sax', 'trumpet', 'violin', 'steelgtr', 'nylon', 'synthlead', 'ocarina', 'oboe', 'kalimba'];
const rep = (txt, n) => Array(n).fill(txt).join(' | ');

export const POP = {
  id: 'pop', name: 'POP', blurb: 'Four chords everybody knows, a tune you can hum, a beat you can clap.', feel: '104-124 BPM  -  MAJOR  -  BRIGHT AND SQUARE',
  bpm: [104, 124], beats: 4, swing: 0, scales: ['major'], keys: ['G', 'D', 'F'], prog: 'pop', bars: 8, form: 16, chordPoly: 3,
  kit: { kick: 'x.......x.x.....', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.x.' },
  parts: {
    tempo: ['Pop lives between 104 and 124 beats a minute: quick enough to move you, slow enough to sing over. About 110 is where the radio sits.', 'Four beats to the bar and no swing. Pop is square on purpose, so the tune is the only thing that has to wobble.'],
    key: ['Pop is written in MAJOR, the sound of everything being fine. The happy MAGIC 5 scale is safe but a little plain; the full MAJOR gives the tune seven notes to choose from, and the chords need them.', 'Pick G, D or F: no more than two sharps or one flat, so the tune stays easy to sing. Leave MAGIC NOTES on and the roll hides every note that would clash.'],
    drums: ['The pop beat is a heartbeat with a clap on top: KICK on beats 1 and 3 (and a little push before 3), SNARE on 2 and 4, and the HI-HAT ticking every eighth note. In the drum grid a bar is 16 columns, so the beats fall on columns 1, 5, 9 and 13.',
      'Add the kit with + TRACK and pick DRUMS. Draw bar 1 as below, then fill the song: drag along the ruler to pick bar 1 and press x4 (that is four bars), then pick bars 1 to 4 and press DUPLICATE (press Esc first, so no single note is selected) and all eight have it.', '{PATTERN}'],
    bass: ['The bass is the floor everything stands on. Put the ROOT of each chord on the first beat of every bar and the song always knows where it is. Keep to the bottom of the roll.', '{CHORDS}'],
    chords: ['Chords are what turns a tune into a song. In pop a pad (STRINGS or ORGAN) holds each chord for the whole bar so it glows behind the singer. Stack its three notes at the start of every bar and draw them four beats long.', '{TONES}'],
    melody: ['Now the part people will remember. A pop tune mostly moves by step, repeats a short idea (that is the hook) and lands on a note of the chord at the end. Keep it in the singing range: around the octave above middle C.',
      'Pick a lead: PIANO, FLUTE, MUSIC BOX or MARIMBA. Write at least a dozen notes across four or more bars, mixing short notes and long ones, and say your first idea again in bar 3 or 4.'],
    dyn: ['A song needs a lift. In pop the chorus is higher than the verse: the same ideas, pitched up, as if the song has opened its arms.', 'Drag a box round the lead\'s notes in bars 5 to 8, then press the UP arrow (or MORE and TRANSPOSE UP A SEMITONE) until that half sits about two notes higher than the first.'],
    form: ['Eight bars is a verse. Pop is verse and chorus: drag along the ruler to pick bars 1 to 8, press DUPLICATE, and the song doubles to 16 bars. Make sure every track plays all the way to the end.'],
    mix: ['Mixing is deciding who stands in front. In pop it is always the TUNE: put the lead a little above the chords, give the chords some ROOM so they sit behind it, and set the limiter to -3 dB so a loud chorus cannot clip.', 'Open the MIXER (TAB).']
  },
  goals: {
    drums: [['Add a DRUMS track.', R.hasInst(['drums'])], ['Draw the beat in bar 1: kick on 1 and 3, snare on 2 and 4, a hat on every eighth.', R.all(R.kit({ kick: [0, 8], snare: [4, 12] }), R.hats(6, ['hat', 'openhat', 'ride']))], ['Fill all the bars with it.', R.kit({ kick: [0, 8], snare: [4, 12] }, true)]],
    bass: [['Add a bass: + TRACK, then BASS or UPRIGHT.', R.hasInst(BASS)], ['The chord\'s root on the first beat of every bar.', R.bassRoots(0)]],
    chords: [['Add a pad: STRINGS, ORGAN or E-PIANO.', R.hasInst(STR)], ['One chord a bar, three notes, held the whole bar.', R.all(R.chordsOn([0], 3), R.chordsHeld(3.5))]],
    melody: [['Add a lead (the track that is already there will do).', R.hasInst(LEAD)], ['12 to 40 notes over 4 or more bars, in the key, short and long.', R.melody({ min: 12, max: 40, bars: 4 })], ['End on a note of the last chord.', R.ends]],
    dyn: [['Lift bars 5-8 of the lead by two semitones or more on average.', R.lift(2)]],
    form: [['Make the song 16 bars long.', R.longer(16)], ['Keep all the tracks going to the last bar.', R.everyBarPlays]],
    mix: [['Lead 10 points above the chords on VOL.', R.louder(0.1)], ['Chords ROOM at 25 or more.', R.mix([['chords', 'reverb', '>=', 0.25]])], ['Limiter at -3 dB.', R.mix([['master', 'limit', '==', -3]])]]
  },
  model(L) {
    const ch = L.progression('G', 'major', 'pop', 16), A = 'E5:q E5 G5 E5 | D5:q D5 E5:h | E5:q E5 G5 A5 | G5:w | A5:q A5 C6 A5 | G5:q G5 A5:h | A5:q G5 E5 D5 | C5:w';
    const tune = L.parseNotes(A + ' | ' + A).map(n => [n[0], n[1], n[2] + 7, n[3]]);
    const s = L.buildSong({ title: 'MODEL POP', bpm: 110, key: 'G', scale: 'major', bars: 16, tracks: [{ name: 'DRUMS', drums: this.kit, vol: 0.8 },
      { name: 'BASS', inst: 'bass', notes: L.bassLine(ch, 4, 'root5'), vol: 0.8 }, { name: 'PAD', inst: 'strings', notes: L.chordLine(ch, 4, 'pad', 55), vol: 0.5, reverb: 0.35 },
      { name: 'TUNE', inst: 'piano', notes: tune, vol: 0.9 }] });
    s.limit = -3; return s;
  }
};

export const ROCK = {
  id: 'rock', name: 'ROCK', blurb: 'Loud guitars, a pounding kit and a riff that will not leave.', feel: '112-150 BPM  -  MINOR PENTATONIC  -  DRIVEN',
  bpm: [112, 150], beats: 4, swing: 0, scales: ['pentaminor', 'minor', 'blues'], keys: ['A', 'E', 'D'], prog: 'rock', bars: 8, form: 16, chordPoly: 2,
  kit: { kick: 'x.......x.x.....', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.x.', crash: 'x...............' },
  parts: {
    tempo: ['Rock wants energy: 112 to 150 beats a minute, with 128 a good place to start. Slower feels heavy, faster feels punk.', 'Straight four beats, no swing: a rock beat is square and hits hard.'],
    key: ['Rock lives on the minor pentatonic, five notes that sound tough whatever you play over them. MAGIC 5 (MOODY) is exactly that scale; MINOR and BLUES work too.', 'Pick A, E or D: they are the open strings of a guitar, which is why so much rock is in them.'],
    drums: ['The rock beat is the pop beat with more weight. KICK on 1 and 3 with a push on the "and" of 3, SNARE on 2 and 4 (the backbeat: make it loud), HI-HAT on every eighth, and a CRASH on the 1 to open the bar.',
      'Add DRUMS with + TRACK, draw bar 1 as below, then fill all eight bars: pick bar 1 on the ruler and press x4, then pick bars 1 to 4 and press DUPLICATE (Esc first, so no single note is selected).', '{PATTERN}'],
    bass: ['A rock bass does not wait: it pumps eighth notes on the root, a driving pulse that glues kick and guitar together. Eight short notes a bar, all on the chord\'s root, starting on beat 1.', '{CHORDS}'],
    chords: ['The guitar plays power chords: just the root and the fifth, struck hard and short. With only two notes they stay tight even when they are loud. Hit them on beats 1 and 3 of every bar.', 'Add a track with E-GUITAR (or DISTORTION GUITAR) and draw the root and the fifth together, a short note each.', '{TONES}'],
    melody: ['A rock riff is short, simple and said again: one bar, five or six notes, using the pentatonic notes you chose. Play it, then play it again, and let the repeat do the work.', 'Pick a lead, draw the riff in bars 1 and 2 and copy it along the song. At least ten notes, and some of them should repeat the same shape.'],
    dyn: ['Every rock bar before a change ends with a fill: the drummer runs round the toms so the next section arrives with a bang. Do it in bar 8.', 'Switch the roll to DRUMS, and in the last bar draw at least four hits on HI TOM, MID TOM and LO TOM.'],
    form: ['Verse then chorus: pick bars 1 to 8 on the ruler, press DUPLICATE, and you have a 16-bar song. The fill you drew tells everyone where the second half begins.'],
    mix: ['Rock is mixed hot. DRIVE on the guitar makes it bite, COMP on the bass keeps every note the same weight, the drums sit loud in the middle, and the limiter at -3 dB stops the crash from clipping.', 'Open the MIXER (TAB).']
  },
  goals: {
    drums: [['Add a DRUMS track.', R.hasInst(['drums'])], ['Bar 1: kick on 1, 3 and the push, snare on 2 and 4, a crash on 1, hats on the eighths.', R.all(R.kit({ kick: [0, 8, 10], snare: [4, 12], crash: [0] }), R.hats(6, ['hat', 'openhat', 'ride']))], ['Fill all the bars with it.', R.kit({ kick: [0, 8, 10], snare: [4, 12] }, true)]],
    bass: [['Add a bass: + TRACK, then BASS.', R.hasInst(BASS)], ['Eighth notes on the root, six or more a bar, starting on beat 1.', R.bassBusy(6)]],
    chords: [['Add an E-GUITAR (or DISTORTION GUITAR) track.', R.hasInst(['eguitar', 'distgtr', 'steelgtr'])], ['Power chords (root and fifth) on beats 1 and 3 of every bar.', R.chordsOn([0, 2], 2)]],
    melody: [['Add a lead (a synth lead, trumpet or the guitar again).', R.hasInst(LEAD.concat(['synthlead', 'distgtr', 'eguitar']))], ['A riff of 10 to 36 notes over 3 or more bars that says the same shape twice.', R.melody({ min: 10, max: 60, bars: 3, repeat: true })], ['End on a note of the last chord.', R.ends]],
    dyn: [['A tom fill in bar 8: four or more hits on the toms.', R.fill(4)]],
    form: [['Make the song 16 bars long.', R.longer(16)], ['Keep all the tracks going to the last bar.', R.everyBarPlays]],
    mix: [['Guitar DRIVE at 25 or more.', R.mix([['chords', 'drive', '>=', 0.25]])], ['Bass COMP at 25 or more.', R.mix([['bass', 'comp', '>=', 0.25]])], ['Drums VOL at 70 or more.', R.mix([['drums', 'vol', '>=', 0.7]])], ['Limiter at -3 dB.', R.mix([['master', 'limit', '==', -3]])]]
  },
  model(L) {
    const ch = L.progression('A', 'pentaminor', 'rock', 16), riff = 'A4:e C5 D5 A4 E5:q D5:e C5 | A4:e C5 D5 A4 E5:q D5:e C5 | A4:e C5 D5 E5 G5:q E5:e D5 | C5:h A4:h';
    const s = L.buildSong({ title: 'MODEL ROCK', bpm: 128, key: 'A', scale: 'pentaminor', bars: 16, tracks: [{ name: 'DRUMS', drums: this.kit, vol: 0.85 },
      { name: 'BASS', inst: 'bass', notes: L.bassLine(ch, 4, 'eighths'), vol: 0.85, comp: 0.4 }, { name: 'GUITAR', inst: 'eguitar', notes: L.chordLine(ch, 4, 'stab', 57), vol: 0.6, drive: 0.4 },
      { name: 'RIFF', inst: 'distgtr', notes: [riff, riff, riff, riff].join(' | '), vol: 0.8 }] });
    /* power chords: keep the root and the fifth of each stab */
    const g = s.tracks[2]; const byT = new Map(); g.notes.forEach(n => { const k = n[0]; if (!byT.has(k)) byT.set(k, []); byT.get(k).push(n); });
    g.notes = []; byT.forEach(list => { list.sort((a, b) => a[2] - b[2]); g.notes.push(list[0], list[list.length - 1]); });
    const d = s.tracks[0], last = 7 * 4; ['hitom', 'midtom', 'lotom', 'lotom'].forEach((p, i) => d.hits.push([last + 2 + i * 0.5, p, 0.85]));
    s.limit = -3; return s;
  }
};

export const LOFI = {
  id: 'lofi', name: 'LO-FI', blurb: 'Slow, warm and a little crooked, like a tape of a good afternoon.', feel: '68-88 BPM  -  MINOR  -  SWUNG AND DUSTY',
  bpm: [68, 88], beats: 4, swing: 0.5, scales: ['minor', 'dorian', 'pentaminor'], keys: ['F', 'Eb', 'Bb', 'G'], prog: 'sad', bars: 8, form: 16, chordPoly: 3,
  kit: { kick: 'x.....x...x.....', snare: '....x.......x...', hat: 'o.o.o.o.o.o.o.o.' },
  parts: {
    tempo: ['Lo-fi is unhurried: 68 to 88 beats a minute, and about 76 is the sweet spot. It is meant to be background to something else.', 'The thing that makes it lo-fi is SWING. Set it to 50% and the off-beat eighth notes arrive late, which is the lazy bounce of a drummer who has nowhere to be.'],
    key: ['Lo-fi leans on MINOR (or DORIAN, a minor with a hopeful sixth note). The chords are soft and a little sad, and the tune floats over them.', 'Pick F, Eb, Bb or G. They sit in a warm register for the electric piano.'],
    drums: ['The beat is a lazy boom-bap: the KICK on 1, a "bump" on the "and" of 2, and another before 4, a SNARE on 2 and 4, and a quiet HAT ticking along. Lo-fi drums are soft and under everything.', 'Add DRUMS with + TRACK and draw bar 1 as below (the swing will do the rest), then pick bar 1 and press x4, pick bars 1 to 4 and press DUPLICATE (Esc first) to fill all eight.', '{PATTERN}'],
    bass: ['A lo-fi bass is slow and round: one long note on the root of each chord, held for nearly the whole bar, so it hums rather than thumps. Use UPRIGHT or BASS and keep it low.', '{CHORDS}'],
    chords: ['The chords are the whole mood. Lo-fi chords are never plain triads: add the 7th (one more note on top, a minor seventh in a minor chord) and they go smoky. An E-PIANO holds them.', 'Draw each chord at the start of the bar for at least two beats, with a fourth note: the 7th is 10 semitones above the root.', '{TONES}'],
    melody: ['A lo-fi tune leaves room. Play less than you think: a handful of soft notes, with at least one whole bar of silence so the chords can breathe. Use VIBES, MUSIC BOX, KALIMBA or a soft PIANO.', 'Six to sixteen notes in the first eight bars, over at least three of them, and one bar left empty.'],
    dyn: ['Machines are too exact; tape is not. HUMANIZE nudges every note a little off the grid and a little off its volume, which is the "crooked" in lo-fi.', 'Select the notes of the lead (CTRL+A) and press MORE, then HUMANIZE. About a third of the notes should end up off the grid.'],
    form: ['Lo-fi loops. Pick bars 1 to 8, press DUPLICATE, and you have sixteen bars that go round and round. Every track should play to the last bar.'],
    mix: ['This is where lo-fi is made. Turn the top end of the chords DOWN (HI at -4 or lower) so they sound like an old tape, give them plenty of ROOM, add an ECHO to the lead so it trails off, and a little DRIVE on the drums for grit.', 'Open the MIXER (TAB). The limiter goes to -6 dB: nothing should ever poke out.']
  },
  goals: {
    drums: [['Add a DRUMS track.', R.hasInst(['drums'])], ['Bar 1: kick on 1, the push before 3 and the one before 4, snare on 2 and 4, hats on the eighths.', R.all(R.kit({ kick: [0, 6, 10], snare: [4, 12] }), R.hats(6, ['hat', 'openhat', 'ride']))], ['Fill all the bars with it.', R.kit({ kick: [0, 6, 10], snare: [4, 12] }, true)]],
    bass: [['Add a bass: UPRIGHT or BASS.', R.hasInst(BASS)], ['The root of the chord held for a beat and a half or more, on the first beat of every bar.', R.bassHeld(1.5)]],
    chords: [['Add an E-PIANO (or any pad).', R.hasInst(STR)], ['One chord a bar, three notes or more, held two beats or more.', R.all(R.chordsOn([0], 3), R.chordsHeld(2))], ['A 7th in at least half the bars.', R.sevenths(0.5)]],
    melody: [['Add a lead: VIBES, MUSIC BOX, KALIMBA or PIANO.', R.hasInst(LEAD)], ['6 to 16 notes over 3 or more bars, with a bar left empty.', R.melody({ min: 6, max: 16, bars: 3, rest: 1 })], ['End on a note of the last chord.', R.ends]],
    dyn: [['Humanize the lead: a third of its notes off the grid.', R.offGrid(0.3)]],
    form: [['Make the song 16 bars long.', R.longer(16)], ['Keep all the tracks going to the last bar.', R.everyBarPlays]],
    mix: [['Chords HI at -4 dB or lower.', R.mix([['chords', 'eq2', '<=', -4]])], ['Chords ROOM at 35 or more.', R.mix([['chords', 'reverb', '>=', 0.35]])], ['Lead ECHO at 20 or more.', R.mix([['lead', 'echo', '>=', 0.2]])], ['Drums DRIVE at 15 or more.', R.mix([['drums', 'drive', '>=', 0.15]])], ['Limiter at -6 dB.', R.mix([['master', 'limit', '==', -6]])]]
  },
  model(L) {
    const ch = L.progression('F', 'minor', 'sad', 16);
    const keys = ch.flatMap((c, b) => { const ns = L.chordNotes(c, 55), root = ns[0]; return [...ns, root + 10].map(n => [b * 4, 3, n, 0.55]); });
    const tune = L.parseNotes('r:w | G5:q Eb5 r:h | r:w | Bb5:q G5 r:h | r:w | Eb5:q G5 Bb5:h | r:q C5:q Eb5:h | F5:w | r:w | G5:q Eb5 r:h | r:w | Bb5:q G5 r:h | r:w | Eb5:q G5 Bb5:h | r:q C5:q Eb5:h | F5:w').map(n => [n[0], n[1], n[2] + 5, n[3]]);
    const s = L.buildSong({ title: 'MODEL LO-FI', bpm: 76, swing: 0.5, key: 'F', scale: 'minor', bars: 16, tracks: [{ name: 'DRUMS', drums: this.kit, vol: 0.6, drive: 0.2 },
      { name: 'BASS', inst: 'upright', notes: L.bassLine(ch, 4, 'root'), vol: 0.8 }, { name: 'KEYS', inst: 'epiano', notes: keys, vol: 0.5, reverb: 0.45, eq: [0, 0, -6] },
      { name: 'VIBES', inst: 'vibes', notes: tune, vol: 0.6, echo: 0.3 }] });
    const lead = s.tracks[3]; lead.notes.forEach((n, i) => { n[0] += (i % 3) * 0.04 + 0.03; });
    s.limit = -6; return s;
  }
};
void rep;
