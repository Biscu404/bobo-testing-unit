import { fs as vfs } from './vfs.js';
import { openWindow, createWindow, toast } from './wm.js';
import { hcLex, hcParse, hcRun, isPanic } from './holyc.js';
import { snapshot } from './holyc_env.js';
import { panic } from './panic.js';
import { sys } from './trophy_hook.js';

function commas(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }

/* COMPILE reads the program the way the JIT would: it is lexed and parsed for real, so a missing bracket is an error on the line that has it, and what it reports
   (functions, statements, globals) is what is in the file. Nothing is run. */
export function compileNode(path, content, print) {
  const src = String(content || '');
  const lines = src.split('\n');
  const bytes = src.length;
  const base = 0x104000 + ((bytes * 7919) % 0x9000);
  const name = path.split('/').pop();
  print(['HOLYC JIT \u2014 ' + path, ''], 'l-dim');
  let ast = null;
  try { ast = hcParse(hcLex(src)); }
  catch (e) {
    print(['  LEX     ' + lines.length + ' LINE(S), ' + commas(bytes) + ' BYTE(S)'], 'l-ok');
    if (e && e.holyc) {
      const bad = e.line && lines[e.line - 1] != null ? lines[e.line - 1].trim().slice(0, 56) : '';
      print(['', '  ERROR   LINE ' + (e.line || '?') + ': ' + e.message].concat(bad ? ['          ' + bad] : [], ['', 'DOES NOT COMPILE. THE COMPILER IS UNMOVED.']), 'l-err');
    }
    else print(['', '  FAULT   ' + (e && e.message)], 'l-err');
    if (window.Snd) window.Snd.err();
    return false;
  }
  const body = ast.body || [], fns = body.filter(n => n.k === 'fn'), decls = body.filter(n => n.k === 'decl'), others = body.filter(n => n.k !== 'fn' && n.k !== 'decl' && n.k !== 'empty');
  const stmts = body.filter(n => n.k !== 'empty').length;
  print(['  LEX     ' + lines.length + ' LINE(S), ' + commas(bytes) + ' BYTE(S)',
         '  PARSE   ' + stmts + ' TOP-LEVEL STATEMENT(S): ' + fns.length + ' FUNCTION(S), ' + decls.reduce((a, d) => a + (d.decls ? d.decls.length : 1), 0) + ' GLOBAL(S), ' + others.length + ' TO RUN',
         '  EMIT    0x' + base.toString(16).toUpperCase().padStart(16, '0') + '   ' + commas(Math.max(16, Math.round(stmts * 11.3 + bytes * 0.4))) + ' BYTES'], 'l-ok');
  fns.forEach(f => print(['  FN      ' + (f.ret || 'U0') + ' ' + f.name + '(' + (f.params || []).join(', ') + ')'], 'l-dim'));
  if (!/\.HC$/i.test(name)) print(['  WARN    ' + name + ' IS NOT .HC. COMPILING IT ANYWAY.'], 'l-err');
  if (!stmts) { print(['', '  ERROR   NOTHING TO COMPILE. THE FILE IS EMPTY.'], 'l-err'); if (window.Snd) window.Snd.err(); return false; }
  if (!others.length && fns.length) print(['  NOTE    NOTHING IN IT CALLS ANYTHING: RUN IT AND IT WILL ONLY DEFINE.'], 'l-dim');
  print(['', 'COMPILES CLEAN. NO WARNINGS. NO LINKER.', 'NO INTERCESSOR.'], 'l-holy');
  if (window.Snd) window.Snd.bell();
  return true;
}

export async function openCompile() {
  const path = window._lastTextPath;
  if (!path) {
    toast('NOTHING TO COMPILE. OPEN A TEXT FILE FIRST.');
    if (window.Snd) window.Snd.err();
    return;
  }
  const file = await vfs.read(path);
  if (!file) {
    toast('NOTHING TO COMPILE. OPEN A TEXT FILE FIRST.');
    if (window.Snd) window.Snd.err();
    return;
  }
  createWindow({
    kind: 'terminal',
    title: 'COMPILE ' + path,
    w: 520, h: 260,
    build: body => {
      const term = document.createElement('div');
      term.className = 'term';
      const out = document.createElement('div');
      out.className = 'termout';
      term.appendChild(out);
      body.appendChild(term);
      const print = (rows, cls) => {
        rows.forEach(txt => {
          const d = document.createElement('div');
          d.className = cls;
          d.textContent = txt;
          out.appendChild(d);
        });
        out.scrollTop = out.scrollHeight;
      };
      compileNode(path, file.content, print);
    }
  });
}

/* a program that puts things on the stage (Button, Label, Pixel...) is an app, not a run for a terminal: HOLYC.EXE's player opens it */
const STAGE_CALLS = /\b(Label|Button|Field|Bar|Pixel|Fill|Note|Every)\s*\(/;

export async function runFileHolyC(path) {
  const file = await vfs.read(path);
  if (file && STAGE_CALLS.test(String(file.content || '').replace(/\/\/[^\n]*/g, ''))) {
    openWindow('holyc', { run: true, from: path, name: path.split('/').pop().replace(/\.HC$/i, '') }).catch(console.error);
    if (window.Snd) window.Snd.bell();
    return;
  }
  const rows = [];
  let bad = null;
  const env = await snapshot(path.slice(0, path.lastIndexOf('/')) || '::');
  try {
    const ast = hcParse(hcLex(file && file.content || ''));
    hcRun(ast, l => rows.push(l), null, {
      godDoodle: () => openWindow('goddoodle').catch(console.error),
      dirNames: env.dirNames, cd: p => env.cd(p)
    });
    sys.holyc(ast, path.split('/').pop());
  } catch (e) { bad = e; }
  /* Panic and DebuggerEnter are the debugger: show it, as a fault at ring 0 would, after what the program had said */
  const fell = isPanic(bad) ? bad : null;
  if (fell) bad = null;
  createWindow({
    kind: 'terminal', title: 'RUN ' + path, w: 480, h: 260,
    build: body => {
      const t = document.createElement('div');
      t.className = 'term';
      const o = document.createElement('div');
      o.className = 'termout';
      const put = (txt, cls) => {
        const d = document.createElement('div');
        d.className = cls; d.textContent = txt; o.appendChild(d);
      };
      put('HOLYC JIT — ' + path, 'l-dim');
      rows.forEach(r => put(r, 'l-holyc'));
      if (bad && bad.holyc) put('HolyC: ' + bad.message, 'l-err');
      else if (bad) { put('FAULT: ' + bad.message, 'l-err'); panic(bad, 'HolyC JIT'); }
      else if (fell) { put('', 'l-dim'); put('RING 0 HAS NO SAFETY NET.', 'l-err'); }
      else { put('', 'l-dim'); put('RAN CLEAN. NO LINKER. NO INTERCESSOR.', 'l-holy'); }
      t.appendChild(o);
      body.appendChild(t);
    }
  });
  if (fell) { panic(fell, 'deliberate'); return; }
  if (window.Snd) { if (bad) window.Snd.err(); else window.Snd.bell(); }
}
