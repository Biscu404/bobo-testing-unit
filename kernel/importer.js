/* Getting things onto the machine: the hidden file pickers, and dropping a
   file straight from the user's own computer onto the desktop or a folder. */
import { fs as vfs } from './vfs.js';
import { toast } from './wm.js';
import { Vault } from './vault.js';
import { crushImage } from './imaging.js';
import { changed } from './vfs_ops.js';

let uploadTarget = '::';

/* used by the folder app so "upload here" targets whatever directory that
   window is actually looking at, not always :: */
export function pickUpload(dir, kind) {
  uploadTarget = dir || '::';
  const el = document.getElementById(kind === 'text' ? 'picktxt' : 'pickimg');
  if (el) el.click();
}

export function wirePickers() {
  const pickimg = document.getElementById('pickimg');
  const picktxt = document.getElementById('picktxt');
  if (pickimg) pickimg.addEventListener('change', ev => {
    importFiles(ev.target.files, 'media');
    ev.target.value = '';
  });
  if (picktxt) picktxt.addEventListener('change', ev => {
    importFiles(ev.target.files, 'text');
    ev.target.value = '';
  });
}

/* a folder (or the bare desktop) accepts a file dropped straight from the
   user's own computer onto it */
export function wireDrop(el, getDir) {
  const hasFiles = ev =>
    ev.dataTransfer && Array.from(ev.dataTransfer.types || []).indexOf('Files') >= 0;

  el.addEventListener('dragover', ev => {
    if (!hasFiles(ev)) return;
    ev.preventDefault();
    ev.stopPropagation();
    ev.dataTransfer.dropEffect = 'copy';
    el.classList.add('dropok');
  });
  el.addEventListener('dragleave', ev => {
    if (el.contains(ev.relatedTarget)) return;
    el.classList.remove('dropok');
  });
  el.addEventListener('drop', ev => {
    if (!ev.dataTransfer || !ev.dataTransfer.files.length) return;
    ev.preventDefault();
    ev.stopPropagation();
    if (window.Snd) window.Snd.drop();
    el.classList.remove('dropok');
    document.querySelectorAll('.dropok').forEach(n => n.classList.remove('dropok'));
    importFiles(ev.dataTransfer.files, null, getDir());
  });
}

function readAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}
function readAsText(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsText(file);
  });
}

/* crushed to the sixteen-colour palette and no bigger than 384px on the
   long edge, the same way every other import on this machine is: a
   full-quality photo would break the illusion the rest of the OS keeps */
function importImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      try {
        const cv = crushImage(img, img.naturalWidth, img.naturalHeight);
        resolve(cv.toDataURL('image/png'));
      } catch (e) { reject(e); }
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('NOT AN IMAGE')); };
    img.src = url;
  });
}

/* video keeps its own bytes in the Vault (a blob, not a base64 string
   several times its own size) and the VFS record only carries the key */
async function importVideo(path, file) {
  const key = await Vault.put(file);
  await vfs.write(path, { type: 'video', vault: key, mime: file.type || 'video/mp4' });
}

export async function importFiles(fileList, kind, dir) {
  const files = Array.from(fileList || []);
  if (!files.length) return;
  dir = dir || uploadTarget || '::';
  for (const f of files) {
    try {
      const isVideo = kind === 'media' ? f.type.startsWith('video') : /^video\//.test(f.type);
      const isImage = kind === 'media' ? !isVideo : /^image\//.test(f.type);
      if (isVideo) {
        await importVideo(`${dir}/${f.name}`, f);
      } else if (isImage) {
        const src = await importImage(f);
        await vfs.write(`${dir}/${f.name}`, { type: 'image', src });
      } else {
        const content = await readAsText(f);
        await vfs.write(`${dir}/${f.name}`, { type: 'text', content });
      }
    } catch (e) { console.error(e); }
  }
  toast(files.length + ' FILE(S) IMPORTED.');
  changed(dir);
}
