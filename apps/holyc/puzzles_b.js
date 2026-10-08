/* PUZZLES, part two: LOOPS and FUNCTIONS. See puzzles_a.js for the shape. A puzzle that is about a loop says so in its tests (`T.source(...)`), so a
   list of fifteen print statements does not count as counting to fifteen. */
import { T } from './tests.js';
import { P } from './puzzles_a.js';
const r = String.raw;
const lines = (...a) => a.join('\n');
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => String(a + i));
const LOOP = T.source(/\b(for|while|do)\b/, 'USES A LOOP', 'write it with a loop, not one line for each');

export const LOOPS = [
  P('loops', 'l_ten', 'COUNT TO TEN', 2, ['Print the numbers 1 to 10, one on each line, using a loop.'], '// a loop goes here\n',
    ['A `for` loop with `i` from 1 up to and including 10.', '`for (I64 i = 1; i <= 10; i++)`', lines('for (I64 i = 1; i <= 10; i++)', r`  "%d\n", i;`)],
    lines('for (I64 i = 1; i <= 10; i++)', r`  "%d\n", i;`), [T.out(range(1, 10)), LOOP]),
  P('loops', 'l_sum', 'ADD THEM UP', 2, ['Print the sum of all the numbers from 1 to 100: `5050`.', 'Keep a running total in a box, and add to it each time round the loop.'],
    '// a total, a loop, a print\n',
    ['Start a box at 0: `I64 total = 0;`', 'Inside the loop: `total += i;`', lines('I64 total = 0;', 'for (I64 i = 1; i <= 100; i++)', '  total += i;', r`"%d\n", total;`)],
    lines('I64 total = 0;', 'for (I64 i = 1; i <= 100; i++)', '  total += i;', r`"%d\n", total;`), [T.out(['5050']), LOOP]),
  P('loops', 'l_table', 'TIMES TABLE', 2, ['Print the seven times table, from `7 x 1 = 7` to `7 x 12 = 84`, one line for each.'], '// loop 1 to 12\n',
    ['One loop, one print, three slots.', 'Each line is `7 x i = 7 * i`: three numbers, so three `%d` slots.', lines('for (I64 i = 1; i <= 12; i++)', r`  "7 x %d = %d\n", i, 7 * i;`)],
    lines('for (I64 i = 1; i <= 12; i++)', r`  "7 x %d = %d\n", i, 7 * i;`), [T.out(range(1, 12).map(i => '7 x ' + i + ' = ' + 7 * i)), LOOP]),
  P('loops', 'l_endless', 'THE ENDLESS LOOP', 2, ['This should print 1 to 5, but it never stops. Find what is missing so it does.'],
    lines('I64 n = 1;', 'while (n <= 5)', '{', r`  "%d\n", n;`, '}'),
    ['A `while` goes on as long as its question is yes. What makes `n <= 5` stop being yes?', 'Nothing changes `n` inside the loop.', 'Add `n++;` inside the braces.'],
    lines('I64 n = 1;', 'while (n <= 5)', '{', r`  "%d\n", n;`, '  n++;', '}'), [T.out(range(1, 5))]),
  P('loops', 'l_stairs', 'THE STAIRCASE', 3, ['Print a staircase of stars, five lines high:', '`*`', '`**`', '`***`', '`****`', '`*****`', 'A loop inside a loop. A `"*";` prints a star and stays on the same line, and a `"\\n";` ends the line.'],
    '// two loops\n',
    ['The outside loop is the line (1 to 5). The inside prints that many stars.', 'After the inside loop, print `"\\n";`', lines('for (I64 y = 1; y <= 5; y++)', '{', '  for (I64 x = 0; x < y; x++)', '    "*";', r`  "\n";`, '}')],
    lines('for (I64 y = 1; y <= 5; y++)', '{', '  for (I64 x = 0; x < y; x++)', '    "*";', r`  "\n";`, '}'), [T.out(['*', '**', '***', '****', '*****']), T.has(R => (R.src.match(/\bfor\b/g) || []).length >= 2, 'USES A LOOP INSIDE A LOOP')]),
  P('loops', 'l_fizz', 'FIZZBUZZ', 3, ['Count from 1 to 15. For a number that divides by 3 print `FIZZ`, by 5 print `BUZZ`, by both print `FIZZBUZZ`, and otherwise print the number.'], '// 1 to 15\n',
    ['`n % 3 == 0` says n divides by 3. Check "both" first.', 'An `if`, `else if`, `else if`, `else` chain inside the loop.', lines('for (I64 i = 1; i <= 15; i++)', '{', r`  if (i % 15 == 0) "FIZZBUZZ\n";`, r`  else if (i % 3 == 0) "FIZZ\n";`, r`  else if (i % 5 == 0) "BUZZ\n";`, r`  else "%d\n", i;`, '}')],
    lines('for (I64 i = 1; i <= 15; i++)', '{', r`  if (i % 15 == 0) "FIZZBUZZ\n";`, r`  else if (i % 3 == 0) "FIZZ\n";`, r`  else if (i % 5 == 0) "BUZZ\n";`, r`  else "%d\n", i;`, '}'),
    [T.out(['1', '2', 'FIZZ', '4', 'BUZZ', 'FIZZ', '7', '8', 'FIZZ', 'BUZZ', '11', 'FIZZ', '13', '14', 'FIZZBUZZ']), LOOP]),
  P('loops', 'l_fact', 'FACTORIAL', 2, ['Write `Fact(n)`: n times (n - 1) times ... times 1. `Fact(5)` is 120. `Fact(0)` is 1.'],
    lines('I64 Fact(I64 n)', '{', '  return 0;', '}'),
    ['Start a result at 1 and multiply it by each number from 2 up to n.', 'A `for` loop, with `result *= i;`', lines('I64 result = 1;', 'for (I64 i = 2; i <= n; i++)', '  result *= i;', 'return result;')],
    lines('I64 Fact(I64 n)', '{', '  I64 result = 1;', '  for (I64 i = 2; i <= n; i++)', '    result *= i;', '  return result;', '}'),
    [T.cases('Fact', [[[0], 1], [[1], 1], [[5], 120], [[10], 3628800], [[3], 6]], 'Fact ANSWERS 5 CASES')]),
  P('loops', 'l_prime', 'IS IT PRIME', 3, ['Write `IsPrime(n)`, returning 1 if n is a prime number and 0 if not.', 'A prime has no divisors but 1 and itself. 1 is not a prime. 2 is.'],
    lines('Bool IsPrime(I64 n)', '{', '  return 0;', '}'),
    ['Numbers below 2 are not prime.', 'Try every `d` from 2 up to n - 1: if `n % d == 0`, it is not prime.', lines('if (n < 2) return 0;', 'for (I64 d = 2; d < n; d++)', '  if (n % d == 0) return 0;', 'return 1;')],
    lines('Bool IsPrime(I64 n)', '{', '  if (n < 2) return 0;', '  for (I64 d = 2; d < n; d++)', '    if (n % d == 0) return 0;', '  return 1;', '}'),
    [T.cases('IsPrime', [[[2], 1], [[3], 1], [[4], 0], [[17], 1], [[18], 0], [[1], 0], [[0], 0], [[97], 1], [[91], 0], [[100], 0]], 'IsPrime ANSWERS 10 CASES')])
];

export const FUNCTIONS = [
  P('functions', 'f_square', 'SQUARE', 1, ['Write `Square(n)`, which returns n times n.'],
    lines('I64 Square(I64 n)', '{', '  return 0;', '}'),
    ['Replace the `0`.', '`return n * n;`', 'return n * n;'],
    lines('I64 Square(I64 n)', '{', '  return n * n;', '}'), [T.cases('Square', [[[0], 0], [[1], 1], [[5], 25], [[-4], 16], [[12], 144]], 'Square ANSWERS 5 CASES')]),
  P('functions', 'f_max3', 'THE BIGGEST OF THREE', 2, ['Write `Max3(a, b, c)`, which returns the biggest of its three numbers.', 'There is a built-in `Max(a, b)` for two, if you want it.'],
    lines('I64 Max3(I64 a, I64 b, I64 c)', '{', '  return a;', '}'),
    ['Compare two, then compare the winner with the third.', '`Max(a, Max(b, c))`', 'return Max(a, Max(b, c));'],
    lines('I64 Max3(I64 a, I64 b, I64 c)', '{', '  return Max(a, Max(b, c));', '}'), [T.cases('Max3', [[[1, 2, 3], 3], [[9, 2, 3], 9], [[1, 9, 3], 9], [[-5, -2, -9], -2], [[4, 4, 4], 4]], 'Max3 ANSWERS 5 CASES')]),
  P('functions', 'f_power', 'POWER', 2, ['Write `Power(base, exp)`: base multiplied by itself exp times. `Power(2, 10)` is 1024, and anything to the power 0 is 1.', 'Do it with a loop: the built-in `Pow` is not allowed here.'],
    lines('I64 Power(I64 base, I64 exp)', '{', '  return 1;', '}'),
    ['Start a result at 1. Multiply it by `base`, `exp` times.', 'A `for` loop from 0 to `exp`.', lines('I64 result = 1;', 'for (I64 i = 0; i < exp; i++)', '  result *= base;', 'return result;')],
    lines('I64 Power(I64 base, I64 exp)', '{', '  I64 result = 1;', '  for (I64 i = 0; i < exp; i++)', '    result *= base;', '  return result;', '}'),
    [T.cases('Power', [[[2, 10], 1024], [[5, 0], 1], [[3, 4], 81], [[7, 1], 7], [[10, 6], 1000000]], 'Power ANSWERS 5 CASES'), T.sourceNot(/\bPow\b/, 'WITHOUT Pow', 'use a loop, not Pow')]),
  P('functions', 'f_digits', 'SUM OF DIGITS', 2, ['Write `DigitSum(n)`: add up the digits of n. `DigitSum(1234)` is 10.', '`n % 10` is the last digit, and `n / 10` is n without it.'],
    lines('I64 DigitSum(I64 n)', '{', '  return 0;', '}'),
    ['Loop while n is above 0.', 'Add `n % 10` to the total, then divide n by 10.', lines('I64 sum = 0;', 'while (n > 0)', '{', '  sum += n % 10;', '  n /= 10;', '}', 'return sum;')],
    lines('I64 DigitSum(I64 n)', '{', '  I64 sum = 0;', '  while (n > 0)', '  {', '    sum += n % 10;', '    n /= 10;', '  }', '  return sum;', '}'),
    [T.cases('DigitSum', [[[1234], 10], [[9], 9], [[100], 1], [[987654321], 45], [[0], 0]], 'DigitSum ANSWERS 5 CASES')]),
  P('functions', 'f_gcd', 'THE BIGGEST SHARED NUMBER', 3, ['Write `Gcd(a, b)`: the biggest number that divides both. `Gcd(12, 18)` is 6.', 'Euclid\'s way: while `b` is not zero, replace (a, b) with (b, the remainder of a divided by b). The answer is a.'],
    lines('I64 Gcd(I64 a, I64 b)', '{', '  return 1;', '}'),
    ['A `while (b != 0)` loop.', 'You need a spare box to hold `a % b` while you move things round.', lines('while (b != 0)', '{', '  I64 t = a % b;', '  a = b;', '  b = t;', '}', 'return a;')],
    lines('I64 Gcd(I64 a, I64 b)', '{', '  while (b != 0)', '  {', '    I64 t = a % b;', '    a = b;', '    b = t;', '  }', '  return a;', '}'),
    [T.cases('Gcd', [[[12, 18], 6], [[17, 5], 1], [[100, 75], 25], [[7, 7], 7], [[0, 5], 5], [[48, 36], 12]], 'Gcd ANSWERS 6 CASES')]),
  P('functions', 'f_fib', 'FIBONACCI', 3, ['Write `Fib(n)`: the nth Fibonacci number. `Fib(0)` is 0, `Fib(1)` is 1, and each one after is the sum of the two before it: 0 1 1 2 3 5 8 13...', 'A function may call itself.'],
    lines('I64 Fib(I64 n)', '{', '  return 0;', '}'),
    ['The two simple answers: `Fib(0)` and `Fib(1)` are just n.', 'Otherwise: `Fib(n - 1) + Fib(n - 2)`.', lines('if (n < 2) return n;', 'return Fib(n - 1) + Fib(n - 2);')],
    lines('I64 Fib(I64 n)', '{', '  if (n < 2) return n;', '  return Fib(n - 1) + Fib(n - 2);', '}'), [T.cases('Fib', [[[0], 0], [[1], 1], [[2], 1], [[10], 55], [[15], 610], [[7], 13]], 'Fib ANSWERS 6 CASES')])
];
