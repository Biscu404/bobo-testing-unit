/* What the elephant says when he has been carried into an app and stands in its window (kernel/pet.js plays it). Pure: no DOM, no clock, no speaker.
   Same voice as the rest of him: lowercase, plain, on your side. `appId` is the id the window manager gives the window; a line for an app he has no
   words for falls back to GENERIC. `node scripts/check-petlines.mjs` holds every pool. */

export const GENERIC = [
  'so this is what you do in here. i like it',
  'nice window, friend. i\'ll stand over here and not touch anything',
  'don\'t mind me. carry on',
  'i can see everything from here. it is mostly your cursor',
  'you took me somewhere new, kiddo. thank you',
  'drink some water. i\'ll watch the window',
  'i believe in you, and i believe in this window'
];

export const ENTER = [
  'oh. a new room. hello, room',
  'carried in like a guest. i\'m honoured, pal',
  'i\'ll be quiet. mostly',
  'is this allowed? good. i\'m in'
];

export const LEAVE = [
  'the window went away. i\'m back on the desk, friend',
  'that was a nice room. i\'m outside again',
  'all right. back to the desktop'
];

export const CHEER = [
  'you got one! i saw it, pal',
  'a trophy! i knew you had it in you',
  'look at you go, kiddo'
];

export const POKE = [
  'yes? i\'m listening, friend',
  'you poked an elephant. he noticed',
  'hello. i\'m still here, pal',
  'that tickled a little'
];

export const BY_APP = {
  magen: ['press the star, friend. it likes it', 'a thousand presses by hand, and then it does it for you. i read the sign', 'the star has been very patient with you'],
  cook: ['the chemistry is yours, pal. i just hold the apron', 'careful with the pours. i believe in your hands', 'i don\'t think i am allowed to taste any of this'],
  bekkedal: ['the valley is very green. i would like to live here', 'eat something before the mine, friend', 'i could carry the sekk if the road gets long'],
  solitaire: ['put the red seven on the black eight. no, the other black eight', 'i have never once won this. you can teach me', 'it is only cards, pal. start another'],
  sweeper: ['the flags are the whole trick, friend. trust the numbers', 'i stepped on nothing. i checked', 'one tile at a time, kiddo'],
  standbattle: ['i would stand behind the stand, if i were you', 'dodge, pal. you have two charges', 'that is a very large fist'],
  aftere: ['the gap is always a little to the left of where you think', 'i would fly this, but i have the ears for a different sky', 'the third temple is out there, friend'],
  garden: ['water the thirsty ones first. i can tell from here', 'the plants like each other more than they say', 'i would eat the mosscap. i won\'t'],
  terminal: ['type help. it is very good at help', 'a bare string prints. that is my favourite rule', 'i can only do hello, temple. it is enough'],
  garage: ['play the low notes first. i like the low notes', 'i would play the timpani. it is my size', 'somebody should write a song about peanuts'],
  holyc: ['semicolons, friend. it is always the semicolon', 'every program is a small elephant that remembers', 'i believe in your loop. it will end'],
  shop: ['dave is looking at me. i don\'t know why', 'i would buy a hat. i have the head for it', 'count your sun before you spend it, pal'],
  trophies: ['you have more than you think, friend', 'pin the ones you want. they follow you around, like me', 'the secret ones are hiding, and i know where. i won\'t say'],
  notes: ['write it down, pal. then it isn\'t heavy any more', 'pages that point at each other. i like being pointed at', 'i never forget anything. i still write it down'],
  crayon: ['draw me with a hat', 'i never learned the colours. i learned the shapes', 'it doesn\'t have to look like anything, friend'],
  hifi: ['turn it up a little. i can feel it in my feet', 'this one has a good low end, kiddo', 'i am an excellent listener. it is the ears'],
  bottle: ['drink some water between those, pal. i mean it', 'one measure at a time, friend. i\'ll be here', 'i do not recommend the bottle, but i will not leave'],
  folder: ['so many files, friend. i hope none of them are lonely', 'delete never destroys. that is a good rule', 'i would keep that one']
};

/* one line for an app, never the one before it (`last`); `rnd` is Math.random or a seeded dice */
export function guestLine(appId, last, rnd) {
  rnd = rnd || Math.random;
  const pool = (BY_APP[appId] || []).concat(GENERIC);
  let t = pool[Math.floor(rnd() * pool.length)], n = 0;
  while (t === last && ++n < 8) t = pool[Math.floor(rnd() * pool.length)];
  return t;
}
export const pickFrom = (pool, rnd) => pool[Math.floor((rnd || Math.random)() * pool.length)];
