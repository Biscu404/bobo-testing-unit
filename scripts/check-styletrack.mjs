#!/usr/bin/env node
/* The style meter's song against its plan (pure Node): kernel/style_track_plan.js. How it comes in under the delete
   sound, where each pass begins, and that the seams between passes are crossfades of the recording's own quiet ends. */
import { readFileSync, existsSync } from 'node:fs';
import { FILE, BLEND, LOOP_FROM, TAIL, SEAM, LEAD, NOTES, ECHOES, songGain, echoCutoff, songCurve, pass, positionAt } from '../kernel/style_track_plan.js';

let bad = 0;
const ok = (c, m) => { console.log((c ? 'ok   ' : 'FAIL ') + m); if (!c) bad++; };
const LEN = 149.37;                                  /* the recording */

ok(existsSync(new URL('../' + FILE, import.meta.url)), 'the recording is where the plan says (' + FILE + ')');
const head = readFileSync(new URL('../' + FILE, import.meta.url)).subarray(0, 3).toString('latin1');
ok(head === 'ID3' || readFileSync(new URL('../' + FILE, import.meta.url))[0] === 0xFF, 'and it is an mp3');

/* the opening: nothing, then all of it, never going back down */
const g = Array.from({ length: 101 }, (_, i) => songGain(BLEND * i / 100));
ok(g[0] === 0 && Math.abs(g[100] - 1) < 1e-12, 'the song comes in from nothing to all of it over ' + BLEND + ' seconds');
ok(g.every((v, i) => i === 0 || v >= g[i - 1]), 'and only ever rises');
ok(songGain(BLEND / 2) > 0.45 && songGain(BLEND / 2) < 0.55 && songGain(1) < 0.15, 'it is slow to start (' + songGain(1).toFixed(2) + ' after a second), so the delete sound is what is heard first');
ok(songGain(BLEND + 10) === 1 && songGain(-1) === 0, 'and it holds at full after');
const c = songCurve(64);
ok(c.length === 64 && c[0] === 0 && Math.abs(c[63] - 1) < 1e-6, 'the curve handed to the audio clock runs from 0 to 1');

/* the echoes of the delete sound: the same notes, each quieter and darker, all inside the blend */
ok(NOTES.join() === '1046.5,1568,2093,3136', 'the echoes are the notes of the top-rank delete sound (C6 G6 C7 G7)');
ok(ECHOES.every((e, i) => i === 0 || (e[1] < ECHOES[i - 1][1] && e[0] > ECHOES[i - 1][0])), 'each echo is later and quieter than the last');
ok(ECHOES.every(e => e[0] < BLEND) && ECHOES[ECHOES.length - 1][1] < 0.15, 'all of them are over before the blend is');
ok(echoCutoff(0) > 5000 && echoCutoff(BLEND) <= 700 && echoCutoff(2.5) < echoCutoff(1), 'and they darken as the song arrives');

/* the passes */
const p0 = pass(0, LEN), p1 = pass(1, LEN), p2 = pass(2, LEN);
ok(p0.at === 0 && p0.from === 0 && Math.abs(p0.to - (LEN - TAIL)) < 1e-9, 'the first pass is the whole recording, less its last ' + TAIL + ' seconds of silence');
ok(p1.from === LOOP_FROM && p2.from === LOOP_FROM, 'every pass after it begins at ' + LOOP_FROM + ' s, in the quiet build before the first drop');
ok(Math.abs(p1.at - (p0.to - SEAM)) < 1e-9, 'the second begins ' + SEAM + ' s before the first ends: a crossfade of the two quiet ends');
ok(Math.abs(p2.at - (p1.at + p1.dur - SEAM)) < 1e-9, 'and each after it the same');
ok(p0.fadeIn === 0 && p1.fadeIn === SEAM && p1.fadeOut === SEAM, 'the first has no fade-in of its own (the opening is its fade-in); the others fade in and out');
ok(pass(1, LEN).at > LEAD && pass(0, LEN).at < LEAD, 'a pass is laid down ' + LEAD + ' seconds ahead, so the first is at once and the second is not');
/* where in the file it is, as a clock */
ok(Math.abs(positionAt(10, LEN) - 10) < 1e-9, 'ten seconds in, it is ten seconds into the recording');
const into = positionAt(p1.at + 5, LEN);
ok(Math.abs(into - (LOOP_FROM + 5)) < 1e-9, 'five seconds into the second pass it is at ' + into.toFixed(1) + ' s of the file');
let prev = -1, back = 0;
for (let t = 0; t < 700; t += 0.5) { const q = positionAt(t, LEN); if (q < prev - 1e-9) back++; prev = q; }
const seams = Math.floor((700 - p1.at) / (p1.dur - SEAM)) + 1;
ok(back === seams, 'over twelve minutes it goes back to ' + LOOP_FROM + ' s only at the seams (' + back + ' times, one for each of the ' + seams + ' passes after the first)');
/* a short recording does not break the plan */
const short = pass(1, 20);
ok(short.dur > 0 && short.to > short.from, 'a recording shorter than the loop point still plays');

console.log(bad ? bad + ' FAILED' : 'all ok');
process.exit(bad ? 1 : 0);
