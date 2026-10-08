/* THE BASICS, lessons five to seven: functions of your own, the stage (buttons, labels, boxes to type in), the board and the music.
   Same shape as lessons_a.js; `act` is what a person does on the stage between RUN and the goals being read. */
import { T } from './tests.js';
const r = String.raw;
const lab = R => R.stage.items.filter(i => i.kind === 'label');
const board = (f) => T.board(f);

export const LESSONS_B = [
  { id: 'L5', title: 'YOUR OWN WORDS', blurb: 'Functions: name a bunch of statements.', steps: [
    { id: 'l5a', runOnly: true, title: 'A FUNCTION', start: 'U0 Greet()\n{\n  "HELLO FROM A FUNCTION.\\n";\n}\nGreet;',
      say: ['A function is a named bunch of statements. `U0` means it gives nothing back.', 'Writing its name on its own, `Greet;`, calls it. That is a HolyC thing. `Greet();` works too.', '[RUN] it.'],
      goals: [{ text: 'PRINT HELLO FROM A FUNCTION.', t: T.outHas('HELLO FROM A FUNCTION.') }], model: 'U0 Greet()\n{\n  "HELLO FROM A FUNCTION.\\n";\n}\nGreet;', hint: 'Just press [RUN].', ok: 'You wrote a word the machine did not have.' },
    { id: 'l5b', title: 'CALL IT AGAIN',
      say: ['The point of a function is to use it many times. Call `Greet` two more times, so the line prints three times.'],
      goals: [{ text: 'PRINT THE LINE THREE TIMES', t: T.has(R => R.out.filter(l => l === 'HELLO FROM A FUNCTION.').length >= 3, 'THREE') }], model: 'U0 Greet()\n{\n  "HELLO FROM A FUNCTION.\\n";\n}\nGreet;\nGreet;\nGreet;', hint: 'Two more lines like `Greet;` under the first.', ok: 'Write once, use often.' },
    { id: 'l5c', title: 'PARAMETERS', start: 'U0 Greet(U8 *who)\n{\n  "HELLO, %s.\\n", who;\n}\nGreet("ADA");\nGreet("BEN");',
      say: ['A function can be given things to work with, called parameters. They go in the parentheses, each with its type.', 'This `Greet` takes one: a name. [RUN] it, then add a third person of your own.'],
      goals: [{ text: 'GREET TWO DIFFERENT PEOPLE', t: T.has(R => R.out.length >= 2 && new Set(R.out).size >= 2 && R.out.every(l => /^HELLO, .+\.$/.test(l)), 'TWO PEOPLE') }, { text: 'GREET THREE', t: T.has(R => R.out.length >= 3, 'THREE PEOPLE') }],
      model: 'U0 Greet(U8 *who)\n{\n  "HELLO, %s.\\n", who;\n}\nGreet("ADA");\nGreet("BEN");\nGreet("CAZ");', hint: 'One more `Greet("...");` with any name.', ok: 'The same function, different people.' },
    { id: 'l5d', title: 'GIVING BACK AN ANSWER', start: 'I64 Double(I64 n)\n{\n  return n * 2;\n}\n"%d\\n", Double(21);',
      say: ['A function can hand back an answer with `return`. Its type says what kind: `I64` for a whole number.', '[RUN] it. Then change it so `Double(21)` becomes `Double(8)`.'],
      goals: [{ text: 'DOUBLE 21 PRINTS 42', t: T.call('Double', [21], 42) }, { text: 'PRINT THE DOUBLE OF 8: 16', t: T.out(['16']) }], model: 'I64 Double(I64 n)\n{\n  return n * 2;\n}\n"%d\\n", Double(8);', hint: 'Only the number inside Double( ) in the last line.', ok: 'A function that is a value.' },
    { id: 'l5e', title: 'FUNCTIONS USING FUNCTIONS',
      say: ['Functions can call each other. Write `Quad`, which uses `Double` twice to multiply by four, so `Quad(5)` is 20.'],
      code: 'I64 Quad(I64 n)\n{\n  return Double(Double(n));\n}',
      goals: [{ text: 'Quad(5) IS 20', t: T.call('Quad', [5], 20) }, { text: 'QUAD USES Double TWICE', t: T.insideCalls('Quad', 'Double', 2) }],
      model: 'I64 Double(I64 n)\n{\n  return n * 2;\n}\nI64 Quad(I64 n)\n{\n  return Double(Double(n));\n}\n"%d\\n", Quad(5);', hint: 'Double(Double(n)) is "double it, then double that".', ok: 'Small pieces made into bigger ones. Now to put things on the stage.' }
  ] },

  { id: 'L6', title: 'THE STAGE', blurb: 'Buttons, labels and boxes: programs you can click.', steps: [
    { id: 'l6a', runOnly: true, title: 'A LABEL', start: 'Label("HELLO, STAGE.");',
      say: ['The right-hand side of the lab is the STAGE. A program can put things on it.', '`Label` puts words there. [RUN] it.'],
      goals: [{ text: 'PUT A LABEL ON THE STAGE', t: T.has(R => lab(R).length >= 1, 'LABEL') }], model: 'Label("HELLO, STAGE.");', hint: 'Press [RUN] and look to the right.', ok: 'Words on the screen: yours.' },
    { id: 'l6b', title: 'A BUTTON', start: 'U0 Hello()\n{\n  "YOU PRESSED IT.\\n";\n}\nButton("PRESS ME", "Hello");',
      say: ['`Button` makes a button. Its second part is the name of one of YOUR functions, in quotes: the function the button calls when it is pressed.', '[RUN] it, then press the button on the stage.'],
      goals: [{ text: 'PRESS THE BUTTON ON THE STAGE', t: T.has(R => R.stage.clicks >= 1, 'CLICKED') }, { text: 'ITS FUNCTION PRINTED', t: T.outHas('YOU PRESSED IT.') }],
      model: 'U0 Hello()\n{\n  "YOU PRESSED IT.\\n";\n}\nButton("PRESS ME", "Hello");', act: [['click', 'PRESS ME']], hint: 'The button is on the stage, on the right.', ok: 'A program that waits for you.' },
    { id: 'l6c', title: 'A COUNTER', start: 'I64 n = 0;\nI64 shown = Label("0");\nU0 Add()\n{\n  n++;\n  SetText(shown, n);\n}\nButton("+1", "Add");',
      say: ['A label can change. `Label` hands back a number, its id, that names it. `SetText(id, value)` changes its words.', '[RUN], and press `+1` three times: the label should read 3.'],
      goals: [{ text: 'MAKE THE LABEL SAY 3', t: T.has(R => R.stage.labels().indexOf('3') >= 0, 'THREE') }], model: 'I64 n = 0;\nI64 shown = Label("0");\nU0 Add()\n{\n  n++;\n  SetText(shown, n);\n}\nButton("+1", "Add");', act: [['click', '+1'], ['click', '+1'], ['click', '+1']], hint: 'Three clicks on +1.', ok: 'It remembers: `n` lives on between presses.' },
    { id: 'l6d', title: 'COLOUR',
      say: ['`Color(id, YELLOW)` colours a thing. The colours are the machine\'s sixteen: BLACK BLUE GREEN CYAN RED PURPLE BROWN LTGRAY DKGRAY LTBLUE LTGREEN LTCYAN LTRED LTPURPLE YELLOW WHITE.', 'Colour the counter yellow: add the line after the `Label` line, [RUN] and press `+1`.'],
      code: 'Color(shown, YELLOW);',
      goals: [{ text: 'COLOUR THE LABEL YELLOW', t: T.has(R => lab(R).some(l => l.color === 14), 'YELLOW') }, { text: 'PRESS +1 ONCE', t: T.has(R => R.stage.clicks >= 1, 'CLICK') }],
      model: 'I64 n = 0;\nI64 shown = Label("0");\nColor(shown, YELLOW);\nU0 Add()\n{\n  n++;\n  SetText(shown, n);\n}\nButton("+1", "Add");', act: [['click', '+1']], hint: 'Colour names are words with no quotes: YELLOW.', ok: 'Everything on the stage can have a colour.' },
    { id: 'l6e', title: 'A BOX TO TYPE IN', start: 'I64 name = Field("NAME");\nI64 reply = Label("TYPE YOUR NAME");\nU0 Greet()\n{\n  SetText(reply, "HELLO, " + GetText(name) + ".");\n}\nButton("GREET", "Greet");',
      say: ['`Field` makes a box you can type into. `GetText(id)` reads what is in it. And `+` joins words together.', '[RUN], type your name in the box, and press GREET.'],
      goals: [{ text: 'TYPE A NAME AND PRESS GREET', t: T.has(R => { const f = R.stage.items.find(i => i.kind === 'field'), l = lab(R)[0]; return !!f && f.value.length > 0 && !!l && l.text === 'HELLO, ' + f.value + '.'; }, 'GREETED') }],
      model: 'I64 name = Field("NAME");\nI64 reply = Label("TYPE YOUR NAME");\nU0 Greet()\n{\n  SetText(reply, "HELLO, " + GetText(name) + ".");\n}\nButton("GREET", "Greet");', act: [['type', 'NAME', 'ADA'], ['click', 'GREET']], hint: 'Click in the NAME box on the stage, type, then press GREET.', ok: 'A program with a user. You are building apps now.' }
  ] },

  { id: 'L7', title: 'THE BOARD AND THE MUSIC', blurb: 'Pixels and notes, painted with loops.', steps: [
    { id: 'l7a', title: 'ONE PIXEL', start: 'Pixel(8, 8, RED);',
      say: ['Also on the stage: a board of 16 by 16 squares. `Pixel(x, y, colour)` paints one. (0, 0) is the top left corner: x goes right, y goes down.', '[RUN] it. Then change the numbers and paint a second square.'],
      goals: [{ text: 'PAINT THE SQUARE AT 8, 8 RED', t: T.has(R => R.stage.grid[8 * 16 + 8] === 4, 'RED') }, { text: 'PAINT A SECOND SQUARE', t: T.has(R => R.stage.grid.filter(c => c !== 0).length >= 2, 'TWO') }],
      model: 'Pixel(8, 8, RED);\nPixel(9, 8, BLUE);', hint: 'Add another Pixel(...) line, with other numbers.', ok: 'Two dots. Now let a loop do the typing.' },
    { id: 'l7b', runOnly: true, title: 'A ROW', start: 'for (I64 x = 0; x < 16; x++)\n  Pixel(x, 0, YELLOW);',
      say: ['A loop can paint a whole row: `x` goes from 0 to 15, and each time one square is painted. [RUN] it.'],
      goals: [{ text: 'PAINT THE TOP ROW YELLOW', t: T.has(R => Array.from({ length: 16 }, (_, x) => R.stage.grid[x]).every(c => c === 14), 'ROW') }], model: 'for (I64 x = 0; x < 16; x++)\n  Pixel(x, 0, YELLOW);', hint: 'Just press [RUN].', ok: 'Sixteen squares, two lines.' },
    { id: 'l7c', runOnly: true, title: 'A LOOP IN A LOOP', start: 'for (I64 y = 0; y < 16; y++)\n  for (I64 x = 0; x < 16; x++)\n    if ((x + y) % 2 == 0)\n      Pixel(x, y, WHITE);',
      say: ['A loop inside a loop covers the whole board: the outside one picks the row (`y`), the inside one the column (`x`).', 'The `if` paints only the squares where `x + y` is even. [RUN] it: a checkerboard.'],
      goals: [{ text: 'PAINT A WHITE CHECKERBOARD', t: board((x, y) => (x + y) % 2 === 0 ? 15 : 0) }], model: 'for (I64 y = 0; y < 16; y++)\n  for (I64 x = 0; x < 16; x++)\n    if ((x + y) % 2 == 0)\n      Pixel(x, y, WHITE);', hint: 'Just press [RUN]. `%` is the remainder.', ok: 'One question, 256 squares, a pattern.' },
    { id: 'l7d', runOnly: true, title: 'NOTES', start: 'Note(60, 300);\nNote(64, 300);\nNote(67, 600);',
      say: ['`Note(number, milliseconds)` plays a note. 60 is middle C and every +1 is a step up the piano keys, black ones too. Notes play one after another.', '[RUN] it and listen: C, E, G.'],
      goals: [{ text: 'PLAY THREE NOTES', t: T.has(R => R.stage.notes.length >= 3, 'NOTES') }], model: 'Note(60, 300);\nNote(64, 300);\nNote(67, 600);', hint: 'Check the MUS knob and the taskbar mixer if you hear nothing.', ok: 'A chord, one note at a time.' },
    { id: 'l7e', title: 'A SCALE WITH A LOOP',
      say: ['Put it all together: a loop that plays every note from 60 up to 72, one after another, 150 milliseconds each. That is a whole octave of the piano.'],
      goals: [{ text: 'PLAY 60 TO 72', t: T.notes([60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72]) }, { text: 'USE A LOOP', t: T.has(R => /\b(for|while)\b/.test(R.src), 'LOOP') }],
      model: 'for (I64 i = 0; i <= 12; i++)\n  Note(60 + i, 150);', hint: '`Note(60 + i, 150)` inside a for that counts i from 0 to 12.', ok: 'That is the language. The PUZZLES are next: bigger problems, and small apps of your own.' }
  ] }
];
