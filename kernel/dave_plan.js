/* Dave's babble, as data. PURE: what is sounded for each letter of a line, and how long until the next letter is typed.
   kernel/dave_voice.js turns one `sound` into audio; kernel/dave_box.js types the letters and asks for each in turn;
   `node scripts/check-farewell.mjs` holds the plan to its numbers.

   He does not say the words, he babbles them: every vowel is a short buzzing blip through two band-pass filters (the first two
   formants of that vowel, so an A and an I are different mouths), the plosives are a dull pop and a click, the S and F and H a puff of
   hiss, the M and N a hum. A space is a breath of silence, a comma a short pause and a full stop a long one. His pitch wanders
   with every blip, sags across a sentence, leans on the first sound of a word, climbs through the last word of a question and
   barks the last word of a shout.  A sound is { k, f0, f1, f2, dur, gain, bend } (k: v vowel, p plosive, f fricative, n nasal;
   f0 in Hz, the formants in Hz, dur in seconds, gain 0..1, bend the factor the pitch glides by over the blip). */

export const BASE_MS = 30;            /* a letter, at his own rate */
export const COMMA_MS = 130, STOP_MS = 280;

const FORMANTS = { A: [730, 1090], E: [530, 1840], I: [270, 2290], O: [570, 840], U: [300, 870], Y: [390, 1990] };
const DIGIT_VOWEL = 'OIEAUAEIOU';                  /* a digit is blipped as one of these, so 7 and 3 are not the same note */
const PLOSIVES = 'PBTDKGCQ', FRICATIVES = 'SZFVXJH', NASALS = 'MNLRW';
const HISS = { S: 5600, Z: 5200, F: 3600, V: 3200, X: 4400, J: 3000, H: 1900 };
const NASAL_F2 = { M: 900, N: 1300, L: 1500, R: 1100, W: 800 };

export const PITCH = 118;             /* his own, Hz */

const isLetter = c => /[A-Z]/.test(c);

export function voicePlan(text, rng, voice) {
  rng = rng || (() => Math.random());
  const vo = Object.assign({ pitch: 1, wobble: 0.15, rate: 1 }, voice || {});
  const n = text.length;

  /* for every character: the end of its sentence, where the sentence starts, and where its last word is */
  const ends = new Array(n).fill(null);
  let start = 0;
  for (let i = 0; i < n; i++) {
    if ('.!?'.indexOf(text[i]) < 0) continue;
    let ws = text.lastIndexOf(' ', i) + 1;
    if (ws < start) ws = start;
    for (let j = start; j <= i; j++) ends[j] = { t: text[i], at: i, start, word: ws };
    start = i + 1;
  }

  const events = [];
  let total = 0, prevSounded = false;
  for (let i = 0; i < n; i++) {
    const ch = text[i], u = ch.toUpperCase();
    const e = ends[i];
    let ms = BASE_MS * vo.rate * (0.85 + rng() * 0.3);
    let sound = null;

    if (ch === ' ') {
      ms = BASE_MS * vo.rate * 0.95;
      prevSounded = false;
    } else if (',;:-'.indexOf(ch) >= 0) {
      ms = COMMA_MS * vo.rate;
    } else if ('.!?'.indexOf(ch) >= 0) {
      ms = STOP_MS * vo.rate;
    } else if (isLetter(u) || /[0-9]/.test(ch)) {
      const wordStart = i === 0 || text[i - 1] === ' ';
      const digit = /[0-9]/.test(ch);
      const L = digit ? DIGIT_VOWEL[+ch] : u;
      const isVowel = !!FORMANTS[L];

      /* the pitch of this blip: his own, wandering, sagging across the sentence, leaning on the start of a word */
      let hz = PITCH * vo.pitch * (1 + (rng() * 2 - 1) * vo.wobble);
      if (e) hz *= 1 - 0.16 * ((Math.min(i, e.word) - e.start) / Math.max(1, e.at - e.start));     /* the sag stops where the last word begins */
      if (wordStart) hz *= 1.08;
      let gain = 0.8 + rng() * 0.3, bend = 0.9 + rng() * 0.22;
      if (e && i >= e.word && e.at > e.word) {
        const f = (i - e.word) / (e.at - e.word);          /* 0 at the start of the last word, 1 at the stop */
        if (e.t === '?') { hz *= 1 + 0.65 * f; bend = 1.08 + 0.25 * f; }
        if (e.t === '!') { hz *= 1.14; gain *= 1.25; bend = 0.85; }
      }

      if (isVowel || digit) {
        const f = FORMANTS[L] || FORMANTS.A;
        const j = 1 + (rng() - 0.5) * 0.12;
        sound = { k: 'v', f0: hz, f1: f[0] * j, f2: f[1] * j, dur: clamp(ms * (2.2 + rng() * 0.8) / 1000, 0.06, 0.13), gain: gain * 0.9, bend };
      } else if (wordStart || prevSounded === false || rng() < 0.6) {
        if (PLOSIVES.indexOf(L) >= 0) {
          sound = { k: 'p', f0: hz * 0.8, f1: 1200 + rng() * 2400, f2: 0, dur: 0.035, gain: gain * 0.75, bend: 0.7 };
        } else if (FRICATIVES.indexOf(L) >= 0) {
          sound = { k: 'f', f0: hz * 0.9, f1: HISS[L], f2: 0, dur: 0.045 + rng() * 0.04, gain: gain * 0.5, bend: 1 };
        } else if (NASALS.indexOf(L) >= 0) {
          sound = { k: 'n', f0: hz, f1: 280, f2: NASAL_F2[L], dur: 0.07 + rng() * 0.03, gain: gain * 0.8, bend };
        }
      }
      prevSounded = !!sound;
    } else {
      ms = BASE_MS * vo.rate * 0.4;                       /* an apostrophe, a quote: no time, no sound */
    }
    ms = Math.round(ms);
    total += ms;
    events.push({ ch, ms, sound });
  }
  return { events, ms: total };
}

function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
