/* Parts that more than one of AfterEgypt's tunes is built from: the layers the run switches on and off. They are the same *idea* in every
 * tier (the sim tells the music four things, see danger.js) and a different sound in each:
 *
 *   build   the arrangement thickening as the temple gets nearer   (a tune's own: written in band_early.js / band_late.js)
 *   edge    a heartbeat: the ship is in the mouth of a gap, close to the stone
 *   swarm   locusts: a high, nervous tremolo that never settles on one note
 *   gust    wind: a run up through the mode, a whistle, a held chord, a whoosh of cymbal
 *   gate    the last stretch: brass an octave up, the choir, a crash on every bar
 */
import { bars, byChord, rep, soft, track, layer, drums, pedal } from './score_kit.js';

/* a heartbeat on the root of each bar's chord: `hits` are [beat, vel] in a bar */
export function heart(L, ch, bpb, low, hits) {
  const out = [];
  ch.forEach((c, b) => { const r = L.chordNotes(c, low)[0]; hits.forEach(h => out.push([b * bpb + h[0], 0.4, r, h[1]])); });
  return out;
}
/* the edge layer: a heart under the tune, and something plucked on top of it that does not let up */
export function edge(L, ch, bpb, o) {
  const beat = bpb === 3 ? [[0, 0.9], [0.5, 0.62], [1.5, 0.8], [2, 0.55]] : [[0, 0.9], [0.5, 0.62], [2, 0.82], [2.5, 0.58]];
  return [
    layer(track('HEART', 'timpani', heart(L, ch, bpb, o.low || 38, beat), { vol: 0.62, reverb: 0.3 }), 'edge'),
    layer(track(o.name || 'TICK', o.inst || 'pizz', byChord(L, ch, bpb, o.tick), { vol: o.vol || 0.46, reverb: 0.12, pan: 0.2 }), 'edge')
  ];
}
/* the swarm layer: a semitone shaken back and forth a sixteenth at a time, on each chord's own neighbour pair (xylophone), and wood ticking */
export function swarm(L, ch, bpb, pairs, wood) {
  const n = bpb * 4, shake = ([a, b]) => Array.from({ length: n }, (_, i) => (i % 2 ? b : a) + (i ? '' : ':s')).join(' ');
  const table = {};
  Object.keys(pairs).forEach(k => { table[k] = shake(pairs[k]); });
  return [
    layer(track('LOCUSTS', 'xylophone', soft(byChord(L, ch, bpb, table), 0.7), { vol: 0.44, reverb: 0.3, pan: 0.35 }), 'swarm'),
    layer(track('CHITTER', 'woodblock', bars(L, rep(wood, ch.length), bpb), { vol: 0.34, reverb: 0.2, pan: -0.3 }), 'swarm')
  ];
}
/* the gust layer: a run up through the mode (every other bar), a whistle between, a held chord on the high choir and a cymbal swelling */
export function gust(L, ch, bpb, runText, whistle) {
  const n = ch.length, runs = [], whistles = [];
  for (let b = 0; b < n; b++) (b % 2 ? whistles : runs).push(b);
  const only = (list, text) => bars(L, Array.from({ length: n }, (_, b) => list.includes(b) ? text : ''), bpb);
  return [
    layer(track('WIND RUN', 'strings', soft(only(runs, runText), 0.7), { vol: 0.5, reverb: 0.5, pan: -0.3 }), 'gust'),
    layer(track('WHISTLE', 'flute', soft(only(whistles, whistle), 0.75), { vol: 0.5, reverb: 0.6, pan: 0.3 }), 'gust'),
    layer(track('AIR', 'choir', soft(L.chordLine(ch, bpb, 'pad', 66), 0.5), { vol: 0.42, reverb: 0.7 }), 'gust'),
    layer(drums('WHOOSH', { crash: 'x' + '.'.repeat(bpb * 8 - 1) }, { vol: 0.3, reverb: 0.4 }), 'gust')
  ];
}
/* the gate layer: the lead's own tune an octave up where there is room, a big choir, a crash on every bar */
export function gate(L, ch, bpb, lead, top) {
  const up = lead.map(n => [n[0], n[1], n[2] + 12 <= top ? n[2] + 12 : n[2], n[3] * 0.85]);
  return [
    layer(track('BRASS UP', 'trumpet', up, { vol: 0.5, reverb: 0.4, pan: 0.15 }), 'gate'),
    layer(track('GATE CHOIR', 'choir', soft(L.chordLine(ch, bpb, 'pad', 55), 0.6), { vol: 0.5, reverb: 0.6 }), 'gate'),
    layer(drums('CRASHES', { crash: 'x' + '.'.repeat(bpb * 4 - 1), ride: 'x...' }, { vol: 0.4, reverb: 0.25 }), 'gate'),
    layer(track('ROLL', 'timpani', bars(L, ch.map(() => 'r:' + (bpb - 2) + ' D2:s!60 D2!66 D2!72 D2!78 D2!84 D2!90 D2!96 D2!104'), bpb), { vol: 0.5, reverb: 0.3 }), 'gate')
  ];
}
export { pedal };
