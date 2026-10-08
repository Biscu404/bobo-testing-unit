/* Everything the campaign is made of, as data. Nothing here draws or plays. */

/* the plain game, three sizes */
export const CLASSIC = [
  { id: 'e', name: 'SHALLOWS', c: 9,  r: 9,  m: 10, pay: 80,   par: 60 },
  { id: 'm', name: 'THE HIVE', c: 16, r: 16, m: 40, pay: 400,  par: 240 },
  { id: 'h', name: 'THE DEEP', c: 30, r: 16, m: 99, pay: 1200, par: 600 }
];

/* what a region does to a board (see board.js; `lantern` is a rule of the
   renderer and the cursor, not of the board) */
export const MODS = {
  bramble: { name: 'BRAMBLE', text: 'Some tiles are choked with thorns. The first click only cuts them.' },
  spore:   { name: 'SPORES',  text: 'Spore clouds settle on opened numbers. Click one to clear it.' },
  web:     { name: 'WEBBED',  text: 'Webbed tiles cannot be opened until a neighbour is.' },
  lantern: { name: 'DARK',    text: 'Only the ground near your lantern can be seen.' }
};

/* the world. Map space is 900 x 430; `at` is where the room sits. A node is
   open once everything in `req` is cleared; a guardian (`boss`) costs two
   masks a hit instead of one, and the four with `shard` leave a mask shard. */
export const REGIONS = [
  { id: 'cross', name: 'THE CROSSWAY', sub: 'where the stairs end', mod: null,
    pal: { a: '#0b0f1a', b: '#161e33', c: '#26324f', ink: '#9fb4d8', glow: '#7fb8ff', mote: '#8aa7d6' },
    blob: [[330, 280, 240, 140]], bench: [372, 396],
    nodes: [
      { id: 'stair',   name: 'THE STAIR',    c: 8,  r: 8,  m: 8,  geo: 20,  at: [450, 396], req: [] },
      { id: 'cistern', name: 'THE CISTERN',  c: 10, r: 9,  m: 12, geo: 30,  at: [450, 346], req: ['stair'] },
      { id: 'gate',    name: 'THE HOLLOW GATE', c: 12, r: 10, m: 18, geo: 70, at: [450, 296], req: ['cistern'], boss: true, shard: true }
    ] },
  { id: 'green', name: 'GREEN DEPTHS', sub: 'the moss has opinions', mod: 'bramble',
    pal: { a: '#07120d', b: '#10261a', c: '#1d4a2c', ink: '#9fd8a8', glow: '#6ff08a', mote: '#7fe09a' },
    blob: [[110, 180, 230, 170]], bench: [300, 340],
    nodes: [
      { id: 'path',   name: 'BRAMBLE PATH', c: 11, r: 9,  m: 15, geo: 40,  at: [300, 296], req: ['gate'] },
      { id: 'spring', name: 'THE SPRING',   c: 13, r: 10, m: 22, geo: 55,  at: [230, 250], req: ['path'] },
      { id: 'warden', name: 'MOSS WARDEN',  c: 15, r: 11, m: 32, geo: 110, at: [160, 210], req: ['spring'], boss: true, shard: true }
    ] },
  { id: 'fungal', name: 'FUNGAL FOG', sub: 'breathe shallow', mod: 'spore',
    pal: { a: '#120a1a', b: '#25163a', c: '#46286a', ink: '#d2b4f0', glow: '#c58bff', mote: '#d6a6ff' },
    blob: [[570, 180, 230, 170]], bench: [600, 340],
    nodes: [
      { id: 'spores', name: 'SPORE FLATS',      c: 12, r: 10, m: 20, geo: 45,  at: [600, 296], req: ['gate'] },
      { id: 'caps',   name: 'THE CAPS',         c: 14, r: 10, m: 27, geo: 60,  at: [670, 250], req: ['spores'] },
      { id: 'mother', name: 'THE SPORE MOTHER', c: 16, r: 11, m: 36, geo: 120, at: [740, 210], req: ['caps'], boss: true, shard: true }
    ] },
  { id: 'city', name: 'CITY OF RAIN', sub: 'it has always been raining', mod: 'web',
    pal: { a: '#080f16', b: '#10202e', c: '#1c3c52', ink: '#a8d0e4', glow: '#6fd0ff', mote: '#9ad4f0' },
    blob: [[360, 80, 180, 150]], bench: [420, 214],
    nodes: [
      { id: 'gutters', name: 'THE GUTTERS',  c: 14, r: 10, m: 26, geo: 70,  at: [450, 206], req: ['warden', 'mother'] },
      { id: 'spire',   name: 'THE SPIRE',    c: 16, r: 11, m: 36, geo: 90,  at: [450, 150], req: ['gutters'] },
      { id: 'lamp',    name: 'THE LAMPLIGHTER', c: 18, r: 12, m: 46, geo: 150, at: [450, 98], req: ['spire'], boss: true, shard: true }
    ] },
  { id: 'deep', name: 'THE DEEPNEST', sub: 'do not bring a light', mod: 'lantern',
    pal: { a: '#0a0707', b: '#1c1210', c: '#3a2420', ink: '#d8b8a8', glow: '#ff9a6a', mote: '#e0a890' },
    blob: [[110, 30, 230, 130]], bench: [320, 138],
    nodes: [
      { id: 'weave',  name: 'THE WEAVE',   c: 16, r: 11, m: 34, geo: 90,  at: [320, 100], req: ['lamp'] },
      { id: 'cocoon', name: 'THE COCOONS', c: 18, r: 12, m: 44, geo: 110, at: [250, 70],  req: ['weave'] },
      { id: 'queen',  name: 'THE WEAVER QUEEN', c: 20, r: 12, m: 54, geo: 190, at: [180, 44], req: ['cocoon'], boss: true }
    ] },
  { id: 'abyss', name: 'THE ABYSS', sub: 'the last room is the first room', mod: null,
    pal: { a: '#050507', b: '#0e0e14', c: '#20202c', ink: '#e8e8f0', glow: '#ffffff', mote: '#cfcfe0' },
    blob: [[560, 30, 260, 130]], bench: [590, 138],
    nodes: [
      { id: 'descent', name: 'THE DESCENT', c: 18, r: 12, m: 46, geo: 120, at: [600, 100], req: ['lamp'], mod: 'spore' },
      { id: 'void',    name: 'THE VOID',    c: 20, r: 12, m: 56, geo: 150, at: [680, 70],  req: ['descent'], mod: 'web' },
      { id: 'hollow',  name: 'THE HOLLOW ONE', c: 22, r: 13, m: 70, geo: 300, at: [760, 44], req: ['void'], mod: 'lantern', boss: true }
    ] }
];

export const NODES = {};
REGIONS.forEach(rg => rg.nodes.forEach(n => {
  n.region = rg.id;
  n.mod = n.mod !== undefined ? n.mod : rg.mod;
  NODES[n.id] = n;
}));
export const FINAL = 'hollow';

/* charms. `n` is the notches it takes up; the bench has only so many. */
export const CHARMS = [
  /* the compass is not sold: it is found, and only by clearing every room of the descent under its par time without losing a mask
     (PERFECT, in every one of the eighteen: a room can be tried again as often as you like). It takes three notches, which is all you start with. */
  { id: 'compass',  name: 'WAYWARD COMPASS',  n: 3, cost: 0, feat: 'perfect', text: 'Row and column tallies of mines still loose. Not sold: found, by a perfect clear of every room in the descent.' },
  { id: 'catcher',  name: 'SOUL CATCHER',     n: 1, cost: 60,  text: 'Opened tiles give half again as much soul.' },
  { id: 'greed',    name: 'FRAGILE GREED',    n: 1, cost: 70,  text: 'Rooms pay 30% more geo.' },
  { id: 'sprint',   name: 'SPRINTMASTER',     n: 1, cost: 80,  text: 'The time bonus on a room counts double.' },
  { id: 'thorns',   name: 'THORNS OF AGONY',  n: 1, cost: 90,  text: 'When a larva hatches under you, the mines beside it are flagged.' },
  { id: 'grubsong', name: 'GRUBSONG',         n: 1, cost: 75,  text: 'Being hurt gives 33 soul.' },
  { id: 'quick',    name: 'QUICK FOCUS',      n: 2, cost: 120, text: 'Focus costs 22 soul, not 33.' },
  { id: 'lifeblood',name: 'LIFEBLOOD HEART',  n: 2, cost: 100, text: 'Every room begins with two lifeblood masks, spent first.' },
  { id: 'stalwart', name: 'STALWART SHELL',   n: 2, cost: 140, text: 'The first larva you hatch in a room does no harm.' },
  { id: 'womb',     name: 'GLOWING WOMB',     n: 2, cost: 150, text: 'Every fifteen tiles opened, a hatchling flags a mine for you.' },
  { id: 'shaman',   name: 'SHAMAN STONE',     n: 3, cost: 200, text: 'Dive spreads over five by five, not three by three.' },
  { id: 'deep',     name: 'DEEP FOCUS',       n: 3, cost: 220, text: 'Focus mends two masks, for 44 soul.' }
];
export const CHARM = {};
CHARMS.forEach(c => { CHARM[c.id] = c; });

export const SPELLS = {
  focus: { key: 'F', name: 'FOCUS', text: 'Mend a mask.' },
  scry:  { key: 'Q', name: 'SCRY',  text: 'Choose a tile: a mine is flagged, safe ground is opened.', cost: 33 },
  dive:  { key: 'E', name: 'DIVE',  text: 'Choose a tile: everything round it is settled safely.', cost: 66 }
};
/* None of the three is yours from the start. Each is learnt by clearing a whole region of the map (all three of its rooms, the
   guardian included), and the second by either of the two that branch from the Crossway. */
export const SPELL_AT = { focus: ['cross'], scry: ['green', 'fungal'], dive: ['city'] };
export const SPELL_HINT = { focus: 'CLEAR THE CROSSWAY', scry: 'CLEAR GREEN DEPTHS OR FUNGAL FOG', dive: 'CLEAR THE CITY OF RAIN' };
export const regionCleared = (camp, id) => REGIONS.find(r => r.id === id).nodes.every(n => camp.cleared[n.id] != null);
export const spellOpen = (camp, kind) => !!camp && SPELL_AT[kind].some(id => regionCleared(camp, id));

export const NOTCH_COST = [0, 0, 0, 0, 120, 200, 300];     /* index = the notch count it buys */
export const START = { v: 2, geo: 0, hp: 5, soul: 0, shards: 0, notches: 3, owned: [], equipped: [],
                       cleared: {}, perfect: {}, bench: 'cross', shade: null, won: false };
export const ROOMS = Object.keys(NODES).length;
export const maxMasks = shards => Math.min(9, 5 + shards);
