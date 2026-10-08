import { fs as vfs } from './vfs.js';
import { openWindow, createWindow, toast } from './wm.js';
import { hcLex, hcParse, hcRun } from './holyc.js';
import { panic } from './panic.js';
import { sys } from './trophy_hook.js';

function commas(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }

function compileNode(path, content, print) {
  const src = String(content || '');
  const lines = src.split('\n');
  const stmts = lines.filter(l => {
    const t = l.trim();
    return t.length && t.slice(0, 2) !== '//';
  }).length;
  const bytes = src.length;
  const base = 0x104000 + ((bytes * 7919) % 0x9000);
  const emitted = Math.max(16, Math.round(stmts * 11.3 + bytes * 0.4));
  const name = path.split('/').pop();

  print(['HOLYC JIT — ' + path, ''], 'l-dim');
  print(['  LEX     ' + lines.length + ' LINE(S), ' + commas(bytes) + ' BYTE(S)',
         '  PARSE   ' + stmts + ' STATEMENT(S)',
         '  EMIT    0x' + base.toString(16).toUpperCase().padStart(16, '0') +
           '   ' + commas(emitted) + ' BYTES'], 'l-ok');

  if (!/\.HC$/i.test(name)) {
    print(['  WARN    ' + name + ' IS NOT .HC. COMPILING IT ANYWAY.'], 'l-err');
  }
  if (!stmts) {
    print(['', '  ERROR   NOTHING TO COMPILE. THE FILE IS EMPTY.'], 'l-err');
    if (window.Snd) window.Snd.err();
    return;
  }
  print(['', 'COMPILES CLEAN. NO WARNINGS. NO LINKER.', 'NO INTERCESSOR.'], 'l-holy');
  if (window.Snd) window.Snd.bell();
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
  try {
    const ast = hcParse(hcLex(file && file.content || ''));
    hcRun(ast, l => rows.push(l), null, {
      godDoodle: () => openWindow('goddoodle').catch(console.error),
      dirNames: () => []
    });
    sys.holyc(ast, path.split('/').pop());
  } catch (e) { bad = e; }
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
      else { put('', 'l-dim'); put('RAN CLEAN. NO LINKER. NO INTERCESSOR.', 'l-holy'); }
      t.appendChild(o);
      body.appendChild(t);
    }
  });
  if (window.Snd) { if (bad) window.Snd.err(); else window.Snd.bell(); }
}
