/* The sound of a file dying, by rank, bolted onto Snd rather than written into it, so the
   speaker stays the speaker it was. Every two ranks the delete gets a bigger gun. The top
   rank's sound is open fifths (C, G, C, G) on purpose: it is the sound the symphony begins on,
   and a fifth belongs to C major and C minor alike, so it never fights what the orchestra is doing. */
import { Snd } from './snd.js';

Object.assign(Snd, {
  delT(tier) {
    if (tier < 2) {              /* D-C: the stock sound, a file giving up */
      this.del();
    } else if (tier < 4) {       /* B-A: it is being taken apart */
      this.noise(120, { freq: 1500, q: 1.4, vol: 0.07 });
      this.tone(620, 130, { type: 'sawtooth', to: 90, vol: 0.05 });
      this.tone(310, 90, { type: 'square', to: 60, vol: 0.035, delay: 0.03 });
    } else if (tier < 6) {       /* S-SS: a shotgun in a server room */
      this.noise(200, { freq: 420, q: 0.6, vol: 0.11 });
      this.noise(60, { freq: 3400, q: 2.0, vol: 0.06 });
      this.tone(180, 220, { type: 'sawtooth', to: 40, vol: 0.07 });
      this.tone(880, 70, { type: 'square', to: 220, vol: 0.03, delay: 0.02 });
    } else {                     /* SSS and above: it is a party favour, in fifths */
      this.noise(240, { freq: 300, q: 0.5, vol: 0.12 });
      [1046, 1568, 2093, 3136].forEach((f, i) =>
        this.tone(f, 130, { type: 'square', delay: i * 0.028, vol: 0.045 }));
      this.tone(140, 260, { type: 'sawtooth', to: 35, vol: 0.07 });
    }
  },
  /* One beat of the delete reel (kernel/delete_reel.js): the tick of a file going and a note of the tune. The higher
     the rank, the more is stacked on the note, but the note is always the same pitch. */
  reelNote(hz, tier, accent) {
    const v = accent ? 0.085 : 0.06;
    this.noise(16, { freq: 3200, q: 1.8, vol: v * 0.7 });
    this.tone(hz, 95, { type: 'triangle', vol: v });
    this.tone(hz * 2, 55, { type: 'square', vol: v * 0.2 });
    if (tier >= 3) this.tone(hz / 2, 120, { type: 'sawtooth', vol: v * 0.3 });
  },
  /* the last beat of a pile: the tune lands on a C major chord */
  reelEnd() {
    [1046, 1318, 1568, 2093].forEach((f, i) => this.tone(f, 340, { type: 'triangle', delay: i * 0.018, vol: 0.04 }));
    this.noise(90, { freq: 2400, q: 1.2, vol: 0.04 });
  },
  /* a single file: dun-dun, G and then C a fifth below, with the tick */
  reelOne(tier) {
    this.noise(20, { freq: 2800, q: 1.6, vol: 0.06 });
    this.tone(784, 80, { type: 'triangle', vol: 0.08 });
    this.tone(523, 190, { type: 'triangle', delay: 0.07, vol: 0.085 });
    if (tier >= 3) this.tone(262, 200, { type: 'sawtooth', delay: 0.07, vol: 0.03 });
  },
  /* the promotion sting: a rising fifth, higher every rank */
  rankUp(tier) {
    const base = 330 * Math.pow(1.12, tier);
    [1, 1.5, 2].forEach((m, i) =>
      this.tone(base * m, 130, { type: 'square', delay: i * 0.05, vol: 0.05 }));
    this.noise(70, { freq: 2600, q: 1.6, vol: 0.05 });
  },
  /* reserved for the birthday: C major going up, the notes the harp plays at the start of the symphony, then the chord */
  birthday() {
    [523, 659, 784, 1046, 1318, 1568, 2093].forEach((f, i) =>
      this.tone(f, 300, { type: 'square', delay: i * 0.075, vol: 0.055 }));
    [523, 784, 1046].forEach(f =>
      this.tone(f, 900, { type: 'triangle', delay: 0.55, vol: 0.04 }));
  }
});
