/* Bekkedal — what somebody says before they say anything else.
 *
 * Pure, the way schedule.js and scene.js are: a function of the save and the clock that hands back
 * lines and changes nothing. index.js's talkTo() calls it, then stamps S.lastTalk itself.
 *
 *   - the first time you speak to somebody on a given day they say hello, most of the time, in the
 *     voice of the hour (and in a warmer one if they like you);
 *   - the second and later times that day they say hello *again*, most of the time;
 *   - if it has been four days or more since you last spoke to them, they say so, and the longer it has
 *     been the more they say. Always: that one is never skipped.
 *
 * "Most of the time" is a hash of the day, the speaker and how often you have spoken, never a random
 * number: the same day says the same thing on a reload, and the check can run it over a whole year.
 * The words are in talk_greet_a.js and talk_greet_b.js.
 */
import { GREET_A } from './talk_greet_a.js';
import { GREET_B } from './talk_greet_b.js';

export const BEK_GREET = Object.assign({}, GREET_A, GREET_B);

/* how many days apart before it is remarked on, and how loudly */
export const AWAY_AT = { few: 4, many: 9, long: 16 };
/* how often the ordinary greetings are said (out of 100) */
export const GREET_FIRST_PCT = 90, GREET_AGAIN_PCT = 75, GREET_CLOSE_PCT = 50, GREET_CLOSE_FR = 6;

const hash = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; };
/* the hour as the greetings divide it: morning, day, evening, night */
export const dayPart = min => (min >= 6 * 60 && min < 10 * 60) ? 'morning' : (min >= 10 * 60 && min < 17 * 60) ? 'day'
                            : (min >= 17 * 60 && min < 21 * 60) ? 'evening' : 'night';

const fill = (line, n) => {
  if (typeof line === 'string') return line.replace(/\{n\}/g, n);
  const out = Object.assign({}, line);
  if (out.no) out.no = out.no.replace(/\{n\}/g, n);
  if (out.en) out.en = out.en.replace(/\{n\}/g, n);
  return out;
};
const expand = (entry, n) => (Array.isArray(entry) ? entry : [entry]).map(l => fill(l, n));

/* Which kind of hello is owed, without choosing its words: 'first' | 'close' | 'again' | 'few' | 'many' | 'long' | null */
export function greetingKind(npcId, S) {
  const g = BEK_GREET[npcId];
  const last = S.lastTalk ? S.lastTalk[npcId] : undefined;
  if (!g || last == null) return null;               /* never spoken: their first words are their own (BEK_TALK's first node) */
  const n = (S.chatIx && S.chatIx[npcId]) || 0, roll = salt => hash(npcId + ':' + S.day + ':' + n + ':' + salt) % 100;
  const days = S.day - last;
  if (days <= 0) return roll('again') < GREET_AGAIN_PCT ? 'again' : null;
  if (days >= AWAY_AT.long) return 'long';
  if (days >= AWAY_AT.many) return 'many';
  if (days >= AWAY_AT.few) return 'few';
  if (roll('first') >= GREET_FIRST_PCT) return null;
  return ((S.fr && S.fr[npcId]) || 0) >= GREET_CLOSE_FR && roll('close') < GREET_CLOSE_PCT ? 'close' : 'first';
}

/* the lines to say first, or [] */
export function greeting(npcId, S) {
  const kind = greetingKind(npcId, S), g = BEK_GREET[npcId];
  if (!kind) return [];
  const n = (S.chatIx && S.chatIx[npcId]) || 0, days = S.day - (S.lastTalk[npcId] || 0);
  const pool = kind === 'first' ? g.first[dayPart(S.min)] : kind === 'close' ? g.close : kind === 'again' ? g.again : g.away[kind];
  return expand(pool[hash(npcId + ':' + S.day + ':' + n + ':' + kind) % pool.length], days);
}
