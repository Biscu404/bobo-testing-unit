/* THE DRINKS THE FOUR GIVE YOU. Not for sale and not on Dave's shelf until a hand has put one in yours (kernel/gifts.js): Gheghe's bottle of water the first time CREDITS.EXE is opened,
   and the other four, one from each of them, the fifth time. Same shape as every other drink (kernel/cos_data.js DRINKS); `gift` says who. How each looks, bottle and label,
   is apps/bottle (drinks.js, labels_gifts.js). `potion` is a drink that is a different strength every sip. */
export const DRINKS_G = [
  { id: 'borsec', name: 'APA PLATA BORSEC', price: 0, gift: 'gheghe', abv: 0, strength: 0, shape: 'pet', cap: '#1f5fc8', glass: '#cfe9f2', liquor: '#e6f4f8', label: '#f4f8fc',
    blurb: 'Still mineral water from Borsec, in a plastic bottle that crackles when you hold it. From Gheghe. Nothing in it but the mountains.' },
  { id: 'chips', name: 'LIQUID CHIPS', price: 0, gift: 'thea', abv: 0, strength: 0, shape: 'squat', capKind: 'screw', cap: '#d8321a', glass: '#e8d250', liquor: '#f0b820', label: '#d8321a',
    blurb: 'Salt and vinegar, but you can pour it. From Thea. Nobody has asked why.' },
  { id: 'biscubeer', name: 'BISCU\'S BEER', price: 0, gift: 'biscu', abv: 5, strength: 0.15, shape: 'beer', cap: '#e0b020', glass: '#6a3c10', liquor: '#e0a020', label: '#f2e8c8',
    blurb: 'A lager with a man in a suit on the label. He has not got his trousers on. What he has got on is red and has hearts on it.' },
  { id: 'morgan', name: 'CAPTAIN MORGAN', price: 0, gift: 'gheghe', abv: 35, strength: 1, shape: 'cm', cap: '#d8a828', glass: '#4a2610', liquor: '#b86820', label: '#a81c1c',
    blurb: 'Spiced gold rum, from Gheghe. The captain has his foot on a barrel and is very pleased about it.' },
  { id: 'potion', name: 'THE HOMEMADE POTION', price: 0, gift: 'teiteotei', abv: 50, strength: 1.4, potion: true, shape: 'flask', glass: '#9ed8a0', liquor: '#5ae048', label: '#e8dcb8',
    blurb: 'The creator made it at home. Somewhere between one and ninety-nine per cent, and a different one every sip. He does not know either.' }
];

/* THE SEED BISCU GIVES. A flower whose head is a cookie, and as near the late game's power as a gift should be: more than Suncrown, a little under Thirdroot, and slow. It is a seed you own
   from the first look at the credits, but it only comes up in the tray once the garden has `needKinds` other kinds of plant (apps/garden), so it cannot be a short cut past the early game. */
export const SPECIES_G = [
  { id: 'cookiebloom', name: 'COOKIEBLOOM', price: 0, gift: 'biscu', needKinds: 7, yield: 78, grow: 520, drop: 195, note: 4, hue: ['#c8863a', '#7a4a1a', '#f0c070'],
    home: 'greenhouse', kin: 'glaze', mate: 'bellvine',
    blurb: 'Biscu\'s. The head is a cookie with a bite out of it and the petals are cream. Likes the warm room and a glazed pot and a bellvine ringing next door. Comes up once you have seven kinds.' }
];
