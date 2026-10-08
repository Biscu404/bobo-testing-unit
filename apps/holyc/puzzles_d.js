/* PUZZLES, part four: PIXELS, SOUND and BIG ONES. The board is judged square by square (a puzzle that asks for a picture says what it is, and the lab
   shows the picture it wants next to the one you made); the music is judged by its notes in order; the big ones are apps, judged by a person at the stage. */
import { T } from './tests.js';
import { P } from './puzzles_a.js';
const r = String.raw;
const lines = (...a) => a.join('\n');
const lab = (R, i) => (R.stage.items.filter(x => x.kind === 'label')[i || 0] || {}).text;
const have = (R, t) => R.stage.labels().indexOf(t) >= 0 || 'the stage shows ' + (R.stage.labels().join(' | ') || 'no labels') + ', not ' + t;
const XY = 'for (I64 y = 0; y < 16; y++)\n  for (I64 x = 0; x < 16; x++)\n';

/* the pictures: f(x, y) is the colour of the square. The lab draws these too, so a person sees what is asked. */
export const PICS = {
  p_dot: (x, y) => x === 7 && y === 7 ? 4 : 0,
  p_frame: (x, y) => x === 0 || y === 0 || x === 15 || y === 15 ? 15 : 0,
  p_checker: (x, y) => (x + y) % 2 === 0 ? 15 : 1,
  p_diag: (x, y) => x === y || x + y === 15 ? 14 : 0,
  p_stairs: (x, y) => x <= y ? 2 : 0,
  p_rainbow: (x, y) => y,
  p_disc: (x, y) => (x - 8) * (x - 8) + (y - 8) * (y - 8) <= 36 ? 12 : 0,
  p_box: (x, y) => (x >= 2 && x < 6 && y >= 3 && y < 7 ? 4 : 0) || (x >= 10 && x < 15 && y >= 10 && y < 15 ? 1 : 0)
};

export const PIXELS = [
  P('pixels', 'p_dot', 'ONE DOT', 1, ['Paint one red square, at x = 7, y = 7. Nothing else.', '`Pixel(x, y, colour)` paints one square. (0, 0) is the top left.'], '// paint it here\n',
    ['Colours are words: RED, BLUE, YELLOW...', '`Pixel(7, 7, RED);`', 'Pixel(7, 7, RED);'], 'Pixel(7, 7, RED);', [T.board(PICS.p_dot, 'THE BOARD HAS ONE RED SQUARE')]),
  P('pixels', 'p_frame', 'A FRAME', 2, ['Draw a white frame round the edge of the board: the squares with x or y at 0 or 15. The inside stays black.'], '// loop over the board\n',
    ['Two loops, `y` and `x`, each from 0 to 15, and an `if` that says when to paint.', 'On the edge means `x == 0 || x == 15 || y == 0 || y == 15`.', lines(XY.trimEnd(), '    if (x == 0 || x == 15 || y == 0 || y == 15)', '      Pixel(x, y, WHITE);')],
    lines(XY.trimEnd(), '    if (x == 0 || x == 15 || y == 0 || y == 15)', '      Pixel(x, y, WHITE);'), [T.board(PICS.p_frame, 'THE FRAME IS RIGHT'), T.source(/\bfor\b[\s\S]*\bfor\b/, 'USES TWO LOOPS', 'use a loop inside a loop')]),
  P('pixels', 'p_checker', 'THE CHECKERBOARD', 2, ['Paint every square: WHITE where `x + y` is even and BLUE where it is odd.'], '// loops over the board\n',
    ['`(x + y) % 2 == 0` says the square is an even one.', 'Paint every square: WHITE if even, else BLUE.', lines(XY.trimEnd(), '    if ((x + y) % 2 == 0)', '      Pixel(x, y, WHITE);', '    else', '      Pixel(x, y, BLUE);')],
    lines(XY.trimEnd(), '    if ((x + y) % 2 == 0)', '      Pixel(x, y, WHITE);', '    else', '      Pixel(x, y, BLUE);'), [T.board(PICS.p_checker, 'THE CHECKERBOARD IS RIGHT')]),
  P('pixels', 'p_diag', 'THE CROSS', 2, ['Paint both diagonals YELLOW: the squares where `x == y`, and where `x + y == 15`. The rest stays black.'], '// loops over the board\n',
    ['Two ways to be on a diagonal; either one paints.', '`if (x == y || x + y == 15)`', lines(XY.trimEnd(), '    if (x == y || x + y == 15)', '      Pixel(x, y, YELLOW);')],
    lines(XY.trimEnd(), '    if (x == y || x + y == 15)', '      Pixel(x, y, YELLOW);'), [T.board(PICS.p_diag, 'THE CROSS IS RIGHT')]),
  P('pixels', 'p_stairs', 'GREEN STAIRS', 2, ['Paint GREEN every square where `x <= y`: a staircase going down to the right. The rest stays black.'], '// loops over the board\n',
    ['The question is `x <= y`.', 'You can also start the inside loop at 0 and stop at `y`.', lines(XY.trimEnd(), '    if (x <= y)', '      Pixel(x, y, GREEN);')],
    lines(XY.trimEnd(), '    if (x <= y)', '      Pixel(x, y, GREEN);'), [T.board(PICS.p_stairs, 'THE STAIRS ARE RIGHT')]),
  P('pixels', 'p_rainbow', 'STRIPES', 2, ['Paint every row in its own colour: the row `y` is painted with the colour number `y`. (A colour is just a number from 0 to 15: BLACK is 0 and WHITE is 15.)'], '// loops over the board\n',
    ['A colour can be a number as well as a word.', '`Pixel(x, y, y)`', lines(XY.trimEnd(), '    Pixel(x, y, y);')],
    lines(XY.trimEnd(), '    Pixel(x, y, y);'), [T.board(PICS.p_rainbow, 'THE STRIPES ARE RIGHT')]),
  P('pixels', 'p_disc', 'A DISC', 3, ['Paint a disc: every square whose distance from the middle (8, 8) is at most 6. Paint it LTRED.', 'A square is inside when `(x - 8) * (x - 8) + (y - 8) * (y - 8) <= 36`: Pythagoras, without the square root.'], '// loops over the board\n',
    ['The question is the formula in the brief.', 'Inside the two loops: an `if` with that question and a `Pixel` for the yes.', lines(XY.trimEnd(), '    if ((x - 8) * (x - 8) + (y - 8) * (y - 8) <= 36)', '      Pixel(x, y, LTRED);')],
    lines(XY.trimEnd(), '    if ((x - 8) * (x - 8) + (y - 8) * (y - 8) <= 36)', '      Pixel(x, y, LTRED);'), [T.board(PICS.p_disc, 'THE DISC IS RIGHT')]),
  P('pixels', 'p_box', 'A BOX FUNCTION', 3, ['Write `Box(x0, y0, size, colour)`: it paints a filled square of that size with its top left corner at (x0, y0).', 'Then use it: a RED box of size 4 at (2, 3) and a BLUE one of size 5 at (10, 10). Your program will be judged on `Box` itself, so write it as a function and call it twice.'],
    lines('U0 Box(I64 x0, I64 y0, I64 size, I64 colour)', '{', '  // paint it', '}', '// call it twice'),
    ['Two loops, `dy` and `dx`, from 0 to `size - 1`.', '`Pixel(x0 + dx, y0 + dy, colour)` inside them.', lines('U0 Box(I64 x0, I64 y0, I64 size, I64 colour)', '{', '  for (I64 dy = 0; dy < size; dy++)', '    for (I64 dx = 0; dx < size; dx++)', '      Pixel(x0 + dx, y0 + dy, colour);', '}', 'Box(2, 3, 4, RED);', 'Box(10, 10, 5, BLUE);')],
    lines('U0 Box(I64 x0, I64 y0, I64 size, I64 colour)', '{', '  for (I64 dy = 0; dy < size; dy++)', '    for (I64 dx = 0; dx < size; dx++)', '      Pixel(x0 + dx, y0 + dy, colour);', '}', 'Box(2, 3, 4, RED);', 'Box(10, 10, 5, BLUE);'),
    [T.board(PICS.p_box, 'BOTH BOXES ARE DRAWN'), { name: 'Box DRAWS WHEREVER IT IS ASKED', run: R => {
      if (!R.session || !R.session.defined('Box')) return { ok: false, msg: 'there is no function named Box' };
      R.stage.builtins.Clear(); R.session.call('Box', [0, 0, 3, 9]); R.session.call('Box', [12, 12, 4, 10]);
      let wrong = 0; for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const w = x < 3 && y < 3 ? 9 : x >= 12 && y >= 12 ? 10 : 0; if (R.stage.grid[y * 16 + x] !== w) wrong++; }
      return wrong === 0 ? { ok: true } : { ok: false, msg: wrong + ' squares are wrong when Box is called with other numbers' };
    } }])
];

export const SOUND = [
  P('sound', 'm_scale', 'THE MAJOR SCALE', 2, ['Play the C major scale, going up: the notes 60 62 64 65 67 69 71 72, one after another.', '`Note(number, milliseconds)` plays one. Each starts when the last one ends.'], '// the notes go here\n',
    ['Eight notes, eight statements, or a loop and a few `if`s.', 'Try 250 milliseconds each.', lines('Note(60, 250); Note(62, 250);', 'Note(64, 250); Note(65, 250);', 'Note(67, 250); Note(69, 250);', 'Note(71, 250); Note(72, 500);')],
    lines('Note(60, 250); Note(62, 250);', 'Note(64, 250); Note(65, 250);', 'Note(67, 250); Note(69, 250);', 'Note(71, 250); Note(72, 500);'), [T.notes([60, 62, 64, 65, 67, 69, 71, 72], 'PLAYS THE C MAJOR SCALE')]),
  P('sound', 'm_twinkle', 'TWINKLE', 2, ['Play the first line of "Twinkle, Twinkle": C C G G A A G, which is the notes 60 60 67 67 69 69 67. Make the last one long.'], '// the notes go here\n',
    ['Seven notes. Each needs its length.', 'Short ones 300 milliseconds, the last 700.', lines('Note(60, 300); Note(60, 300);', 'Note(67, 300); Note(67, 300);', 'Note(69, 300); Note(69, 300);', 'Note(67, 700);')],
    lines('Note(60, 300); Note(60, 300);', 'Note(67, 300); Note(67, 300);', 'Note(69, 300); Note(69, 300);', 'Note(67, 700);'),
    [T.notes([60, 60, 67, 67, 69, 69, 67], 'PLAYS THE TUNE'), T.has(R => R.stage.notes.length === 7 && R.stage.notes[6].ms > R.stage.notes[0].ms, 'THE LAST NOTE IS LONGER')]),
  P('sound', 'm_chord', 'A CHORD FUNCTION', 3, ['Write `Chord(root)`, which plays three notes one after another: `root`, `root + 4` and `root + 7` (a major chord).', 'Then play `Chord(60);` `Chord(65);` `Chord(67);`: C, F and G.'],
    lines('U0 Chord(I64 root)', '{', '  // three notes', '}', '// play three chords'),
    ['Three `Note` statements inside the function.', '`Note(root, 200);` then `Note(root + 4, 200);` then `Note(root + 7, 200);`', lines('U0 Chord(I64 root)', '{', '  Note(root, 200);', '  Note(root + 4, 200);', '  Note(root + 7, 200);', '}', 'Chord(60);', 'Chord(65);', 'Chord(67);')],
    lines('U0 Chord(I64 root)', '{', '  Note(root, 200);', '  Note(root + 4, 200);', '  Note(root + 7, 200);', '}', 'Chord(60);', 'Chord(65);', 'Chord(67);'),
    [T.notes([60, 64, 67, 65, 69, 72, 67, 71, 74], 'PLAYS C, F AND G'), T.callsAtLeast('Chord', 3, 'CALLS Chord THREE TIMES')]),
  P('sound', 'm_piano', 'A PIANO', 3, ['Three buttons, `C`, `E` and `G`. Each plays its own note when pressed: C is 60, E is 64 and G is 67.'], '// three functions, three buttons\n',
    ['One function per note, one button per function.', '`Button("C", "PlayC");` calls a function named `PlayC`.', lines('U0 PlayC() { Note(60, 400); }', 'U0 PlayE() { Note(64, 400); }', 'U0 PlayG() { Note(67, 400); }', 'Button("C", "PlayC");', 'Button("E", "PlayE");', 'Button("G", "PlayG");')],
    lines('U0 PlayC() { Note(60, 400); }', 'U0 PlayE() { Note(64, 400); }', 'U0 PlayG() { Note(67, 400); }', 'Button("C", "PlayC");', 'Button("E", "PlayE");', 'Button("G", "PlayG");'),
    [T.scenario('C PLAYS 60', [['click', 'C']], R => (R.stage.notes.length === 1 && R.stage.notes[0].n === 60) || 'it played ' + R.stage.notes.map(n => n.n).join(' ')),
     T.scenario('E PLAYS 64', [['click', 'E']], R => (R.stage.notes.length === 1 && R.stage.notes[0].n === 64) || 'it played ' + R.stage.notes.map(n => n.n).join(' ')),
     T.scenario('G PLAYS 67, AND THE NOTES FOLLOW EACH OTHER', [['click', 'G'], ['click', 'C']], R => (R.stage.notes.length === 2 && R.stage.notes[0].n === 67 && R.stage.notes[1].n === 60) || 'it played ' + R.stage.notes.map(n => n.n).join(' '))])
];

export const BIG = [
  P('big', 'b_calc', 'A CALCULATOR', 3, ['Two boxes with the hints `A` and `B`, four buttons `+` `-` `*` `/`, and a label for the answer.', 'Type 12 and 4, press a button, and the label shows the answer: 16, 8, 48 or 3.'], '// two Fields, four Buttons, a Label\n',
    ['One small function for each button.', '`SetText(answer, GetNum(a) + GetNum(b))`', lines('I64 a = Field("A");', 'I64 b = Field("B");', 'I64 answer = Label("");', 'U0 Plus() { SetText(answer, GetNum(a) + GetNum(b)); }', 'U0 Minus() { SetText(answer, GetNum(a) - GetNum(b)); }', 'U0 Times() { SetText(answer, GetNum(a) * GetNum(b)); }', 'U0 Over() { SetText(answer, GetNum(a) / GetNum(b)); }', 'Button("+", "Plus");', 'Button("-", "Minus");', 'Button("*", "Times");', 'Button("/", "Over");')],
    lines('I64 a = Field("A");', 'I64 b = Field("B");', 'I64 answer = Label("");', 'U0 Plus() { SetText(answer, GetNum(a) + GetNum(b)); }', 'U0 Minus() { SetText(answer, GetNum(a) - GetNum(b)); }', 'U0 Times() { SetText(answer, GetNum(a) * GetNum(b)); }', 'U0 Over() { SetText(answer, GetNum(a) / GetNum(b)); }', 'Button("+", "Plus");', 'Button("-", "Minus");', 'Button("*", "Times");', 'Button("/", "Over");'),
    ['+', '-', '*', '/'].map((op, i) => T.scenario('12 ' + op + ' 4 IS ' + [16, 8, 48, 3][i], [['type', 'A', '12'], ['type', 'B', '4'], ['click', op]], R => have(R, String([16, 8, 48, 3][i]))))),
  P('big', 'b_quiz', 'THE QUIZ', 3, ['A label with the question `6 x 7 = ?`, three buttons `40`, `42` and `44`, a label that says `RIGHT!` or `WRONG.` after an answer, and a label `SCORE: 0` that goes up by one for each right answer.'], '// labels, three buttons, a score\n',
    ['Three buttons can call functions that share the work: one for the right answer and one for the wrong ones.', 'Keep the score in a box, and show `"SCORE: " + score`.', lines('I64 score = 0;', 'I64 q = Label("6 x 7 = ?");', 'I64 says = Label("");', 'I64 total = Label("SCORE: 0");', 'U0 Right() { score++; SetText(says, "RIGHT!"); SetText(total, "SCORE: " + score); }', 'U0 Wrong() { SetText(says, "WRONG."); }', 'Button("40", "Wrong");', 'Button("42", "Right");', 'Button("44", "Wrong");')],
    lines('I64 score = 0;', 'I64 q = Label("6 x 7 = ?");', 'I64 says = Label("");', 'I64 total = Label("SCORE: 0");', 'U0 Right() { score++; SetText(says, "RIGHT!"); SetText(total, "SCORE: " + score); }', 'U0 Wrong() { SetText(says, "WRONG."); }', 'Button("40", "Wrong");', 'Button("42", "Right");', 'Button("44", "Wrong");'),
    [T.has(R => R.stage.labels().indexOf('6 x 7 = ?') >= 0 && R.stage.labels().indexOf('SCORE: 0') >= 0, 'SHOWS THE QUESTION AND SCORE: 0'),
     T.scenario('42 IS RIGHT!', [['click', '42']], R => have(R, 'RIGHT!') === true && have(R, 'SCORE: 1')),
     T.scenario('40 IS WRONG. AND SCORES NOTHING', [['click', '40']], R => have(R, 'WRONG.') === true && have(R, 'SCORE: 0')),
     T.scenario('TWO RIGHT ANSWERS SCORE 2', [['click', '42'], ['click', '44'], ['click', '42']], R => have(R, 'SCORE: 2'))]),
  P('big', 'b_stopwatch', 'THE STOPWATCH', 4, ['A label that shows seconds, and three buttons: `START`, `STOP` and `RESET`.', 'START makes it count up once a second, STOP holds it where it is, START carries on from there, and RESET puts it back to 0.', '`Every(1000, "Tick")` calls `Tick` every second, as long as the program runs: make `Tick` do nothing when it is stopped.'],
    '// a label, a flag for running, Every, three buttons\n',
    ['A box `running` that is 1 or 0. `Tick` only counts if it is 1.', 'START sets it to 1, STOP to 0, RESET sets the count to 0 and shows it.', lines('I64 secs = 0;', 'I64 running = 0;', 'I64 shown = Label("0");', 'U0 Tick() { if (running) { secs++; SetText(shown, secs); } }', 'U0 Start() { running = 1; }', 'U0 Stop() { running = 0; }', 'U0 Zero() { secs = 0; SetText(shown, secs); }', 'Every(1000, "Tick");', 'Button("START", "Start");', 'Button("STOP", "Stop");', 'Button("RESET", "Zero");')],
    lines('I64 secs = 0;', 'I64 running = 0;', 'I64 shown = Label("0");', 'U0 Tick() { if (running) { secs++; SetText(shown, secs); } }', 'U0 Start() { running = 1; }', 'U0 Stop() { running = 0; }', 'U0 Zero() { secs = 0; SetText(shown, secs); }', 'Every(1000, "Tick");', 'Button("START", "Start");', 'Button("STOP", "Stop");', 'Button("RESET", "Zero");'),
    [T.has(R => lab(R) === '0', 'STARTS AT 0'),
     T.scenario('IT DOES NOT COUNT UNTIL STARTED', [['wait', 5000]], R => have(R, '0')),
     T.scenario('START, THREE SECONDS: 3', [['click', 'START'], ['wait', 3000]], R => have(R, '3')),
     T.scenario('STOP HOLDS IT AT 3', [['click', 'START'], ['wait', 3000], ['click', 'STOP'], ['wait', 4000]], R => have(R, '3')),
     T.scenario('START AGAIN CARRIES ON: 4', [['click', 'START'], ['wait', 3000], ['click', 'STOP'], ['wait', 2000], ['click', 'START'], ['wait', 1000]], R => have(R, '4')),
     T.scenario('RESET GOES BACK TO 0', [['click', 'START'], ['wait', 3000], ['click', 'RESET']], R => have(R, '0'))]),
  P('big', 'b_painter', 'THE PIXEL PAINTER', 4, ['An app for painting the board. A cursor starts at (0, 0). Buttons `LEFT` `RIGHT` `UP` `DOWN` move it one square (never off the board), and `PAINT` paints the cursor\'s square in the current colour, which starts WHITE.', 'Three buttons `RED`, `GREEN` and `BLUE` choose the current colour.'], '// the cursor, the colour, eight buttons\n',
    ['Keep `cx`, `cy` and `colour` in boxes. Each button changes one of them.', 'Stay on the board: `if (cx > 0) cx--;` and `if (cx < 15) cx++;`', lines('I64 cx = 0; I64 cy = 0; I64 colour = WHITE;', 'U0 Left() { if (cx > 0) cx--; }', 'U0 Right() { if (cx < 15) cx++; }', 'U0 Up() { if (cy > 0) cy--; }', 'U0 Down() { if (cy < 15) cy++; }', 'U0 Paint() { Pixel(cx, cy, colour); }', 'U0 Red() { colour = RED; }', 'U0 Green() { colour = GREEN; }', 'U0 Blue() { colour = BLUE; }', 'Button("LEFT", "Left"); Button("RIGHT", "Right");', 'Button("UP", "Up"); Button("DOWN", "Down");', 'Button("PAINT", "Paint");', 'Button("RED", "Red"); Button("GREEN", "Green"); Button("BLUE", "Blue");')],
    lines('I64 cx = 0; I64 cy = 0; I64 colour = WHITE;', 'U0 Left() { if (cx > 0) cx--; }', 'U0 Right() { if (cx < 15) cx++; }', 'U0 Up() { if (cy > 0) cy--; }', 'U0 Down() { if (cy < 15) cy++; }', 'U0 Paint() { Pixel(cx, cy, colour); }', 'U0 Red() { colour = RED; }', 'U0 Green() { colour = GREEN; }', 'U0 Blue() { colour = BLUE; }', 'Button("LEFT", "Left"); Button("RIGHT", "Right");', 'Button("UP", "Up"); Button("DOWN", "Down");', 'Button("PAINT", "Paint");', 'Button("RED", "Red"); Button("GREEN", "Green"); Button("BLUE", "Blue");'),
    (() => { const at = (R, x, y) => R.stage.grid[y * 16 + x];
      return [T.scenario('PAINT AT THE START MAKES (0, 0) WHITE', [['click', 'PAINT']], R => at(R, 0, 0) === 15 || 'the square at 0, 0 is colour ' + at(R, 0, 0)),
        T.scenario('RIGHT RIGHT DOWN PAINT MAKES (2, 1) WHITE', [['click', 'RIGHT'], ['click', 'RIGHT'], ['click', 'DOWN'], ['click', 'PAINT']], R => at(R, 2, 1) === 15 || 'the square at 2, 1 is colour ' + at(R, 2, 1)),
        T.scenario('THE CURSOR STAYS ON THE BOARD', [['click', 'LEFT'], ['click', 'UP'], ['click', 'PAINT']], R => at(R, 0, 0) === 15 || 'LEFT and UP at the corner must not move it'),
        T.scenario('IT STOPS AT THE FAR EDGE', Array.from({ length: 20 }, () => ['click', 'RIGHT']).concat([['click', 'PAINT']]), R => at(R, 15, 0) === 15 || 'twenty RIGHTs must stop at square 15'),
        T.scenario('RED, THEN ONE LEFT-RIGHT STEP, PAINTS RED', [['click', 'RIGHT'], ['click', 'RIGHT'], ['click', 'RED'], ['click', 'LEFT'], ['click', 'PAINT']], R => at(R, 1, 0) === 4 || 'the square at 1, 0 is colour ' + at(R, 1, 0)),
        T.scenario('GREEN AND BLUE TOO', [['click', 'GREEN'], ['click', 'PAINT'], ['click', 'DOWN'], ['click', 'BLUE'], ['click', 'PAINT']], R => (at(R, 0, 0) === 2 && at(R, 0, 1) === 1) || 'the squares are ' + at(R, 0, 0) + ' and ' + at(R, 0, 1))]; })()),
  P('big', 'b_alarm', 'THE ALARM', 4, ['A box with the hint `SECONDS`, a button `START`, and a label. Press START and the label counts down from the number in the box, one a second. When it reaches 0 it says `RING!` and plays `Beep();` once.', 'Type 3: after one second it says 2, after two it says 1, after three it says RING!'], '// a Field, a Label, Every and a countdown\n',
    ['`Every(1000, "Tick")` runs all the time: only count down when `left > 0`.', 'START reads the box with `GetNum` and puts it in `left`.', lines('I64 sec = Field("SECONDS");', 'I64 shown = Label("-");', 'I64 left = 0;', 'U0 Tick()', '{', '  if (left > 0)', '  {', '    left--;', '    SetText(shown, left);', '    if (left == 0) { SetText(shown, "RING!"); Beep; }', '  }', '}', 'U0 Start() { left = GetNum(sec); SetText(shown, left); }', 'Every(1000, "Tick");', 'Button("START", "Start");')],
    lines('I64 sec = Field("SECONDS");', 'I64 shown = Label("-");', 'I64 left = 0;', 'U0 Tick()', '{', '  if (left > 0)', '  {', '    left--;', '    SetText(shown, left);', '    if (left == 0) { SetText(shown, "RING!"); Beep; }', '  }', '}', 'U0 Start() { left = GetNum(sec); SetText(shown, left); }', 'Every(1000, "Tick");', 'Button("START", "Start");'),
    [T.scenario('3 SECONDS: AFTER ONE IT SAYS 2', [['type', 'SECONDS', '3'], ['click', 'START'], ['wait', 1000]], R => have(R, '2')),
     T.scenario('AFTER TWO, 1', [['type', 'SECONDS', '3'], ['click', 'START'], ['wait', 2000]], R => have(R, '1')),
     T.scenario('AFTER THREE, RING! AND A BEEP', [['type', 'SECONDS', '3'], ['click', 'START'], ['wait', 3000]], R => have(R, 'RING!') === true && (R.stage.beeps === 1 || 'it beeped ' + R.stage.beeps + ' times, not once')),
     T.scenario('IT RINGS ONCE, NOT FOR EVER', [['type', 'SECONDS', '2'], ['click', 'START'], ['wait', 9000]], R => have(R, 'RING!') === true && (R.stage.beeps === 1 || 'it beeped ' + R.stage.beeps + ' times'))])
];
