/* Bekkedal — a line that is said, not shown.
 *
 * The dialogue box used to put a whole line on the glass at once and play one burst of blips for it. People talk a letter at a time.
 * `createTyper()` reveals a line at a steady `CPS` letters a second, stops a moment at a comma and a little longer at a full stop, and
 * reports each letter as it comes up, so the caller can give every second one a blip at the speaker's pitch. SPACE finishes a line
 * that is still coming (`skip()`); once it is all there SPACE goes on to the next, as it always did.
 *
 * What is in square brackets is not said but done: [HE LAUGHS]. It is revealed twice as fast, makes no sound, and is drawn in its
 * own colour (menus_talk.js reads `isAct()`/`actMask()` for that).
 *
 * Pure: no clock, no canvas, no audio. `typer_check.js` holds the pace and the pauses.
 */
export const CPS = 44;                 /* letters a second */
export const ACT_RATE = 2.2;           /* an action is typed this much faster */
export const PAUSE = { '.': 0.17, '!': 0.19, '?': 0.19, ',': 0.075, ':': 0.1, ';': 0.09, '—': 0.1, '…': 0.15 };
export const BLIP_EVERY = 2;           /* every this many voiced letters make a sound */

/* which characters of a line are inside [ ] (the brackets themselves included) */
export function actMask(str) {
  const m = new Array(str.length); let on = false;
  for (let i = 0; i < str.length; i++) {
    if (str[i] === '[') on = true;
    m[i] = on;
    if (str[i] === ']') on = false;
  }
  return m;
}

export function createTyper() {
  let text = '', mask = [], at = 0, acc = 0, voiced = 0;
  return {
    reset(str) { text = str || ''; mask = actMask(text); at = 0; acc = 0; voiced = 0; },
    skip() { at = text.length; acc = 0; },
    done() { return at >= text.length; },
    shown() { return at; },
    length() { return text.length; },
    mask() { return mask; },
    /* advance by `dt` seconds; returns the letters (strings of one character) that ought to be voiced in that time */
    step(dt) {
      const out = [];
      if (at >= text.length) return out;
      acc += dt;                                  /* a breath is time owed: it takes the budget below zero, and the next letters wait */
      while (at < text.length) {
        const act = mask[at], per = 1 / (act ? CPS * ACT_RATE : CPS);
        if (acc < per) break;
        acc -= per;
        const c = text[at++];
        if (!act && /[\p{L}\p{N}]/u.test(c)) { if (voiced++ % BLIP_EVERY === 0) out.push(c); }
        if (!act && PAUSE[c] && (at >= text.length || text[at] === ' ' || text[at] === '—')) acc -= PAUSE[c];
      }
      return out;
    }
  };
}

/* the characters of `str` that are on show when `shown` have been revealed, split at each row of a wrapped paragraph: for each row, how many
   of its characters are visible and whether the row begins inside a bracket (so a bracket that spans a wrap keeps its colour) */
export function revealRows(rows, str, shown) {
  const mask = actMask(str), out = []; let pos = 0;
  for (const r of rows) {
    const start = str.indexOf(r, pos);
    const s = start < 0 ? pos : start;
    out.push({ text: r, n: Math.max(0, Math.min(r.length, shown - s)), inAct: s > 0 ? !!mask[s - 1] && str[s - 1] !== ']' : false });
    pos = s + r.length;
  }
  return out;
}
