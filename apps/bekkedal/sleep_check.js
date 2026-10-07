/* node apps/bekkedal/sleep_check.js — the night: what staying up costs, what a bed gives back, the scene's timing. Pure Node. */
import { lateLevel, lateExtra, warningFor, WARN, nightOf, pilfer, napPhase, NAP_TOTAL, NAP, WAKE, vignette, zCount, GROUND_WAKE_MIN, MIDNIGHT } from './sleep.js';
import { BEK_DAY_START, BEK_DAY_END } from './data.js';
let bad = 0;
const ok = (c, m, d) => { console.log((c ? 'OK   ' : 'FAIL ') + m + (d ? '  ' + d : '')); if (!c) bad++; };

ok(lateExtra(BEK_DAY_START) === 0 && lateExtra(23 * 60) === 0 && lateExtra(MIDNIGHT - 1) === 0, 'a normal day and evening cost nothing extra');
ok(lateExtra(MIDNIGHT) === 1 && lateExtra(25 * 60) === 2 && lateExtra(BEK_DAY_END - 1) === 2, 'after midnight work costs one more, after one two more');
ok(BEK_DAY_END === 26 * 60, 'the day still ends at 02:00');
const seen = {}; let said = [];
for (let m = BEK_DAY_START; m < BEK_DAY_END; m += 3) { const w = warningFor(m, seen); if (w) { seen[w.key] = 1; said.push(w.key + '@' + Math.floor(m / 60)); } }
ok(said.length === 3, 'three warnings in a night, each once', said.join(' '));
ok(WARN.every(w => w.no && w.en && w.no !== w.en), 'every warning is in both languages');
const bed = nightOf(22 * 60, false), late = nightOf(25 * 60, false), floor = nightOf(BEK_DAY_END, true);
ok(bed.frac === 1 && bed.wakeMin === BEK_DAY_START, 'a bed before midnight: the whole bar, at six');
ok(late.frac === WAKE.late && late.frac < 1 && late.wakeMin === BEK_DAY_START, 'a bed after midnight: a short night');
ok(floor.frac === WAKE.ground && floor.frac < late.frac && floor.wakeMin === GROUND_WAKE_MIN && GROUND_WAKE_MIN > BEK_DAY_START, 'the ground is worse than any bed, and costs the morning');
ok(pilfer(0) === 0 && pilfer(10) === 10 && pilfer(300) === 25 && pilfer(2400) === 200 && pilfer(90000) === 600, 'the magpie takes a twelfth, within bounds', [pilfer(300), pilfer(2400), pilfer(90000)].join('/'));
ok(pilfer(5) <= 5, 'and never more than there is');
ok(napPhase(0).cover === 0 && napPhase(NAP.out).cover === 16 && napPhase(NAP.out + NAP.hold - 0.01).phase === 'hold' && napPhase(NAP_TOTAL - 0.01).cover <= 1 && napPhase(NAP_TOTAL).phase === 'done', 'the picture closes, holds, opens');
let mono = true, prev = -1; for (let t = 0; t < NAP.out; t += 0.05) { const c = napPhase(t).cover; if (c < prev) mono = false; prev = c; }
ok(mono, 'it closes steadily');
ok(NAP_TOTAL > 2.5 && NAP_TOTAL < 5, 'the whole scene is a few seconds', NAP_TOTAL.toFixed(1) + ' s');
ok(zCount(0) === 1 && zCount(5) === 3, 'the Zs rise to three');
ok(vignette(12 * 60) === null && vignette(MIDNIGHT).length === 3 && vignette(25 * 60).length === 4, 'the edges close in, more as it gets later');
ok(lateLevel(0) === 0, 'level is total');
if (bad) { console.log(bad + ' failed'); process.exit(1); }
console.log('All sleep checks pass.');
