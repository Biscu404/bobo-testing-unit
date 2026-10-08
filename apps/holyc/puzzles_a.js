/* PUZZLES, part one: WORDS, NUMBERS and CHOICES. Each is `P(chapter, id, title, stars, brief, start, hints, model, tests)`: a brief that says exactly
   what the program must do, the code it starts with (a skeleton, or a bug), up to three hints that say more each time, a model answer that
   holyc_check.js proves passes every test (and that the starting code does not), and tests (tests.js). The tests are the whole judge:
   there is no other way to be right. */
import { T } from './tests.js';
export const P = (ch, id, title, stars, brief, start, hints, model, tests) => ({ ch, id, title, stars, brief, start, hints, model, tests });
const r = String.raw;
const lines = (...a) => a.join('\n');

export const WORDS = [
  P('words', 'w_hello', 'SAY IT', 1, ['Print exactly this line:', '`HOLY C IS MY LANGUAGE.`'], '// your program here\n',
    ['Words in quotes, on their own, are a print statement.', 'End the words with `\\n` for a new line, and the statement with `;`.', r`"HOLY C IS MY LANGUAGE.\n";`],
    r`"HOLY C IS MY LANGUAGE.\n";`, [T.out(['HOLY C IS MY LANGUAGE.'])]),
  P('words', 'w_three', 'THREE LINES', 1, ['Print three lines: `ONE`, then `TWO`, then `THREE`.'], r`"ONE\n";` + '\n',
    ['One print statement per line.', 'Each needs its own `\\n`.', r`"ONE\n"; "TWO\n"; "THREE\n";`],
    lines(r`"ONE\n";`, r`"TWO\n";`, r`"THREE\n";`), [T.out(['ONE', 'TWO', 'THREE'])]),
  P('words', 'w_semi', 'THE BUG IS SMALL', 1, ['This program will not run. Read what the lab says, find the problem, and fix it so it prints both lines.'],
    lines(r`"THE BUG IS SMALL\n"`, r`"AND SO IS THE FIX.\n";`),
    ['The error names a line. Look at the end of that line.', 'A statement ends with `;`.', 'Put a `;` after the first string.'],
    lines(r`"THE BUG IS SMALL\n";`, r`"AND SO IS THE FIX.\n";`), [T.out(['THE BUG IS SMALL', 'AND SO IS THE FIX.'])]),
  P('words', 'w_shout', 'SHOUT IT', 1, ['The box `quiet` holds some quiet words.', 'Print them in CAPITAL LETTERS. `ToUpper(words)` gives the capital version of words.'],
    lines('U8 *quiet = "psst, over here";', '// print it loud'),
    ['A print with a slot: `"%s\\n", something;`', 'Put the call inside the print: `ToUpper(quiet)`.', r`"%s\n", ToUpper(quiet);`],
    lines('U8 *quiet = "psst, over here";', r`"%s\n", ToUpper(quiet);`), [T.out(['PSST, OVER HERE']), T.callsAtLeast('ToUpper', 1, 'USES ToUpper')]),
  P('words', 'w_slots', 'THE SLOTS', 1, ['Print `7 DAYS IN A WEEK` using the two boxes, so that changing a box changes the line:', 'a `%d` slot for the number and a `%s` slot for the words.'],
    lines('I64 days = 7;', 'U8 *what = "DAYS IN A WEEK";', '// print them'),
    ['One print, two slots, two values after the comma, in the same order.', 'The number slot is `%d` and the words slot is `%s`.', r`"%d %s\n", days, what;`],
    lines('I64 days = 7;', 'U8 *what = "DAYS IN A WEEK";', r`"%d %s\n", days, what;`),
    [T.out(['7 DAYS IN A WEEK']), T.has(R => /"[^"]*%d[^"]*%s[^"]*"/.test(R.src), 'USES A %d AND A %s SLOT')])
];

export const NUMBERS = [
  P('numbers', 'n_area', 'AREA', 1, ['The boxes `w` and `h` are the width and height of a room.', 'Print `AREA 42`: the width times the height. Use the boxes, so a different room gives a different area.'],
    lines('I64 w = 6;', 'I64 h = 7;', '// print the area'),
    ['`*` multiplies.', 'Put `w * h` after the comma, with a `%d` slot.', r`"AREA %d\n", w * h;`],
    lines('I64 w = 6;', 'I64 h = 7;', r`"AREA %d\n", w * h;`), [T.out(['AREA 42']), T.source(/\bw\s*\*\s*h\b|\bh\s*\*\s*w\b/, 'MULTIPLIES THE BOXES', 'work it out from w and h, not by writing 42')]),
  P('numbers', 'n_change', 'MAKING CHANGE', 2, ['`cents` is an amount of money. Print how many whole dollars it is, and how many cents are left over:', '`3 DOLLARS 87 CENTS`', '`/` divides whole numbers (the rest is thrown away) and `%` gives what is left over.'],
    lines('I64 cents = 387;', '// print dollars and cents'),
    ['387 divided by 100, thrown-away remainder, is 3.', '`cents / 100` is the dollars and `cents % 100` is the cents.', r`"%d DOLLARS %d CENTS\n", cents / 100, cents % 100;`],
    lines('I64 cents = 387;', r`"%d DOLLARS %d CENTS\n", cents / 100, cents % 100;`),
    [T.out(['3 DOLLARS 87 CENTS']), T.source(/\w\s*\/\s*\w/, 'USES /', 'use / to get the dollars'), T.source(/\w\s*%\s*\w/, 'USES %', 'use % to get what is left over')]),
  P('numbers', 'n_swap', 'SWAP THEM', 2, ['`a` is 3 and `b` is 9. Swap what is in the two boxes, so the last line prints `a=9 b=3`.', 'You will need a third box to hold one value for a moment.'],
    lines('I64 a = 3;', 'I64 b = 9;', '// swap them here', r`"a=%d b=%d\n", a, b;`),
    ['If you write `a = b;` first, the old a is gone.', 'Put a in a spare box first: `I64 t = a;`', lines('I64 t = a;', 'a = b;', 'b = t;')],
    lines('I64 a = 3;', 'I64 b = 9;', 'I64 t = a;', 'a = b;', 'b = t;', r`"a=%d b=%d\n", a, b;`), [T.out(['a=9 b=3']), T.has(R => (R.src.match(/\bI64\b/g) || []).length >= 3, 'USES A THIRD BOX', 'it needs a third box')]),
  P('numbers', 'n_avg', 'THE AVERAGE', 2, ['Print the average of the three numbers with two decimals: `8.33`.', 'Careful: dividing whole numbers throws the fraction away. A number written with a point, like `3.0`, is a float, and keeps its fraction.'],
    lines('I64 a = 7;', 'I64 b = 8;', 'I64 c = 10;', '// print the average'),
    ['The sum is 25. 25 divided by 3 as whole numbers is 8.', 'Divide by `3.0` instead of `3`.', r`"%.2f\n", (a + b + c) / 3.0;`],
    lines('I64 a = 7;', 'I64 b = 8;', 'I64 c = 10;', r`"%.2f\n", (a + b + c) / 3.0;`), [T.out(['8.33'])]),
  P('numbers', 'n_fever', 'FEVER', 2, ['Write `ToF`, which turns degrees Celsius into Fahrenheit:', '`c * 9 / 5 + 32`. `ToF(37)` is 98.6.', '`F64` is the type for numbers with a fraction.'],
    lines('F64 ToF(F64 c)', '{', '  return c;   // fix me', '}'),
    ['Replace what `ToF` returns.', 'The formula is `c * 9 / 5 + 32`.', 'return c * 9 / 5 + 32;'],
    lines('F64 ToF(F64 c)', '{', '  return c * 9 / 5 + 32;', '}'), [T.cases('ToF', [[[0], 32], [[100], 212], [[37], 98.6], [[-40], -40]], 'ToF CONVERTS CORRECTLY')])
];

export const CHOICES = [
  P('choices', 'c_sign', 'WHICH SIDE OF ZERO', 2, ['Write `Sign(n)`: it returns `1` if n is above zero, `-1` if it is below zero, and `0` if it is zero.'],
    lines('I64 Sign(I64 n)', '{', '  return 0;', '}'),
    ['Three cases: use `if` and `else if`.', 'Test `n > 0`, then `n < 0`, and otherwise it is 0.', lines('if (n > 0) return 1;', 'if (n < 0) return -1;', 'return 0;')],
    lines('I64 Sign(I64 n)', '{', '  if (n > 0) return 1;', '  if (n < 0) return -1;', '  return 0;', '}'), [T.cases('Sign', [[[5], 1], [[-3], -1], [[0], 0], [[100], 1], [[-1], -1]], 'Sign ANSWERS 5 CASES')]),
  P('choices', 'c_even', 'EVEN OR ODD', 2, ['Write `IsEven(n)`: it returns 1 when n is even and 0 when it is odd.', 'Remember `%` is the remainder after dividing.'],
    lines('Bool IsEven(I64 n)', '{', '  return 0;', '}'),
    ['An even number has remainder 0 when divided by 2.', '`n % 2 == 0` is the question.', 'return n % 2 == 0;'],
    lines('Bool IsEven(I64 n)', '{', '  return n % 2 == 0;', '}'), [T.cases('IsEven', [[[4], 1], [[7], 0], [[0], 1], [[-2], 1], [[-3], 0], [[101], 0]], 'IsEven ANSWERS 6 CASES')]),
  P('choices', 'c_grade', 'THE GRADE', 2, ['Write `Grade(score)`. It returns the words `"A"` for 90 and up, `"B"` for 80 and up, `"C"` for 70 and up, and `"F"` for anything lower.', 'A function that returns words has the type `U8 *`.'],
    lines('U8 *Grade(I64 score)', '{', '  return "F";', '}'),
    ['Check the highest grade first, then the next.', 'Each `if (score >= 90) return "A";` stops the function when it is true.', lines('if (score >= 90) return "A";', 'if (score >= 80) return "B";', 'if (score >= 70) return "C";', 'return "F";')],
    lines('U8 *Grade(I64 score)', '{', '  if (score >= 90) return "A";', '  if (score >= 80) return "B";', '  if (score >= 70) return "C";', '  return "F";', '}'),
    [T.cases('Grade', [[[95], 'A'], [[90], 'A'], [[89], 'B'], [[80], 'B'], [[79], 'C'], [[70], 'C'], [[69], 'F'], [[0], 'F']], 'Grade ANSWERS 8 CASES')]),
  P('choices', 'c_leap', 'LEAP YEAR', 3, ['Write `IsLeap(year)`, returning 1 for a leap year and 0 for any other.', 'A year is a leap year if it divides by 4, except if it divides by 100, unless it divides by 400.', '2000 and 2024 are leap years. 1900 and 2023 are not.'],
    lines('Bool IsLeap(I64 year)', '{', '  return 0;', '}'),
    ['Three remainders: by 4, by 100 and by 400.', 'Leap if (divisible by 4 and not by 100) or divisible by 400.', 'return (year % 4 == 0 && year % 100 != 0) || year % 400 == 0;'],
    lines('Bool IsLeap(I64 year)', '{', '  return (year % 4 == 0 && year % 100 != 0) || year % 400 == 0;', '}'),
    [T.cases('IsLeap', [[[2000], 1], [[1900], 0], [[2024], 1], [[2023], 0], [[2100], 0], [[1600], 1], [[1996], 1], [[2019], 0]], 'IsLeap ANSWERS 8 CASES')]),
  P('choices', 'c_clamp', 'KEEP IT IN BOUNDS', 2, ['Write `Clamp(v, lo, hi)`: it returns v, unless v is below lo (then lo) or above hi (then hi).'],
    lines('I64 Clamp(I64 v, I64 lo, I64 hi)', '{', '  return v;', '}'),
    ['Two questions: is v too small? is v too big?', 'Return `lo` if `v < lo`, `hi` if `v > hi`.', lines('if (v < lo) return lo;', 'if (v > hi) return hi;', 'return v;')],
    lines('I64 Clamp(I64 v, I64 lo, I64 hi)', '{', '  if (v < lo) return lo;', '  if (v > hi) return hi;', '  return v;', '}'),
    [T.cases('Clamp', [[[5, 0, 10], 5], [[-3, 0, 10], 0], [[15, 0, 10], 10], [[0, 0, 10], 0], [[10, 0, 10], 10], [[7, 7, 7], 7]], 'Clamp ANSWERS 6 CASES')])
];
