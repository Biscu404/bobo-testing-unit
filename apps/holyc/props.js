/* HOLYC.EXE's props are its programs: the model answer to every lesson step and every puzzle, and every workshop template, as .HC files you can open and run. */
import { doc, fname } from '../prop_kit.js';
import { LESSONS, modelOf } from './lessons.js';
import { CHAPTERS } from './puzzles.js';
import { TEMPLATES } from './templates.js';

export const NAME = 'HOLYC.EXE';
export const FOLDER = 'HolyCPrograms';
export async function props() {
  const L = [];
  CHAPTERS.forEach(ch => ch.list.forEach(p => L.push(doc('PUZZLE_' + fname(ch.id) + '_' + fname(p.id) + '.HC', '// ' + p.title + '  (' + '*'.repeat(p.stars) + ')\n// ' + p.brief.join(' ').replace(/`/g, '') + '\n' + p.model))));
  LESSONS.forEach(les => les.steps.forEach(st => { const code = modelOf(st); if (code) L.push(doc('LESSON_' + fname(les.id) + '_' + fname(st.id) + '.HC', '// ' + les.title + ': ' + st.title + '\n' + code)); }));
  TEMPLATES.forEach(t => L.push(doc('TEMPLATE_' + fname(t.name) + '.HC', t.code)));
  L.push(doc('README.TXT', 'HOLYC.EXE: THE PROGRAMS\n\nThe working answer to every puzzle, every lesson step and every workshop template, as a plain .HC file.\nOpen one in the editor and RUN it. You solved all of them yourself; these are the ones that agree with you.\n'));
  return L;
}
