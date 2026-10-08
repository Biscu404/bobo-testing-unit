/* THINGS DAVE DOES NOT SELL. The milestone trophies (kernel/trophy_rewards.js) pay SUN, and the biggest of them pay in something a price cannot get you: an item
   that sits on Dave's shelves like any other (a frame, a logo, a pointer, a colour scheme, something for the elephant to wear, a bottle) but is marked
   `reward: '<trophy id>'`. On the shelf it is dim and says what earns it; `Cos.buy` refuses it; the moment its trophy is earned it is simply owned (kernel/cos.js
   `grantFor`/`syncRewards`), worn from the same card as anything bought, and counted in the same "owned" tally. Nothing that counts "everything Dave sells" counts these.
   Pure data: `price: 0` is only so that a list that is sorted by price puts them last (cos_data.js sorts rewards after everything for sale). */

const ROOM_VARS = (o) => Object.assign({
  '--lamp-on': '#ffffff', '--lamp-off': '#2a2a2a', '--lamp-glow': 'rgba(255,255,255,0.8)', '--scr-tint': 'transparent'
}, o);

export const FRAMES_R = [
  {
    id: 'loft', name: 'LOFTET', price: 0, reward: 'bk_loft',
    blurb: 'Honey-coloured logs chinked with moss, and a key hung on a nail. Every wing of the old storehouse is full.',
    brand: 'HOLYTRON  *  STOREHOUSE',
    vars: ROOM_VARS({
      '--case-bg': 'repeating-linear-gradient(0deg, #b07a3a 0 18px, #8a5a24 18px 21px, #c48e4a 21px 36px, #6e4518 36px 39px)',
      '--well-bg': 'linear-gradient(160deg, #3c2410 0%, #5a3818 45%, #2e1a0a 100%)',
      '--chin-ink': '#f6e4b8', '--knob-bg': 'linear-gradient(180deg, #e0c890 0%, #b48c4c 100%)', '--knob-bg-hi': 'linear-gradient(180deg, #f0dca8 0%, #c8a060 100%)', '--knob-ink': '#3a2410',
      '--lamp-on': '#ffd86a', '--lamp-off': '#3a2a10', '--lamp-glow': 'rgba(255,216,106,0.8)',
      '--case-shadow': 'inset 0 2px 0 rgba(255,230,170,0.4), inset 0 -3px 0 rgba(0,0,0,0.5), inset 3px 0 0 rgba(255,230,170,0.15), inset -3px 0 0 rgba(0,0,0,0.35)'
    }),
    deco: [{ svg: 'grain', pos: 'left 2% bottom 4%', size: '120px 20px' }]
  },
  {
    id: 'obsidian', name: 'OBSIDIAN', price: 0, reward: 'sw_king',
    blurb: 'Black glass with a violet edge. It was under the Underdeep, in the dark, being patient.',
    brand: 'PALE  *  NIGHTGLASS',
    vars: ROOM_VARS({
      '--case-bg': 'linear-gradient(158deg, #2a1c3c 0%, #120a1c 38%, #07040c 100%)',
      '--well-bg': 'linear-gradient(160deg, #05030a 0%, #160e24 50%, #030208 100%)',
      '--chin-ink': '#d8c8f4', '--knob-bg': 'linear-gradient(180deg, #4a3470 0%, #20143a 100%)', '--knob-bg-hi': 'linear-gradient(180deg, #5f4690 0%, #2e1d52 100%)', '--knob-ink': '#f0e4ff',
      '--lamp-on': '#c58bff', '--lamp-off': '#1e1230', '--lamp-glow': 'rgba(197,139,255,0.85)',
      '--scr-tint': 'rgba(120,60,200,0.05)',
      '--case-shadow': 'inset 0 2px 0 rgba(200,160,255,0.35), inset 0 -3px 0 rgba(0,0,0,0.7), inset 3px 0 0 rgba(200,160,255,0.12), inset -3px 0 0 rgba(0,0,0,0.6)'
    }),
    deco: [{ svg: 'screw', pos: 'left 2px top 2px' }, { svg: 'screw', pos: 'right 2px top 2px' }]
  },
  {
    id: 'laurel', name: 'THE GRAND TOUR', price: 0, reward: 'meta_grand',
    blurb: 'Green enamel and gold wire, for somebody who has been to every room on the machine and signed the book.',
    brand: 'HOLYTRON  *  LAUREATE',
    vars: ROOM_VARS({
      '--case-bg': 'linear-gradient(158deg, #2f6a3c 0%, #1d4a28 45%, #12331a 100%)',
      '--well-bg': 'linear-gradient(160deg, #0b2412 0%, #1a4a28 45%, #08190d 100%)',
      '--chin-ink': '#f4e2a0', '--knob-bg': 'linear-gradient(180deg, #f0d870 0%, #b8982e 100%)', '--knob-bg-hi': 'linear-gradient(180deg, #fff0a0 0%, #d0b040 100%)', '--knob-ink': '#2a2000',
      '--lamp-on': '#ffe680', '--lamp-off': '#223a14', '--lamp-glow': 'rgba(255,230,128,0.85)',
      '--scr-tint': 'rgba(60,160,80,0.04)',
      '--case-shadow': 'inset 0 2px 0 rgba(255,235,150,0.45), inset 0 -3px 0 rgba(0,0,0,0.55), inset 3px 0 0 rgba(255,235,150,0.2), inset -3px 0 0 rgba(0,0,0,0.4)'
    }),
    deco: [{ svg: 'crown', pos: 'center top 0.5%', size: '120px 24px' }]
  },
  {
    id: 'platinum', name: 'PLATINUM', price: 0, reward: 'meta_all',
    blurb: 'Not gold, and not trying to be. Cold, bright and a little smug, the case of a machine with nothing left in its ledger.',
    brand: 'HOLYTRON  *  LEDGER FULL',
    vars: ROOM_VARS({
      '--case-bg': 'linear-gradient(158deg, #ffffff 0%, #dfe6ee 25%, #b7c2d0 58%, #8e9aab 80%, #f2f6fb 100%)',
      '--well-bg': 'linear-gradient(160deg, #7c8898 0%, #b8c4d4 45%, #5e6a7a 100%)',
      '--chin-ink': '#26303e', '--knob-bg': 'linear-gradient(180deg, #ffffff 0%, #b4bfce 100%)', '--knob-bg-hi': 'linear-gradient(180deg, #ffffff 0%, #cdd6e2 100%)', '--knob-ink': '#1a2230',
      '--lamp-on': '#7fe0ff', '--lamp-off': '#2a3442', '--lamp-glow': 'rgba(127,224,255,0.9)',
      '--scr-tint': 'rgba(180,220,255,0.04)',
      '--case-shadow': 'inset 0 3px 0 rgba(255,255,255,0.95), inset 0 -4px 0 rgba(40,52,70,0.45), inset 4px 0 0 rgba(255,255,255,0.55), inset -4px 0 0 rgba(40,52,70,0.35)'
    }),
    deco: [{ svg: 'crown', pos: 'center top 0.5%', size: '150px 30px' }]
  }
];

const svg = body => '<svg viewBox="0 0 160 120" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges"><rect width="160" height="120" fill="#000000"/>' + body + '</svg>';
const R = (x, y, w, h, c) => '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + c + '"/>';
/* a disc as a staircase of rows (nothing on this machine is anti-aliased) */
const disc = (cx, cy, r, c) => { let o = ''; for (let dy = -r; dy <= r; dy += 2) { const w = Math.floor(Math.sqrt(Math.max(0, r * r - dy * dy))); o += R(cx - w, cy + dy, w * 2, 2, c); } return o; };

export const LOGOS_R = [
  {
    id: 'compass', name: 'THE WAYWARD COMPASS', price: 0, reward: 'sw_compass_found',
    blurb: 'A needle that points at the mines you have not found yet. It points at the temple, now, if you ask nicely.',
    svg: svg(disc(80, 60, 46, '#AAAAAA') + disc(80, 60, 41, '#000000') + disc(80, 60, 36, '#0000AA') +
      R(78, 14, 4, 10, '#FFFFFF') + R(78, 96, 4, 10, '#AAAAAA') + R(34, 58, 10, 4, '#AAAAAA') + R(116, 58, 10, 4, '#AAAAAA') +
      R(76, 28, 8, 32, '#FF5555') + R(72, 40, 16, 20, '#FF5555') + R(78, 60, 4, 4, '#FFFFFF') + R(76, 60, 8, 26, '#FFFFFF') + R(72, 60, 16, 12, '#FFFFFF') +
      R(76, 56, 8, 8, '#FFFF55') + R(79, 59, 2, 2, '#000000'))
  },
  {
    id: 'braces', name: 'THE COMPILER', price: 0, reward: 'hc_pall',
    blurb: 'Two braces and a semicolon: all fifty-six puzzles, solved, and not once did it tell you where the missing bracket was.',
    svg: svg(R(30, 22, 8, 16, '#55FF55') + R(22, 38, 8, 14, '#55FF55') + R(14, 52, 8, 16, '#55FF55') + R(22, 68, 8, 14, '#55FF55') + R(30, 82, 8, 16, '#55FF55') +
      R(122, 22, 8, 16, '#55FF55') + R(130, 38, 8, 14, '#55FF55') + R(138, 52, 8, 16, '#55FF55') + R(130, 68, 8, 14, '#55FF55') + R(122, 82, 8, 16, '#55FF55') +
      R(52, 46, 56, 6, '#FFFFFF') + R(52, 60, 40, 6, '#AAAAAA') + R(52, 74, 48, 6, '#FFFFFF') + R(74, 28, 12, 12, '#FFFF55') + R(74, 88, 12, 12, '#FFFF55') + R(78, 100, 4, 8, '#FFFF55'))
  },
  {
    id: 'cup', name: 'THE TWO HUNDREDTH', price: 0, reward: 'meta_200',
    blurb: 'A gold cup with two hundred small cups engraved inside it. You can only see them from the inside.',
    svg: svg(R(46, 24, 68, 6, '#FFFF55') + R(46, 30, 68, 34, '#FFFF55') + R(54, 64, 52, 10, '#FFFF55') + R(62, 74, 36, 8, '#AA5500') + R(70, 82, 20, 14, '#FFFF55') + R(52, 96, 56, 8, '#AA5500') + R(52, 96, 56, 3, '#FFFF55') +
      R(28, 32, 18, 6, '#FFFF55') + R(22, 38, 6, 16, '#FFFF55') + R(28, 54, 18, 6, '#FFFF55') + R(114, 32, 18, 6, '#FFFF55') + R(132, 38, 6, 16, '#FFFF55') + R(114, 54, 18, 6, '#FFFF55') +
      R(52, 30, 8, 34, '#FFFFFF') + R(98, 30, 10, 34, '#AA5500') + R(66, 36, 4, 4, '#AA5500') + R(78, 42, 4, 4, '#AA5500') + R(88, 36, 4, 4, '#AA5500') + R(72, 52, 4, 4, '#AA5500') + R(84, 54, 4, 4, '#AA5500'))
  }
];

/* pointer bitmaps: X is the edge, O the fill, as the others */
export const CUR_HOLLOW = [
  '..XXXXXXXX..',
  '.XOOOOOOOOX.',
  'XOOOOOOOOOOX',
  'XOOXXOOXXOOX',
  'XOOXXOOXXOOX',
  'XOOOOOOOOOOX',
  'XOOOXOOXOOOX',
  '.XOOOXXOOOX.',
  '.XOXOXXOXOX.',
  '..XOXXXXOX..',
  '...XXXXXX...'
];
export const CUR_SCARAB = [
  '....XXXX....',
  '..XXOOOOXX..',
  '.XOOOXXOOOX.',
  'XXOOXOOXOOXX',
  'XOXOXOOXOXOX',
  'XOXOOXXOOXOX',
  'XXOXOOOOXOXX',
  '.XOOXOOXOOX.',
  '.XXOOXXOOXX.',
  '..XOXOOXOX..',
  '..XX.XX.XX..'
];
export const CURSORS_R = [
  { id: 'hollow', name: 'THE HOLLOW MASK', price: 0, reward: 'sw_hollow', blurb: 'Pale, round, and hollow in the right places. It was the Hollow One\'s, and it is still, and now it is yours to point with.', mask: CUR_HOLLOW, o: '#000000', f: '#FFFFFF', hx: 5, hy: 0 },
  { id: 'scarab', name: 'SCARAB', price: 0, reward: 'ae_five', blurb: 'Five ways across the sky with no failed run between. It carries the sun, and, if it must, a click.', mask: CUR_SCARAB, o: '#0000AA', f: '#55FFFF', hx: 5, hy: 0 }
];

export const SCHEMES_R = [
  { id: 'bone', name: 'BONE ORCHARD', price: 0, reward: 'sw_under9', blurb: 'Ivory on soot. Every room of the Underdeep, and the colour of what it was growing.',
    v: { bg: '#0e0c08', fg: '#F2EAD0', ok: '#BFD08A', hi: '#FFF6C8', err: '#E88A6A', dim: '#B4A98A', acc: '#D8C890' } },
  { id: 'verdigris', name: 'VERDIGRIS', price: 0, reward: 'gd_hands', blurb: 'Oxidised copper and wet leaves. The garden runs itself now, and it has gone green at the edges.',
    v: { bg: '#04100e', fg: '#CDEFE6', ok: '#5FE0B0', hi: '#F4F2C0', err: '#FF8F7A', dim: '#6FB3A2', acc: '#7FE8D0' } },
  { id: 'nightshift', name: 'NIGHT SHIFT', price: 0, reward: 'meta_secret10', blurb: 'Blue-white on blue-black: what the screen looks like to somebody who has found ten things they were not supposed to.',
    v: { bg: '#05060c', fg: '#D6DCF0', ok: '#8FD0FF', hi: '#FFFFFF', err: '#FF7A9C', dim: '#8A93B8', acc: '#B8C4FF' } }
];

/* for the elephant: drawn on the big one (apps/elephant/wear.js) and the small one (kernel/pet_art.js) */
export const ELEPHANT_R = [
  { id: 'halo', slot: 'head', name: 'THE HALO', price: 0, reward: 'el_wardrobe', blurb: 'It hovers a hand\'s width above his head. He has every other thing Dave sells; this is what is left when you have all of it.' },
  { id: 'medal', slot: 'neck', name: 'THE GOLD MEDAL', price: 0, reward: 'el_200', blurb: 'On a red ribbon. For hearing all two hundred things he has to say, and being very kind about the repeats.' }
];

export const DRINKS_R = [
  { id: 'goldwasser', name: 'GOLDWASSER', price: 0, reward: 'bt_flight9', abv: 40, strength: 0.9, glass: '#d8b84a', liquor: '#f0d060', label: '#8a1010',
    blurb: 'A cinnamon schnapps with flakes of real gold in it. You have drunk every other drink Dave sells; he kept this one back.' }
];
