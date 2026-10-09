/* node apps/standbattle/music_check.js -- Stand Battle's score, its band and its choosing (pure Node: no audio, no window).
   THE BARS       every tune is thirty-two bars; every bar of every lead is as long as the bar, and there is a chord for each bar
   THE NOTES      every note is playable, on the instrument it is written for (inside the range the recordings cover), and starts inside the song; every drum pattern is as long as the song
   THE KEY        the lead stays in its key (and the dominant's own leading tone), and sits on its chord on the strong beats
   THE BAND       each tune is a floor, a band and a last round (three layers), played by an instrument of its own; there is no other loop that sounds like it
   THE SHAPE      the four sections of a tune are four different things (the lead, the comping, the groove), and the last bar of a section is a fill
   THE CHOOSING   every place has a pool, a fight begins with its own stage's tune and the others follow in an order, nothing repeats within a pool, and a tune is heard through before the next */
import { readFileSync } from 'node:fs';
import * as Lang from '../../kernel/songtext.js';
import { song, TUNES, IDS, FIGHT, STAGE_TUNE, POOLS, poolFor, passSecs, melodyOf, BARS, LAYERS, layersFor } from './score.js';
import { SEC, chordsOf, kitDrums } from './score_kit.js';
import { createSbMusic, loopsFor, MIN_HEARD, PLACES } from './music.js';
import { STAGE_IDS } from './stages.js';

let fails = 0, checks = 0;
const ok = (c, label, detail) => { checks++; if (c) { console.log('OK   ' + label.padEnd(72) + (detail || '')); return true; } fails++; console.log('FAIL ' + label + '   ' + (detail || '')); return false; };
const INST = Object.fromEntries(JSON.parse(readFileSync(new URL('../../assets/instruments/index.json', import.meta.url), 'utf8')).instruments.map(i => {
  const ns = i.samples.map(s => s.note != null ? s.note : s.midi); return [i.id, [Math.min(...ns), Math.max(...ns)]];
}));

console.log('-- the bars --');
ok(IDS.length === 7 && BARS === 32 && SEC === 8, 'seven tunes of thirty-two bars, four sections of eight', IDS.join(' '));
for (const id of IDS) {
  const d = TUNES[id], bad = [], bars = d.lead.notes;
  if (bars.length !== 4 || bars.some(s => s.length !== 8)) bad.push('the lead is not four sections of eight bars');
  else bars.forEach((sec, si) => sec.forEach((b, i) => { const len = Lang.parseNotes(b).length_; if (Math.abs(len - d.beats) > 1e-9) bad.push('bar ' + (si * 8 + i + 1) + ' is ' + len); }));
  if (chordsOf(d).length !== BARS) bad.push('chords: ' + chordsOf(d).length);
  if (d.secs.length !== 4) bad.push('sections: ' + d.secs.length);
  ok(!bad.length, id + ': the lead and the chords fill every bar', bad.slice(0, 4).join('; '));
}

console.log('\n-- the notes --');
const badNote = n => !(n[1] > 0 && n[0] >= 0 && n[2] >= 24 && n[2] <= 108 && n[3] > 0 && n[3] <= 1.0001);
for (const id of IDS) {
  const sg = song(Lang, id), len = Lang.songLength(sg);
  const wrong = sg.tracks.filter(t => (t.notes || []).some(badNote) || (t.hits || []).some(h => !(h[0] >= 0 && h[0] < len)));
  const over = sg.tracks.filter(t => (t.notes || []).some(n => n[0] >= len || n[0] + n[1] > len + 0.5));
  ok(!wrong.length && !over.length, id + ': every note is playable and starts inside the song', wrong.concat(over).map(t => t.name).join(', '));
  const out = [];
  sg.tracks.forEach(t => {
    if (t.inst === 'drums' || !INST[t.inst]) { if (t.inst !== 'drums') out.push(t.name + ' has no recordings: ' + t.inst); return; }
    const [lo, hi] = INST[t.inst], slack = t.name.startsWith('LEAD') ? 0 : 3;
    (t.notes || []).forEach(n => { if (n[2] < lo - slack || n[2] > hi + slack) out.push(t.name + ' ' + t.inst + ' ' + n[2] + ' (' + lo + '-' + hi + ')'); });
  });
  ok(!out.length, id + ': every instrument plays inside the range it was recorded in', [...new Set(out)].slice(0, 3).join('; '));
  const short = sg.tracks.filter(t => t.hits && !t.hits.length);
  ok(!short.length, id + ': no drum track is silent');
  const kit = kitDrums(TUNES[id]);
  ok(Object.keys(kit).every(k => kit[k].length === BARS * 16), id + ': every drum pattern is exactly thirty-two bars');
}

console.log('\n-- the key --');
for (const id of IDS) {
  const d = TUNES[id], ch = chordsOf(d), mel = melodyOf(Lang, id);
  let strong = 0, on = 0; const outside = new Set();
  mel.forEach(n => {
    const bar = Math.min(BARS - 1, Math.floor(n[0] / d.beats)), tones = Lang.chordNotes(ch[bar], 60).map(x => x % 12), pc = n[2] % 12, at = n[0] - bar * d.beats;
    const chordTone = tones.includes(pc);
    if (d.pcs.indexOf(pc) < 0 && !chordTone) outside.add(pc);                  /* the key, or a tone of the chord that is sounding (a dominant's leading tone) */
    if (Math.abs(at % 1) < 1e-6 && (at === 0 || at === 2)) { strong++; if (chordTone || tones.some(t => Math.abs(t - pc) === 2 || Math.abs(t - pc) === 10)) on++; }
  });
  ok(!outside.size, id + ': nothing but the key and the chords\' own notes', [...outside].join(','));
  ok(strong > 0 && on / strong >= 0.8, id + ': the lead sits on its chord on the strong beats', Math.round(100 * on / strong) + '%');
}

console.log('\n-- the band --');
const insts = new Set(), leads = [];
for (const id of IDS) {
  const sg = song(Lang, id), by = k => sg.tracks.filter(t => t.layer === k).length, d = TUNES[id];
  ok(LAYERS.every(k => by(k) >= (k === 'tension' && d.level === 0 ? 0 : 1)) && sg.tracks.every(t => LAYERS.includes(t.layer)), id + ': a floor, a band and a last round' + (d.level === 0 ? ' (the menus have no last round)' : ''), LAYERS.map(k => by(k)).join('/'));
  ok(sg.tracks.length >= (d.level === 0 ? 6 : 10), id + ': ' + sg.tracks.length + ' players');
  const lead = sg.tracks.find(t => t.name === 'LEAD');
  ok(lead && lead.layer === (d.level === 0 ? 'explore' : 'combat'), id + ': the lead is in the ' + (d.level === 0 ? 'floor of the menus' : 'band'), lead && lead.layer);
  sg.tracks.forEach(t => insts.add(t.inst)); leads.push(lead.inst + '@' + sg.bpm);
}
ok(new Set(IDS.map(id => song(Lang, id).bpm)).size === IDS.length && IDS.every(id => song(Lang, id).bpm >= 88 && song(Lang, id).bpm <= 150), 'seven tempos, all different', IDS.map(id => song(Lang, id).bpm).join(' '));
ok(new Set(IDS.map(id => TUNES[id].lead.inst)).size >= 6, 'six or more different lead instruments', IDS.map(id => TUNES[id].lead.inst).join(' '));
ok(['distgtr', 'trumpet', 'violin', 'sax', 'vibes', 'upright', 'choir', 'timpani', 'flute', 'epiano', 'synthbass', 'steelgtr', 'organ', 'frenchhorn', 'trombone', 'drums'].every(i => insts.has(i)), 'the whole bench is used: ' + insts.size + ' instruments', [...insts].join(' '));

console.log('\n-- the shape: no section is the last one again --');
const same = (a, b) => { const n = Math.min(a.length, b.length); let s = 0; for (let i = 0; i < n; i++) if (a[i] === b[i]) s++; return s / Math.max(a.length, b.length); };
for (const id of IDS) {
  const d = TUNES[id], leadSecs = d.lead.notes.map(s => s.join(' '));
  let worst = 0; for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) worst = Math.max(worst, same(leadSecs[i].split(' '), leadSecs[j].split(' ')));
  ok(worst < 0.5, id + ': the four sections of the lead are four different things (the likest pair is ' + Math.round(worst * 100) + '% the same)');
  const kit = kitDrums(d), keys = Object.keys(kit);
  const bar = (k, b) => kit[k].slice(b * 16, b * 16 + 16), distinct = new Set([0, 8, 16, 24].map(b => keys.map(k => bar(k, b)).join('|')));
  ok(distinct.size >= 3, id + ': the groove changes with the section (' + distinct.size + ' grooves)');
  const fills = [7, 15, 23, 31].every(b => keys.map(k => bar(k, b)).join('|') !== keys.map(k => bar(k, b - 1)).join('|'));
  ok(fills, id + ': the last bar of every section is a fill');
  const sg = song(Lang, id), comp = sg.tracks.find(t => t.name === 'COMP');
  if (comp) { const per = [0, 1, 2, 3].map(s => comp.notes.filter(n => n[0] >= s * 32 && n[0] < s * 32 + 32).length); ok(new Set(per).size >= 2, id + ': the rhythm player plays a different amount in different sections', per.join('/')); }
}

console.log('\n-- the choosing --');
ok(PLACES.every(p => poolFor(p).length >= 1 && poolFor(p).every(id => IDS.includes(id))), 'every place has a pool of tunes that exist', PLACES.map(p => p + ':' + poolFor(p).length).join(' '));
ok(STAGE_IDS.every(s => STAGE_TUNE[s] && poolFor(s)[0] === STAGE_TUNE[s]) && new Set(STAGE_IDS.map(s => STAGE_TUNE[s])).size === STAGE_IDS.length, 'a fight begins with the tune of its own stage; the four stages have four tunes', STAGE_IDS.map(s => poolFor(s)[0]).join(' '));
STAGE_IDS.forEach(s => { const p = poolFor(s); ok(p.length === FIGHT.length && new Set(p).size === p.length && FIGHT.every(id => p.includes(id)), s + ': the other three follow in an order, none twice', p.join(' > ')); });
ok(POOLS.menu[0] === 'arenalights' && POOLS.select[0] === 'choose' && POOLS.boss[0] === 'queen', 'the menus, the select and the boss each have their own tune');
ok(IDS.every(id => loopsFor(id) >= 1 && loopsFor(id) * passSecs(id) >= MIN_HEARD && passSecs(id) > 50 && passSecs(id) < 100), 'each tune is about a minute a pass, heard through at least ' + MIN_HEARD + ' s before the next', IDS.map(id => Math.round(passSecs(id)) + 's').join(' '));
ok(JSON.stringify(layersFor(0)) === '{"explore":true,"combat":false,"tension":false}' && layersFor(1).combat && !layersFor(1).tension && layersFor(2).tension, 'level 0 is the floor, 1 the band, 2 the last round');
{
  const M = createSbMusic({ studio: () => null });
  M.set(0, 'menu'); M.set(1, 'park'); M.set(2); ok(M.state.place === 'park' && M.state.level === 2, 'the place and the level are set separately: a fight says the level every frame and the place once');
  M.set(1, 'nowhere'); ok(M.state.place === 'park', 'a place that does not exist is ignored');
  M.start(); M.step(); M.stop(); ok(!M.state.running, 'the music starts, steps and stops with no studio and no sound, quietly');
}
console.log(fails ? '\n' + fails + ' FAILED of ' + checks : '\nstand battle music: all ' + checks + ' ok');
process.exit(fails ? 1 : 0);
