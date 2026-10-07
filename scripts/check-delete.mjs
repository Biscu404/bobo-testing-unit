#!/usr/bin/env node
/* The delete reel (kernel/delete_reel.js), pure Node: a pile of files goes on a beat each, a short cooldown apart, as a
   fast tune that always lands on the high C, and however big the pile is it is over in about three and a half seconds.
     node scripts/check-delete.mjs */
import { GAP, SPAN, planReel, chunkItems, melody, hzOf, midiOf } from '../kernel/delete_reel.js';

let fails = 0;
const ok = (c, m) => { console.log(`${c ? 'PASS' : 'FAIL'} - ${m}`); if (!c) fails++; };

ok(GAP >= 40 && GAP <= 120, `there is a cooldown between beats, and it is short (${GAP} ms)`);
for (const n of [1, 2, 7, 20, 48, 49, 80, 200, 1000]) {
  const p = planReel(n), ms = (p.steps - 1) * p.gap;
  const beats = chunkItems(Array.from({ length: n }, (_, i) => i), p.chunk);
  ok(beats.length === p.steps && beats.flat().length === n && beats.flat().every((v, i) => v === i),
    `${n} files -> ${p.steps} beats of up to ${p.chunk}, every file once and in order`);
  ok(ms <= SPAN, `  and it is over in ${ms} ms (limit ${SPAN})`);
  if (n <= Math.floor(SPAN / GAP)) ok(p.chunk === 1, `  one file to a beat while the pile is small`);
}

/* the tune: every note is in C pentatonic, the last is the high C, the one before is the G under it, nothing is out of reach of a speaker */
const PENTA = new Set([0, 2, 4, 7, 9]);
for (const steps of [2, 3, 8, 9, 20, 48]) {
  const m = melody(steps);
  ok(m.length === steps, `${steps} beats -> ${steps} notes`);
  ok(m.every(n => PENTA.has(((n.midi - 72) % 12 + 12) % 12)), `  every note is C D E G or A`);
  ok(m.every(n => n.hz >= 400 && n.hz <= 1400), `  all between ${Math.round(Math.min(...m.map(n => n.hz)))} and ${Math.round(Math.max(...m.map(n => n.hz)))} Hz`);
  ok(m[steps - 1].midi === midiOf(5) && m[steps - 1].last && (steps < 2 || m[steps - 2].midi === midiOf(3)), `  it lands on the high C, from the G`);
  ok(m.filter(n => n.accent).length >= Math.floor(steps / 4), `  and it has a pulse`);
}
let leaps = 0, worst = 0;
const long = melody(48);
for (let i = 1; i < 47; i++) { const d = Math.abs(long[i].midi - long[i - 1].midi); worst = Math.max(worst, d); if (d > 9) leaps++; }
ok(leaps === 0, `no leap bigger than a sixth in the long tune (largest ${worst} semitones)`);
ok(Math.abs(hzOf(72) - 523.25) < 0.1, `C5 is ${hzOf(72).toFixed(2)} Hz`);
console.log(fails ? `${fails} FAILED` : 'DELETE REEL OK');
process.exit(fails ? 1 : 0);
