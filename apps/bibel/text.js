/* THE BIBEL as a book: a preface, three parts, a colophon. Each chapter is { id, no, title, note?, verses: [string] }.
   The text lives in text_a..d.js; this file only puts it in order and names the parts. */
import { PART_ONE } from './text_a.js';
import { PART_ONE_B } from './text_b.js';
import { PART_TWO_A } from './text_c.js';
import { PART_TWO_B, PART_THREE, PREFACE, COLOPHON } from './text_d.js';

export const PARTS = [
  { id: 'front', name: '', chapters: [PREFACE] },
  { id: 'one', name: 'PART ONE: THE THINGS THAT WERE BEFORE US', chapters: [...PART_ONE, ...PART_ONE_B] },
  { id: 'two', name: 'PART TWO: THE ACCOUNTS, ONE FOR EACH PEOPLE', chapters: [...PART_TWO_A, ...PART_TWO_B] },
  { id: 'three', name: 'PART THREE: WHAT ALL THE ACCOUNTS AGREE ON', chapters: [...PART_THREE] },
  { id: 'back', name: '', chapters: [COLOPHON] }
];

export const CHAPTERS = PARTS.flatMap(p => p.chapters);

/* plain text, as the desktop file ::/TheBibel.TXT keeps it */
export function plainText(width = 72) {
  const wrap = s => {
    const out = []; let line = '';
    for (const w of s.split(' ')) {
      if (line && (line + ' ' + w).length > width) { out.push(line); line = w; } else line = line ? line + ' ' + w : w;
    }
    if (line) out.push(line);
    return out.join('\n');
  };
  const out = ['THE BIBEL', 'An Amalgamated Scripture', ''];
  for (const p of PARTS) {
    if (p.name) out.push(p.name, '');
    for (const c of p.chapters) {
      out.push((c.no ? c.no + '. ' : '') + c.title);
      if (c.note) out.push('(' + c.note + ')');
      out.push('');
      c.verses.forEach((v, i) => out.push(wrap((c.no && c.id !== 'z' ? (i + 1) + ' ' : '') + v), ''));
    }
  }
  return out.join('\n');
}
