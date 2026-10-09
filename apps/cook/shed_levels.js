/* THE BACKYARD PROJECT, the ten boards (the rules are shed_model.js). Each is a garden of at most ten squares by seven, as the rows of a map:
     # hedge   . lawn   ~ pond   S the shed   @ where you start   p a part   $ a coin   g a gnome   V the van   L the lemonade stall   N a neighbour
   A neighbour's turns are `neighbours` in the order the N's are met reading left to right and down; `dirs` is a letter a turn (N E S W for the way she looks, - for not looking),
   `range` how far she sees and `who` which of the four people she is (shed_art.js). `tax` is the tax man's round, square by square. `price` is what the van wants for a part
   and `stock` how many parts it has. `par` is the fewest turns there is: it is *worked out* by node apps/cook/shed_check.js, which solves every board and fails if one is wrong or
   cannot be done, so it is a number to beat and never a guess. They were found by a search (a board is kept only if the street really matters to it), and tidied by hand. */
export const LEVELS = [
  {
    id: 1,
    name: 'THE FIRST PART',
    sub: 'ONE SPOON, ONE SHED, NOBODY LOOKING',
    par: 18,
    rows: [
      '........',
      '.@..~...',
      '....~..p',
      '.S..~...',
      '........'
    ]
  },
  {
    id: 2,
    name: 'A LITTLE HEDGE',
    sub: 'TWO PARTS, TWO HANDS, ONE AT A TIME',
    par: 19,
    rows: [
      '..........',
      '.@.#....p.',
      '...#.##...',
      '.p.#.#..S.',
      '...#.#....',
      '.....#....'
    ]
  },
  {
    id: 3,
    name: 'MRS. PICKLES',
    sub: 'SHE SEES ALL. A GNOME SEES NOTHING',
    par: 15,
    neighbours: [{ dirs: 'E', range: 7, who: 0 }],
    rows: [
      '..@.....',
      '..g.....',
      'N......p',
      '........',
      '.S......'
    ]
  },
  {
    id: 4,
    name: 'THE TURNING HEAD',
    sub: 'GEORGE LOOKS ALL ROUND. WAIT FOR HIM',
    par: 22,
    neighbours: [{ dirs: 'ES-W', range: 6, who: 1 }],
    rows: [
      '.#....S.',
      '...###..',
      '.#...#..',
      '.p##.#..',
      '...N.#..',
      '...#@...'
    ]
  },
  {
    id: 5,
    name: 'TWO WINDOWS',
    sub: 'TWO HEADS, TWO MINDS, ONE LAWN',
    par: 22,
    neighbours: [{ dirs: 'EEWW', range: 5, who: 2 }, { dirs: 'ESWN', range: 6, who: 3 }],
    rows: [
      '.S.......',
      '...##....',
      '.......N.',
      '..##.....',
      '.p.g.N..#',
      '..#..@###'
    ]
  },
  {
    id: 6,
    name: 'THE TAX MAN',
    sub: 'HE WALKS THE SAME STREET EVERY DAY',
    par: 15,
    tax: [[1, 4], [1, 5]],
    rows: [
      '...##....',
      '.#...##.#',
      '.#....#.#',
      '.#.#.....',
      '.........',
      '@.p.S...#'
    ]
  },
  {
    id: 7,
    name: 'CASH ONLY',
    sub: 'THE VAN SELLS PARTS FOR COINS',
    par: 32,
    price: 2,
    stock: 1,
    neighbours: [{ dirs: 'E', range: 6, who: 2 }],
    rows: [
      '..#......',
      '#S...##..',
      '#.##.##..',
      '...@.V#..',
      '.###N....',
      '$......$.'
    ]
  },
  {
    id: 8,
    name: 'THE FUNDRAISER',
    sub: 'WAIT ON THE STAND AND IT PAYS A COIN',
    par: 30,
    price: 2,
    stock: 1,
    neighbours: [{ dirs: 'E-', range: 4, who: 3 }],
    rows: [
      'S........',
      '.......##',
      '###..##.V',
      '..@L..#..',
      '.##.N.$..',
      '..#......'
    ]
  },
  {
    id: 9,
    name: 'THE WHOLE STREET',
    sub: 'GNOME, WINDOWS, TAX MAN AND A VAN',
    par: 45,
    price: 1,
    stock: 1,
    neighbours: [{ dirs: 'ESWN', range: 6, who: 0 }, { dirs: 'S', range: 3, who: 2 }],
    tax: [[6, 2], [6, 1], [6, 0], [5, 0], [4, 0]],
    rows: [
      '.......#.S',
      '.....p.g.#',
      '.#.N......',
      '@.N.#....#',
      '#..#..####',
      '.#..$#....',
      '.......V.#'
    ]
  },
  {
    id: 10,
    name: 'THE THING',
    sub: 'EVERYTHING WE HAVE, ONE MORE TIME',
    par: 71,
    price: 2,
    stock: 1,
    neighbours: [{ dirs: 'SW-E', range: 6, who: 0 }, { dirs: 'EEWW', range: 4, who: 3 }],
    tax: [[7, 2], [8, 2], [9, 2]],
    rows: [
      '.##...N...',
      '$@..##VL.#',
      '#...#.....',
      '..#p#.N...',
      'p#..g.###S',
      '.#..#.....',
      '.#....##..'
    ]
  }
];
