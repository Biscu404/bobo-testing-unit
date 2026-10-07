/* What the elephant on the desktop says (kernel/pet.js plays it). Pure: no DOM, no clock, no speaker; a line is a string or a
   function of the desk (`d`: { icons, sun, wins, hour }) and answers a string. `node scripts/check-petlines.mjs` holds the pools.

   He is the same elephant as the one in his window (apps/elephant/quotes.js): on your side, in no hurry, talks lowercase and a
   little plainly, calls you pal, friend or kiddo, tells you to drink water, believes in you and says so more than once. Out here
   the same warmth is turned on the desktop: the icons, the windows, the hour, what he has noticed while standing about. A few
   of the old deadpan lines (the peanuts, the guest who has not left) are kept because they are his too.

   Goodbyes are played just before he lies down to sleep: a small farewell, one for the day and one for the late hours. */

const sunWord = n => (n === 1 ? '1 sun' : n + ' sun');

/* ---- things he says while standing about ----------------------------------------------------------------------------------- */
const KIND = [
  'i believe in you pal',
  'you\'re doing better than you think you are',
  'i\'m proud of you. i don\'t say that lightly',
  'rest is not quitting, friend',
  'you don\'t have to have it figured out today',
  'slow progress is still progress, friend. i\'d know. i walked here',
  'take the small step, friend. the small step counts',
  'you are not behind. there is no schedule out here',
  'somebody is glad you\'re here. i\'m somebody',
  'be as kind to you as you are to everybody else',
  'you\'re allowed to start over as many times as you need',
  'one thing at a time, kiddo. just the one',
  'you\'re not too much. you never were',
  'nobody good ever did it alone. nobody. i have a whole screen full of friends',
  'whatever it is, pal, it is smaller than it was at three in the morning'
];

const BODY = [
  'drink some water, pal. i mean it',
  'eat something. you\'ll think clearer after',
  'shoulders down. jaw loose. there you go',
  'you\'ve been holding your breath again. let it all the way out',
  'stretch. right now, kiddo. i\'ll wait. i\'m very good at waiting',
  'look at something far away for a second, friend. the wall counts',
  'blink, pal. i can see the screen from here and it is a lot',
  'sit up a little. no, a little more. thank you',
  'open a window if you have one. new air helps more than it should',
  'go outside for ten minutes, pal. the sky is still there. i checked',
  'put the phone down, friend, and look at something far away',
  'you\'ve been sitting too long, friend. so have i. let\'s both move'
];

const DESK = [
  d => 'i counted your icons. there are ' + d.icons + '. i like all of them. i won\'t say which most',
  d => d.icons > 30 ? 'that is a lot of icons, kiddo. they\'re all welcome. i just have to walk around them' : 'plenty of room on your desktop. i could stretch my legs properly',
  d => d.icons < 12 ? 'your desktop is nice and quiet. i like a quiet desk' : 'busy desktop. busy is fine. busy is a sign you\'re making things',
  d => 'you have ' + sunWord(d.sun) + '. i don\'t really understand sun. i understand peanuts. but i\'m glad for you',
  d => d.wins > 3 ? d.wins + ' windows open. you\'re allowed to close one. nobody will be offended' : d.wins ? 'keep going with what you\'re doing. i\'ll be quiet down here' : 'no windows open. just you and me. i like it',
  d => d.wins === 0 ? 'the whole desktop to ourselves. what shall we do with it' : 'i can\'t step on the windows. they\'re above me. i\'m very careful',
  () => 'that icon looks lonely. the one by itself. i\'ll go and say hello later',
  () => 'i can see the taskbar from here. it isn\'t much of a horizon, but it\'s ours',
  () => 'somebody left a recycle bin on the desktop. i looked. i did not touch it. no judgment inside either',
  () => 'don\'t worry about the mess. the mess is part of it, pal. it always was',
  () => 'shall i move one of your things? i will. i\'m only asking to be polite',
  () => 'i like the way the light comes off the screen. it\'s very warm. it\'s like a small sunflower field',
  () => 'every icon is a thing you decided to keep. that\'s a nice thing to look at',
  () => 'the wallpaper is good. your taste is good. trust it',
  () => 'i haven\'t pushed anything for a while. i\'m thinking about it. i\'m being responsible'
];

const TIME_OF_DAY = [
  d => d.hour < 6 ? 'it is very late. you should be asleep. so should i. we can both do better' : d.hour < 12 ? 'good morning. i\'ve been up for hours. i haven\'t done anything. it was lovely' : d.hour < 18 ? 'it\'s afternoon. i can tell by the light. there is no light. i can tell anyway' : 'good evening, friend. you made it through another day. that counts',
  d => d.hour >= 23 || d.hour < 5 ? 'go to bed. it will keep till morning' : 'tomorrow gets a fresh page for you. that is the whole point of tomorrow',
  d => d.hour >= 5 && d.hour < 9 ? 'early start. be gentle with yourself. the day isn\'t going anywhere' : 'there is no wrong time for you to take a break. this is a fine one',
  d => d.hour >= 12 && d.hour < 14 ? 'it\'s about lunchtime. eat something real, pal. i\'ll have a peanut in solidarity' : 'do you know what time it is. i don\'t. i just walk around and trust it',
  d => d.hour >= 20 ? 'the evening is for slowing down. i\'m very good at it. watch me' : 'there is plenty of day left. take your time anyway'
];

const ELEPHANT = [
  () => 'i walked all the way across the screen. it took nine seconds. i\'m very brave',
  () => 'i am not a pet. i am a guest who has not left. you\'re welcome to ask me to',
  () => 'i remember a sunflower field. i\'ll say more some day. it was bright',
  () => 'a good elephant hat is a good elephant hat. i say nothing else',
  () => 'dave sends his regards. dave does not know i\'m out. let\'s keep it that way',
  () => 'i\'m thinking about the third temple. it\'s a long way and i have short legs. i\'ll get there',
  () => 'there is a bear in your game. he is not here. i checked twice',
  () => 'this desktop needs more grass. i\'ll mention it to the management',
  () => 'peanuts are not a food group. they are a feeling. don\'t tell the doctors',
  () => 'i\'ve been out here a while. it\'s bigger than the window. it\'s all right. i like both',
  () => 'when i hop it isn\'t because i\'m happy. okay it is a little',
  () => 'elephants never forget. that\'s why i still remember the nice things you said. do keep saying them',
  () => 'i could trumpet. i won\'t. but i could. it is nice to know i could',
  () => 'do you ever just stand somewhere for a while. it\'s underrated',
  () => 'the floor here is very flat. i have opinions about it. they are warm ones'
];

const CHEER = [
  () => 'keep going, kiddo. i\'ll be right here',
  () => 'you started. that is the rare part',
  () => 'start ugly, friend. ugly finishes. perfect never starts',
  () => 'done beats perfect, pal. ask anybody who ever finished anything',
  () => 'you don\'t have to feel good to do good',
  () => 'do it scared, kiddo. that one counts double',
  () => 'make something today, friend. anything. badly is fine',
  () => 'the world is better with the things you put in it',
  () => 'you\'re allowed to want good things for you',
  () => 'hope is not naive. it\'s a decision you make again tomorrow',
  () => 'finish it, pal. even messy. finish it',
  () => 'you\'ve survived every single one of your worst days. look at that record',
  () => 'hey. whatever happens today, you are still you, and that is enough',
  () => 'call the person you\'ve been meaning to call. i\'ll be here when you\'re back',
  () => 'tell somebody how you actually are today. the real one, not the tidy one'
];

export const LINES = [].concat(KIND, BODY, DESK, TIME_OF_DAY, ELEPHANT, CHEER);

/* ---- when he picks something up of yours and moves it ------------------------------------------------------------------- */
export const PUSH_LINES = [
  'in the way. sorry. better now',
  'that was doing nothing there. look, wallpaper',
  'i\'m tidying. don\'t thank me. okay, thank me a little',
  'one cell. i won\'t say which',
  'there. now you can see the wallpaper',
  'a tiny nudge. you can put it back. i\'ll understand',
  'i moved it with love, friend. not with force',
  'for your own good, kiddo. i mean the icon'
];

/* ---- a small goodbye before he lies down ------------------------------------------------------------------------------------ */
export const GOODBYES_DAY = [
  'i\'m going to lie down for a bit. you carry on, pal',
  'just resting my eyes. i\'ll be right over there',
  'nap time. you\'re doing great. wake me if you need me',
  'i\'ll be asleep over here. don\'t tiptoe on my account',
  'see you in a little while, kiddo. no rush at all',
  'heavy eyelids. big day of standing around. bye for now',
  'rest is not quitting. so i\'m resting. take care of you',
  'i\'ll dream about sunflowers. you drink some water',
  'shutting my eyes a minute. i believe in you from here',
  'back in a bit. keep the desktop warm for me',
  'goodbye for now, friend. i\'m only down the corner',
  'i\'ll be down for a while. don\'t forget to breathe out'
];
export const GOODBYES_NIGHT = [
  'it\'s late. go to bed soon, pal. i\'m going now',
  'goodnight, friend. you did enough today',
  'the screen will still be here tomorrow. so will i',
  'sleep well. tomorrow gets a fresh page',
  'turning in. tell somebody you love them first',
  'lights out for me. you should follow soon',
  'night night, kiddo. i\'m proud of you. i don\'t say that lightly'
];

/* ---- what he says when he wakes ------------------------------------------------------------------------------------------------ */
export const WAKES = [
  '...morning. did i miss anything',
  '...hm. hello again, friend',
  'oh. that was a good one. i dreamed of the oasis',
  'i\'m up. i\'m up. i believe in you. what did i miss',
  '...back. feeling better. you too?'
];
export const WAKES_NEAR = [
  'hm? ...oh. it\'s you',
  'oh. hello. i wasn\'t asleep. i was thinking',
  'you came to say hi. that\'s kind of you'
];

/* ---- going in ------------------------------------------------------------------------------------------------------------------- */
export const HOME_LINES = ['going in. don\'t move anything while i\'m gone', 'back inside. come and find me. i\'ll be here', 'in i go. take care of yourself out here'];
export const DOOR_LINES = ['nobody has the door open. i\'ll open it myself', 'no window to go back to. let me knock one open', 'i\'ll let myself in. it\'s allowed'];

/* the deterministic picker the tests use as well as the pet: rnd() in [0, 1) */
export function choose(pool, rnd, d) {
  const x = pool[Math.min(pool.length - 1, Math.floor(rnd() * pool.length))];
  return typeof x === 'function' ? x(d) : x;
}
