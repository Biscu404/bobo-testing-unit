/* Files dropped on the library: pictures and music, and whole folders of them (a dropped folder is walked entry by entry; each file carries the path it was found at, the way a
   folder picked from the dialog does). */
import { isAudio } from './library_io.js';
import { isImage } from './labels.js';

const readAll = dir => new Promise(res => {
  const out = [], rd = dir.createReader();
  const go = () => rd.readEntries(es => { if (!es.length) res(out); else { out.push(...es); go(); } }, () => res(out));
  go();
});
async function walk(entry, path, out) {
  if (entry.isFile) { await new Promise(res => entry.file(f => { try { Object.defineProperty(f, 'webkitRelativePath', { value: path + f.name }); } catch (e) { /* kept as it was */ } out.push(f); res(); }, res)); }
  else if (entry.isDirectory) for (const e of await readAll(entry)) await walk(e, path + entry.name + '/', out);
}
/* every file in a drop, folders opened up */
export async function filesFromDrop(dt) {
  const items = dt.items ? [].slice.call(dt.items) : [];
  const entries = items.map(i => (i.webkitGetAsEntry ? i.webkitGetAsEntry() : null)).filter(Boolean);
  if (entries.some(e => e.isDirectory)) { const out = []; for (const e of entries) await walk(e, '', out); return out; }
  return [].slice.call(dt.files || []);
}
export const kinds = files => ({ audio: files.filter(isAudio), pics: files.filter(isImage) });
export const hasFiles = dt => !!dt && [].indexOf.call(dt.types || [], 'Files') >= 0;
