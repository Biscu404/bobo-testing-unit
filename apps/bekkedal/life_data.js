/* Bekkedal — what people do between their posts. Content only.
 *
 * `schedule.js` says where somebody is at a given hour: a post, and a walk between two. That left each of the eight
 * standing on one tile for most of a working day, as still as the fence post beside them. This is the rest of a day:
 *
 *   CHORES  per person, per post, a few *stations* near it: a place to stand, the way to face, and what the hands do
 *           there. Through the working day they go to one for a while and come back (life.js decides when, off the day
 *           and the person, never a random number).
 *   BED     when they are indoors and not to be found: nobody is on the road at three in the morning.
 *   ERRANDS how often, and for how long, they are away for a few hours in the day: to the mill, the market, the next
 *           valley. Most hours, and every hour of a festival, they are about.
 *   CALLS   what somebody shouts across the square when they see you from a long way off and have something to say.
 *
 * A station is a tile somebody can stand on and reach from their post on foot; `life_check.js` walks all of them.
 * `act` is a verb life.js hands to the drawing: `ACT_TOOL` below says what is in the hand while it is done.
 *
 * Nothing here is a number of the economy, and nothing is saved.
 */

/* the verbs, and what the hands hold for each: a tool the swing tables already know, an item carried (BEK_ITEMS id),
   or nothing at all. `swing` is how fast the tool moves (cycles a second): a broom is slow, a hammer is not. */
export const ACT_TOOL = {
  sweep:  { tool: 'spade', swing: 0.7 },
  draw:   { tool: 'spade', swing: 0.5 },
  hammer: { tool: 'oks', swing: 1.1 },
  saw:    { tool: 'oks', swing: 0.9 },
  pick:   { tool: 'hakke', swing: 0.8 },
  water:  { tool: 'kanne', swing: 0.5 },
  wash:   { tool: 'kanne', swing: 0.6 },
  rod:    { tool: 'stang', swing: 0.15 },
  carry:  { item: 'tommer' },
  stock:  { item: 'tommer' },
  sort:   { item: 'orret' },
  net:    { item: 'tau' },
  rope:   { item: 'tau' },
  mend:   { item: 'spiker' },
  churn:  { item: 'melk' },
  tend:   { item: 'melk' },
  cairn:  { item: 'stein' },
  rest:   { item: 'kaffe', sit: true },
  sit:    { sit: true },
  look:   {}
};

/* [from, to] minutes of day, wrapping past midnight: somebody asleep is indoors and not on any map */
export const BED = {
  default: [23 * 60 + 30, 5 * 60 + 45],
  hakon: [22 * 60 + 30, 5 * 60 + 15],         /* up before the site */
  astrid: [23 * 60, 5 * 60 + 30],
  sigrid: [22 * 60 + 30, 5 * 60],             /* the milking */
  lars: [23 * 60 + 30, 6 * 60 + 30]
};

/* who goes away in the day, and how: `odds` is the share of days (out of 100) on which they do, `len` the shortest and
   longest time away in minutes, `between` the window in which they set out. A shopkeeper does not go (`odds: 0`): the
   counter is the point of them, and their hours are in their own dialogue. */
export const ERRANDS = {
  hakon:  { odds: 35, len: [150, 240], between: [9 * 60, 14 * 60] },
  ingrid: { odds: 35, len: [150, 240], between: [9 * 60, 14 * 60] },
  olav:   { odds: 40, len: [180, 270], between: [9 * 60, 13 * 60] },
  marit:  { odds: 30, len: [150, 210], between: [9 * 60, 14 * 60] },
  gunnar: { odds: 25, len: [120, 180], between: [9 * 60, 15 * 60] },
  astrid: { odds: 0 }, sigrid: { odds: 0 }, lars: { odds: 0 }
};

/* stations: { id, x, y, face (0 down, 1 up, 2 left, 3 right), act }, by person and by the id of the post they belong to.
   Each is one or two tiles from something it is for: a doorstep to sweep, a well, a bench, a wall to mend, the water. */
export const CHORES = {
  astrid: { shop: [
    { id: 'sweep', x: 8,  y: 11, face: 1, act: 'sweep' },
    { id: 'stock', x: 11, y: 11, face: 1, act: 'stock' },
    { id: 'well',  x: 18, y: 13, face: 3, act: 'draw' },
    { id: 'bench', x: 24, y: 11, face: 3, act: 'rest' } ] },
  hakon: { work: [
    { id: 'hammer', x: 31, y: 24, face: 1, act: 'hammer' },
    { id: 'saw',    x: 26, y: 24, face: 2, act: 'saw' },
    { id: 'carry',  x: 22, y: 24, face: 3, act: 'carry' } ] },
  ingrid: { shore: [
    { id: 'net',  x: 9,  y: 9,  face: 3, act: 'net' },
    { id: 'wash', x: 16, y: 11, face: 3, act: 'wash' },
    { id: 'sort', x: 9,  y: 14, face: 0, act: 'sort' } ] },
  olav: { dock: [
    { id: 'rod',  x: 18, y: 8,  face: 3, act: 'rod' },
    { id: 'rope', x: 11, y: 8,  face: 2, act: 'rope' },
    { id: 'mend', x: 9,  y: 10, face: 0, act: 'mend' } ] },
  marit: { field: [
    { id: 'water', x: 23, y: 9,  face: 3, act: 'water' },
    { id: 'pick',  x: 19, y: 10, face: 2, act: 'carry' },
    { id: 'rest',  x: 20, y: 11, face: 0, act: 'rest' } ] },
  sigrid: { dairy: [
    { id: 'churn', x: 7,  y: 7, face: 1, act: 'churn' },
    { id: 'tend',  x: 14, y: 8, face: 0, act: 'tend' },
    { id: 'sweep', x: 10, y: 6, face: 2, act: 'sweep' } ] },
  gunnar: { watch: [
    { id: 'look',  x: 21, y: 16, face: 1, act: 'look' },
    { id: 'cairn', x: 12, y: 20, face: 0, act: 'cairn' },
    { id: 'sit',   x: 24, y: 18, face: 3, act: 'sit' } ] },
  lars: { shop: [
    { id: 'pick', x: 8, y: 10, face: 3, act: 'pick' },
    { id: 'sort', x: 4, y: 10, face: 0, act: 'sort' },
    { id: 'tend', x: 8, y: 12, face: 1, act: 'tend' } ] }
};

/* the share of working slots (out of 100) spent at a station rather than at the post */
export const CHORE_ODDS = 50;
/* how long, in game minutes, one stretch lasts: a day is five real minutes, so ninety of them is about twenty-two seconds */
export const SLOT_MIN = 90;

/* what somebody calls out across the ground when they have seen you from a long way off and have something to say */
export const CALLS = [
  { no: 'HEI! VENT!',                  en: 'HEY! WAIT!' },
  { no: 'DU DER! KOM HIT!',            en: 'YOU THERE! OVER HERE!' },
  { no: 'HALLO! BARE ET ØYEBLIKK!',    en: 'HELLO! JUST A MOMENT!' },
  { no: 'HEI, DU! JEG HAR NOE Å SI!',  en: 'HEY! I HAVE SOMETHING TO SAY!' },
  { no: 'ÅH, DER ER DU JO!',           en: 'OH, THERE YOU ARE!' }
];

/* ---- what a gift looks like once it is somebody's ----------------------------------------------------------------
   An item somebody was given (and did not dislike) is seen on them afterwards, some of the time. Three ways:
     wear   something on the body: it is on whenever they are about (the sweater when it is cold, the rest always)
     hold   something in the hand while they rest (a cup, a bunch of flowers, a basket of berries)
     the item the hands already hold at a chore (ACT_TOOL.item) is the same item, if they were given it: it is theirs now
   `glyph` is what `actors_look.js` draws; `col` is a palette index to tint it with where it has one. */
export const LOOKS = {
  ullgenser: { wear: 'knit' },
  ull:       { wear: 'scarf' },
  krystall:  { wear: 'pendant' },
  solv:      { wear: 'pendant' },
  kobber:    { wear: 'pendant' },
  lykt:      { hold: 'lamp', dark: true },
  kaffe:     { hold: 'cup' },
  bukett:    { hold: 'bouquet' },
  blomst_bla: { hold: 'bouquet' }, blomst_gul: { hold: 'bouquet' }, blomst_ro: { hold: 'bouquet' },
  vaffel:    { hold: 'bite' }, lefse: { hold: 'bite' }, gulrotkake: { hold: 'bite' },
  jordbar:   { hold: 'basket' }, blabar: { hold: 'basket' }, multe: { hold: 'basket' }, tyttebar: { hold: 'basket' },
  melk:      { hold: 'jug' }, brunost: { hold: 'bite' },
  multekrem: { hold: 'bowl' }, fiskesuppe: { hold: 'bowl' }, potetstuing: { hold: 'bowl' }, gresskarsuppe: { hold: 'bowl' }, rabarbragrot: { hold: 'bowl' },
  orret: { hold: 'fish' }, laks: { hold: 'fish' }, makrell: { hold: 'fish' }, torsk: { hold: 'fish' },
  tau: { hold: 'coil' }, snelle: { hold: 'coil' },
  tommer: { hold: 'plank' }, planke: { hold: 'plank' }, spiker: { hold: 'nails' },
  stein: { hold: 'stone' }
};
