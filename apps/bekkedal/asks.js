/* Bekkedal — what you say, and what they remember.
 *
 * An ordinary conversation used to be one line from the pool and a goodbye. Now, after that line, you get to say something: a short list of
 * things to bring up (a *topic*), and picking one is an exchange — they answer, you choose how to take it, they answer that — and what you
 * chose is written down (`S.mem['<person>.<topic>']`) and never forgotten. It comes back: a topic that was a follow-up to a choice is only
 * offered to someone who made it; a person's chat pool has lines that are only said to someone who answered a certain way; and one
 * neighbour knows what you told another (`mem()` reads anybody's), which is how Astrid has an opinion about what you said to Håkon.
 *
 * Shape of a topic (content: `ask_<id>.js`, joined into `BEK_TALK[id].topics`):
 *
 *   { id, label,                 what you say to bring it up (short: it is one row of a list)
 *     when?: S => bool,          only offered while true (a season, a flag, a friendship, a thing remembered)
 *     follow?: true,             a follow-up to something remembered: offered ahead of the ordinary ones
 *     mood?, lines: [...],       what they say to it
 *     ask?: { q, opts: [{ t, reply: [...], mem?, fr?, set?, give?, then? }] } }
 *                                how you take it. `mem` is what is remembered (a short word, never shown); `then` is the id of
 *                                another of theirs to go straight on to.
 *
 * Pure: nothing here writes `S`. `index.js`'s dlgChoose() is the one writer (`S.mem`), the way spineDonate() is the loft's.
 */
export const MENU_SIZE = 3;                         /* topics offered at once */
export const memKey = (npc, topic) => npc + '.' + topic;
export const mem = (S, npc, topic) => (S.mem && S.mem[memKey(npc, topic)]) || null;
/* a small stable hash, so the same day offers the same three */
const h = (...p) => { let x = 2166136261 >>> 0; const s = p.join('|'); for (let i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = Math.imul(x, 16777619) >>> 0; } return x; };

export const topicOf = (book, id) => (book && book.topics || []).filter(t => t.id === id)[0] || null;

/* the topics somebody could be asked about right now: not asked before, and their own condition met */
export function openTopics(book, npcId, S) {
  return ((book && book.topics) || []).filter(t => !S.mem[memKey(npcId, t.id)] && (!t.when || safe(t.when, S)));
}
const safe = (fn, S) => { try { return !!fn(S); } catch (e) { return false; } };

/* three of them: follow-ups first, then the rest in an order that changes with the day */
export function pickTopics(book, npcId, S, n) {
  const open = openTopics(book, npcId, S);
  open.sort((a, b) => (b.follow ? 1 : 0) - (a.follow ? 1 : 0) || h(S.day, npcId, a.id) - h(S.day, npcId, b.id));
  return open.slice(0, n || MENU_SIZE);
}

/* the list the player is shown after a chat line, or null when there is nothing to bring up. `shop` says whether the last row opens a counter. */
export function topicMenu(book, npcId, S, shop) {
  const picks = pickTopics(book, npcId, S);
  if (!picks.length) return null;
  const opts = picks.map(t => ({ t: t.label, topic: t.id }));
  opts.push(shop ? { t: { no: 'La oss handle.', en: 'Let us trade.' }, leave: true, shop: true, reply: [] }
                 : { t: { no: '[Gå videre.]', en: '[Walk on.]' }, leave: true, reply: [] });
  return { q: { no: 'Hva sier du?', en: 'What do you say?' }, opts: opts };
}

/* a topic as a dialogue: what they say, then (if there is one) how you take it, every answer carrying the key it is remembered under */
export function topicDialogue(book, npcId, t) {
  const key = memKey(npcId, t.id);
  const d = { lines: (t.lines || []).slice(), mood: t.mood, key: key };
  if (t.ask) d.ask = { q: t.ask.q, opts: t.ask.opts.map((o, i) => Object.assign({}, o, { memKey: key, mem: o.mem || ('o' + (i + 1)) })) };
  return d;
}

/* ---- writing them ---------------------------------------------------------------------------------------------------------
   `topic(id, label, lines, q, opts, extra)`, where each of `opts` is `[what you say, [what they answer], remembered?, extra?]`:
       topic('shop', 'How is the shop?', ['Quiet. It is always quiet.'], 'Do you want company?',
             [['I could help out.', ['Would you? [She smiles.]'], 'help', { fr: 1 }], ['Not really.', ['Honest.'], 'no']])
   `extra` is any of `mood`, `when`, `follow`; on an answer `fr`, `set`, `give`, `then`. A topic with no `q` is just said.
   `echo(line, if, mood)` is a line for their ordinary pool that is only said to somebody who answered a certain way. */
export function topic(id, label, lines, q, opts, extra) {
  const t = Object.assign({ id: id, label: label, lines: lines }, extra || {});
  if (q) t.ask = { q: q, opts: (opts || []).map(o => Object.assign({ t: o[0], reply: o[1], mem: o[2] || undefined }, o[3] || {})) };
  return t;
}
export const echo = (line, cond, mood) => ({ t: Array.isArray(line) ? line : [line], if: cond, mood: mood });
/* reading what was said, safely, from a predicate */
export const said = (S, npc, topicId, ...vals) => { const v = S && S.mem && S.mem[memKey(npc, topicId)]; return vals.length ? vals.indexOf(v) >= 0 : !!v; };
