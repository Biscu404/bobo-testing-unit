/* The desktop elephant goes to where you are. Pure: no DOM, no clock, no speaker (`node scripts/check-petlines.mjs` holds it); kernel/pet.js plays it.

   He used to wander the bare desktop under every window, where nobody was looking. Now, whenever there is a window you are using (the one in front, not the
   elephant's own and not a dialog), he mostly goes there: walks to its edge, steps in over the top of it (small, one pixel to one pixel, and never in the way of
   a click), walks about inside it, stands and watches, says something that is about *that* app, cheers when you earn a trophy, naps in a corner when it is
   late, and follows you when you move to another app. When the window is closed or put away he drops out where he stood.

   `pickTarget(windows)`: the window to visit, from descriptors { appId, hidden, active, z, game }: the active one if it is a real app window, otherwise the
   highest that is not hidden; a game outranks a tool when neither is active. `VISIT_RATE` is how often, when there is somewhere to go, he goes.
   His words are in his voice (lowercase, on your side), one pool for coming in and a few for watching, per app, plus the cheers, the naps and the leaving. */

export const VISIT_RATE = 0.86;                      /* of his decisions, when there is a window in use: "almost always" */
export const SKIP = { elephant: 1, placeholder: 1, about: 1, help: 1 };
export const GAMES = { sweeper: 1, solitaire: 1, aftere: 1, garden: 1, cook: 1, magen: 1, standbattle: 1, bekkedal: 1, bottle: 1, goddoodle: 1, defrag: 1 };

export function pickTarget(wins) {
  const ok = (wins || []).filter(w => w && w.appId && !SKIP[w.appId] && !w.hidden);
  if (!ok.length) return null;
  const act = ok.find(w => w.active);
  if (act) return act;
  return ok.slice().sort((a, b) => ((GAMES[b.appId] ? 1000 : 0) + (b.z || 0)) - ((GAMES[a.appId] ? 1000 : 0) + (a.z || 0)))[0];
}

/* ---- coming in ----------------------------------------------------------------------------------------------------------------- */
export const ENTER = {
  _: ['i\'ll just stand in the corner and watch. you won\'t know i\'m here', 'room for one more in here? good', 'carry on. i\'m only visiting', 'don\'t mind me, friend. i\'m small in here'],
  sweeper: ['careful where you step in here, pal. i\'ve seen what is in those rooms', 'i\'ll stay clear of the mines. i have big feet', 'a dungeon. i love a dungeon, as long as i\'m not the one doing the clearing'],
  solitaire: ['oh good, cards. i\'ll be quiet. i won\'t say where the red queen is', 'take your time with it, friend. nobody is dealing against you', 'i\'ve been told i have a good poker face. let me see it on the felt'],
  aftere: ['i\'ll ride along. i don\'t have wings, but i have good posture', 'sand and stone and a long way up. you\'ve got this, pilgrim', 'i\'ll watch the pillars, you watch the gap'],
  garden: ['plants. oh, plants. i\'ll keep my trunk to myself, i promise', 'i\'ve eaten a garden before. this is not a threat', 'water them, pal. i\'ll supervise'],
  cook: ['i\'ll stand well back from the flasks, friend. i know what i am', 'chemistry. i never did well at it. i did very well at lunch', 'careful with the pours. i\'ll hold the door'],
  magen: ['one more mitzvah for the pile, friend. i\'ll count along', 'a star and a click. i could do this all day. and i have', 'i don\'t know all the words, but i know the tune'],
  standbattle: ['a fight. i\'m a peaceful elephant, but i\'ll cheer very loudly', 'i\'ll stay behind the line. you do the hard part', 'whatever happens, pal, you looked great doing it'],
  bekkedal: ['a whole little valley. i\'ll just be a very small cow, if anybody asks', 'the fields look good. i believe in your carrots', 'i\'ll watch the weather for you, friend. it looks fine. it always looks fine'],
  bottle: ['i\'m not drinking. i\'m supervising. there is a difference, pal', 'drink some water between those, friend. and a sandwich', 'i\'ll be the designated elephant'],
  goddoodle: ['what did he draw this time? i\'m going to say it\'s a dog', 'a word from above. let\'s see what we get'],
  crayon: ['a blank sheet. the best kind. i\'ll stay off it', 'draw me in, if you like. i have a good side. both of them'],
  garage: ['a studio. i\'ll keep time with my foot, quietly', 'play something, friend. i\'m a very forgiving audience', 'i can hum in the key of whatever you pick'],
  holyc: ['code. i read it the way i read the sky: slowly, and hoping for the best', 'you write it, i\'ll believe it works', 'i\'ll sit by the semicolons and make sure none of them wander off'],
  notes: ['a place to put your thoughts. i keep mine in a peanut tin', 'write it down, pal. then you can put it down'],
  hifi: ['music. i\'ll sway. it\'s the most elephant thing i can do', 'turn it up a little, friend. not much. a little'],
  shop: ['shopping. i\'ll keep an eye on dave. he looks at my trunk like it is stock', 'i\'ll hold your sun, friend. no, i won\'t. i\'ll just stand near it'],
  folder: ['a folder. all these little things you kept. i\'ll look, i won\'t touch', 'tidy, tidy. i won\'t move anything. well. i might nudge one'],
  terminal: ['a terminal. it talks very plainly. i like that in a machine', 'type something kind, friend. it will do what it\'s told'],
  trophies: ['the trophies. i\'ll stand next to the gold ones, if that\'s alright', 'so many cups. you did all of that. i watched some of it']
};

/* ---- watching -------------------------------------------------------------------------------------------------------------------- */
export const WATCH = {
  _: ['you\'re doing better than you think, pal', 'still here. still watching. still on your side', 'drink some water while you\'re in here, friend', 'i\'ll stay as long as you do'],
  sweeper: ['a flag there, i think. no. you know better than me', 'every number is a small promise, kiddo. read it', 'breathe. the next tile is just a tile', 'i would never have the nerve. i\'m very proud of yours', 'that was a clean room. it\'s the soul that does it, i\'ve heard'],
  solitaire: ['the five goes on the six. no wait, i don\'t know what i\'m talking about', 'there is always one more move, friend. sometimes it is an undo', 'that deal looked tricky. you made it look easy', 'you\'ve got it. i can feel it, and i\'m only an elephant'],
  aftere: ['up a little. a little more. there. oh, you\'re good', 'mind the locusts, pal. there are a lot of them', 'that was close. my trunk went cold', 'the temple is a long way. so is everything good'],
  garden: ['that one looks thirsty, friend. i can tell. i know thirsty', 'they grow better when somebody talks to them. i\'m talking to them', 'nice rack. of plants. i meant plants', 'give them time, kiddo. everything green takes its time'],
  cook: ['steady with the pour. steady. i\'m holding my breath for you', 'that is a very pure flask, pal. i can tell by the colour. i can\'t tell by anything else', 'take it slow. nobody is timing you but you', 'you\'re doing great. you\'re doing great and i\'ll keep saying so'],
  magen: ['that\'s a lot of mitzvot, friend. look at them go', 'the star is happy. i can tell. i\'m not sure how', 'one more click. then one more. you\'ve found the rhythm', 'i\'ll count them with you. eleven. twelve. i lost count. thirteen'],
  standbattle: ['dodge! no, the other way! sorry. you\'re fine', 'that\'s a good hit. i felt that through the screen', 'you\'re doing it right, pal. i\'m only an elephant, but i know', 'keep your guard up. and drink some water after'],
  bekkedal: ['the crops look good from up here. well, from in here', 'it\'s getting late in the valley. go home soon, friend. you need to sleep too', 'nice farm. i\'d live here, if the door were a little wider', 'somebody in that village is going to be glad you came by'],
  bottle: ['one measure, pal. one. then a glass of water', 'that glass is very full. so is the evening', 'i can\'t drink with this trunk. it just goes everywhere', 'slow down, friend. the floor is not going anywhere'],
  goddoodle: ['a boat? i\'m going with a boat', 'he draws like i walk: with great confidence and no plan', 'ask again. it\'s free. nothing costs anything in here'],
  crayon: ['that is a lovely line, friend. wobbly in the right places', 'draw something for me. i\'ll put it up on the wall', 'colours are nice. i see most of them'],
  garage: ['that\'s a good groove, pal. i\'m nodding. can you see me nodding', 'the bass is doing the real work in there. it always does', 'play it again. i\'d listen to it again', 'you made that out of nothing, friend. that\'s the whole trick'],
  holyc: ['a missing semicolon, i think. i\'m not looking. i\'m looking a little', 'it\'ll run, pal. and if it doesn\'t, it\'ll tell you why. that\'s kind of it', 'you wrote that. a person wrote that. look at you', 'i\'d be so scared to type that. you just did it'],
  notes: ['write another one. they\'re nice to read', 'a small thought is still a thought, friend', 'you\'ve got a lot of notes. i\'m not reading them. i\'m reading them a bit'],
  hifi: ['i like this one. who is it? don\'t tell me. i want to keep liking it', 'the little needles are dancing. so am i. very slowly', 'turn it up one notch. one. i\'m sensitive'],
  shop: ['dave is looking at you again, pal. you don\'t have to buy it', 'that one is nice. it\'s a lot of sun. think about it first', 'you\'ve got a good eye, friend', 'i don\'t need anything. i have a hat'],
  folder: ['so many files. you made all this, friend', 'the little yellow folders are my favourite', 'tidy is nice. so is messy. i\'ve seen the both of it'],
  terminal: ['you\'re typing so fast. i\'m impressed. i\'m only a spectator', 'it said ok. it\'s always glad to hear from you', 'that command looks serious, pal. i\'m standing very still'],
  trophies: ['look at all the cups, friend. each one was something you did', 'the gold ones are the hard ones. you earned plenty', 'nearly there on that one. a little more', 'it\'s a long list. there\'s no hurry. it isn\'t going anywhere']
};

/* ---- a trophy lands while he is in the window (the card is over the app; he hops) ----------------------------------------------------- */
export const CHEER = ['a trophy! i heard it, pal', 'look at that, friend. you did that', 'that\'s a good one. i\'m clapping. these are my clapping feet', 'i knew you would. i said so, didn\'t i', 'cup number whatever! i\'m proud of you, kiddo', 'oh, that\'s lovely. put it somewhere you can see it'];
export const BIG_CHEER = ['pal. pal. do you know what you just did. that is the whole thing. that is all of it', 'that is a very big one, friend. i\'m going to need a moment. and a peanut', 'the whole thing! you did the whole thing! i\'m not crying. it\'s the screen'];

/* ---- napping and leaving ------------------------------------------------------------------------------------------------------------- */
export const NAP = ['...i\'ll rest my eyes in the corner. i\'ll still be watching. a bit', 'a nap in here, then. wake me if you win', 'just ten minutes, friend. you carry on. i\'m right here'];
export const LEAVE = ['i\'ll go and see what the desktop is up to. back soon', 'stretching my legs. i\'ll be around, pal', 'that was nice. i\'m going to wander. keep going, you\'re doing well', 'out for a walk. i left a good thought in there for you'];
export const FOLLOW = ['you moved! wait for me, friend', 'oh, we\'re going over there. good. i\'ll come too', 'i\'ll follow you, pal. i\'m slow, but i follow'];
export const OUT_WHEN_SHUT = ['oh. it closed. well. that\'s alright. i was only visiting', 'the window went away. i\'m still here, kiddo. i\'m always still here'];

/* what to say at a moment: a line for the app if it has any, else the general ones; rnd() in [0, 1) */
export function lineFor(table, appId, rnd, avoid) {
  const pool = (table[appId] || []).concat(table._ || []);
  const fresh = pool.filter(t => !avoid || avoid.indexOf(t) < 0);
  const from = fresh.length ? fresh : pool;
  return from[Math.min(from.length - 1, Math.floor(rnd() * from.length))];
}
