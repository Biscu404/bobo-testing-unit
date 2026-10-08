/* THE BASICS, lessons one to four: words, boxes that hold values, decisions, loops. A step says what to do, shows the lines (TYPE IT FOR ME puts them in
   the editor), and has goals the lab ticks off after each RUN. `model` is a program that meets the goals (what SHOW ME types, and what holyc_check.js
   proves); `runs` is a series of programs for a step that has to be done in two goes (cause an error, then fix it); `act` is what a person would
   click on the stage. `start` replaces the editor when the step opens; a step without one carries on from the person's own code. */
import { T } from './tests.js';
const r = String.raw;

export const LESSONS_A = [
  { id: 'L1', title: 'THE FIRST WORD', blurb: 'Make the machine say something.', steps: [
    { id: 'l1a', runOnly: true, title: 'PRINT A LINE', start: r`"HELLO, GOD.\n";`,
      say: ['This is HolyC. TempleOS was written in it, every last bit of it.', 'The line in the editor is a statement. A statement that is only words in quotes prints them, and it ends with a `;`.', 'Press [RUN] (or CTRL+ENTER). What it printed appears under the editor.'],
      goals: [{ text: 'RUN IT AND SEE HELLO, GOD.', t: T.outHas('HELLO, GOD.') }], model: r`"HELLO, GOD.\n";`,
      hint: 'The big [RUN] button is above the editor. CTRL+ENTER does the same.', ok: 'That is a program. The shortest one there is.' },
    { id: 'l1b', title: 'YOUR OWN WORDS',
      say: ['The `\\n` at the end is a new line, as if you pressed ENTER. Without it the next words would run on.', 'Change what is between the quotes to a message of your own, and [RUN] again.'],
      goals: [{ text: 'PRINT SOMETHING NEW', t: T.has(R => R.out.length >= 1 && R.out.join('').trim().length > 0 && R.out.join('').indexOf('HELLO, GOD.') < 0, 'PRINT SOMETHING NEW') }],
      model: r`"HOLY C IS EASY.\n";`, hint: 'Keep the quote marks and the `;`: only change the words between them.', ok: 'Your words, on the machine.' },
    { id: 'l1c', title: 'THE MISSING ;',
      say: ['Every statement ends in `;`. This compiler is strict about it, as the real one is, and it tells you which line is missing one.', 'Delete the `;` at the end of your line and [RUN]. Read what the lab says. Then put the `;` back and [RUN] again.'],
      seq: true, goals: [{ text: 'RUN IT WITHOUT THE ; AND READ THE ERROR', t: T.has(R => !!R.err && /missing ;/.test(R.err.message), 'ERROR') }, { text: 'PUT THE ; BACK AND RUN IT CLEAN', t: T.has(R => !R.err && R.out.length > 0, 'CLEAN RUN') }],
      runs: [{ code: r`"HOLY C IS EASY.\n"` }, { code: r`"HOLY C IS EASY.\n";` }],
      hint: 'The red line number in the status bar is the line to look at.', ok: 'Errors are not failures: they are the compiler talking.' },
    { id: 'l1d', title: 'ONE STATEMENT PER LINE',
      say: ['Each statement is one action. Add a second line under the first that prints another message.'],
      goals: [{ text: 'PRINT TWO LINES', t: T.has(R => R.out.length >= 2, 'TWO LINES') }],
      model: r`"HOLY C IS EASY.\n";` + '\n' + r`"AND NOW THERE ARE TWO.\n";`, hint: 'A new line in the editor, a new pair of quotes, a new `;`.', ok: 'You can write programs now. Next: boxes for values.' }
  ] },

  { id: 'L2', title: 'BOXES THAT HOLD VALUES', blurb: 'Numbers and words with names.', steps: [
    { id: 'l2a', runOnly: true, title: 'A WHOLE NUMBER', start: r`I64 age = 12;` + '\n' + r`"I am %d years old.\n", age;`,
      say: ['`I64` makes a box that holds a whole number. The box is named `age`, and we put 12 in it.', '`%d` inside the words is a slot. It is filled with the value after the comma.', '[RUN] it.'],
      goals: [{ text: 'PRINT I am 12 years old.', t: T.outHas('I am 12 years old.') }], model: r`I64 age = 12;` + '\n' + r`"I am %d years old.\n", age;`, hint: 'Just press [RUN].', ok: 'A box and a slot.' },
    { id: 'l2b', title: 'CHANGE THE VALUE',
      say: ['Change the 12 to your own age (or any number) and [RUN]. The words did not change, only what is in the box.'],
      goals: [{ text: 'PRINT A DIFFERENT AGE', t: T.has(R => /^I am \d+ years old\.$/.test(R.out[0] || '') && R.out[0] !== 'I am 12 years old.', 'DIFFERENT AGE') }],
      model: r`I64 age = 30;` + '\n' + r`"I am %d years old.\n", age;`, hint: 'Edit only the number after the `=`.', ok: 'One place to change, many places that follow it.' },
    { id: 'l2c', title: 'MORE THAN ONE BOX',
      say: ['Add two more lines under the others. Two slots, two values after the comma, in the same order. The sum is worked out first.'],
      code: r`I64 years = 3;` + '\n' + r`"In %d years I will be %d.\n", years, age + years;`,
      goals: [{ text: 'PRINT THE SECOND LINE, ADDED UP RIGHT', t: T.has(R => { const m = /^In (\d+) years I will be (\d+)\.$/.exec(R.out[1] || ''); return !!m && R.session.globals.age + (+m[1]) === +m[2]; }, 'SUM') }],
      model: r`I64 age = 30;` + '\n' + r`"I am %d years old.\n", age;` + '\n' + r`I64 years = 3;` + '\n' + r`"In %d years I will be %d.\n", years, age + years;`,
      hint: 'Type the two lines exactly as shown, or press TYPE IT FOR ME.', ok: 'The machine does the adding.' },
    { id: 'l2d', title: 'DO SOME MATH',
      say: ['`+` `-` `*` `/` work as you expect. `%` is the remainder: what is left over after dividing.', 'Print how many days old you are, if a year has 365 days: `age * 365`. Use a slot, and your own words, on a new line.'],
      goals: [{ text: 'PRINT YOUR AGE IN DAYS', t: T.has(R => R.out.length >= 3 && R.out.join('\n').indexOf(String(R.session.globals.age * 365)) >= 0, 'DAYS') }],
      model: r`I64 age = 30;` + '\n' + r`"I am %d years old.\n", age;` + '\n' + r`I64 years = 3;` + '\n' + r`"In %d years I will be %d.\n", years, age + years;` + '\n' + r`"That is %d days.\n", age * 365;`,
      hint: 'Like the line above it: words with a `%d`, then a comma, then `age * 365`.', ok: 'Maths is just statements.' },
    { id: 'l2e', title: 'WORDS IN A BOX',
      say: ['Words live in boxes too. `U8 *` is the type for words, and the slot for words is `%s`.', 'Add the two lines, [RUN], and then change the name.'],
      code: r`U8 *name = "Ada";` + '\n' + r`"Hello, %s!\n", name;`,
      goals: [{ text: 'PRINT Hello, AND A NAME', t: T.has(R => R.out.some(l => /^Hello, .+!$/.test(l)), 'GREETING') }, { text: 'USE A U8 * BOX', t: T.source(/U8\s*\*/, 'U8 *', 'there is no U8 * box in the program') }],
      model: r`I64 age = 30;` + '\n' + r`"I am %d years old.\n", age;` + '\n' + r`U8 *name = "Ada";` + '\n' + r`"Hello, %s!\n", name;`, hint: 'The star goes after U8 and before the name.', ok: 'Numbers and words: that is most of programming.' }
  ] },

  { id: 'L3', title: 'DECISIONS', blurb: 'Make the program choose.', steps: [
    { id: 'l3a', runOnly: true, title: 'IF', start: r`I64 hp = 3;` + '\n' + r`if (hp > 0) "STILL STANDING.\n";` + '\n' + r`else "DOWN.\n";`,
      say: ['`if` asks a question in parentheses. If the answer is yes, the statement after it runs. `else` is what runs if the answer is no.', '[RUN] it.'],
      goals: [{ text: 'PRINT STILL STANDING.', t: T.outHas('STILL STANDING.') }], model: r`I64 hp = 3;` + '\n' + r`if (hp > 0) "STILL STANDING.\n";` + '\n' + r`else "DOWN.\n";`, hint: 'Just press [RUN].', ok: 'It chose.' },
    { id: 'l3b', title: 'THE OTHER WAY',
      say: ['Change `hp` so the other message prints.'],
      goals: [{ text: 'PRINT DOWN.', t: T.out(['DOWN.']) }], model: r`I64 hp = 0;` + '\n' + r`if (hp > 0) "STILL STANDING.\n";` + '\n' + r`else "DOWN.\n";`, hint: 'The question is `hp > 0`. What value of hp makes it a no?', ok: 'Same program, other branch.' },
    { id: 'l3c', title: 'MORE QUESTIONS',
      say: ['The questions you can ask: `>` bigger, `<` smaller, `>=` and `<=` or-equal, `==` equal (two signs, one is an assignment!), `!=` not equal.', 'Add a middle case with `else if`. Change the first question to `hp > 1`, set `hp` to 1, and add the new line before the `else`.'],
      code: r`else if (hp == 1) "LOW!\n";`,
      goals: [{ text: 'PRINT LOW!', t: T.out(['LOW!']) }, { text: 'USE else if', t: T.source(/else\s+if/, 'else if', 'no else if in the program') }],
      model: r`I64 hp = 1;` + '\n' + r`if (hp > 1) "STILL STANDING.\n";` + '\n' + r`else if (hp == 1) "LOW!\n";` + '\n' + r`else "DOWN.\n";`, hint: 'hp is 1: the first question must say no, the second must say yes.', ok: 'Three ways out of one question.' },
    { id: 'l3d', title: 'BRACES',
      say: ['To do several things on a yes, wrap them in `{ }`.', 'Make the `LOW!` case print two lines: `LOW!` and `FIND A HEALER.`'],
      code: 'if (hp == 1)\n{\n  "LOW!\\n";\n  "FIND A HEALER.\\n";\n}',
      goals: [{ text: 'PRINT BOTH LINES', t: T.out(['LOW!', 'FIND A HEALER.']) }, { text: 'USE { }', t: T.source(/\{[\s\S]*\}/, '{ }', 'no { } in the program') }],
      model: r`I64 hp = 1;` + '\n' + r`if (hp > 1) "STILL STANDING.\n";` + '\n' + 'else if (hp == 1)\n{\n  "LOW!\\n";\n  "FIND A HEALER.\\n";\n}\n' + r`else "DOWN.\n";`, hint: 'Put the two prints between { and } after `else if (hp == 1)`.', ok: 'A block is many statements acting as one.' },
    { id: 'l3e', title: 'AND, OR',
      say: ['`&&` means AND, `||` means OR. Add a line that is only true for a hurt but living hero:', 'Then [RUN] with hp at 1.'],
      code: r`if (hp > 0 && hp < 3) "WOUNDED.\n";`,
      goals: [{ text: 'PRINT WOUNDED.', t: T.outHas('WOUNDED.') }, { text: 'USE &&', t: T.source(/&&/, '&&', 'no && in the program') }],
      model: r`I64 hp = 1;` + '\n' + r`if (hp > 1) "STILL STANDING.\n";` + '\n' + 'else if (hp == 1)\n{\n  "LOW!\\n";\n  "FIND A HEALER.\\n";\n}\n' + r`else "DOWN.\n";` + '\n' + r`if (hp > 0 && hp < 3) "WOUNDED.\n";`, hint: 'Both questions must be yes for the && line to run.', ok: 'Questions can be combined. On to loops.' }
  ] },

  { id: 'L4', title: 'DOING IT AGAIN', blurb: 'Loops: for and while.', steps: [
    { id: 'l4a', runOnly: true, title: 'FOR', start: 'for (I64 i = 1; i <= 5; i++)\n  "%d\\n", i;',
      say: ['A `for` loop does something again and again.', 'It has three parts between the parentheses: where to start (`i = 1`), how long to keep going (`i <= 5`), and what changes each time (`i++` means add one).', '[RUN] it, then try [WATCH IT RUN] to see the loop go round, line by line.'],
      goals: [{ text: 'PRINT 1 TO 5', t: T.out(['1', '2', '3', '4', '5']) }], model: 'for (I64 i = 1; i <= 5; i++)\n  "%d\\n", i;', hint: 'Press [RUN]. [WATCH IT RUN] shows the variable changing.', ok: 'Five times, written once.' },
    { id: 'l4b', title: 'A BIGGER LOOP',
      say: ['Change the 5 so it counts to 10.'],
      goals: [{ text: 'PRINT 1 TO 10', t: T.out(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']) }], model: 'for (I64 i = 1; i <= 10; i++)\n  "%d\\n", i;', hint: 'The number after `<=` is where it stops.', ok: 'One number changed, five more lines.' },
    { id: 'l4c', title: 'COUNTING BY TWOS',
      say: ['`i += 2` adds two each time. Change `i++` to `i += 2`.'],
      goals: [{ text: 'PRINT 1 3 5 7 9', t: T.out(['1', '3', '5', '7', '9']) }], model: 'for (I64 i = 1; i <= 10; i += 2)\n  "%d\\n", i;', hint: 'The last part of the for is what happens after each round.', ok: 'You choose the step.' },
    { id: 'l4d', title: 'COUNTDOWN',
      say: ['A loop can go down. Count from 10 to 1 (start at 10, keep going while `i >= 1`, use `i--`), and then, after the loop, print `LIFT OFF.`'],
      goals: [{ text: 'PRINT 10 TO 1, THEN LIFT OFF.', t: T.out(['10', '9', '8', '7', '6', '5', '4', '3', '2', '1', 'LIFT OFF.']) }],
      model: 'for (I64 i = 10; i >= 1; i--)\n  "%d\\n", i;\n"LIFT OFF.\\n";', hint: 'The LIFT OFF line is not part of the loop: it goes after it, with no indent needed.', ok: 'Three, two, one.' },
    { id: 'l4e', runOnly: true, title: 'WHILE', start: 'I64 n = 1;\nwhile (n < 100)\n  n *= 2;\n"%d\\n", n;',
      say: ['`while` keeps going as long as its question is yes. Use it when you do not know how many rounds it will take.', 'This one doubles `n` until it is over 100. [RUN] it: what do you think it prints?'],
      goals: [{ text: 'PRINT 128', t: T.out(['128']) }, { text: 'USE while', t: T.uses('while') }], model: 'I64 n = 1;\nwhile (n < 100)\n  n *= 2;\n"%d\\n", n;', hint: '1, 2, 4, 8, 16, 32, 64, 128: the first one that is not under 100.', ok: 'Loops you can read. Next: your own functions.' }
  ] }
];
