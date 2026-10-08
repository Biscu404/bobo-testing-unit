/* Jesse's voice. Nobody has a voice actor: he talks in blips, one for each letter that is said, the way a character in an old game
   does, but his, not anybody's: a nasal square wave that sits around the bottom of a man's range (a vowel is a pitch, a stop is a
   click, an S or an F is a little hiss, M and N and L hum), a rising tail on a question, a bark on a shout, higher and louder on a
   word in capitals, a word at a time a little up or down so a sentence has a tune, and a drop at the end of it. Spaces, commas and
   full stops are silent: the pause is the sound of them.
   `blip(text, i)` is pure (what the i-th character of `text` sounds like, or null) and is what `node apps/cook/cook_check.js`
   holds; `play(Snd, b)` is the speaker. It is silent at SFX 0 like everything else on the machine. */
const VOWEL = { a: 233, e: 294, i: 349, o: 196, u: 165, y: 262 };
const STOP = 'bdgkpqtcx', HISS = 'sfhzvj', HUM = 'mnlrw';
const isLetter = ch => /[A-Za-z]/.test(ch);
const hash = s => { let h = 7; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };
/* the start and end of the word the i-th character is in */
function wordAt(text, i) {
  let a = i, b = i;
  while (a > 0 && /[A-Za-z'’]/.test(text[a - 1])) a--;
  while (b < text.length && /[A-Za-z'’]/.test(text[b])) b++;
  return [a, b];
}
const WORD_TUNE = [1, 1.12, 0.95, 1.06, 0.89, 1.18];

export function blip(text, i) {
  const ch = text[i];
  if (ch == null || !isLetter(ch) && ch !== '?' && ch !== '!') return null;
  const [a, b] = wordAt(text, i), word = text.slice(a, b);
  const shout = word.length > 1 && word === word.toUpperCase() && /[A-Z]/.test(word);
  /* the sentence's tune: a word's own wobble, a lift over the first words and a sag over the last */
  const upTo = text.slice(0, i), ends = text.slice(i).search(/[.!?]/), toEnd = ends < 0 ? text.length - i : ends;
  const sag = toEnd < 14 ? 1 - (14 - toEnd) * 0.009 : 1;
  const tune = WORD_TUNE[hash(word.toLowerCase()) % WORD_TUNE.length] * sag * (shout ? 1.28 : 1);
  if (ch === '?') return { kind: 'ask', f: 247 * tune, to: 392 * tune, ms: 130, vol: 0.02, type: 'square' };
  if (ch === '!') return { kind: 'bark', f: 175 * tune, to: 105, ms: 110, vol: 0.026, type: 'sawtooth' };
  const l = ch.toLowerCase();
  /* only every other consonant sounds: forty letters a second would be a buzz, not a voice (a vowel always does) */
  const n = (upTo.match(/[A-Za-z]/g) || []).length;
  const vol = shout ? 0.022 : 0.015;
  if (VOWEL[l]) return { kind: 'vowel', f: VOWEL[l] * tune, ms: shout ? 52 : 40, vol, type: 'square' };
  if (n % 2) return null;
  if (STOP.indexOf(l) >= 0) return { kind: 'stop', f: 0, ms: 14, vol: vol * 1.3, noise: 1700 + (hash(l) % 5) * 300 };
  if (HISS.indexOf(l) >= 0) return { kind: 'hiss', f: 0, ms: 26, vol: vol * 0.8, noise: 3600 };
  if (HUM.indexOf(l) >= 0) return { kind: 'hum', f: 128 * tune, ms: 36, vol: vol * 0.9, type: 'triangle' };
  return { kind: 'vowel', f: 220 * tune, ms: 30, vol: vol * 0.8, type: 'square' };
}
export function play(Snd, b) {
  if (!b || !Snd) return;
  try {
    if (b.noise) Snd.noise(b.ms, { freq: b.noise, q: 1.1, vol: b.vol });
    else Snd.tone(b.f, b.ms, b.to ? { type: b.type, to: b.to, vol: b.vol } : { type: b.type, vol: b.vol });
  } catch (e) { /* no sound on this machine */ }
}
