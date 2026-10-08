/* PUZZLES, part three: THE STAGE. Small apps: a program that puts buttons, labels and boxes on the stage and answers a person. The test is a
   person (`T.scenario`): it presses the buttons by what is written on them, types into the boxes by their hints, lets time pass, and reads the labels. */
import { T } from './tests.js';
import { P } from './puzzles_a.js';
const r = String.raw;
const lines = (...a) => a.join('\n');
const label = (R, i) => (R.stage.items.filter(x => x.kind === 'label')[i || 0] || {}).text;
const labelsHave = (R, t) => R.stage.labels().indexOf(t) >= 0 || 'the stage shows ' + (R.stage.labels().join(' | ') || 'no labels') + ', not ' + t;

export const STAGE = [
  P('stage', 's_talk', 'A BUTTON THAT TALKS', 2, ['Make a button with the words `SAY HI` on it.', 'When it is pressed the program prints `HI THERE.`'], '// a function, and a button that calls it\n',
    ['The function prints. The button calls the function by its name, in quotes.', '`Button("SAY HI", "Hi");` with a function called `Hi`.', lines('U0 Hi()', '{', r`  "HI THERE.\n";`, '}', 'Button("SAY HI", "Hi");')],
    lines('U0 Hi()', '{', r`  "HI THERE.\n";`, '}', 'Button("SAY HI", "Hi");'),
    [T.scenario('PRESSING SAY HI PRINTS HI THERE.', [['click', 'SAY HI']], R => R.out.indexOf('HI THERE.') >= 0 || 'nothing was printed when the button was pressed')]),
  P('stage', 's_counter', 'THE COUNTER', 2, ['A label that starts as `0`, and a button `+1` that adds one to it each time it is pressed.'],
    '// a number, a label, a function, a button\n',
    ['Keep the count in a box: `I64 n = 0;`', '`Label` gives back an id; `SetText(id, n)` changes its words.', lines('I64 n = 0;', 'I64 shown = Label("0");', 'U0 Add()', '{', '  n++;', '  SetText(shown, n);', '}', 'Button("+1", "Add");')],
    lines('I64 n = 0;', 'I64 shown = Label("0");', 'U0 Add()', '{', '  n++;', '  SetText(shown, n);', '}', 'Button("+1", "Add");'),
    [T.has(R => label(R) === '0', 'STARTS AT 0'), T.scenario('THREE PRESSES SHOW 3', [['click', '+1'], ['click', '+1'], ['click', '+1']], R => labelsHave(R, '3'))]),
  P('stage', 's_updown', 'UP, DOWN, RESET', 2, ['A counter with three buttons: `+1`, `-1` and `RESET`. The label shows the count. It may go below zero.'],
    '// like the counter, with two more buttons\n',
    ['One function for each button.', 'RESET sets the box back to 0 and the label to `0`.', lines('I64 n = 0;', 'I64 shown = Label("0");', 'U0 Up() { n++; SetText(shown, n); }', 'U0 Down() { n--; SetText(shown, n); }', 'U0 Zero() { n = 0; SetText(shown, n); }', 'Button("+1", "Up");', 'Button("-1", "Down");', 'Button("RESET", "Zero");')],
    lines('I64 n = 0;', 'I64 shown = Label("0");', 'U0 Up() { n++; SetText(shown, n); }', 'U0 Down() { n--; SetText(shown, n); }', 'U0 Zero() { n = 0; SetText(shown, n); }', 'Button("+1", "Up");', 'Button("-1", "Down");', 'Button("RESET", "Zero");'),
    [T.scenario('+1 +1 +1 -1 SHOWS 2', [['click', '+1'], ['click', '+1'], ['click', '+1'], ['click', '-1']], R => labelsHave(R, '2')),
     T.scenario('-1 FROM 0 SHOWS -1', [['click', '-1']], R => labelsHave(R, '-1')),
     T.scenario('RESET SHOWS 0 AGAIN', [['click', '+1'], ['click', '+1'], ['click', 'RESET']], R => labelsHave(R, '0'))]),
  P('stage', 's_greeter', 'THE GREETER', 2, ['A box with the hint `NAME`, a button `GREET`, and a label.', 'Type a name, press GREET, and the label says `HELLO, ` then the name and a full stop: `HELLO, ADA.`'],
    '// Field, Label, a function, Button\n',
    ['`GetText(id)` reads what is in a box.', '`"HELLO, " + GetText(name) + "."` joins words together.', lines('I64 name = Field("NAME");', 'I64 reply = Label("");', 'U0 Greet()', '{', '  SetText(reply, "HELLO, " + GetText(name) + ".");', '}', 'Button("GREET", "Greet");')],
    lines('I64 name = Field("NAME");', 'I64 reply = Label("");', 'U0 Greet()', '{', '  SetText(reply, "HELLO, " + GetText(name) + ".");', '}', 'Button("GREET", "Greet");'),
    [T.scenario('ADA IS GREETED', [['type', 'NAME', 'ADA'], ['click', 'GREET']], R => labelsHave(R, 'HELLO, ADA.')), T.scenario('SO IS BEN', [['type', 'NAME', 'BEN'], ['click', 'GREET']], R => labelsHave(R, 'HELLO, BEN.'))]),
  P('stage', 's_dice', 'ROLL THE DICE', 3, ['A button `ROLL` and a label. Each press shows a new random number from 1 to 6.', '`RandU16()` gives a random number from 0 to 65535, and `%` gives a remainder.'],
    '// a button, a label, and a number from 1 to 6\n',
    ['`RandU16() % 6` is from 0 to 5.', 'Add 1: `RandU16() % 6 + 1`.', lines('I64 shown = Label("-");', 'U0 Roll() { SetText(shown, RandU16() % 6 + 1); }', 'Button("ROLL", "Roll");')],
    lines('I64 shown = Label("-");', 'U0 Roll() { SetText(shown, RandU16() % 6 + 1); }', 'Button("ROLL", "Roll");'),
    [{ name: 'ROLLING 60 TIMES GIVES ONLY 1 TO 6, AND ALL OF THEM', run: R => {
      const seen = new Set();
      for (let i = 0; i < 60; i++) { const c = R.stage.click('ROLL'); if (!c.ok) return { ok: false, msg: c.msg }; const v = label(R); if (!/^[1-6]$/.test(v)) return { ok: false, got: v, msg: 'the label showed ' + JSON.stringify(v) + ', not 1 to 6' }; seen.add(v); }
      return seen.size >= 6 ? { ok: true } : { ok: false, msg: 'in sixty rolls it only ever showed ' + [...seen].sort().join(' ') };
    } }]),
  P('stage', 's_light', 'TRAFFIC LIGHT', 3, ['A label that starts as `STOP` in RED. A button `NEXT` changes it: STOP (red), then GO (green), then WAIT (yellow), then STOP again, round and round.', '`Color(id, RED)` colours a label.'],
    '// a label that changes words and colour\n',
    ['Keep which light it is in a box: 0, 1 or 2.', 'In the function, an `if` for each light that sets the words and the colour.', lines('I64 light = Label("STOP");', 'Color(light, RED);', 'I64 state = 0;', 'U0 Next()', '{', '  state = (state + 1) % 3;', '  if (state == 0) { SetText(light, "STOP"); Color(light, RED); }', '  if (state == 1) { SetText(light, "GO"); Color(light, GREEN); }', '  if (state == 2) { SetText(light, "WAIT"); Color(light, YELLOW); }', '}', 'Button("NEXT", "Next");')],
    lines('I64 light = Label("STOP");', 'Color(light, RED);', 'I64 state = 0;', 'U0 Next()', '{', '  state = (state + 1) % 3;', '  if (state == 0) { SetText(light, "STOP"); Color(light, RED); }', '  if (state == 1) { SetText(light, "GO"); Color(light, GREEN); }', '  if (state == 2) { SetText(light, "WAIT"); Color(light, YELLOW); }', '}', 'Button("NEXT", "Next");'),
    [T.has(R => { const l = R.stage.items.find(i => i.kind === 'label'); return !!l && l.text === 'STOP' && l.color === 4; }, 'STARTS AS STOP, IN RED'),
     T.scenario('NEXT GIVES GO IN GREEN', [['click', 'NEXT']], R => { const l = R.stage.items.find(i => i.kind === 'label'); return (l.text === 'GO' && l.color === 2) || 'after one press it says ' + l.text + ' in colour ' + l.color; }),
     T.scenario('THEN WAIT IN YELLOW', [['click', 'NEXT'], ['click', 'NEXT']], R => { const l = R.stage.items.find(i => i.kind === 'label'); return (l.text === 'WAIT' && l.color === 14) || 'after two presses it says ' + l.text + ' in colour ' + l.color; }),
     T.scenario('AND ROUND TO STOP IN RED', [['click', 'NEXT'], ['click', 'NEXT'], ['click', 'NEXT']], R => { const l = R.stage.items.find(i => i.kind === 'label'); return (l.text === 'STOP' && l.color === 4) || 'after three presses it says ' + l.text + ' in colour ' + l.color; })]),
  P('stage', 's_tip', 'THE TIP CALCULATOR', 3, ['Two boxes with the hints `BILL` and `TIP %`, a button `CALC`, and a label that then says `TOTAL: ` and the bill plus its tip.', 'A bill of 50 with a 10 tip is `TOTAL: 55`.', '`GetNum(id)` reads a box as a number.'],
    '// two Fields, a Button, a Label\n',
    ['The tip is `bill * tip / 100`.', 'The total is `bill + bill * tip / 100`.', lines('I64 bill = Field("BILL");', 'I64 tip = Field("TIP %");', 'I64 total = Label("");', 'U0 Calc()', '{', '  I64 b = GetNum(bill);', '  I64 t = GetNum(tip);', '  SetText(total, "TOTAL: " + (b + b * t / 100));', '}', 'Button("CALC", "Calc");')],
    lines('I64 bill = Field("BILL");', 'I64 tip = Field("TIP %");', 'I64 total = Label("");', 'U0 Calc()', '{', '  I64 b = GetNum(bill);', '  I64 t = GetNum(tip);', '  SetText(total, "TOTAL: " + (b + b * t / 100));', '}', 'Button("CALC", "Calc");'),
    [T.scenario('50 AND 10 GIVES TOTAL: 55', [['type', 'BILL', '50'], ['type', 'TIP %', '10'], ['click', 'CALC']], R => labelsHave(R, 'TOTAL: 55')), T.scenario('80 AND 25 GIVES TOTAL: 100', [['type', 'BILL', '80'], ['type', 'TIP %', '25'], ['click', 'CALC']], R => labelsHave(R, 'TOTAL: 100'))]),
  P('stage', 's_clock', 'TICK TOCK', 3, ['A label that counts seconds by itself: it shows `0` and then goes up by one each second. Nobody presses anything.', '`Every(1000, "Tick")` calls your function `Tick` once every thousand milliseconds.'],
    '// a label, a function, and Every\n',
    ['Keep the seconds in a box. `Tick` adds one and shows it.', 'Call `Every(1000, "Tick");` once, outside the function.', lines('I64 secs = 0;', 'I64 shown = Label("0");', 'U0 Tick()', '{', '  secs++;', '  SetText(shown, secs);', '}', 'Every(1000, "Tick");')],
    lines('I64 secs = 0;', 'I64 shown = Label("0");', 'U0 Tick()', '{', '  secs++;', '  SetText(shown, secs);', '}', 'Every(1000, "Tick");'),
    [T.has(R => label(R) === '0', 'STARTS AT 0'), T.scenario('AFTER THREE SECONDS IT SHOWS 3', [['wait', 3000]], R => labelsHave(R, '3')), T.scenario('AFTER TEN, 10', [['wait', 10000]], R => labelsHave(R, '10'))]),
  P('stage', 's_health', 'A HEALTH BAR', 3, ['`Bar(100)` makes a bar that holds up to 100, and `SetBar(id, value)` sets how full it is. Start it full.', 'Two buttons: `HIT` takes 10 off and `HEAL` puts 10 back. It never goes below 0 or above 100.'],
    '// a Bar, two buttons, and limits\n',
    ['Keep the health in a box too, and keep the box between 0 and 100.', '`if (hp < 0) hp = 0;` after taking the 10 off, and likewise for 100.', lines('I64 hp = 100;', 'I64 bar = Bar(100);', 'SetBar(bar, hp);', 'U0 Hit() { hp -= 10; if (hp < 0) hp = 0; SetBar(bar, hp); }', 'U0 Heal() { hp += 10; if (hp > 100) hp = 100; SetBar(bar, hp); }', 'Button("HIT", "Hit");', 'Button("HEAL", "Heal");')],
    lines('I64 hp = 100;', 'I64 bar = Bar(100);', 'SetBar(bar, hp);', 'U0 Hit() { hp -= 10; if (hp < 0) hp = 0; SetBar(bar, hp); }', 'U0 Heal() { hp += 10; if (hp > 100) hp = 100; SetBar(bar, hp); }', 'Button("HIT", "Hit");', 'Button("HEAL", "Heal");'),
    (() => { const bar = R => (R.stage.items.find(i => i.kind === 'bar') || {}).value;
      return [T.has(R => bar(R) === 100, 'STARTS FULL'),
        T.scenario('THREE HITS LEAVE 70', [['click', 'HIT'], ['click', 'HIT'], ['click', 'HIT']], R => bar(R) === 70 || 'the bar is at ' + bar(R)),
        T.scenario('A HEAL AFTER THAT MAKES 80', [['click', 'HIT'], ['click', 'HIT'], ['click', 'HIT'], ['click', 'HEAL']], R => bar(R) === 80 || 'the bar is at ' + bar(R)),
        T.scenario('IT STOPS AT 0: TWELVE HITS AND ONE HEAL LEAVE 10', Array.from({ length: 12 }, () => ['click', 'HIT']).concat([['click', 'HEAL']]), R => bar(R) === 10 || 'the bar is at ' + bar(R) + ': it must stay at 0 however many hits'),
        T.scenario('IT STOPS AT 100', [['click', 'HEAL'], ['click', 'HEAL'], ['click', 'HIT']], R => bar(R) === 90 || 'the bar is at ' + bar(R) + ': it must stay at 100 however many heals')]; })()),
  P('stage', 's_guess', 'GUESS THE NUMBER', 3, ['The secret number is 7 (`I64 secret = 7;`). A box with the hint `GUESS`, a button `TRY`, and a label.', 'After a guess the label says `TOO LOW`, `TOO HIGH` or `YOU GOT IT`.'],
    lines('I64 secret = 7;', '// Field, Label, Button, and the choice'),
    ['Read the guess with `GetNum`.', 'Three cases: `<`, `>`, and equal.', lines('I64 secret = 7;', 'I64 guess = Field("GUESS");', 'I64 says = Label("");', 'U0 Try()', '{', '  I64 g = GetNum(guess);', '  if (g < secret) SetText(says, "TOO LOW");', '  else if (g > secret) SetText(says, "TOO HIGH");', '  else SetText(says, "YOU GOT IT");', '}', 'Button("TRY", "Try");')],
    lines('I64 secret = 7;', 'I64 guess = Field("GUESS");', 'I64 says = Label("");', 'U0 Try()', '{', '  I64 g = GetNum(guess);', '  if (g < secret) SetText(says, "TOO LOW");', '  else if (g > secret) SetText(says, "TOO HIGH");', '  else SetText(says, "YOU GOT IT");', '}', 'Button("TRY", "Try");'),
    [T.scenario('3 IS TOO LOW', [['type', 'GUESS', '3'], ['click', 'TRY']], R => labelsHave(R, 'TOO LOW')), T.scenario('9 IS TOO HIGH', [['type', 'GUESS', '9'], ['click', 'TRY']], R => labelsHave(R, 'TOO HIGH')), T.scenario('7 IS IT', [['type', 'GUESS', '7'], ['click', 'TRY']], R => labelsHave(R, 'YOU GOT IT'))])
];
