/* node apps/holyc/holyc_check.js -- HOLYC.EXE, held to account (pure Node).
   - the language: scoping, integer division, errors that say their line, the trace, the session a button calls back into;
   - the stage: what a program can put on it and what a click does;
   - every lesson step: its model answer meets its goals (after the clicks a person would make), and a step that asks for work is not done by the code it starts with;
   - every puzzle: its model answer passes every test, its starting program does not, each has hints, a brief and a price;
   - the highlighter reads every program in the app back as the same text. */
import { hcLex } from '../../kernel/holyc_lex.js';
import { hcParse } from '../../kernel/holyc_parse.js';
import { hcRun } from '../../kernel/holyc_run.js';
import { runProgram, stripped } from './engine.js';
import { runTests } from './tests.js';
import { createStage } from './stage.js';
import { LESSONS, startOf, modelOf, stepCount } from './lessons.js';
import { CHAPTERS, PUZZLES } from './puzzles.js';
import { PICS } from './puzzles_d.js';
import { TEMPLATES } from './templates.js';
import { highlight } from './highlight.js';
import { LESSON_SUN, STAR_SUN, puzzleSun, CHAPTER_SUN } from './pay.js';

const HC = { lex: hcLex, parse: hcParse, run: hcRun };
let bad = 0, n = 0;
const ok = (c, m) => { n++; if (!c) { bad++; console.log('FAIL ' + m); } };
const go = (src, o) => runProgram(HC, src, o);
const outOf = src => { const R = go(src); return R.err ? 'ERR ' + R.err.message : R.out.join('|'); };

/* ---- the language ------------------------------------------------------------------------------------------------------------------ */
ok(outOf('I64 x = 7 / 2; "%d\\n", x;') === '3', 'integer division truncates');
ok(outOf('F64 y = 7 / 2.0; "%.1f\\n", y;') === '3.5', 'a point makes a float');
ok(outOf('F64 ToF(F64 c) { return c * 9 / 5 + 32; } "%.1f\\n", ToF(37);') === '98.6', 'a typed parameter keeps its fraction');
ok(outOf('I64 f(I64 n) { if (n < 2) return 1; return n * f(n - 1); } "%d\\n", f(6);') === '720', 'recursion');
ok(outOf('I64 i = 5; for (I64 i = 0; i < 2; i++) { } "%d\\n", i;') === '5', 'a loop counter is the loop\'s own');
ok(outOf('U0 F() { I64 k = 9; } F; "%d\\n", k;').indexOf('undefined symbol "k"') >= 0, 'a function\'s variables are its own');
ok(outOf('I64 x = 1; { I64 x = 2; } "%d\\n", x;') === '1', 'a block\'s variables are its own');
ok(outOf('for (I64 i = 0; i < 6; i++) { if (i == 2) continue; if (i == 4) break; "%d\\n", i; }') === '0|1|3', 'continue and break');
ok(outOf('I64 i = 0; do { i++; } while (i < 5); "%d\\n", i;') === '5', 'do while');
ok(outOf('"%5d|%-5d|%05d|%.2f\\n", 42, 42, 42, 3.14159;') === '   42|42   |00042|3.14', 'format widths and precision');
ok(outOf('"%b %x %c\\n", 5, 255, 65;') === '101 ff A', 'binary, hex, characters');
ok(outOf('"%d\\n", \'A\';') === '65', 'a character is its number');
ok(/missing ; after "5"/.test(go('I64 x = 5\n"hi";').err.message) && go('I64 x = 5\n"hi";').err.line === 1, 'a missing ; is said, with the line it is missing from');
ok(go('"a\\n";\n"b\\n"\n').err.message === 'missing ; after "b\\n"', 'a string in the message is shown as written');
ok(go('I64 x = 5;\ny = 3;').err.line === 2 && /not declared/.test(go('I64 x = 5;\ny = 3;').err.message), 'an undeclared name is an error, on its line');
ok(go('I64 x = 5;\nI64 x = 6;').err.line === 2, 'declaring a name twice is an error');
ok(go('I64 x = 5;\n"%d", x / 0;').err.message === 'divided by zero', 'dividing by zero is an error');
ok(/too deep/.test(go('U0 R() { R; } R;').err.message), 'a function that calls itself for ever stops');
ok(/ran too long/.test(go('while (1) { }').err.message), 'a loop that never ends stops');
ok(go('U0 F() { "x\\n"; }\nF(1 2);').err.line === 2, 'a broken call says its line');
ok(/never ends/.test(go('"abc').err.message), 'an unclosed string is said');
ok(/never closed/.test(go('U0 F() {\n"x\\n";\n').err.message), 'an unclosed { is said');
ok(go('I64 a = 1;\n"%d\\n", a;\nundefinedthing;').err.line === 3, 'a run-time error is on the line that did it');
{
  const R = go('I64 a = 1;\nfor (a = 1; a < 3; a++)\n  a;\n', { trace: true });
  ok(R.trace.map(t => t.line).join(',') === '1,2,3,3' && R.trace[3].vars.a === 2, 'the trace says each statement\'s line and what the variables were');
}
{
  const R = go('I64 n = 0; U0 Inc() { n++; "n=%d\\n", n; }');
  ok(R.session && R.session.has('Inc') && R.session.defined('Inc') && !R.session.defined('Nope'), 'a program leaves a session behind');
  R.session.call('Inc'); R.session.call('Inc');
  ok(R.out.join('|') === 'n=1|n=2' && R.session.globals.n === 2, 'the session calls the program\'s functions again, and what they print arrives');
}
ok(go('I64 s = 0; for (I64 i = 0; i < 100; i++) s += i; "%d\\n", s;').out[0] === '4950', 'a loop adds up');
ok(go('"hello\\n"; "world\\n";').out.join('|') === 'hello|world', 'a bare string prints');
ok(go('Print("a%db\\n", 3);').out[0] === 'a3b', 'Print works as a call');
ok(go('"%d\\n", Max(3, 9) + Min(3, 9) + Abs(-4) + Floor(2.7);').out[0] === '18', 'the math builtins');

/* ---- the stage ----------------------------------------------------------------------------------------------------------------------- */
{
  const R = go('I64 n = 0;\nI64 s = Label("0");\nU0 Add() { n++; SetText(s, n); }\nButton("+1", "Add");\nPixel(3, 4, RED);\nNote(60, 100);\nNote(64, 200);');
  ok(!R.err && R.stage.items.length === 2 && R.stage.grid[4 * 16 + 3] === 4, 'Label, Button and Pixel put things on the stage');
  ok(R.stage.notes.length === 2 && R.stage.notes[1].t === 100 && R.stage.cursor === 300, 'notes follow one another');
  R.stage.click('+1'); R.stage.click('+1');
  ok(R.stage.labels()[0] === '2' && R.stage.clicks === 2, 'a click calls the function the button names');
  ok(!R.stage.click('NOPE').ok, 'a button that is not there cannot be pressed');
  const B = go('Button("X", "Nothing");');
  ok(B.stage.warnings.length === 1 && /NO FUNCTION/.test(B.stage.warnings[0]), 'a button that names no function is warned about');
  const C = go('I64 t = 0;\nI64 s = Label("0");\nU0 Tick() { t++; SetText(s, t); }\nEvery(1000, "Tick");');
  C.stage.advance(3500);
  ok(C.stage.labels()[0] === '3', 'Every calls a function as time passes');
  const D = go('Pixel(-1, 0, RED); Pixel(16, 0, RED); Pixel(0, 0, 99);');
  ok(D.stage.offBoard === 2 && D.stage.grid[0] === (99 & 15), 'a Pixel off the board is counted, not drawn');
  const E = go('U0 Boom() { I64 z = 1 / 0; } Button("B", "Boom");');
  const r = E.stage.click('B');
  ok(r.ok === false && /divided by zero/.test(r.msg) && E.stage.err, 'an error inside a button is caught and kept');
  const F = go('I64 f = Field("A");\nI64 l = Label("");\nU0 Go() { SetText(l, "HI " + GetText(f)); }\nButton("GO", "Go");');
  F.stage.type('A', 'ADA'); F.stage.click('GO');
  ok(F.stage.labels()[0] === 'HI ADA', 'a field can be typed in and read back');
  const G = createStage(); for (let i = 0; i < 30; i++) G.builtins.Label(['x']);
  ok(G.items.length === 24 && G.warnings.length > 0, 'the stage is full at twenty-four things');
}

/* ---- the lessons ---------------------------------------------------------------------------------------------------------------------- */
ok(LESSONS.length === 7 && stepCount() >= 33, 'seven lessons, thirty-odd steps (' + stepCount() + ')');
function playSteps(step, runs) {
  const latched = step.goals.map(() => false);
  let last = null;
  for (const run of runs) {
    const R = go(run.code); last = R;
    (run.act || []).forEach(a => { if (a[0] === 'click') R.stage.click(a[1]); else if (a[0] === 'type') R.stage.type(a[1], a[2]); else if (a[0] === 'wait') R.stage.advance(a[1]); });
    step.goals.forEach((g, i) => {
      if (latched[i]) return;
      if (step.seq && i > 0 && !latched[i - 1]) return;
      let r; try { r = g.t.run(R); } catch (e) { r = { ok: false, msg: e.message }; }
      if (r.ok) latched[i] = true;
    });
  }
  return { latched, last };
}
LESSONS.forEach(L => {
  ok(L.steps.length >= 4 && L.title && L.blurb, L.id + ': a title, a blurb and four steps or more');
  const ids = new Set();
  L.steps.forEach((st, i) => {
    const tag = L.id + '/' + st.id + ' (' + st.title + ')';
    ok(!ids.has(st.id), tag + ': a unique id'); ids.add(st.id);
    ok(st.say && st.say.length >= 1 && st.say.every(s => s.length < 330), tag + ': says what to do, in short paragraphs');
    ok(st.goals && st.goals.length >= 1 && st.goals.every(g => g.text && g.text.length <= 48 && g.t), tag + ': goals with short words and a test');
    ok(st.hint && st.hint.length > 8 && st.ok, tag + ': a hint and a word of praise');
    const runs = st.runs || [{ code: st.model, act: st.act }];
    ok(runs.every(r => typeof r.code === 'string' && r.code.length > 0), tag + ': a model answer');
    const done = playSteps(st, runs);
    ok(done.latched.every(Boolean), tag + ': its model answer meets every goal (' + st.goals.filter((g, k) => !done.latched[k]).map(g => g.text).join('; ') + ')');
    /* a step that asks for work is not already done by the code it starts with, unless it is a step that only asks to be RUN */
    const startCode = startOf(L, i), startDone = playSteps(st, [{ code: startCode }]);
    if (st.runOnly) ok(startDone.latched.every(Boolean), tag + ': a RUN-only step is met by the code it starts with');
    else ok(!startDone.latched.every(Boolean), tag + ': it is not already done by the code it starts with');
    runs.forEach(r => { const R = go(r.code); if (!st.seq) ok(!R.err, tag + ': the model runs without an error (' + (R.err && R.err.message) + ')'); });
    /* the next step opens on this one's answer */
    if (i > 0 && L.steps[i].start === undefined) ok(!!startOf(L, i), tag + ': it carries on from the step before');
  });
});

/* ---- the puzzles ------------------------------------------------------------------------------------------------------------------------ */
ok(CHAPTERS.length === 9 && PUZZLES.length >= 50, 'nine chapters and fifty puzzles or more (' + PUZZLES.length + ')');
{
  const ids = new Set();
  CHAPTERS.forEach(c => ok(c.list.length >= 3 && c.title && c.blurb, c.id + ': a title, a blurb and three puzzles or more'));
  PUZZLES.forEach(p => {
    const tag = p.id + ' (' + p.title + ')';
    ok(!ids.has(p.id) && /^[a-z]_[a-z0-9]+$/.test(p.id), tag + ': a unique id'); ids.add(p.id);
    ok(CHAPTERS.some(c => c.id === p.ch && c.list.indexOf(p) >= 0), tag + ': it is in its own chapter');
    ok([1, 2, 3, 4].indexOf(p.stars) >= 0, tag + ': one to four stars');
    ok(p.brief.length >= 1 && p.brief.every(b => b.length <= 330), tag + ': a brief in short paragraphs');
    ok(p.hints.length === 3 && p.hints.every(h => h.length > 6), tag + ': three hints, each saying more');
    ok(p.tests.length >= 1 && p.tests.every(t => t.name && t.name.length <= 64 && typeof t.run === 'function'), tag + ': tests with names that fit');
    /* the model answer passes every test, and does so without an error */
    const good = runTests(HC, p.model, p.tests);
    ok(good.ok, tag + ': its model answer passes every test (' + good.results.filter(r => !r.ok).map(r => r.name + ' [' + (r.msg || r.got) + ']').join('; ') + ')');
    /* the program it starts with is not already a solution */
    const start = runTests(HC, p.start, p.tests);
    ok(!start.ok, tag + ': its starting program is not already a solution');
    ok(p.stars >= 1 && puzzleSun(p.stars, false) === STAR_SUN[p.stars] && puzzleSun(p.stars, true) < puzzleSun(p.stars, false), tag + ': it has a price, and less if the answer was looked at');
  });
  /* a program that does nothing, and a program that only prints, solve none of them */
  PUZZLES.forEach(p => { ok(!runTests(HC, '"nothing\\n";', p.tests).ok, p.id + ': a program that only prints a word solves nothing'); });
  const pics = Object.keys(PICS);
  ok(pics.every(id => PUZZLES.some(p => p.id === id)), 'every picture belongs to a puzzle');
  const total = PUZZLES.reduce((a, p) => a + puzzleSun(p.stars, false), 0) + CHAPTERS.length * CHAPTER_SUN + LESSONS.length * LESSON_SUN;
  ok(total > 8000 && total < 16000, 'the whole of it pays ' + total + ' SUN, once (8,000 to 16,000)');
  console.log('  ' + PUZZLES.length + ' puzzles in ' + CHAPTERS.length + ' chapters, ' + PUZZLES.reduce((a, p) => a + p.tests.length, 0) + ' tests, ' + total + ' SUN for all of it');
}

/* ---- the workshop, and what the editor shows ---------------------------------------------------------------------------------------------- */
TEMPLATES.forEach(t => {
  const R = go(t.code);
  ok(!R.err, 'template ' + t.id + ' runs without an error (' + (R.err && R.err.message) + ')');
  ok(t.id === 'blank' || R.stage.items.length > 0 || R.stage.notes.length > 0 || R.out.length > 0, 'template ' + t.id + ' does something');
});
{
  const R = go(TEMPLATES.find(t => t.id === 'counter').code); R.stage.click('+1'); R.stage.click('+1');
  ok(R.stage.labels()[0] === '2' && R.stage.beeps === 2, 'the counter template counts and beeps');
  const sources = [].concat(TEMPLATES.map(t => t.code), PUZZLES.map(p => p.start), PUZZLES.map(p => p.model), LESSONS.reduce((a, l) => a.concat(l.steps.map(s => modelOf(s))), []));
  let drift = 0; sources.forEach(src => { if (highlight(src).map(p => p.s).join('') !== src) drift++; });
  ok(drift === 0, 'the highlighter puts every program in the app back as the same text (' + drift + ' did not)');
  ok(highlight('"a %d\\n" // x').some(p => p.t === 'esc') && highlight('I64 x;').some(p => p.t === 'ty'), 'the highlighter finds types and slots');
  ok(highlight('"never ends\nI64 x;').map(p => p.s).join('') === '"never ends\nI64 x;' && highlight('"never ends\nI64 x;').some(p => p.t === 'ty'), 'an unclosed string stops at the end of its line');
}

/* ---- done ------------------------------------------------------------------------------------------------------------------------------ */
void stripped;
console.log(bad ? bad + ' FAILED of ' + n : 'holyc: all ' + n + ' ok  (' + stepCount() + ' lesson steps)');
process.exit(bad ? 1 : 0);
