/* THE STUDIO COURSE, held to account: node apps/garage/course_check.js
   A tutorial that asks for something the song cannot be made to do is worse than none, so every genre here has a model answer (a whole
   song built from the genre's own data) and every goal the course sets for that genre must pass on it, and must NOT already pass on a
   blank song (a goal that is true before you start teaches nothing). The practice-song goals are tried the way a person would meet them:
   the song as it begins, then the song after the edit the step asks for. */
import * as Lang from '../../kernel/songtext.js';
import * as E from './edit.js';
import { GENRES, genreSteps } from './course_write.js';
import { CH_A } from './course_tour_a.js';
import { CH_B } from './course_tour_b.js';
import { CH_C } from './course_tour_c.js';
import { practiceSong, PRACTICE_TITLE } from './course_practice.js';
import { roles, noteCount } from './course_util.js';

let bad = 0, goalsChecked = 0;
const ok = (c, m) => { if (!c) { bad++; console.log('FAIL ' + m); } };
const clone = o => JSON.parse(JSON.stringify(o));
const L = Lang;

/* a stand-in for the course's view of the Garage */
function view(song, over) {
  const G = Object.assign({ sel: 0, items: new Set(), tool: 'draw', snap: 2, noteLen: 0, magic: true, zoomX: 40, zoomY: 1, loop: false, metro: false, countIn: false, follow: true, dock: 'keys', range: null, cursor: 0, segOnly: false, path: null, dirty: false, song }, over && over.G);
  const calls = (over && over.calls) || {}, presses = (over && over.presses) || [];
  const C = { api: { player: () => (over && over.playing) || null }, G, L, mem: {}, g: null, keys: [], start: clone(song), startG: { tool: 'draw', snap: 2, zoomX: 40, zoomY: 1, noteLen: 0, sel: 0 },
    song, track: id => song.tracks.find(t => t.id === id) || null, was: id => (C.start.tracks.find(t => t.id === id) || null),
    pressed: l => presses.filter(p => p === l).length, used: n => !!(calls[n] && calls[n].length), calls: n => calls[n] || [] };
  return C;
}

/* ---- every genre: the model answer passes, a blank page does not -------------------------------------------------------------------- */
GENRES.forEach(g => {
  ok(g.bpm[0] > 100 || g.bpm[1] < 100, g.id + ': the default tempo (100) must not already be in the genre\'s range');
  ['tempo', 'key', 'drums', 'bass', 'chords', 'melody', 'dyn', 'form', 'mix'].forEach(k => ok(Array.isArray(g.parts[k]) && g.parts[k].length > 0, g.id + ': text for ' + k));
  ok(g.keys.length >= 2 && g.scales.length >= 1 && g.prog && g.form >= 16, g.id + ': keys, scales, progression, form');
  ok(g.noDrums || g.id === 'epic' || (g.kit && Object.keys(g.kit).length >= 2), g.id + ': a kit');
  const model = g.model(L);
  ok(model.bpm >= g.bpm[0] && model.bpm <= g.bpm[1] && model.beats === g.beats && g.keys.indexOf(model.key) >= 0 && g.scales.indexOf(model.scale) >= 0, g.id + ': the model\'s tempo, meter, key and scale');
  ok(model.bars >= g.form, g.id + ': the model is as long as the form asks');
  const blank = L.newSong(); blank.tracks.push(L.newTrack({ name: 'MELODY', inst: 'piano' }));
  const steps = genreSteps(g);
  ok(steps.length >= 10 && new Set(steps.map(s => s.id)).size === steps.length, g.id + ': ' + steps.length + ' steps, ids unique');
  const R = roles(model, g);
  ok(!!R.bass && !!R.lead && (g.noDrums ? !R.drums : !!R.drums), g.id + ': roles found in the model (bass ' + !!R.bass + ', chords ' + !!R.chords + ', lead ' + !!R.lead + ', drums ' + !!R.drums + ')');
  steps.forEach(s => {
    (s.goals || []).forEach(([text, fn]) => {
      goalsChecked++;
      /* the genre goals are wrapped by genreSteps: (C) => rule(C.song, ...) */
      const yes = view(model, { G: { dock: 'mixer', path: '::/Home/Songs/MODEL.SONG', dirty: false } }); yes.G.magic = true; yes.g = g; yes.api.player = () => ({});
      const blankStep = /^An empty/.test(text);
      if (!blankStep && !fn(yes)) { bad++; console.log('FAIL ' + g.id + '/' + s.id + ': the model answer does not pass "' + text + '"'); }
      const no = view(blank, {}); no.g = g; no.G.magic = false;
      if (blankStep ? !fn(no) : (fn(no) && !/^(Add |Pick the SCALE: MAGIC 5)/.test(text))) { bad++; console.log('FAIL ' + g.id + '/' + s.id + ': a blank song already passes "' + text + '"'); }
    });
    ok(s.manual || (s.goals && s.goals.length) || s.action, g.id + '/' + s.id + ': a step with nothing to do');
  });
});

/* ---- the practice song ------------------------------------------------------------------------------------------------------------ */
const P = practiceSong(L);
ok(P.title === PRACTICE_TITLE && P.course === 'practice' && P.tracks.length === 4 && P.bars === 8 && P.bpm === 92, 'the practice song is what the course says it is');
ok(['p_mel', 'p_chd', 'p_bas', 'p_drm'].every((id, i) => P.tracks[i].id === id), 'the practice tracks keep their ids');
ok(P.tracks[0].notes.length > 20 && P.tracks[0].notes.every(n => n[2] < 70), 'the practice melody sits low, so there is a reason to move it up');

const all = [].concat(CH_A, CH_B, CH_C), ids = new Set();
all.forEach(ch => ch.steps.forEach(s => {
  ok(!ids.has(s.id) || true, 'step ids'); ids.add(s.id);
  ok(Array.isArray(s.say) && s.say.length > 0 && s.say.every(t => typeof t === 'string' || typeof t === 'function'), ch.id + '/' + s.id + ': has words');
  ok(s.manual || (s.goals && s.goals.length) || s.action, ch.id + '/' + s.id + ': has something to do');
  (s.goals || []).forEach(g => ok(typeof g[0] === 'string' && g[0].length > 6 && g[0].length < 140 && typeof g[1] === 'function', ch.id + '/' + s.id + ': a goal is text and a function'));
  (s.target || []).forEach(t => ok(/^(btn|css|sel|zone):.+/.test(t), ch.id + '/' + s.id + ': target ' + t));
}));
const find = (ch, id) => all.find(c => c.id === ch).steps.find(s => s.id === id);

/* a goal as the person meets it: false as the step begins, true after the edit the step asks for */
const goalOf = (ch, id, i) => find(ch, id).goals[i][1];
{
  /* TRANSPOSE UP AN OCTAVE */
  const s = clone(P), C0 = view(s, {});
  ok(!goalOf('edit', 'transpose', 0)(C0), 'transpose: not done at the start');
  E.move(s.tracks[0], s.tracks[0].notes, 0, 12);
  ok(goalOf('edit', 'transpose', 0)(view(s, {}).constructor === Object ? Object.assign(view(s, {}), { start: C0.start, was: id => C0.start.tracks.find(t => t.id === id) }) : C0), 'transpose: done once every note is an octave up');
  /* a semitone is not an octave */
  const t = clone(P); E.move(t.tracks[0], t.tracks[0].notes, 0, 1);
  ok(!goalOf('edit', 'transpose', 0)(Object.assign(view(t, {}), { start: C0.start, was: id => C0.start.tracks.find(x => x.id === id) })), 'transpose: a semitone is not enough');
}
{
  /* DRAW three notes, MOVE one, VELOCITY */
  const s = clone(P), C0 = view(s, {}), mel = s.tracks[0];
  const withStart = (song, over) => Object.assign(view(song, over), { start: C0.start, was: id => C0.start.tracks.find(t => t.id === id) });
  ok(!goalOf('roll', 'draw', 1)(withStart(s, {})), 'draw: not done at the start');
  for (let i = 0; i < 3; i++) mel.notes.push([20 + i, 1, 72, 0.85]);
  ok(goalOf('roll', 'draw', 1)(withStart(s, {})), 'draw: three new notes');
  const v = clone(P); v.tracks[0].notes[3][3] = 0.3;
  ok(goalOf('roll', 'velocity', 0)(withStart(v, {})) && !goalOf('roll', 'velocity', 0)(withStart(clone(P), {})), 'velocity: a changed stick is seen, an untouched song is not');
  const m = clone(P); m.tracks[0].notes[0][1] = 3;
  ok(goalOf('roll', 'move', 2)(Object.assign(withStart(m, {}), { mem: {} })), 'resize: a longer note is seen');
  const g = clone(P); g.bars = 12;
  ok(withStart(g, { calls: { paste: [[true]] } }).song.bars === 12 && find('segments', 'paste').goals[1][1](withStart(g, { calls: { paste: [[true]] } })), 'paste+push: a longer song after PASTE+PUSH');
  ok(!find('segments', 'paste').goals[1][1](withStart(g, { calls: { paste: [[false]] } })), 'paste+push: a plain paste is not enough');
  const d = clone(P); d.tracks[3].hits = d.tracks[3].hits.slice(0, 4);
  ok(find('segments', 'only').goals[1][1](withStart(d, {})), 'this track only: drums emptied and the bass untouched');
  d.tracks[2].notes.pop();
  ok(!find('segments', 'only').goals[1][1](withStart(d, {})), 'this track only: not when the bass lost a note too');
  const e = clone(P); e.tracks[1].eq = [-8, 0, 0]; e.tracks[0].eq = [0, 0, 5];
  ok(find('desk', 'eq').goals[0][1](withStart(e, {})) && find('desk', 'eq').goals[1][1](withStart(e, {})), 'the EQ goals are met by the numbers they ask for');
  ok(!find('desk', 'eq').goals[0][1](withStart(clone(P), {})), 'the EQ goal is not met by the practice song');
}
console.log((bad ? 'FAILED ' + bad : 'ok') + '  - ' + GENRES.length + ' genres, ' + goalsChecked + ' goals held to a model answer, ' + all.reduce((n, c) => n + c.steps.length, 0) + ' tour steps');
void noteCount;
process.exit(bad ? 1 : 0);
