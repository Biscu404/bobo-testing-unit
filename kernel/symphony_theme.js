/* What the symphony is made of: its chords, its tunes, and its drums.

   It is in C minor and it is sad in the way a fast thing can be sad. The tempo is a drum-and-bass walk (160), the
   drums are a broken beat with ghost notes under it, and over that goes a long, yearning tune that does not run
   fast at all: the tension between the two is the piece. (The track that taught it that is Marzuku's "At Ends": G minor,
   120, melancholic and high energy at once, a breakbeat with grief on top. This is not that track and does not copy a note
   of it; it borrows the argument.)

   The tune (HOOK) is eight bars over Cm Ab Eb Bb | Cm Ab Fm G. Its first four bars are one shape said four times (a dotted
   note, a quick one, a long one: reach, reach, arrive) so that it can be remembered; the second four say something
   different. It comes in two halves: a question that ends open on G, and an answer that is the same four bars a step
   higher and then closes on a climb to Ab. LIFT is the same tune turned into the relative major, a fifth of hope in the
   middle of the piece. The counter-line (BELOW) is what the cello sings under it: it falls where the tune rises. */

/* chords, as the notes of a pad (C3 up) and the root a bass plays (C2 = 36) */
export const CM = [48, 51, 55], AB = [44, 48, 51], EB = [51, 55, 58], BB = [46, 50, 53], FM = [41, 44, 48], G7 = [43, 47, 50, 53];
export const DM = [50, 53, 57], F = [53, 57, 60], C = [48, 52, 55], GM = [43, 46, 50], A = [45, 49, 52];
/* the progression of the tune, a bar each, and of the lift in E flat, and of the last statement a step up */
export const PROG = [CM, AB, EB, BB, CM, AB, FM, G7], ROOT = [36, 32, 39, 34, 36, 32, 41, 31];
export const PLIFT = [EB, BB, CM, AB, EB, BB, AB, BB], RLIFT = [39, 34, 36, 32, 39, 34, 32, 34];
export const PUP = [DM, BB, F, C, DM, BB, GM, G7], RUP = [38, 34, 41, 36, 38, 34, 31, 31];
/* a chord of the pad lifted to where a piano or a harp wants it */
export const up = (chords, n) => chords.map(ch => ch.map(x => x + n));

/* the tune: question and answer (written where a violin sings it; a trumpet or a guitar plays it an octave down) */
export const HOOK_Q = 'G5:q. Bb5:e C6:h | C6:q. Bb5:e Ab5:h | G5:q. Bb5:e Eb6:h | D6:q. C6:e Bb5:h | G5:q. Bb5:e C6:q Eb6:q | F6:q. Eb6:e C6:h | Ab5:q C6:q F6:h | D6:q. B5:e G5:h';
export const HOOK_A = 'C6:q. Eb6:e G6:h | Eb6:q. C6:e Ab5:h | Bb5:q. Eb6:e G6:h | F6:q. D6:e Bb5:h | G5:q. Bb5:e C6:q Eb6:q | F6:q. Eb6:e C6:q Ab5:q | Ab5:q C6:q F6:q Ab6:q | G6:q. F6:e D6:q B5:q';
/* the tune in E flat major: the lift */
export const HOOK_MAJ = 'Bb5:q. Eb6:e G6:h | F6:q. D6:e Bb5:h | Eb6:q. C6:e G5:h | Ab5:q C6:q Eb6:h | Bb5:q. Eb6:e G6:q Bb6:q | F6:q. D6:e F6:q D6:q | Eb6:q C6:q Ab5:h | Bb5:q D6:q F6:q Bb6:q';
/* what the cello sings under HOOK_Q and HOOK_A: it falls where they rise */
export const BELOW = 'Eb4:q. D4:e C4:h | Eb4:q. C4:e Ab3:h | G4:q. F4:e Eb4:h | F4:q. D4:e Bb3:h | Eb4:q. D4:e C4:q Bb3:q | C4:q. Bb3:e Ab3:q F3:q | Ab3:q C4:q F4:h | D4:q. B3:e G3:h';
/* the first bars of it, to hint at it before it comes */
export const HINT = 'G5:q. Bb5:e C6:h | C6:q. Bb5:e Ab5:h';

/* the bass: a riff on a sixteenth grid (null a rest, a number the semitones above the root). The one with the flat second is the dark one. */
export const RIFF_DARK = [0, null, null, 0, null, 1, null, 0, null, 0, null, 3, null, 0, null, -2];
export const RIFF_PLAIN = [0, null, null, 0, null, null, 7, null, 0, null, null, 0, null, 7, null, 4];
export const RIFF_BOUNCE = [0, null, 12, null, 0, null, 12, null, 0, null, 12, null, 0, null, 12, null];
export const RIFF_EIGHTHS = [0, null, 0, null, 0, null, 0, null, 0, null, 0, null, 0, null, 0, null];
export const PUNCH = [0, null, 0, 0, null, 0, 0, null, 0, null, 0, 0, null, 0, 0, null];

/* the drums, as patterns over one or two bars (they repeat to fill the stretch) */
const two = (a, b) => a + b, many = (c, n) => c + '.'.repeat(n * 16 - 1);
export const DRUMS = {
  /* the broken beat: two bars, ghost snares either side of the backbeat, a kick that does not sit on the grid */
  broken: {
    kick: two('x.......x.x.....', 'x.....x.....x...'), snare: two('....x..o....x..o', '....x.o.o...x...'),
    hat: two('x.x.x.x.x.x.x.x.', 'x.x.x.x.x.x.xox.'), openhat: two('................', '..............x.'), crash: many('X', 4)
  },
  /* the same, harder: for the climax and the finale */
  driving: {
    kick: two('x.x...x.x.x...x.', 'x.x...x.x...x.x.'), snare: two('....x.o.....x..o', '....x..o....x.xo'),
    hat: 'XxxxXxxxXxxxXxxx', ride: 'x...x...x...x...', crash: many('X', 2)
  },
  /* half-time: the kick on one, the snare on three, room to breathe */
  half: {
    kick: two('x.....x.........', 'x...............'), snare: '........x.......', hat: 'x.x.x.x.x.x.x.x.', openhat: two('................', '..............x.'), crash: many('X', 4)
  },
  /* the lift: four on the floor, claps, the off-beat hat that makes a room stand up */
  lift: { kick: 'x...x...x...x...', clap: '....x.......x...', hat: '..x...x...x...x.', ride: 'x.x.x.x.x.x.x.x.', crash: many('X', 4) },
  /* a build: a snare in eighths, a kick on every beat */
  build: { kick: 'x...x...x...x...', snare: 'x.x.x.x.x.x.x.x.', crash: many('X', 4) },
  /* fills: the last bar of a stretch */
  fillToms: { kick: 'x.......x.......', snare: 'x.x.x.x.........', hitom: '........xx......', midtom: '..........xx....', lotom: '............xxxx' },
  fillSnare: { kick: 'x.......x.......', snare: '..x.x.x.xxxxxxxx', crash: '................' },
  fillStop: { kick: 'x.......x.......', snare: 'x.x.x.x.xxxxxxxx', hitom: 'xxxx............' }
};
