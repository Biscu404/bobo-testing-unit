/* Genres for the Studio Course, part two: DANCE, WALTZ, LULLABY, EPIC. See course_genres.js for what a genre is. */
import * as R from './course_rules.js';

const STR = ['strings', 'organ', 'epiano', 'synthpad', 'piano', 'choir', 'harp', 'musicbox'], BASS = ['bass', 'upright', 'synthbass', 'tuba', 'cello'];
const LEAD = ['piano', 'flute', 'musicbox', 'marimba', 'vibes', 'clarinet', 'sax', 'trumpet', 'violin', 'steelgtr', 'nylon', 'synthlead', 'ocarina', 'oboe', 'kalimba', 'frenchhorn', 'celesta'];

export const DANCE = {
  id: 'dance', name: 'DANCE', blurb: 'A kick on every beat, a bass that bounces, a hook that loops all night.', feel: '118-132 BPM  -  MINOR  -  FOUR ON THE FLOOR',
  bpm: [118, 132], beats: 4, swing: 0, scales: ['minor', 'dorian', 'pentaminor'], keys: ['A', 'G', 'F#'], prog: 'epic', bars: 8, form: 16, chordPoly: 3,
  kit: { kick: 'x...x...x...x...', clap: '....x.......x...', openhat: '..x...x...x...x.', hat: 'x.x.x.x.x.x.x.x.' },
  parts: {
    tempo: ['Dance music is built for walking pace at speed: 118 to 132 beats a minute, and 124 is the house-music standard. Go lower and nobody dances; go higher and it is a different genre.', 'Four straight beats and no swing. The machine is meant to sound like a machine.'],
    key: ['Dance is mostly MINOR: it keeps the mood tense and a little dark. DORIAN is a minor with a brighter sixth note, which is the sound of a lot of house. MAGIC 5 (MOODY) is the safest of all.', 'Pick A, G or F#: low enough for a deep bass, high enough to cut through.'],
    drums: ['The beat is called four on the floor: the KICK hits on every single beat. The CLAP lands on 2 and 4, and the OPEN HAT sits in the gaps between beats, the "and", so the kick and the hat never play together. That gap is the groove.',
      'Add DRUMS with + TRACK, draw bar 1 as below, press x4 on it, then pick bars 1 to 4 and press DUPLICATE (Esc first) to fill all eight.', '{PATTERN}'],
    bass: ['The dance bass plays in the gaps too: short notes on the "and" of every beat, only the chord\'s own notes, so it bounces between the kicks. Three or more notes in every bar, all of them on the off-beat.', '{CHORDS}'],
    chords: ['Dance chords are stabs: short, bright hits instead of held pads. Strike the whole chord on beats 1 and 3 and let the silence in between do the work. An E-PIANO or SYNTH PAD is the classic sound.', '{TONES}'],
    melody: ['The hook is the whole tune in miniature: a few notes, a catchy rhythm, repeated until it is stuck in your head. In dance the repeat is the point, so play a short idea in bar 1 and play exactly the same shape again later.', 'Pick a lead (SYNTH LEAD, MARIMBA or PIANO), write at least eight notes over three or more bars, and make some of them repeat the same pattern.'],
    dyn: ['A dance track builds. Before the drop the drums get busier: a snare roll, hats on every sixteenth. That tension is what the next bar then releases.', 'In bar 8, draw ten or more hits on any drum pieces (the clap on every sixteenth is the classic roll).'],
    form: ['Eight bars is a phrase and a dance track is a stack of them. Pick bars 1 to 8, DUPLICATE it, and you have sixteen. The roll in bar 8 now leads into the second pass.'],
    mix: ['Dance is a mix of control. COMP on the drums and on the bass squeezes them so they pump together, and the limiter at -1 dB keeps it as loud as it can be without clipping.', 'Open the MIXER (TAB).']
  },
  goals: {
    drums: [['Add a DRUMS track.', R.hasInst(['drums'])], ['Bar 1: a kick on every beat, a clap on 2 and 4, an open hat on every "and".', R.kit({ kick: [0, 4, 8, 12], clap: [4, 12], openhat: [2, 6, 10, 14] })], ['Fill all the bars with it.', R.kit({ kick: [0, 4, 8, 12], clap: [4, 12], openhat: [2, 6, 10, 14] }, true)]],
    bass: [['Add a bass: BASS or SYNTH BASS.', R.hasInst(BASS)], ['Three or more notes in every bar, all on the off-beat.', R.bassOffbeat(3)], ['Only the notes of the chord for that bar.', R.bassTones]],
    chords: [['Add a pad: E-PIANO or SYNTH PAD.', R.hasInst(STR)], ['A full chord struck on beats 1 and 3 of every bar.', R.chordsOn([0, 2], 3)]],
    melody: [['Add a lead.', R.hasInst(LEAD)], ['8 to 30 notes over 3 or more bars that repeat the same shape.', R.melody({ min: 8, max: 60, bars: 3, repeat: true })], ['End on a note of the last chord.', R.ends]],
    dyn: [['A roll in bar 8: ten or more drum hits.', R.buildUp(10)]],
    form: [['Make the song 16 bars long.', R.longer(16)], ['Keep all the tracks going to the last bar.', R.everyBarPlays]],
    mix: [['Drums COMP at 30 or more.', R.mix([['drums', 'comp', '>=', 0.3]])], ['Bass COMP at 30 or more.', R.mix([['bass', 'comp', '>=', 0.3]])], ['Limiter at -1 dB.', R.mix([['master', 'limit', '==', -1]])]]
  },
  model(L) {
    const ch = L.progression('A', 'minor', 'epic', 16);
    const hook = 'A4:e A4 C5 A4 E5:q D5:e C5 | A4:e A4 C5 A4 G4:q A4:q | A4:e A4 C5 A4 E5:q D5:e C5 | D5:e C5 A4 G4 E4:h | A4:e A4 C5 A4 E5:q D5:e C5 | A4:e A4 C5 A4 G4:q A4:q | A4:e A4 C5 A4 E5:q D5:e C5 | A4:w';
    const s = L.buildSong({ title: 'MODEL DANCE', bpm: 124, key: 'A', scale: 'minor', bars: 16, tracks: [{ name: 'DRUMS', drums: this.kit, vol: 0.8, comp: 0.5 },
      { name: 'BASS', inst: 'bass', notes: L.bassLine(ch, 4, 'offbeat'), vol: 0.85, comp: 0.5 }, { name: 'STABS', inst: 'epiano', notes: L.chordLine(ch, 4, 'stab', 57), vol: 0.5 },
      { name: 'HOOK', inst: 'marimba', notes: hook + ' | ' + hook, vol: 0.8 }] });
    const d = s.tracks[0]; for (let i = 0; i < 16; i++) d.hits.push([28 + i / 4, 'clap', 0.5 + i / 40]);
    s.limit = -1; return s;
  }
};

export const WALTZ = {
  id: 'waltz', name: 'WALTZ', blurb: 'Three beats to the bar: one big step and two light ones, round and round.', feel: '78-96 BPM  -  MAJOR  -  3 BEATS A BAR',
  bpm: [78, 96], beats: 3, swing: 0, scales: ['major'], keys: ['D', 'G', 'F'], prog: 'sunny', bars: 8, form: 16, chordPoly: 3, noDrums: true,
  parts: {
    tempo: ['A waltz is three beats to the bar, not four: ONE-two-three, ONE-two-three. Set BEATS to 3 in the top bar (the bar lines move at once). A comfortable waltz is 78 to 96 beats a minute; the Viennese ones are much faster.', 'No swing: a waltz turns, it does not bounce.'],
    key: ['Waltzes are classical, so write in MAJOR for the sunny ones. (Minor waltzes exist and are wonderful, but start with a happy one.)', 'Pick D, G or F: keys that are easy on strings and piano.'],
    drums: ['There is no drum kit in a waltz. The rhythm comes from the bass and the chords instead, the famous "oom-pah-pah": a low note on the ONE, and the chord on TWO and THREE. Leave the drums out; the next steps build the beat from the bass and chords.'],
    bass: ['The "oom": a single deep note on beat 1 of every bar, the root of the chord, held for most of the beat. Use CELLO or UPRIGHT. It is heavy, so the two beats after it feel light.', '{CHORDS}'],
    chords: ['The "pah-pah": strike the whole chord on beat 2 and again on beat 3, and leave beat 1 empty (the bass has it). With STRINGS or PIANO it sounds like a ballroom.', '{TONES}'],
    melody: ['A waltz tune is lyrical: it sings. Make it flow, with long notes that last a beat and a half or more, and keep it mostly stepwise, so it feels like gliding rather than jumping.', 'Pick a lead (VIOLIN, FLUTE, CLARINET or PIANO), write at least ten notes over four or more bars, and make sure at least one lasts a dotted beat or longer (a bar of three beats can hold a note all the way across).'],
    dyn: ['What makes it a waltz and not a march is the accent: the ONE is stronger than the two and the three. The bass should be firm and the pah-pahs softer.', 'Turn the velocity lane to work: drag the bars under the chords on beats 2 and 3 down (or select them and press MORE then SOFTER) until the notes on the beat sit clearly above the rest.'],
    form: ['Eight bars is a short dance. Pick bars 1 to 8, press DUPLICATE, and you have 16. A waltz repeats until the dancers are dizzy.'],
    mix: ['A waltz is meant to sound like a big room. Give every track a good ROOM (30 or more) so it sounds like a ballroom, and make sure the melody is clearly louder than the chords.', 'Open the MIXER (TAB).']
  },
  goals: {
    drums: [],
    bass: [['Add a CELLO or UPRIGHT track.', R.hasInst(BASS)], ['The root of the chord on beat 1 of every bar, held nearly a whole beat.', R.bassHeld(0.9)]],
    chords: [['Add STRINGS or PIANO.', R.hasInst(STR)], ['The chord struck on beats 2 and 3 of every bar.', R.chordsOn([1, 2], 3)], ['Nothing on beat 1: the bass has it.', R.noChordOn(0)]],
    melody: [['Add a lead.', R.hasInst(LEAD)], ['10 to 40 notes over 4 or more bars, mostly stepwise, with a long note.', R.melody({ min: 10, max: 40, bars: 4, stepwise: 4, longNote: 1.4 })], ['End on a note of the last chord.', R.ends]],
    dyn: [['Notes on the beat clearly louder (0.08) than the others.', R.accent(0.08)]],
    form: [['Make the song 16 bars long.', R.longer(16)], ['Keep all the tracks going to the last bar.', R.everyBarPlays]],
    mix: [['Every track ROOM at 30 or more.', R.mix([['all', 'reverb', '>=', 0.3]])], ['Lead 10 points above the chords on VOL.', R.louder(0.1)]]
  },
  model(L) {
    const ch = L.progression('D', 'major', 'sunny', 16), bass = L.bassLine(ch, 3, 'root').map(n => [n[0], 2, n[2], 0.9]);
    const pah = ch.flatMap((c, b) => [1, 2].flatMap(o => L.chordNotes(c, 57).map(n => [b * 3 + o, 0.8, n, 0.45])));
    const A = 'F#5:q. G5:e A5:q | B5:h. | A5:q. F#5:e D5:q | E5:h. | F#5:q. G5:e A5:q | B5:q A5 G5 | F#5:q E5 D5 | D5:h.';
    const s = L.buildSong({ title: 'MODEL WALTZ', bpm: 88, beats: 3, key: 'D', scale: 'major', bars: 16, tracks: [{ name: 'CELLO', inst: 'cello', notes: bass, vol: 0.7, reverb: 0.4 },
      { name: 'STRINGS', inst: 'strings', notes: pah, vol: 0.5, reverb: 0.4 }, { name: 'VIOLIN', inst: 'violin', notes: A + ' | ' + A, vol: 0.8, reverb: 0.4 }] });
    s.tracks[0].notes.forEach(n => { n[3] = 0.9; }); s.tracks[2].notes.forEach(n => { n[3] = n[0] % 3 < 0.05 ? 0.9 : 0.7; });
    return s;
  }
};

export const LULLABY = {
  id: 'lullaby', name: 'LULLABY', blurb: 'Slow, soft and simple enough to hum to a sleeping child.', feel: '56-76 BPM  -  PENTATONIC  -  QUIET',
  bpm: [56, 76], beats: 4, swing: 0, scales: ['pentatonic', 'major'], keys: ['F', 'G', 'Bb'], prog: 'sunny', bars: 8, form: 16, chordPoly: 2, noDrums: true,
  parts: {
    tempo: ['A lullaby is slower than a resting heartbeat: 56 to 76 beats a minute. About 66 rocks like a cradle.', 'Four beats to the bar and no swing. Anything bouncy would wake them up.'],
    key: ['Lullabies are written on MAGIC 5 (HAPPY), the pentatonic scale: five notes and no clashes, which is why a toddler can sing along. A plain MAJOR works as well.', 'Pick F, G or Bb: these put the tune in the music box\'s sweetest octave.'],
    drums: ['There are no drums in a lullaby, on purpose. A beat would wake the baby. The rocking comes from the long bass notes and the harp underneath. Leave the drums out.'],
    bass: ['The bass is a slow, soft rock: one long root note per bar, held for the whole bar. Use UPRIGHT or CELLO, very quiet.', '{CHORDS}'],
    chords: ['A harp rolling the chord is the classic: play the three notes of the chord one after another, up and down, at least six notes a bar, all from the chord. It is a lullaby\'s glitter.', 'Use HARP (or MUSIC BOX, or any soft sound) and keep each note short so the notes ripple.', '{TONES}'],
    melody: ['A lullaby tune is slow, simple and moves mostly by step, so a sleepy voice can follow it. No fast notes: nothing shorter than half a beat, and no big leaps.', 'Pick MUSIC BOX or CELESTA, write at least eight notes over four or more bars, and keep each step small.'],
    dyn: ['Nothing is loud in a lullaby. The notes themselves should be played gently: lower the velocity of every note until the average is well under two thirds.', 'Select all the notes in a track (CTRL+A) and press MORE, then SOFTER, a few times on each track, or drag the bars in the velocity lane down.'],
    form: ['Eight bars is only the first verse. Pick bars 1 to 8, press DUPLICATE, and it sings itself twice. A lullaby is a promise that it will come round again.'],
    mix: ['A lullaby is mixed like a whisper: no track above 75 on its VOL fader, a lot of ROOM on the music box (40 or more) so it floats, and the limiter at -6 dB so nothing can ever startle.', 'Open the MIXER (TAB).']
  },
  goals: {
    drums: [],
    bass: [['Add a bass: UPRIGHT or CELLO.', R.hasInst(BASS)], ['One root a bar, held the whole bar.', R.bassHeld(3.5)]],
    chords: [['Add a HARP or MUSIC BOX.', R.hasInst(STR)], ['Six or more notes a bar, all from the chord.', R.chordsOnly(6)]],
    melody: [['Add a lead: MUSIC BOX or CELESTA.', R.hasInst(LEAD)], ['8 to 24 notes over 4 or more bars, small steps, nothing shorter than half a beat.', R.melody({ min: 8, max: 24, bars: 4, stepwise: 3, shortest: 0.5 })], ['End on a note of the last chord.', R.ends]],
    dyn: [['All the notes played gently: the average under two thirds.', R.quiet(0.65)]],
    form: [['Make the song 16 bars long.', R.longer(16)], ['Keep all the tracks going to the last bar.', R.everyBarPlays]],
    mix: [['No track above 75 on VOL.', R.mix([['all', 'vol', '<=', 0.75]])], ['Lead ROOM at 40 or more.', R.mix([['lead', 'reverb', '>=', 0.4]])], ['Limiter at -6 dB.', R.mix([['master', 'limit', '==', -6]])]]
  },
  model(L) {
    const ch = L.progression('F', 'pentatonic', 'sunny', 16), bass = L.bassLine(ch, 4, 'root').map(n => [n[0], 4, n[2], 0.4]);
    const harp = L.chordLine(ch, 4, 'arp', 53).map(n => [n[0], n[1], n[2], 0.35]);
    const A = 'A4:q C5 D5 C5 | A4:h G4:h | F4:q G4 A4 C5 | A4:w | C5:q D5 C5 A4 | C5:h A4:h | G4:q A4 G4 F4 | F4:w';
    const s = L.buildSong({ title: 'MODEL LULLABY', bpm: 66, key: 'F', scale: 'pentatonic', bars: 16, tracks: [{ name: 'BASS', inst: 'upright', notes: bass, vol: 0.5 },
      { name: 'HARP', inst: 'harp', notes: harp, vol: 0.5, reverb: 0.5 }, { name: 'BOX', inst: 'musicbox', notes: A + ' | ' + A, vol: 0.6, reverb: 0.5 }] });
    s.tracks[2].notes.forEach(n => { n[3] = 0.5; }); s.limit = -6; return s;
  }
};

export const EPIC = {
  id: 'epic', name: 'EPIC', blurb: 'Drums like thunder, strings like a sunrise, and a theme that rises.', feel: '70-96 BPM  -  MINOR  -  A BUILD TO A PEAK',
  bpm: [70, 96], beats: 4, swing: 0, scales: ['minor', 'dorian'], keys: ['D', 'A', 'G'], prog: 'epic', bars: 8, form: 16, chordPoly: 3,
  parts: {
    tempo: ['Film music is slow and wide: 70 to 96 beats a minute, around 84 for a march into battle. It gets its power from size, not speed.', 'Straight four beats. Weight, not bounce.'],
    key: ['The epic sound is MINOR, or DORIAN for a hopeful edge. The EPIC chord run (the sixth, the fourth, the fifth) goes up like an army cresting a hill.', 'Pick D, A or G: strings and horns are happiest there.'],
    drums: ['There is no drum kit here: the percussion is the TIMPANI, a big orchestral drum. One hit on beat 1 of every bar is the heartbeat of the whole piece, and later in the song it can speed up.', 'Add a track with TIMPANI via + TRACK (look under FUN) and play a low note on beat 1 of all eight bars.'],
    bass: ['The orchestra\'s floor is the CELLOS (or TUBA): a deep root note held for the whole bar, so the harmony has weight under it.', '{CHORDS}'],
    chords: ['The chords are STRINGS playing slow, held chords, one per bar. They swell under everything and tell the listener how to feel.', '{TONES}'],
    melody: ['The theme is a horn or trumpet call: short, bold and heroic. The secret is a big leap, at least a fifth (7 semitones), early in the phrase, like a hero\'s fanfare, then a long held note to let it ring.', 'Pick TRUMPET, FRENCH HORN or VIOLIN, write at least eight notes over four or more bars, with one leap of 7 semitones or more and one note of two beats or longer.'],
    dyn: ['Epic is a crescendo. Nothing starts at full volume: the first bars are quiet and the last bars are loud. That climb is the whole drama.', 'Lower the velocity of the first two bars (select them, MORE, SOFTER) and raise the last two bars (select them, MORE, HARDER) until the last two bars are clearly stronger.'],
    form: ['Eight bars is the opening. Pick bars 1 to 8, press DUPLICATE, and the theme comes round again, bigger this time. Every track should play to the very end.'],
    mix: ['Epic is the sound of a huge hall. ROOM on the strings at 50 or more makes the sound hang in the air, ROOM on the lead at 35 or more makes the horn sound far away and grand, and the limiter at -3 dB keeps the big finish from clipping.', 'Open the MIXER (TAB).']
  },
  goals: {
    drums: [['Add a TIMPANI track.', R.hasInst(['timpani'])], ['A hit on beat 1 of every bar.', R.downbeats]],
    bass: [['Add a bass: CELLO or TUBA.', R.hasInst(BASS)], ['The root of the chord held the whole bar.', R.bassHeld(3.5)]],
    chords: [['Add STRINGS.', R.hasInst(STR)], ['One chord a bar, held the whole bar.', R.all(R.chordsOn([0], 3), R.chordsHeld(3.5))]],
    melody: [['Add a lead: TRUMPET, FRENCH HORN or VIOLIN.', R.hasInst(LEAD)], ['8 to 30 notes over 4 or more bars with a leap of 7 semitones and a note of two beats or longer.', R.melody({ min: 8, max: 30, bars: 4, leap: 7, longNote: 2 })], ['End on a note of the last chord.', R.ends]],
    dyn: [['A crescendo: the last two bars 15 points louder than the first two.', R.crescendo(0.15)]],
    form: [['Make the song 16 bars long.', R.longer(16)], ['Keep all the tracks going to the last bar.', R.everyBarPlays]],
    mix: [['Strings ROOM at 50 or more.', R.mix([['chords', 'reverb', '>=', 0.5]])], ['Lead ROOM at 35 or more.', R.mix([['lead', 'reverb', '>=', 0.35]])], ['Limiter at -3 dB.', R.mix([['master', 'limit', '==', -3]])]]
  },
  model(L) {
    const ch = L.progression('D', 'minor', 'epic', 16), roots = ch.map(c => L.chordNotes(c, 38)[0]);
    const timp = roots.map((r, b) => [b * 4, 2, r, 0.8]), bass = L.bassLine(ch, 4, 'root').map(n => [n[0], 4, n[2], 0.6]);
    const A = 'D5:q F5 A5:h | G5:q F5 D5:h | Bb4:q D5 F5:h | A5:w | D5:q F5 A5 D6 | C6:h A5:h | G5:q F5 E5 D5 | D5:w';
    const s = L.buildSong({ title: 'MODEL EPIC', bpm: 84, key: 'D', scale: 'minor', bars: 16, tracks: [{ name: 'TIMPANI', inst: 'timpani', notes: timp, vol: 0.7 },
      { name: 'CELLOS', inst: 'cello', notes: bass, vol: 0.7 }, { name: 'STRINGS', inst: 'strings', notes: L.chordLine(ch, 4, 'pad', 50), vol: 0.5, reverb: 0.55 },
      { name: 'HORN', inst: 'trumpet', notes: A + ' | ' + A, vol: 0.8, reverb: 0.4 }] });
    s.tracks.forEach(t => t.notes.forEach(n => { n[3] = 0.4 + 0.5 * Math.min(1, Math.max(0, (n[0] % 32) / 28)); })); s.limit = -3; return s;
  }
};
