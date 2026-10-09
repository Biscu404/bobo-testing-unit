#!/usr/bin/env node
/* The four on the credits screen and what they give (pure Node, no browser): the book (kernel/gifts_core.js), the drinks that are gifts (kernel/cos_gifts.js) and that the shelf
   and the shop treat them as gifts (kernel/cos.js).
   THE BOOK     the first visit holds out the first set, the fifth the second, a thing is given once, a window closed half way gives the rest, nothing is lost to a damaged store
   THE DATA     every giver gives one thing in each set; every drink that is a gift belongs to exactly one gift; nothing a gift needs is missing (art for the tray, a bottle, a label)
   THE SHELF    a gift is not on Dave's shelf, and cannot be bought, until it has been given */
import { createGifts, GIFTS, SETS, GIVERS, VISITS_FOR_SET2, KEY, giftOf } from '../kernel/gifts_core.js';
import { DRINKS_G } from '../kernel/cos_gifts.js';
import { DRINKS } from '../kernel/cos_data.js';
import { ROWS, ORDER } from '../apps/credits/tray.js';
import { GIFT_LABELS } from '../apps/bottle/labels_gifts.js';
import { SHAPES } from '../apps/bottle/shapes.js';

let fails = 0, checks = 0;
const ok = (c, label, detail) => { checks++; if (c) { console.log('OK   ' + label.padEnd(88) + (detail || '')); return true; } fails++; console.log('FAIL ' + label + '   ' + (detail || '')); return false; };
const mem = () => { const m = {}; return { m, io: { get: () => m[KEY] == null ? null : m[KEY], set: v => { m[KEY] = v; } } }; };

console.log('-- the book --');
{
  const { io, m } = mem(), told = [], g = createGifts(io, { onGive: x => told.push(x.id) });
  ok(g.visits === 0 && g.given().length === 0, 'nothing has been given and nobody has looked');
  const v1 = g.visit();
  ok(v1.n === 1 && v1.set === 1 && v1.items.length === 4 && v1.items.map(i => i.id).join() === 'cookie,borsec,goose,blueprint', 'the first look holds out the first set: a cookie, a bottle of water, a goose, a blueprint');
  ok(g.give('cookie') && !g.give('cookie') && g.has('cookie') && told.join() === 'cookie', 'a thing is given once, and told once');
  ok(!g.give('nonsense') && told.length === 1, 'a thing that does not exist is not given');
  ok(JSON.stringify(g.finish(1)) === JSON.stringify(['borsec', 'goose', 'blueprint']) && g.given().length === 4, 'a window closed half way gives the rest at once, in order');
  ok(g.visit().set === 0 && g.visit().set === 0, 'the second and third looks hold out nothing');
  const v4 = g.visit(); ok(v4.n === 4 && v4.set === 0, 'nor the fourth');
  const v5 = g.visit(); ok(v5.n === 5 && v5.set === 2 && v5.items.map(i => i.id).join() === 'chips,biscubeer,morgan,potion', 'the fifth holds out the second set: four drinks, one from each of them', v5.items.map(i => i.from).join());
  g.finish(2);
  ok(g.visit().set === 0 && g.given().length === 8, 'and that is everything: nothing more, ever');
  const again = createGifts(io, {});
  ok(again.visits === g.visits && again.given().length === 8 && again.has('potion'), 'it is all there the next time the machine is switched on');
  m[KEY] = '{{{'; const bad = createGifts(io, {});
  ok(bad.visits === 0 && bad.given().length === 0 && bad.visit().set === 1, 'a damaged store is a new one: the first look again');
  m[KEY] = JSON.stringify({ visits: -3, given: { cookie: true, nothing: true } }); const odd = createGifts(io, {});
  ok(odd.visits === 0 && odd.given().length === 1 && odd.visit().items.length === 3, 'a store with nonsense in it keeps what makes sense; the rest is held out again, only what is left');
  const late = mem(); late.m[KEY] = JSON.stringify({ visits: 9, given: { cookie: true, borsec: true, goose: true, blueprint: true } }); const l = createGifts(late.io, {});
  ok(l.visit().set === 2, 'somebody who had given up before the fifth look and comes back after it is held the second set at once');
  const hooked = createGifts(mem().io, { onGive: () => { throw new Error('a gift must not break the next'); } }); hooked.visit();
  ok(hooked.give('cookie') && hooked.give('goose') && hooked.has('goose'), 'a gift whose hook breaks is still given, and does not stop the next one');
  const dead = createGifts({ get: () => { throw new Error('no storage'); }, set: () => { throw new Error('no storage'); } }, {});
  ok(dead.visit().set === 1 && dead.give('cookie'), 'with no storage at all it still works, for this sitting');
}

console.log('\n-- the data --');
{
  ok(GIFTS.length === 8 && new Set(GIFTS.map(g => g.id)).size === 8 && SETS[1].length === 4 && SETS[2].length === 4 && VISITS_FOR_SET2 === 5, 'eight things, four in each set, the second on the fifth look');
  ok([1, 2].every(s => GIVERS.every(who => SETS[s].filter(g => g.from === who).length === 1)), 'in each set every one of the four gives exactly one thing');
  ok(GIFTS.every(g => g.name === g.name.toUpperCase() && g.name.length <= 24 && g.line.length <= 56 && /\.$/.test(g.line) && g.where), 'each has a name in capitals, a line of what is said that fits the plate, and where it works');
  ok(ORDER.length === 8 && ORDER.every(id => giftOf(id)) && new Set(ORDER).size === 8 && ORDER.slice(0, 4).join() === SETS[1].map(g => g.id).join(), 'the tray has a cell for each, the first four being the first set');
  ok(ORDER.every(id => ROWS[id] && ROWS[id].length === 16 && ROWS[id].every(r => r.length === 16 && /^[0-9A-F.]+$/.test(r))), 'and a picture of each: sixteen by sixteen, in the sixteen colours');
  const drinkGifts = GIFTS.filter(g => g.drink);
  ok(drinkGifts.length === 5 && drinkGifts.every(g => DRINKS_G.some(d => d.id === g.drink && d.gift === g.from)), 'five of them are drinks, and each drink knows who gave it', drinkGifts.map(g => g.drink).join());
  ok(DRINKS_G.length === 5 && DRINKS_G.every(d => drinkGifts.some(g => g.drink === d.id)) && DRINKS_G.every(d => DRINKS.includes(d)), 'and every drink that is a gift is one, and is in Dave\'s list');
  ok(DRINKS_G.every(d => d.price === 0 && d.gift && /\.$/.test(d.blurb) && SHAPES[d.shape] && d.glass && d.liquor && d.label), 'a gift costs nothing, has a blurb, a bottle that exists and three colours');
  ok(DRINKS_G.every(d => GIFT_LABELS[d.id]), 'and its own label');
  const potion = DRINKS_G.find(d => d.id === 'potion'), others = DRINKS_G.filter(d => d.id !== 'potion');
  ok(potion.potion && potion.abv > 0 && others.every(d => !d.potion), 'only the potion is a different strength every sip');
  ok(DRINKS_G.filter(d => d.abv === 0).map(d => d.id).join() === 'borsec,chips', 'the water and the liquid chips have nothing in them; the beer, the rum and the potion have');
  ok(DRINKS.filter(d => !d.gift && !d.reward).length === 9, 'the nine drinks Dave sells are the nine he sold (a gift is not one of them)');
}

console.log('\n-- the shelf --');
{
  /* cos.js needs a window: a stand-in that has what it asks for */
  globalThis.window = globalThis; globalThis.addEventListener = () => {}; globalThis.dispatchEvent = () => true;
  const store = {}; globalThis.localStorage = { getItem: k => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } };
  globalThis.document = { getElementById: () => null, createElement: () => ({ style: {}, appendChild() {}, getContext: () => null, classList: { add() {}, remove() {}, toggle() {} } }), body: { appendChild() {} }, addEventListener() {} };
  globalThis.Economy = { spend: () => true, balance: () => 99999 };
  let cosMod = null;
  try { cosMod = await import('../kernel/cos.js'); } catch (e) { /* the shelf needs a whole machine: the data checks above stand */ }
  if (cosMod && cosMod.Cos && cosMod.Cos.st) {
    const C = cosMod.Cos;
    ok(C.shelf('drink').every(d => !d.gift) && C.shelf('drink').length === 10, 'before anything is given, Dave\'s DRINKS shelf has ten bottles and none of them a gift', C.shelf('drink').map(d => d.id).join());
    ok(C.buy('drink', 'borsec') === false && C.buy('drink', 'potion') === false, 'and a gift cannot be bought at any price');
    ok(C.grant('drink', 'borsec') === true && C.shelf('drink').some(d => d.id === 'borsec') && C.has('drink', 'borsec'), 'given, it is on the shelf and yours');
    ok(!C.shelf('drink').some(d => d.id === 'chips'), 'and the others of its kind are still not there');
  } else console.log('--   (the shelf is checked in the machine: npm run check:shell)');
}
console.log(fails ? '\n' + fails + ' FAILED of ' + checks : '\nthe gifts: all ' + checks + ' ok');
process.exit(fails ? 1 : 0);
