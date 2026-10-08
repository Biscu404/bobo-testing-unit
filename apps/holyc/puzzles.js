/* PUZZLES: nine chapters, about fifty problems. Each is solved when every one of its tests passes (tests.js); the data are in puzzles_a..d.js. */
import { WORDS, NUMBERS, CHOICES } from './puzzles_a.js';
import { LOOPS, FUNCTIONS } from './puzzles_b.js';
import { STAGE } from './puzzles_c.js';
import { PIXELS, SOUND, BIG } from './puzzles_d.js';

export const CHAPTERS = [
  { id: 'words', title: 'WORDS', blurb: 'Print things. Read what the compiler tells you.', list: WORDS },
  { id: 'numbers', title: 'NUMBERS', blurb: 'Boxes, sums, remainders, and the trap of whole numbers.', list: NUMBERS },
  { id: 'choices', title: 'CHOICES', blurb: 'if, else, and functions that answer yes or no.', list: CHOICES },
  { id: 'loops', title: 'LOOPS', blurb: 'Do it again, and again, and know when to stop.', list: LOOPS },
  { id: 'functions', title: 'FUNCTIONS', blurb: 'Small tools, written once and trusted.', list: FUNCTIONS },
  { id: 'stage', title: 'THE STAGE', blurb: 'Programs with buttons, boxes and clocks: small apps.', list: STAGE },
  { id: 'pixels', title: 'PIXELS', blurb: 'Draw with loops, then with your own functions.', list: PIXELS },
  { id: 'sound', title: 'SOUND', blurb: 'Music that is a program.', list: SOUND },
  { id: 'big', title: 'BIG ONES', blurb: 'Whole apps: a calculator, a quiz, a stopwatch, a painter, an alarm.', list: BIG }
];
export const PUZZLES = [].concat(...CHAPTERS.map(c => c.list));
export const puzzleById = id => PUZZLES.find(p => p.id === id) || null;
export const chapterOf = p => CHAPTERS.find(c => c.id === p.ch);
