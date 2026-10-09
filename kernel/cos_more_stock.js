/* DAVE'S SECOND SHELF OF BOTTLES AND OF THINGS FOR THE ELEPHANT TO WEAR. None is for sale: each is given by one trophy (`reward`), and `secret` ones are `???` until it is earned.
   A drink is the same record as any other (kernel/cos_data.js DRINKS: `strength` is its per cent over thirty-five, so Jägermeister is one) and may say `shape` and `cap`
   (apps/bottle/shapes.js) and `print`, the two lines under its name on the label. What the elephant wears is drawn twice, big (apps/elephant/wear_more.js) and small
   (kernel/pet_art_more.js), under the id that is here. */
const D = (id, name, reward, abv, shape, glass, liquor, label, print, blurb, cap, secret) => {
  const o = { id, name, price: 0, reward, abv, strength: Math.round(abv / 35 * 100) / 100, shape, glass, liquor, label, print, blurb, more: true };
  if (cap) o.cap = cap;
  if (secret) o.secret = true;
  return o;
};

export const DRINKS_M = [
  D('holywater', 'HOLY WATER', 'sys_holyc2', 0, 'tall', '#cfe3ff', '#e8f4ff', '#ffffff', ['SPRING WATER', '0% vol · blessed in HolyC'], 'Nothing in it, and a function of your own to say so. You wrote the blessing; it came out clear.', '#f4f4ea'),
  D('knobtonic', 'KNOB TONIC', 'sys_knobs', 0, 'round', '#d8d8dc', '#e8f0e8', '#202020', ['DEGAUSS TONIC', '0% vol · turn to taste'], 'Quinine, lime and a bubble that goes up when you touch it. Every knob on the chin was turned; this is what it tastes like.', '#555555'),
  D('sunwater', 'SUN WATER', 'sys_earned2', 0, 'squat', '#e8c850', '#ffe070', '#8a4a00', ['LIQUID SUN', '0% vol · ten thousand of them'], 'Fizzy gold, cold from the glass. It tastes like the number on the counter looks: warm, and slightly too much.', '#8a4a00'),
  D('soulwater', 'LIQUID SOUL', 'sw_learn1', 0, 'flask', '#a8c8f0', '#d0e8ff', '#0a1a3a', ['VESSEL WATER', '0% vol · do not spill'], 'Pale blue and faintly lit from inside. Focus, and it fills a little. Do not ask what it was made from.', '#7aa0d8'),
  D('ichor', 'ORANGE ICHOR', 'sw_hive3', 12, 'round', '#6a3a10', '#ff9a28', '#2a1400', ['HIVE SYRUP', '12% vol · sticky'], 'Thick, orange, and glowing a bit, from something that was in the walls. Three hives, and a taste you are not supposed to want.', '#ff9a28'),
  D('karkade', 'KARKADE', 'ae_half', 0, 'tall', '#8a1818', '#d82838', '#f4e8c8', ['HIBISCUS TEA', '0% vol · served cold'], 'Red as the sunset on the far side of the river, sour as the walk. You were halfway; here is a glass for the other half.', '#2a0808'),
  D('zibib', 'ZIBIB', 'ae_roll', 40, 'squat', '#d8e8f0', '#f0f4f8', '#1a3a6a', ['ARAK', '40% vol · turns white with water'], 'Aniseed spirit, clear until you add water and then cloudy. A rolling pilgrim drinks it plain, and rolls farther.', '#1a3a6a'),
  D('rootnectar', 'ROOT NECTAR', 'gd_tune', 0, 'flask', '#a0d870', '#e0ff90', '#3a5a10', ['NECTAR', '0% vol · from the roots'], 'The garden sang a tune from underneath, and this is the sweetness the tune left in the soil. Drink it before it stops.', '#6a9a30'),
  D('herbbitter', 'HERBAL BITTERS', 'gd_herb5', 28, 'cm', '#3a2a10', '#7a5a20', '#d8c890', ['BITTERS', '28% vol · five herbs'], 'Five herbs steeped in grain spirit, the way the herbalist does it. It is better for you than it tastes.', '#8a6a20'),
  D('bluesky', 'BLUE SKY', 'ck_two', 0, 'pet', '#78c8ff', '#b0e4ff', '#ffffff', ['BLUE RASPBERRY', '0% vol · ninety-nine point one'], 'Bright blue soda, extremely pure. There are two ways to lose and this is the third, which is a hangover with no cause.', '#2a8ae0'),
  D('kiddush', 'KIDDUSH WINE', 'mg_echo', 11, 'squat', '#4a0e1a', '#9a1a34', '#f4ecd0', ['SWEET RED WINE', '11% vol · for the blessing'], 'Sweet red wine for the Friday blessing, and for the little silver cup. Your first echo, and the wine rang.', '#c8a020'),
  D('julebrus', 'JULEBRUS', 'bk_fairs', 0, 'beer', '#a82818', '#e04828', '#f4e8c8', ['CHRISTMAS SODA', '0% vol · all four fairs'], 'The red fizz that comes out in December and stays out too long. You went to all four fairs, and this is the fair price.', '#e0b020'),
  D('solbaer', 'SOLBÆR', 'bk_gifts8', 18, 'jag', '#3a0a2a', '#7a1a4a', '#f0d8e8', ['BLACKCURRANT LIQUEUR', '18% vol · for eight friends'], 'Dark, sweet and the colour of a bruise on a good plum. A present for everyone, and a glass left over for the giver.', '#7a1a4a'),
  D('peanutlik', 'PEANUT LIQUEUR', 'el_25', 17, 'squat', '#c89a58', '#e8c080', '#6a3a10', ['PEANUT CREAM', '17% vol · do not tell him'], 'Creamy, nutty and a bit shameful. You listened to twenty-five of his stories, and he would like to say thank you with a glass.', '#6a3a10'),
  D('partywine', 'BIRTHDAY SPARKLING', 'sys_birthday', 11, 'tall', '#e8d870', '#fff0a0', '#ff77c8', ['SPARKLING', '11% vol · once a year'], 'Gold, with a pop. You opened the machine on the day, and nobody told you they had put this on the shelf.', '#c8a020', true),
  D('stoptime', 'TIME STOP', 'sb_za', 40, 'cm', '#2f7a18', '#d8f040', '#fff6a0', ['GREEN HOUR', '40% vol · nine seconds'], 'Acid-green, and it takes nine seconds to go down. During which time, nobody moves, not even the one drinking it.', '#e8d820', true)
];

const E = (id, slot, name, reward, blurb) => ({ id, slot, name, price: 0, reward, blurb, more: true });
export const ELEPHANT_M = [
  E('horns', 'head', 'THE HOLLOW HORNS', 'sw_learn2', 'Pale and curved. He sees through the room and the room does not see him. It suits him.'),
  E('nemes', 'head', 'THE NEMES', 'ae_f_scribe', 'Blue and gold stripes, falling either side of the ears. Clean hands made it, and clean hands put it on him.'),
  E('toque', 'head', 'CHEF\'S TOQUE', 'ck_idle', 'Tall, white, and pleated like a thing for a patient man. He has never once hurried a batch.'),
  E('viking', 'head', 'THE HORNED HELM', 'bk_furrow', 'Grey iron and two horns, worn by someone who only wanted to plough. It fits better than it should.'),
  E('straw', 'head', 'THE STRAW HAT', 'gd_sun2', 'A wide brim and a red ribbon, from a man who kept an orchard. He can reach the high branches.'),
  E('headband', 'head', 'THE HEADBAND', 'sb_dodge', 'White, with a red sun in the middle, tied tight. Sidestep and he does not even move his ears.'),
  E('tubehat', 'head', 'THE TUBE', 'sys_roll', 'A small grey television, switched on, on his head. The picture rolls. He has stopped noticing.'),
  E('visor', 'face', 'THE GREEN VISOR', 'hc_trace', 'A strip of terminal green across the eyes. He can watch it run, line by line, and he keeps up.'),
  E('anaglyph', 'face', 'RED AND CYAN', 'sys_video', 'Cardboard 3D glasses, red one side and cyan the other. Fifteen frames a second, and every one pops out.'),
  E('ankhchain', 'neck', 'THE ANKH PENDANT', 'ae_ankh2', 'On a gold chain. A spare and a spare, and one more round his neck for good measure.'),
  E('arrowchain', 'neck', 'THE ARROW', 'sb_final', 'A golden arrow head on a cord. It is meant to give somebody power. He keeps it for the final round only.'),
  E('lusekofte', 'body', 'THE LUSEKOFTE', 'bk_scene', 'Red and white, knitted into snowflakes. A scene of your own, and the sweater to watch it in.'),
  E('yellowsuit', 'body', 'THE YELLOW SUIT', 'ck_knock', 'Bright, plastic, and a little too large. He has never been seen without it near a knock.'),
  E('robe', 'body', 'THE TEMPLE ROBE', 'sys_eden', 'Plain brown and tied with rope. It was enough. It has always been enough.')
];
