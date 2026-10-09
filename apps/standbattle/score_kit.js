/* The band, built from a tune's data (tunes_a.js, tunes_b.js): chords, a lead written out bar by bar, and a style for each of the players (what the bass does in a verse and in a
   chorus, how the rhythm guitar chugs, what the kit plays and where it fills). One tune is thirty-two bars in four sections of eight; the style changes with the section, and the
   last bar of every section is a fill. The game turns the three layers up and down while the tune plays (music.js):

     explore   the floor of it: the pad, the bass held, a kick, and in the menus the tune itself
     combat    the band: the lead, the rhythm guitar, the bass playing its groove, the whole kit
     tension   the last round, a boss, a fighter nearly out: the lead doubled, the stabs, crashes on every section, the toms

   Pure: it needs the studio's song language (kernel/songtext.js, handed in as `L`) and nothing else. */

export const SEC = 8;                                   /* bars to a section */
export const BARS = 32;
export const LAYERS = ['explore', 'combat', 'tension'];
export const layersFor = level => ({ explore: true, combat: level >= 1, tension: level >= 2 });

const DEG = { r: 0, b3: 3, 3: 4, 4: 5, 5: 7, b6: 8, 6: 9, b7: 10, 7: 11, 8: 12, 9: 14, '-5': -5, '-b7': -2, '-1': -12 };
const VEL = { verse: 0.82, chorus: 1, break: 0.62, intro: 0.7 };
const clampV = v => Math.max(0.05, Math.min(1, v));

/* the chords of a tune, one symbol a bar */
export const chordsOf = d => d.chords.trim().split(/\s+/);
export const sectionOf = (d, bar) => d.secs[Math.floor(bar / SEC)];

/* the lead as the studio keeps it: the four sections of eight bars, joined into one line of text, and read */
export const leadNotes = (L, d) => L.parseNotes(d.lead.notes.map(s => s.join(' | ')).join(' | '));

/* one sixteenth-step pattern per bar, as notes: `pat` is 'x.xx.xx.' (x hit, X accent, o soft); `fn(step, strength)` says what to play there */
export function stepsOf(pat, bar, bpb, fn) {
  const p = pat.replace(/[\s|]/g, ''), out = [];
  for (let i = 0; i < p.length; i++) {
    const c = p[i];
    if (c === '.' || c === '-') continue;
    fn(bar * bpb + i / 4, c === 'X' ? 1 : c === 'o' ? 0.55 : 0.82, i, p, out);
  }
  return out;
}

/* the bass: a groove per kind of section, on the root of each bar's chord (the notes are degrees: r 3 5 8 b7 ...) and a walk into the next chord's root on the last beat */
export function bassNotes(L, d) {
  const ch = chordsOf(d), out = [], bpb = d.beats || 4, B = d.bass;
  ch.forEach((c, bar) => {
    const sec = sectionOf(d, bar), pat = B.pat[sec] || B.pat.verse, k = VEL[sec] || 0.8;
    const root = L.chordNotes(c, B.base || 38)[0], third = L.chordNotes(c, B.base || 38)[1] - root;
    pat.forEach(h => {
      const deg = h[2] === '3' ? third : DEG[h[2]];
      out.push([bar * bpb + h[0], h[1], root + (deg == null ? 0 : deg), clampV((h[3] == null ? 0.8 : h[3]) * k)]);
    });
    /* the walk: a note one step from the next bar's root on the last half beat, when the groove has left it free and the chord is about to change */
    if (B.walk && bar < ch.length - 1 && bar % SEC !== SEC - 1) {
      const next = L.chordNotes(ch[bar + 1], B.base || 38)[0];
      if (next !== root) out.push([bar * bpb + bpb - 0.5, 0.45, next + (next > root ? -1 : 1), clampV(0.6 * k)]);
    }
  });
  return out;
}

/* the rhythm player: chords struck on the steps of a pattern. voicing 'power' (root and fifth, twice), 'triad', 'seventh' (as written: m7, maj7), 'root' (one note) */
export function compNotes(L, d) {
  const ch = chordsOf(d), out = [], bpb = d.beats || 4, C = d.comp;
  ch.forEach((c, bar) => {
    const sec = sectionOf(d, bar), pat = bar % SEC === SEC - 1 && C.fill ? C.fill : (C.pat[sec] || C.pat.verse), k = VEL[sec] || 0.8;
    const ns = L.chordNotes(c, C.base || 52), root = ns[0];
    const voice = C.voicing === 'power' ? [root, root + 7, root + 12] : C.voicing === 'root' ? [root] : C.voicing === 'triad' ? ns.slice(0, 3) : ns;
    stepsOf(pat, bar, bpb, (t, s, i, p) => {
      let j = i + 1; while (j < p.length && p[j] === '.' && j - i < (C.hold || 2)) j++;
      voice.forEach((n, v) => out.push([t, (j - i) / 4 * (C.gate || 0.9), n + (C.up || 0), clampV(s * k * (v === voice.length - 1 && C.voicing === 'power' ? 0.8 : 1) * (C.vel || 0.85))]));
    });
  });
  return out;
}

/* arpeggios: the chord's own notes rolled in eighths, from the pattern of indices in `C.arp` */
export function arpNotes(L, d, from) {
  const ch = chordsOf(d), out = [], bpb = d.beats || 4, A = d.arp;
  ch.forEach((c, bar) => {
    const sec = sectionOf(d, bar), k = VEL[sec] || 0.8, ns = L.chordNotes(c, A.base || 60);
    for (let i = 0; i < bpb * 2; i++) {
      const ix = A.pattern[i % A.pattern.length], n = ns[ix % ns.length] + (ix >= ns.length ? 12 : 0);
      out.push([bar * bpb + i / 2, 0.55, n, clampV((i % 2 ? 0.5 : 0.65) * k * (A.vel || 1))]);
    }
  });
  return out;
}

/* the pad: the chord held for the bar */
export function padNotes(L, d) {
  const out = [], bpb = d.beats || 4, P = d.pad;
  chordsOf(d).forEach((c, bar) => {
    const sec = sectionOf(d, bar), k = sec === 'break' ? 0.8 : 1;
    L.chordNotes(c, P.base || 50).forEach(n => out.push([bar * bpb, bpb * (P.len || 1), n, clampV((P.vel || 0.36) * k)]));
  });
  return out;
}

/* the kit, a bar of sixteenth steps for each kind of section, the last bar of a section a fill, and (tension) a crash on the first beat of every section */
export function kitDrums(d, only) {
  const K = d.kit, keys = new Set();
  ['verse', 'chorus', 'break', 'fill', 'fill2'].forEach(s => K[s] && Object.keys(K[s]).forEach(k => keys.add(k)));
  const out = {};
  keys.forEach(key => {
    if (only && only.indexOf(key) < 0) return;
    let s = '';
    for (let bar = 0; bar < BARS; bar++) {
      const sec = d.secs[Math.floor(bar / SEC)], last = bar % SEC === SEC - 1, half = bar % SEC === 3 && K.fill2;
      const src = last ? K.fill : half ? K.fill2 : K[sec] || K.verse;
      s += (src && src[key]) || '................';
    }
    out[key] = s;
  });
  return out;
}
export const crashEvery = d => { let s = ''; for (let bar = 0; bar < BARS; bar++) s += bar % SEC === 0 ? 'X...............' : '................'; return s; };

/* the lead's second voice: an octave up, or a scale step either side, read from the lead as written */
export function doubleOf(notes, semis, k, top) {
  return notes.map(n => [n[0], n[1], Math.min(top || 96, n[2] + semis), clampV(n[3] * (k || 0.75))]);
}
