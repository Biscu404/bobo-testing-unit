/* Bekkedal — what somebody says as you go by.
 *
 * Not a conversation: a word over the shoulder, in a bubble, the first time on a day you come within a few steps of them while they are
 * about their business. Homey, short, and what a neighbour says: good morning, evening, mind the puddle. Everybody has the common
 * stock (by the time of day) and each of the eight has a few of their own. Pure: a hash of the day and the person, never a random number,
 * so a reload says the same thing. `hellos_check.js` holds it (both languages, capitals, short enough for a bubble).
 */
import { hash } from './life.js';

const P = (no, en) => ({ no: no, en: en });

export const HELLO_MORNING = [
  P('GOD MORGEN!', 'GOOD MORNING!'), P('MORN!', 'MORNING!'), P('TIDLIG UTE, DU.', 'UP EARLY, ARE YOU.'),
  P('SOLEN ER OPPE.', 'THE SUN IS UP.'), P('HEI, NABO!', 'HELLO, NEIGHBOUR!')
];
export const HELLO_DAY = [
  P('HEI DER!', 'HELLO THERE!'), P('GOD DAG!', 'GOOD DAY!'), P('HEI, NABO!', 'HELLO, NEIGHBOUR!'),
  P('GÅR DET BRA?', 'KEEPING WELL?'), P('NÅ ER DU UTE.', 'OUT AND ABOUT, I SEE.'), P('FINT VÆR, ELLER?', 'NICE WEATHER, OR?')
];
export const HELLO_EVENING = [
  P('GOD KVELD!', 'GOOD EVENING!'), P('SENT, DET.', 'GETTING LATE.'), P('HA EN FIN KVELD.', 'HAVE A GOOD EVENING.'),
  P('SNART LEGGETID.', 'NEARLY BEDTIME.'), P('HEI, NABO!', 'HELLO, NEIGHBOUR!')
];
export const HELLO_RAIN = [P('VÅTT, HVA?', 'WET ONE, ISN\'T IT?'), P('PASS PÅ PYTTENE!', 'MIND THE PUDDLES!')];

/* a few each of their own, said any hour but the dead of night */
export const HELLO_OWN = {
  astrid: [P('KAFFEN ER PÅ!', 'THE COFFEE IS ON!'), P('KOM INN ETTERPÅ!', 'COME IN LATER!')],
  hakon:  [P('MORN, NABO.', 'MORNING, NEIGHBOUR.'), P('DET HOLDER.', 'IT WILL HOLD.')],
  ingrid: [P('FISKEVÆR!', 'GOOD FISHING WEATHER!'), P('HEI PÅ DEG!', 'HELLO TO YOU!')],
  olav:   [P('HEI, VENN.', 'HELLO, FRIEND.'), P('VANNET ER ROLIG.', 'THE WATER IS CALM.')],
  marit:  [P('SE PÅ BLOMSTENE!', 'LOOK AT THE FLOWERS!'), P('HEI, DU SNILLE!', 'HELLO, DEAR!')],
  sigrid: [P('HEI OPPE FRA!', 'HELLO FROM UP HERE!'), P('GEITENE SENDER HILSEN.', 'THE GOATS SEND THEIR REGARDS.')],
  gunnar: [P('STILLE I DAG.', 'QUIET TODAY.'), P('HEI, GJEST.', 'HELLO, VISITOR.')],
  lars:   [P('HEI, STØVETE!', 'HELLO, DUSTY!'), P('LYKT MED, ELLER?', 'GOT YOUR LANTERN?')]
};

export function helloFor(id, day, min, weather) {
  const h = hash(id, 'hello', day);
  const m = ((Math.floor(min) % 1440) + 1440) % 1440;
  const pool = m < 11 * 60 ? HELLO_MORNING : m < 18 * 60 ? HELLO_DAY : HELLO_EVENING;
  const own = HELLO_OWN[id];
  const k = h % 5;
  if (weather === 'regn' && (h >>> 9) % 3 === 0) return HELLO_RAIN[(h >>> 4) % HELLO_RAIN.length];
  if (own && k < 2) return own[(h >>> 4) % own.length];
  return pool[(h >>> 4) % pool.length];
}
