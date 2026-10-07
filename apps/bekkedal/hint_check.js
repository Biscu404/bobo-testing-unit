/* Bekkedal hint check — `node apps/bekkedal/hint_check.js`
 *
 * `hint.js` says what SPACE would do at the square in front of you. This walks every case it answers: each thing act() does has a line,
 * the lines are the right ones (a person is named, a gift names what is given, a locked door says so), nothing that does nothing is
 * given a line, and every line exists in both languages and is spoken in capitals like the rest of the HUD. */
import { hintFor, holdingLine, GIFT_HELP } from './hint.js';

let fails = 0, checks = 0;
const ok = (c, label, detail) => { checks++; if (c) console.log('OK   ' + label); else { fails++; console.log('FAIL ' + label + '   ' + (detail || '')); } };
const say = c => { const h = hintFor(c); return h ? h.en : null; };
const base = { tile: '.', map: 'farm', tool: 'spade', who: null, giftSel: false, giftName: { no: 'EPLE', en: 'APPLE' }, animal: false, placed: false, ready: false, soil: null, hasSeed: false, canGive: false, door: true };
const at = o => Object.assign({}, base, o);

ok(hintFor(null) === null && hintFor(undefined) === null, 'no square, no line');
ok(say(at({})) === null, 'bare ground with a spade says nothing');

const who = { id: 'astrid', n: 'ASTRID', bear: false, gift: true };
ok(/TALK TO ASTRID/.test(say(at({ who }))), 'a person is talked to, by name', say(at({ who })));
ok(/HOLD OUT A GIFT/.test(say(at({ who, canGive: true }))), 'and with something to give, it says how to hold it out');
ok(!/HOLD OUT/.test(say(at({ who }))), 'but not when there is nothing in the bag to give');
ok(/GIVE APPLE TO ASTRID/.test(say(at({ who, giftSel: true }))), 'a gift held out is given, and says what', say(at({ who, giftSel: true })));
ok(/BEAR/.test(say(at({ who: { n: 'BJØRN', bear: true } }))), 'the bear is greeted');
ok(/ANIMAL/.test(say(at({ animal: true }))), 'an animal is tended');

ok(/SLEEP/.test(say(at({ tile: 'b' }))), 'a bed sleeps');
ok(/SIT/.test(say(at({ tile: 'J' }))), 'a bench sits');
ok(/GO IN/.test(say(at({ tile: 'D', door: true }))) && /LOCKED/.test(say(at({ tile: 'D', door: false }))), 'a door opens, or says it is locked');
ok(/LOT/.test(say(at({ tile: 'S', map: 'lake' }))) && /NOTICE/.test(say(at({ tile: 'S', map: 'town' }))), 'a sign is the lot by the water and the board in town');
ok(/LOFT/.test(say(at({ tile: 'K', map: 'loftet' }))) && /WORKSHOP/.test(say(at({ tile: 'K', map: 'farm' }))), 'a chest is the loft or the workshop');
ok(/RAKE/.test(say(at({ tile: 'v' }))), 'ash is raked');
ok(/PICK IT UP/.test(say(at({ placed: true }))), 'a placed thing is picked up');
ok(/FILL THE CAN/.test(say(at({ tile: 'o' }))) && /FILL THE CAN/.test(say(at({ tile: '~', tool: 'kanne' }))), 'water fills the can');
ok(/CAST/.test(say(at({ tile: 'W', tool: 'stang' }))) && say(at({ tile: 'D', tool: 'stang' })) !== null, 'water with a rod casts the line');
ok(/PICK THE FLOWER/.test(say(at({ tile: 'p', ready: true }))) && say(at({ tile: 'p', ready: false })) === null, 'a flower is picked only when it is ready');
ok(/FELL/.test(say(at({ tile: 'Y', tool: 'oks' }))) && /FELL/.test(say(at({ tile: 'G', tool: 'oks' }))) && say(at({ tile: 'Y', tool: 'spade' })) === null, 'trees are felled with the axe and only with the axe');
ok(/MINE/.test(say(at({ tile: 'O', tool: 'hakke' }))) && /MINE/.test(say(at({ tile: 'Q', tool: 'hakke' }))) && say(at({ tile: 'O', tool: 'spade' })) === null, 'ore is mined with the pick and only with the pick');
ok(/DIG/.test(say(at({ tile: 'f', soil: null }))), 'bare soil is dug with the spade');
ok(say(at({ tile: 'f', soil: { till: true, seed: false, ready: false, wet: false } })) === null, 'soil already dug with the spade says nothing');
ok(/WATER/.test(say(at({ tile: 'f', tool: 'kanne', soil: { till: true, seed: true, ready: false, wet: false } }))) && say(at({ tile: 'f', tool: 'kanne', soil: { till: true, seed: true, ready: false, wet: true } })) === null, 'dry soil is watered, wet soil is left');
ok(/DIG IT FIRST/.test(say(at({ tile: 'f', tool: 'kanne', soil: null }))), 'a can on soil nobody has dug says to dig it first');
ok(/HARVEST/.test(say(at({ tile: 'f', soil: { till: true, seed: true, ready: true, wet: true } }))), 'a ripe plot is harvested');
ok(/SOW/.test(say(at({ tile: 'f', tool: 'oks', soil: { till: true, seed: false, ready: false, wet: false }, hasSeed: true }))), 'a dug plot and a seed in the bag: sow it');

/* everything it can say, in both languages, in capitals */
const samples = [
  at({ who }), at({ who, canGive: true }), at({ who, giftSel: true }), at({ who: { n: 'B', bear: true } }), at({ animal: true }), at({ tile: 'b' }), at({ tile: 'J' }),
  at({ tile: 'D' }), at({ tile: 'D', door: false }), at({ tile: 'S', map: 'lake' }), at({ tile: 'S' }), at({ tile: 'K' }), at({ tile: 'K', map: 'loftet' }), at({ tile: 'v' }),
  at({ placed: true }), at({ tile: 'o' }), at({ tile: 'W', tool: 'stang' }), at({ tile: 'p', ready: true }), at({ tile: 'Y', tool: 'oks' }), at({ tile: 'O', tool: 'hakke' }), at({ tile: 'f' })
];
ok(samples.every(c => { const h = hintFor(c); return h && h.no && h.en && h.no === h.no.toUpperCase() && h.en === h.en.toUpperCase(); }), 'every line has both languages and is in capitals');
const hold = holdingLine({ no: 'EPLE', en: 'APPLE' });
ok(/APPLE/.test(hold.en) && /EPLE/.test(hold.no), 'the line kept up while a gift is held out names the gift');
ok(['open', 'place', 'holding'].every(k => GIFT_HELP[k] && GIFT_HELP[k].no && GIFT_HELP[k].en), 'the bag has its three footers');

console.log(fails ? '\n' + fails + ' of ' + checks + ' failed' : '\nAll ' + checks + ' hint checks pass.');
process.exit(fails ? 1 : 0);
