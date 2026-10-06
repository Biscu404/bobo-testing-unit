/* The symphony, third part: bars 57-100. The climax, the last stand, and the way home.

   Bars 57-72 are the climax: the tune with everything behind it, then the answer a whole step higher (D minor) for seven bars,
   and in the eighth the harmony comes home to G so that C minor can be where it lands. Bars 73-92 are the last stand: the
   tune in the guitars and the violins alone for four bars, the brass coming in under it, and then the answer, closing, with a
   long climb on F and G to the cadence. Bars 93-100 are C major, the fanfare notes again, and one long chord: the
   delete sound it began as, arrived at. */
import { at, chug, hold, tune, kit, run, roll, drumRoll, riff, arp, pad } from './symphony_kit.js';
import { PROG, ROOT, PUP, RUP, HOOK_Q, HOOK_A, BELOW, up, DRUMS, PUNCH, G7, FM } from './symphony_theme.js';

const PW = [0, 7, 12], bars = text => text.split(' | ');
/* some bars of a tune, as text */
const part = (text, from, to) => bars(text).slice(from, to).join(' | ');
/* a tune played a whole step above `base` for its first seven bars, and at `base` for the eighth: it is going to a key a step up and
   its last bar turns back toward C minor, so that the key it lands in is the one the next part begins in */
function stanza(L, out, text, bar, base, vel) {
  bars(text).forEach((b, i) => tune(L, out, b, bar + i, i === 7 ? base : base + 2, vel));
}

/* bars 57-72 */
export function climax(L, T) {
  const roots = ROOT.slice(0, 8).concat(RUP.slice(0, 7), [31]), gtr = roots.map(r => r + 12);
  const chords = PROG.concat(PUP.slice(0, 7), [G7]);
  /* 57-64 the question at full cry; 65-72 the answer, a step up */
  tune(L, T.violins, HOOK_Q, 57, 0, 0.82); stanza(L, T.violins, HOOK_A, 65, 0, 0.88);
  tune(L, T.strings, HOOK_Q, 57, 0, 0.5); stanza(L, T.strings, HOOK_A, 65, 0, 0.55);
  tune(L, T.trumpet, HOOK_Q, 57, -12, 0.92); stanza(L, T.trumpet, HOOK_A, 65, -12, 0.98);
  tune(L, T.lead, HOOK_Q, 57, -12, 0.82); stanza(L, T.lead, HOOK_A, 65, -12, 0.88);
  tune(L, T.choir, HOOK_Q, 57, -12, 0.66); stanza(L, T.choir, HOOK_A, 65, -12, 0.72);
  tune(L, T.cello, BELOW, 57, 0, 0.7); stanza(L, T.cello, BELOW, 65, 0, 0.74);
  tune(L, T.glock, HOOK_Q, 57, 12, 0.34); stanza(L, T.glock, HOOK_A, 65, 12, 0.38);
  [57, 65].forEach(b => T.bells.push([at(b), 6, b === 57 ? 72 : 74, 0.7]));
  /* underneath: the riff, tight, the pad swelling, the piano turning over, the timpani on every beat */
  riff(T.bass, 57, 16, roots, PUNCH, 0.2, 0.92, true);
  riff(T.guitar, 57, 16, gtr, PUNCH.map(s => s == null ? null : [0, 7, 12]), 0.17, 0.88, true);
  pad(T.strings, 57, chords, 0.5, 0.7); pad(T.organ, 57, chords, 0.4, 0.5, -12);
  arp(T.piano, 57, up(chords, 12), [0, 1, 2, 3, 2, 1, 2, 3], 0.25, 0.2, 0.4, 0.56);
  arp(T.harp, 65, up(chords.slice(8), 24), [0, 1, 2, 3], 0.5, 0.45, 0.4, 0.5);
  roots.forEach((r, b) => { for (let k = 0; k < 4; k++) T.timp.push([at(57 + b) + k, 0.9, r + 12, k % 2 ? 0.7 : 0.92]); });
  run(T.harp, at(64), [91, 88, 84, 79, 76, 72, 67, 64], 0.5, 0.6, 0.7, 0.5);
  kit(L, T.drums, 57, 8, DRUMS.driving, DRUMS.fillStop);
  kit(L, T.drums, 65, 8, DRUMS.driving, DRUMS.fillToms);
}

/* bars 73-92 */
export function finale(L, T) {
  const roots = ROOT.concat(ROOT, [41, 41, 31, 31]), gtr = roots.map(r => r + 12), chords = PROG.concat(PROG);
  /* 73-80: the question, in the guitars and the violins (the brass wait four bars); 81-88: the answer, closing, all of it */
  tune(L, T.violins, HOOK_Q, 73, 0, 0.84); tune(L, T.violins, HOOK_A, 81, 0, 0.92);
  tune(L, T.lead, HOOK_Q, 73, -12, 0.88); tune(L, T.lead, HOOK_Q, 73, -5, 0.7); tune(L, T.lead, HOOK_A, 81, -12, 0.94); tune(L, T.lead, HOOK_A, 81, -5, 0.76);
  tune(L, T.choir, HOOK_Q, 73, -12, 0.66); tune(L, T.choir, HOOK_A, 81, -12, 0.78);
  tune(L, T.trumpet, part(HOOK_Q, 4, 8), 77, -12, 0.94); tune(L, T.trumpet, HOOK_A, 81, -12, 1);
  tune(L, T.strings, HOOK_Q, 73, 0, 0.46); tune(L, T.strings, HOOK_A, 81, 0, 0.58);
  tune(L, T.cello, BELOW, 73, 0, 0.7); tune(L, T.cello, BELOW, 81, 0, 0.76);
  tune(L, T.glock, HOOK_A, 81, 12, 0.4);
  riff(T.bass, 73, 16, roots, PUNCH, 0.2, 0.92, true);
  riff(T.guitar, 73, 16, gtr, PUNCH.map(s => s == null ? null : [0, 7, 12]), 0.17, 0.86, true);
  pad(T.strings, 73, chords, 0.5, 0.75); pad(T.organ, 73, chords, 0.4, 0.52, -12);
  arp(T.piano, 73, up(chords, 12), [0, 1, 2, 3, 2, 1, 2, 3], 0.25, 0.2, 0.44, 0.6);
  roots.slice(0, 16).forEach((r, b) => { for (let k = 0; k < 4; k++) T.timp.push([at(73 + b) + k, 0.9, r + 12, k % 2 ? 0.75 : 0.95]); });
  T.bells.push([at(73), 6, 72, 0.7], [at(81), 6, 79, 0.75]);
  run(T.harp, at(80), [91, 88, 84, 79, 76, 72, 67, 64], 0.5, 0.6, 0.7, 0.5);
  kit(L, T.drums, 73, 8, DRUMS.driving, DRUMS.fillStop);
  kit(L, T.drums, 81, 8, Object.assign({}, DRUMS.driving, { crash: 'X.......x.......' }), DRUMS.fillToms);
  /* 89-92: the climb to the cadence: Fm, Fm, G, G, the pad rising, the snare in eights then in sixteenths, a stop on the last beat */
  chug(T.cello, 89, 4, gtr.slice(16), 'xxxxxxxxxxxxxxxx', 0.16, 0.62);
  chug(T.bass, 89, 4, roots.slice(16), 'x.xx.xx.x.xx.xx.', 0.2, 0.9);
  chug(T.guitar, 89, 4, gtr.slice(16), 'x.xx.xx.x.xx.xx.', 0.17, 0.84, PW);
  [[89, FM], [90, FM], [91, G7], [92, G7]].forEach(([b, c], i) => {
    hold(T.strings, b, [c], 4, 0.7 + i * 0.07, null, b === 92 ? 3 : 3.9); hold(T.choir, b, [c.map(n => n + 12)], 4, 0.6 + i * 0.1, null, b === 92 ? 3 : 3.9);
  });
  for (let b = 89; b <= 92; b++) for (let k = 0; k < 4; k++) if (b < 92 || k < 3) T.timp.push([at(b) + k, 0.9, (b < 91 ? 41 : 43) + 12, 0.8 + (b - 89) * 0.05]);
  kit(L, T.drums, 89, 3, { kick: 'x.x.x.x.x.x.x.x.', snare: 'x.x.x.x.x.x.x.x.', crash: 'x...............' });
  drumRoll(T.drums, at(92), at(92) + 3, 0.25, 'snare', 0.7, 1);
  roll(T.timp, at(91), at(92) + 3, 0.25, [43], 0.6, 1, 0.22);
  run(T.violins, at(91), [67, 71, 74, 79, 83, 86, 91, 95], 0.5, 0.48, 0.6, 1);
}

/* bars 93-100: C major, the fanfare notes again, and one long chord */
export function outro(L, T) {
  const arpg = ['C5:s E5 G5 C6 E6 G6 C7:q. r:q', 'F4:s A4 C5 F5 A5 C6 F6:q. r:q', 'A4:s C5 E5 A5 C6 E6 A6:q. r:q', 'G4:s B4 D5 G5 B5 D6 G6:q. r:q', 'C5:s E5 G5 C6 E6 G6 C7:q. r:q', 'F4:s A4 C5 F5 A5 C6 F6:q. r:q', 'G4:s B4 D5 G5 B5 D6 G6:q. r:q'];
  arpg.forEach((t, i) => { tune(L, T.harp, t, 93 + i, 0, 0.95); tune(L, T.glock, t.replace(/ r:q$/, ''), 93 + i, 0, 0.55); });
  const ch = [[48, 52, 55, 60], [41, 45, 48, 53], [45, 48, 52, 57], [43, 47, 50, 55], [48, 52, 55, 60], [41, 45, 48, 53], [43, 47, 50, 55]];
  ch.forEach((c, i) => { const b = 93 + i; hold(T.choir, b, [c.map(n => n + 12)], 4, 0.55 + i * 0.05, null, 4); hold(T.strings, b, [c], 4, 0.6 + i * 0.05, null, 4); hold(T.organ, b, [c.map(n => n - 12)], 4, 0.5 + i * 0.05, null, 4); T.bells.push([at(b), 4, c[0] + 12, 0.7]); });
  tune(L, T.trumpet, 'E5:h G5:h | F5:h A5:h | C6:h A5:h | B5:q. G5:e D6:h | E6:h C6:h | F6:h A5:h | D6:h B5:h', 93, 0, 0.9);
  tune(L, T.violins, 'C6:w | A5:w | E6:w | D6:w | G6:w | A6:w | G6:w', 93, 0, 0.7);
  [36, 29, 33, 31, 36, 29, 31].forEach((r, i) => { T.bass.push([at(93 + i), 3.5, r, 0.9]); T.cello.push([at(93 + i), 3.5, r + 12, 0.7]); for (let k = 0; k < 4; k++) T.timp.push([at(93 + i) + k, 0.9, r + 12, k === 0 ? 0.95 : 0.6]); });
  kit(L, T.drums, 93, 4, { kick: 'x.......x.......', snare: '........x.......', crash: 'x...............', hat: 'x.x.x.x.x.x.x.x.' });
  kit(L, T.drums, 97, 3, { kick: 'x.x.x.x.x.x.x.x.', snare: 'x.x.x.x.x.x.x.x.', crash: 'x...............' });
  /* bar 100: the last chord, all of it, held */
  const end = at(100);
  [36, 48, 52, 55, 60, 64, 67, 72].forEach(n => { T.organ.push([end, 8, n, 0.9]); T.strings.push([end, 8, n + 12, 0.85]); T.choir.push([end, 8, n + 12, 0.8]); });
  [60, 64, 67, 72, 76].forEach(n => { T.trumpet.push([end, 6, n + 12, 0.9]); T.bells.push([end, 10, n, 0.8]); });
  T.timp.push([end, 4, 36, 1]); T.drums.push([end, 'crash', 1], [end, 'kick', 1]); T.harp.push([end, 6, 84, 0.9], [end, 6, 88, 0.9], [end, 6, 91, 0.9], [end, 6, 96, 0.9]);
}
