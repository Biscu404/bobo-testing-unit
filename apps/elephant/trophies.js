/* THE ELEPHANT's trophies (docs/achievements/toys.md). The rule for the toys is stricter than for the games: a trophy here only celebrates something the person chose to do, never makes them
   do it. The one count is the bag of sayings, and it is allowed because the bag is the app: it hands them out without repeating, so the number is how many *different* things he has said.
   Events: talk, wear { any, gent, five, owned }, out, put-back, sleep, woken, picked-up, door. Sets: heard (sayings), places. */
import { t, secret, rule } from '../trophy_kit.js';
import { ELE_QUOTES, ELE_PLACES } from './quotes.js';
const on = rule.on;

export const GENT = ['tophat', 'monocle', 'bowtie'];
export const SLOTS = ['head', 'face', 'neck', 'body', 'feet'];

export const TROPHIES = [
  t('el_hello', 'HEY THERE FRIEND', 'B', 'P', 'Press the button once and let him talk.', on('talk')),
  t('el_25', 'A GOOD LISTENER', 'B', 'P', 'Hear 25 different things he has to say.', rule.sets('heard', 25)),
  t('el_100', 'AN OLD FRIEND', 'S', 'P', 'Hear 100 different things.', rule.sets('heard', 100)),
  t('el_200', 'TWO HUNDRED THINGS', 'G', 'P', 'Hear every one of the ' + ELE_QUOTES.length + ' things he has to say.', rule.sets('heard', ELE_QUOTES.length)),
  t('el_places', 'FIVE PLACES', 'B', 'E', 'See all ' + ELE_PLACES.length + ' places he lives in.', rule.sets('places', ELE_PLACES.length)),
  t('el_dressed', 'DRESSED FOR IT', 'B', 'P', 'Put something on him.', on('wear', p => p.any)),
  t('el_gent', 'THE GENTLEMAN', 'B', 'C', 'Top hat, monocle and bow tie, all at once.', on('wear', p => p.gent)),
  t('el_five', 'FROM HAT TO BOOTS', 'S', 'C', 'Have him wear something in every one of the five slots at once.', on('wear', p => p.five)),
  t('el_wardrobe', 'THE WHOLE WARDROBE', 'G', 'P', 'Own everything Dave sells for him to wear.', on('wear', p => p.owned)),
  t('el_out', 'GO OUTSIDE', 'B', 'P', 'Let him out of his window onto the desktop.', on('out')),
  t('el_helping', 'HE WAS ONLY HELPING', 'B', 'E', 'Let him push one of your icons, then put it back from his menu.', on('put-back')),
  t('el_goodnight', 'SLEEP WELL, BIG GUY', 'B', 'E', 'Let him say goodbye and lie down to sleep.', on('sleep')),
  secret('el_sorry', 'SORRY!', 'B', 'E', 'He sleeps lightly.', 'Wake him by walking the pointer up to him.', on('woken')),
  t('el_pickup', 'PUT ME DOWN, KIDDO', 'B', 'C', 'Pick him up and drop him somewhere else on the desktop.', on('picked-up')),
  t('el_door', 'HE KNOWS THE DOOR', 'S', 'E', 'Call him in with no window open, and watch him open his own and walk in.', on('door'))
];

/* what his saves already prove: that he was let out, what he wears */
export function backfill(read) {
  const p = read('templeos.pet.v1'), ids = [];
  if (!p) return ids;
  const w = p.wear || {}, worn = SLOTS.filter(s => w[s]);
  if (p.out) ids.push('el_out');
  if (worn.length) ids.push('el_dressed');
  if (worn.length === SLOTS.length) ids.push('el_five');
  if (GENT.every(id => Object.keys(w).some(s => w[s] === id))) ids.push('el_gent');
  return ids;
}
