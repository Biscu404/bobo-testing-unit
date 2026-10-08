export const CK_SAVE = 'templeos.cook.v1';
export const CK_W = 19, CK_H = 11, CK_T = 20;    /* the bench, in cells and pixels */

/* ---- 33.1 the ten cooks, every one of them proved solvable ------------- */
export const CK_LV = [
{ id:1, par:4, par:4, n:'THE FIRST BATCH', sub:'Two reagents, one flask, and nothing in the way.',
  grid:[
  '###################',
  '#.................#',
  '#.................#',
  '#.................#',
  '#........T........#',
  '#.................#',
  '#.................#',
  '#.................#',
  '#..O..............#',
  '#.................#',
  '###################'],
  reg:[ {n:'ACETONE', d:[3,0], uses:4, c:11},
        {n:'LYE',     d:[0,-2], uses:4, c:14} ] },

{ id:2, par:4, par:4, n:'GLASSWARE', sub:'The bench is not empty any more. Go round it.',
  grid:[
  '###################',
  '#.................#',
  '#....#######......#',
  '#....#.....#......#',
  '#....#..T..#......#',
  '#....#.....#......#',
  '#....###.###......#',
  '#.................#',
  '#..O..............#',
  '#.................#',
  '###################'],
  reg:[ {n:'ACETONE', d:[3,0], uses:4, c:11},
        {n:'ETHER',   d:[2,0], uses:3, c:9},
        {n:'LYE',     d:[0,-2], uses:4, c:14} ] },

{ id:3, par:5, par:5, n:'THE RUIN', sub:'Touch the red and the batch is gone. Resetting costs you nothing.',
  grid:[
  '###################',
  '#.................#',
  '#..XXX..XXX..XXX..#',
  '#.................#',
  '#..XXX..XXX..XXX..#',
  '#...............T.#',
  '#..XXX..XXX..XXX..#',
  '#.................#',
  '#..XXX..XXX..XXX..#',
  '#..O..............#',
  '###################'],
  reg:[ {n:'ACETONE', d:[3,0],  uses:4, c:11},
        {n:'ETHER',   d:[2,0],  uses:4, c:9},
        {n:'AMINE',   d:[0,-3], uses:3, c:13},
        {n:'TOLUENE', d:[2,-2], uses:4, c:10} ] },

{ id:4, par:8, par:8, n:'THE MIRROR', sub:'Nothing on this shelf pours left. The mirrored plate is the only way back.',
  grid:[
  '###################',
  '#.................#',
  '#.................#',
  '#.......###.......#',
  '#..T....#.#...M...#',
  '#.......###.......#',
  '#.................#',
  '#.................#',
  '#.............O...#',
  '#.................#',
  '###################'],
  reg:[ {n:'ACETONE', d:[3,0],  uses:4, c:11},
        {n:'ETHER',   d:[2,0],  uses:4, c:9},
        {n:'LYE',     d:[0,-2], uses:3, c:14},
        {n:'AMINE',   d:[0,-3], uses:3, c:13},
        {n:'BENZENE', d:[0,3],  uses:3, c:5} ] },

{ id:5, par:5, par:5, n:'THE BLUE', sub:'A doubling plate. Twice as far, and twice as easy to overshoot.',
  grid:[
  '###################',
  '#.................#',
  '#..XXXXX...XXXXX..#',
  '#.................#',
  '#.................#',
  '#..O....D........T#',
  '#.................#',
  '#..XXXXX...XXXXX..#',
  '#.................#',
  '#.................#',
  '###################'],
  reg:[ {n:'ACETONE', d:[3,0],  uses:2, c:11},
        {n:'ETHER',   d:[2,0],  uses:4, c:9},
        {n:'AMINE',   d:[0,-3], uses:2, c:13},
        {n:'BENZENE', d:[0,3],  uses:2, c:5} ] },

{ id:6, par:7, par:7, n:'THE BURNER', sub:'Wax melts only when it is hot. Frost holds only when it is cold. The flask is behind both.',
  grid:[
  '###################',
  '#.................#',
  '#....#######......#',
  '#....#.....#......#',
  '#..O.*.....~.T....#',
  '#....#.....#......#',
  '#....#######......#',
  '#.................#',
  '#.................#',
  '#.................#',
  '###################'],
  temp0:1, heat:2, cool:2,
  reg:[ {n:'ETHER',   d:[2,0],  uses:6, c:9},
        {n:'ACETONE', d:[3,0],  uses:2, c:11},
        {n:'AMINE',   d:[0,-3], uses:2, c:13} ] },

{ id:7, par:3, par:3, n:'THE UNMARKED JAR', sub:'One bottle has no label. The only way to read it is to pour it.',
  grid:[
  '###################',
  '#..XXXX...XXXX....#',
  '#.................#',
  '#.....#######.....#',
  '#.....#.....#.....#',
  '#.....#..T..#.....#',
  '#.....#.....#.....#',
  '#.....#.#####.....#',
  '#..XXX.......XXX..#',
  '#..O..............#',
  '###################'],
  reg:[ {n:'ACETONE', d:[3,0],  uses:4, c:11},
        {n:'ETHER',   d:[2,0],  uses:4, c:9},
        {n:'BENZENE', d:[0,3],  uses:3, c:5},
        {n:'???',     d:[2,-2], uses:5, c:13, hidden:1} ] },

{ id:8, par:5, par:5, n:'THE SWEEP', sub:'Something crosses the bench once for every pour you make. Do not be standing in it.',
  grid:[
  '###################',
  '#.......M.........#',
  '#..XXX.......XXX..#',
  '#.................#',
  '#..XXX.......XXX..#',
  '#.............T...#',
  '#..XXX.......XXX..#',
  '#.................#',
  '#..O...S.....XXX..#',
  '#.................#',
  '###################'],
  sweep:[15, -1],
  reg:[ {n:'ETHER',   d:[2,0],  uses:5, c:9},
        {n:'AMINE',   d:[0,-3], uses:4, c:13},
        {n:'BENZENE', d:[0,3],  uses:3, c:5},
        {n:'???',     d:[3,-3], uses:4, c:12, hidden:1} ] },

{ id:9, par:13, par:13, n:'THREE STAGES', sub:'The flask will not take it until all three stages are done, in order.',
  grid:[
  '###################',
  '#.................#',
  '#..1....#....3....#',
  '#.......#.........#',
  '#.......#..XX.XX..#',
  '#.......#....2....#',
  '#.......#..XX.XX..#',
  '#.......#.........#',
  '#..O.........T....#',
  '#.................#',
  '###################'],
  cps:3,
  reg:[ {n:'ETHER',   d:[2,0],  uses:8, c:9},
        {n:'AMINE',   d:[0,-3], uses:6, c:13},
        {n:'BENZENE', d:[0,3],  uses:6, c:5},
        {n:'TOLUENE', d:[2,-2], uses:4, c:10} ] },

{ id:10, par:14, par:14, n:'ONE LAST TIME', sub:'Everything on the bench at once, and two bottles with no labels.',
  grid:[
  '###################',
  '#.................#',
  '#..1....*....3....#',
  '#.......#.........#',
  '#.......#..XX.XX..#',
  '#.......#....2....#',
  '#.......#..XX.XX..#',
  '#.......#.........#',
  '#..O....~....T....#',
  '#.................#',
  '###################'],
  cps:3, temp0:1, heat:2, cool:2, sweep:[17, -1],
  reg:[ {n:'ETHER',   d:[2,0],  uses:8, c:9},
        {n:'AMINE',   d:[0,-3], uses:7, c:13},
        {n:'???',     d:[2,-2], dt:[3,-3], uses:5, c:12, hidden:1},
        {n:'???',     d:[0,2],  dc:[0,3],  uses:6, c:4,  hidden:1} ] },

{ id:11, par:28, n:'THE ONE WHO KNOCKS', sub:'Nobody is left to cook it for. Do it anyway.', hidden:1,
  grid:[
  '###################',
  '#.................#',
  '#..1....#....3...M#',
  '#.......#.........#',
  '#.......#..XX.XX..#',
  '#.......#....2....#',
  '#.......#..XX.XX..#',
  '#.......#.........#',
  '#T.O....~....S....#',
  '#.................#',
  '###################'],
  cps:3, temp0:1, heat:2, cool:2, sweep:[15, -1],
  reg:[ {n:'ETHER',   d:[2,0],  uses:9, c:9},
        {n:'AMINE',   d:[0,-3], uses:7, c:13},
        {n:'???',     d:[2,-2], dt:[3,-3], uses:5, c:12, hidden:1},
        {n:'???',     d:[0,2],  dc:[0,3],  uses:8, c:4,  hidden:1} ] }

];

/* ---- 33.2 the story: story.js (thirteen chapters in the order they happened, and which bench each is read before) ---- */

/* ---- 33.2b the kid --------------------------------------------------------
   The single thing every review of Bartender: The Right Mix comes back to is
   that failure produces a REACTION rather than a reset — "hilarious trial and
   error", "memorable moments". A puzzle you fail in silence is homework. A
   puzzle somebody watches you fail is a scene.

   So somebody watches. He is not much help and he never shuts up, and he is
   the reason a ruined batch is worth having.
   ========================================================================== */
export const CK_KID = {
  /* the batch is gone, and why */
  ruin_X: [
    'Yeah, that\'s — that\'s all over the floor now.',
    'Cool. Cool cool cool. That was the red one. The red one is bad.',
    'I feel like the red squares were pretty clear about it.',
    'You walked it straight through. On purpose? Was that on purpose?',
    'That\'s a whole batch. That\'s a whole — okay. Okay. Again.'
  ],
  ruin_sweep: [
    'They came through. You were standing in it. I told you it moves.',
    'It moves every time YOU move. That\'s the whole thing it does.',
    'Okay so we do NOT stand in the light. Noted. Writing that down.',
    'That is the second worst place you could have been standing.'
  ],
  wall: [
    'That\'s glass, man.',
    'It doesn\'t go there. I watched it not go there.',
    'Nothing happened. That was a nothing.',
    'You just poured that at a wall. Confidently.'
  ],
  /* mechanics, the first time they land */
  first_mirror: [
    'Whoa — okay, everything goes backwards now. Everything.',
    'It flipped. The whole shelf flipped. Is that supposed to happen?'
  ],
  first_double: [
    'That went twice as far. That plate does that. Once.',
    'Double. One time only, then it forgets.'
  ],
  first_solvent: [
    'Clean slate. Whatever was riding on that, it\'s gone.'
  ],
  first_hot: [
    'It\'s melting. The wax is actually melting.',
    'Hot. Okay. The wax opens and the frost locks. Obviously.'
  ],
  first_cold: [
    'Frost\'s open. But the wax just sealed itself back up, so.',
    'Cold. Which means we can go through there and not through there.'
  ],
  first_stage: [
    'One down. Flask won\'t take it till all three are done. In order.',
    'That\'s stage one. It\'s counting.'
  ],
  reveal: [
    'It\'s — huh. Okay. Now we know what that one does.',
    'Well now it\'s labelled. Cost us a pour to find out.',
    'That\'s what was in there. Was it worth it? Probably.'
  ],
  /* how it went */
  win_par: [
    'That\'s it. That is EXACTLY it. Not one drop wasted.',
    'You did that in the minimum. The actual minimum.',
    'Okay that was — yeah. Yeah, that was clean.'
  ],
  win_over: [
    'It worked. It was ugly, but it worked.',
    'We got there. Took the scenic route.',
    'Fine. Nobody asks how many tries. Nobody ever asks.'
  ],
  win_first: [
    'First go. FIRST GO. You just — okay.',
    'You didn\'t even test anything. You just looked at it and knew.'
  ],
  /* the anti-obtuse net: the reviews of The Witness that hurt are the ones
     about a game that explains nothing and calls that respect */
  stuck1: [
    'You want to just — try one and see? Nothing here bites twice.',
    'Reset\'s free. It has always been free. Use it.'
  ],
  stuck2: [
    'Hover a bottle. It draws you the line before you commit. It\'s free.',
    'Look at the dotted line before you pour. It tells you everything.'
  ],
  stuck3: [
    'Count it. Where you are, where the flask is, how far each bottle goes.',
    'It\'s arithmetic, man. It\'s just arithmetic with a hat on.',
    'What if the answer is you go the wrong way first?'
  ],
  idle: [
    'Take your time. Genuinely. Nothing is on a clock.',
    'You get that look when you\'ve already solved it and haven\'t noticed.',
    'I\'m not rushing you. I\'m just standing here. In a desert.'
  ]
};

/* ---- 33.3 the ledger ------------------------------------------------------ */
export const CK_ACH = [
  { id:'a1',  n:'FIRST COOK',      d:'Finish the first batch.' },
  { id:'a2',  n:'THE PARTNERSHIP', d:'Finish three levels.' },
  { id:'a3',  n:'THE BLUE',        d:'Finish five levels.' },
  { id:'a4',  n:'THE EMPIRE',      d:'Finish eight levels.' },
  { id:'a5',  n:'ONE LAST TIME',   d:'Finish all ten.' },
  { id:'a6',  n:'NINETY-NINE ONE', d:'Hit 99.1% on any level.' },
  { id:'a7',  n:'ARTISAN',         d:'Hit 99.1% on five levels.' },
  { id:'a8',  n:'THE ONE WHO KNOCKS', d:'Hit 99.1% on all ten.' },
  { id:'a9',  n:'NO NOTES',        d:'Solve a level first try, no resets.' },
  { id:'a10', n:'CLEAN BENCH',     d:'Solve five levels with no resets.' },
  { id:'a11', n:'RUINED',          d:'Ruin a batch. It happens.' },
  { id:'a12', n:'RUINED A LOT',    d:'Ruin twenty batches.' },
  { id:'a13', n:'READ THE JAR',    d:'Identify an unlabelled reagent.' },
  { id:'a14', n:'BOTH JARS',       d:'Identify both jars in the last level.' },
  { id:'a15', n:'THE BURNER',      d:'Melt a wax seal.' },
  { id:'a16', n:'COLD HANDS',      d:'Cross a frost seal.' },
  { id:'a17', n:'THROUGH THE GLASS', d:'Use a mirrored plate.' },
  { id:'a18', n:'NOT TODAY',       d:'Finish a level with the sweep two cells away.' },
  { id:'a19', n:'IN ORDER',        d:'Complete three stages in one run.' },
  { id:'a20', n:'THE MONEY',       d:'Bank a million.' },
  { id:'a21', n:'STILL HERE',      d:'Reset the same level ten times and finish it.' },
  { id:'a22', n:'I WAS ALIVE',     d:'Read the ending.' },
  { id:'a23', n:'TEN STARS',       d:'Finish all ten in par with nothing spilled.' },
  { id:'a24', n:'THE ONE WHO KNOCKS', d:'Finish the eleventh bench.' }
];

/* ---- 33.4 the score: score.js (real instruments on the studio), played by music.js ---- */
