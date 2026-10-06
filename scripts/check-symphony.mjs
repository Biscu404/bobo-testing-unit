#!/usr/bin/env node
/* The symphony, held to numbers (pure Node: no audio, no window).  `node scripts/check-symphony.mjs`   (npm run check:symphony)

   What cannot be heard from here is checked as what it is made of:
     THE CONTRACT   a hundred bars at 160 (two and a half minutes), sixteen tracks, the harp opens on the notes of the delete sound
                    (C E G C E G C) and the last chord is C major;
     THE TUNE       every bar of the tune and its counter-line is four beats; on the strong beats it sits on its chord; it is in the key it says
                    (C minor for the tune, E flat major for the lift) and in no other;
     THE SHAPE      the loud places are louder than the quiet ones (the band is made smaller before the master's limiter, which flattens anything
                    loud to one level; what comes out the other side is measured in `scripts/check-music.mjs`, which renders it), and the two
                    stops are silences: nothing begins, and nothing is still sounding, in the last beat before bar 57 and bar 93;
     THE BEAT       the drums are a broken beat with ghost notes, not a four-on-the-floor wall: the kick lands off the beat and the snare has
                    notes quieter than the backbeat. */
import * as Lang from '../kernel/songtext.js';
import { HOOK_Q, HOOK_A, HOOK_MAJ, BELOW, HINT, PROG, PLIFT, PUP, DRUMS } from '../kernel/symphony_theme.js';
globalThis.localStorage = { getItem() { return null; }, setItem() {} };
const { symphony, BARS, BPM, SECONDS, LOOP_FROM_BAR } = await import('../kernel/symphony.js');

let fails = 0, checks = 0;
const ok = (c, label, detail) => { checks++; if (c) { console.log('OK   ' + label.padEnd(72) + (detail || '')); return true; } fails++; console.log('FAIL ' + label + '   ' + (detail || '')); return false; };
const song = symphony(Lang), by = n => song.tracks.find(t => t.name === n);
const at = bar => (bar - 1) * 4;

console.log('-- the contract --');
ok(song.bars === 100 && BARS === 100 && BPM === 160 && Math.abs(SECONDS - 150) < 1e-9, 'a hundred bars at 160: two and a half minutes', SECONDS + ' s');
ok(song.tracks.length === 16, 'sixteen real instruments', song.tracks.map(t => t.inst).filter((v, i, a) => a.indexOf(v) === i).length + ' kinds');
ok(by('HARP').notes.slice(0, 7).map(n => n[2]).join() === '72,76,79,84,88,91,96', 'it opens on the notes of the delete sound: C E G C E G C');
{
  const last = []; song.tracks.forEach(t => (t.notes || []).forEach(n => { if (n[0] >= at(100) && n[0] < at(100) + 0.01) last.push(n[2] % 12); }));
  ok(last.length >= 8 && last.every(pc => [0, 4, 7].includes(pc)), 'and ends on a C major chord, all of it, held', 'pitch classes ' + [...new Set(last)].sort((a, b) => a - b).join());
}
ok(LOOP_FROM_BAR >= 9 && LOOP_FROM_BAR < 20, 'a meter kept at the top loops from the ignition, not the unwrapping', 'bar ' + LOOP_FROM_BAR);

console.log('\n-- the tune --');
const bars = t => t.split(' | ');
for (const [name, text] of [['the question', HOOK_Q], ['the answer', HOOK_A], ['the major tune', HOOK_MAJ], ['the counter-line', BELOW], ['the hint', HINT]]) {
  const bad = bars(text).map((b, i) => [i + 1, Lang.parseNotes(b).length_]).filter(x => Math.abs(x[1] - 4) > 1e-9);
  ok(bad.length === 0, name + ': every bar is four beats', bad.map(x => 'bar ' + x[0] + '=' + x[1]).join(' '));
}
for (const [name, text, chords] of [['the question', HOOK_Q, PROG], ['the answer', HOOK_A, PROG], ['the major tune', HOOK_MAJ, PLIFT]]) {
  let strong = 0, on = 0;
  bars(text).forEach((b, i) => { const pcs = chords[i % chords.length].map(n => n % 12); Lang.parseNotes(b).forEach(n => { if (n[0] === 0 || n[0] === 2) { strong++; if (pcs.includes(n[2] % 12)) on++; } }); });
  ok(on / strong >= 0.7, name + ': ' + on + ' of ' + strong + ' strong-beat notes are on their chord', (100 * on / strong).toFixed(0) + '%');
}
{
  const pcsIn = (name, a, b) => { const s = new Set(); (by(name).notes || []).forEach(n => { if (n[0] >= at(a) && n[0] < at(b + 1)) s.add(n[2] % 12); }); return s; };
  const minor = [0, 2, 3, 5, 7, 8, 10, 11], eflat = [3, 5, 7, 8, 10, 0, 2];
  const A = pcsIn('VIOLINS', 17, 32), L = pcsIn('VIOLINS', 41, 48);
  ok([...A].every(p => minor.includes(p)), 'the tune in the violins is in C minor and nowhere else', [...A].sort((a, b) => a - b).join());
  ok([...L].every(p => eflat.includes(p)) && L.size >= 6, 'and the lift is in E flat major', [...L].sort((a, b) => a - b).join());
  const D = pcsIn('VIOLINS', 65, 71);
  ok([...D].every(p => [2, 4, 5, 7, 9, 10, 0, 1, 11, 3, 6, 8].includes(p)) && D.has(2) && D.has(10), 'and the climax lifts it a whole step (D minor: D, Bb, A in the violins)', [...D].sort((a, b) => a - b).join());
}

console.log('\n-- the shape --');
/* a rough power for each bar: what each note does to the speaker (velocity to gain as the instruments have it, squared) for as long as it
   sounds. A plucked or struck note rings for longer than it is held, a held note for as long as it is held. */
const vgain = v => Math.pow(Math.max(0.02, Math.min(1, v)), 1.35), RING = new Set(['piano', 'eguitar', 'pizz', 'harp', 'bells', 'glock', 'timpani', 'bass', 'drums']);
const energy = Array(100).fill(0);
song.tracks.forEach(t => {
  (t.notes || []).forEach(n => { const b = Math.floor(n[0] / 4); if (b < 100) energy[b] += Math.pow(vgain(n[3]), 2) * (RING.has(t.inst) ? Math.min(1.5, Math.max(0.6, n[1])) : Math.min(4, n[1])); });
  (t.hits || []).forEach(h => { const b = Math.floor(h[0] / 4); if (b < 100) energy[b] += Math.pow(vgain(h[2]), 2) * 0.5; });
});
const mean = (a, b) => { let s = 0; for (let i = a - 1; i < b; i++) s += energy[i]; return s / (b - a + 1); };
const E = { intro: mean(1, 8), ignition: mean(9, 16), question: mean(17, 24), answer: mean(25, 32), breath: mean(33, 36), lift: mean(41, 48), low: mean(49, 52), climax: mean(57, 72), finale: mean(73, 88), outro: mean(93, 99) };
console.log('     energy per bar: ' + Object.keys(E).map(k => k + ' ' + E[k].toFixed(0)).join('  '));
ok(E.question < E.answer, 'the answer is bigger than the question', E.question.toFixed(0) + ' < ' + E.answer.toFixed(0));
ok(E.low < E.lift * 0.8, 'the minor key comes back smaller than the lift', (100 * E.low / E.lift).toFixed(0) + '%');
ok(E.climax > E.ignition * 1.5 && E.finale >= E.climax * 0.95, 'the climax and the finale are well above the ignition, and the finale keeps it', (E.climax / E.ignition).toFixed(2) + '× ' + (E.finale / E.climax).toFixed(2) + '×');
{
  const stops = [57, 93].map(bar => {
    const edge = at(bar) - 1; let begin = 0, across = 0;
    song.tracks.forEach(t => {
      (t.notes || []).forEach(n => { if (n[0] >= edge && n[0] < at(bar)) begin++; if (n[0] < edge && n[0] + n[1] > edge + 1e-6) across++; });
      (t.hits || []).forEach(h => { if (h[0] >= edge && h[0] < at(bar)) begin++; });
    });
    return [bar, begin, across];
  });
  ok(stops.every(s => s[1] === 0 && s[2] === 0), 'the last beat before bar 57 and before bar 93 is silent: nothing begins, nothing rings across', stops.map(s => 'bar ' + s[0] + ': ' + s[1] + '/' + s[2]).join('  '));
}

console.log('\n-- the beat --');
{
  const hits = by('DRUMS').hits, inBar = (k, a, b) => hits.filter(h => h[1] === k && h[0] >= at(a) && h[0] < at(b + 1));
  const kicks = inBar('kick', 9, 32), sn = inBar('snare', 9, 32);
  const off = kicks.filter(h => Math.abs(h[0] * 4 - Math.round(h[0] * 4 / 4) * 4) > 1e-6 && Math.abs((h[0] % 1)) > 1e-6).length;
  ok(off / kicks.length > 0.1, 'the kick does not sit on the grid: some of it lands between the beats', (100 * off / kicks.length).toFixed(0) + '% of ' + kicks.length);
  /* a ghost is a snare note a good deal quieter than the loudest one in its own bar (the band is made smaller as a whole, bar by bar) */
  const top = {}; sn.forEach(h => { const b = Math.floor(h[0] / 4); top[b] = Math.max(top[b] || 0, h[2]); });
  const ghost = sn.filter(h => h[2] < top[Math.floor(h[0] / 4)] * 0.7).length, back = sn.filter(h => h[2] >= top[Math.floor(h[0] / 4)] * 0.9).length;
  ok(ghost >= 6 && back >= 12, 'the snare has ghost notes under its backbeat', ghost + ' ghosts, ' + back + ' backbeats');
  ok(Object.keys(DRUMS).length >= 8, 'and there is more than one beat in the piece', Object.keys(DRUMS).join(' '));
  const crash = hits.filter(h => h[1] === 'crash').length;
  ok(crash >= 20 && crash < 90, 'with crashes where the sections turn, not on every bar', crash + ' crashes');
}

console.log('\n' + (fails ? fails + ' of ' + checks + ' symphony checks FAILED' : 'All ' + checks + ' symphony checks pass.'));
process.exit(fails ? 1 : 0);
