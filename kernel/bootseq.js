/* The two boots.

   quick   every time the set is switched on, and on a launch inside eight
           hours of the last one: a short POST, then the temple.
   long    a launch after eight hours away (or the first ever). A machine that
           has been sitting cold for a day, and is not at all happy about it:
           dying fan, a bad block, a drive that will not spin up, a progress
           bar that goes backwards, a freeze — for seven seconds, with the song
           coming through a wall — and then, for the last three, the text.
           Nothing on the keyboard or the mouse skips it.

   Both end the same way: a line that says PRESS ~ TO ENTER and a #bootcursor
   (the marker the checks wait for). boot.js owns what happens next. */
import { BIRTHDAY_TEXT } from './boot_text.js';
import { CRT, lampDip } from './hardware.js';
import { load as loadBios, post as biosPost, memSteps, holdLine } from './bios_cfg.js';

export const LONG_MS = 10000;
export const STRUGGLE_MS = 7000;

const BOOT_LINES = [
  ['TempleOS V5.03', 'w'],
  ['Public Domain. God\'s Third Temple.', 'y'],
  ['Loading Adam (task 0)...', 'g'],
  ['Spawning Seth...', 'g'],
  ['Mem: 640K OK', 'g'],
  ['HolyC JIT Ready', 'g'],
  ['DolDoc Ready', 'g'],
  ['Ring 0. No user mode. No network.', 'y']
];

/* what BIOS SETUP (hold DEL at power-up: kernel/bios_ui.js) says this power-on does; read again at the start of every boot */
let P = biosPost(loadBios());
let ids = [];
let alive = false;
let runId = 0;
const el = id => document.getElementById(id);
const snd = () => window.Snd;

function at(ms, fn) {
  const mine = runId;
  ids.push(setTimeout(() => { if (alive && mine === runId && CRT.on) fn(); }, ms));
}

export function cancelBoot() {
  alive = false; runId++;
  ids.forEach(clearTimeout); ids = [];
  const bios = el('bios'), sp = el('splash');
  if (bios) { bios.style.display = 'none'; bios.className = ''; bios.textContent = ''; }
  if (sp) sp.classList.remove('posting', 'revealing', 'flashing');
  const box = el('bootlines');
  if (box) box.className = '';
}

/* ---- the sounds of a machine that is not well --------------------------- */
const beep = (f, ms) => P.speaker && snd() && snd().tone(f, ms, { mech: true, type: 'square', vol: 0.035 });
const seek = n => {
  if (!snd() || !P.speaker) return;
  for (let i = 0; i < n; i++) snd().noise(26, { mech: true, freq: 700 + (i % 3) * 260, q: 2.4, vol: 0.1, delay: i * 0.085 });
};
const whir = (ms, from, to) => P.speaker && snd() && snd().tone(from, ms, { mech: true, type: 'sawtooth', to: to, vol: 0.022 });

/* ---- a text screen -------------------------------------------------------
   The BIOS is a column of lines that scrolls off the top when it runs out
   of glass. print() hands back the line so a counter can rewrite it. */
function biosOpen() {
  const b = el('bios'), sp = el('splash');
  b.textContent = ''; b.className = ''; b.style.display = 'block';
  sp.classList.add('posting');
  /* the line a real BIOS keeps at the foot of the screen: it stays while the lines above it scroll */
  const del = document.createElement('div');
  del.className = 'biosdel'; del.textContent = 'PRESS DEL TO ENTER SETUP';
  b.appendChild(del);
  return b;
}
function print(text, cls) {
  const b = el('bios');
  if (!b) return null;
  const d = document.createElement('div');
  d.className = 'bl' + (cls ? ' ' + cls : '');
  d.textContent = text;
  const del = b.querySelector('.biosdel');
  b.insertBefore(d, del);
  const max = Math.max(8, Math.floor((b.clientHeight - 20) / (d.offsetHeight || 20)) - 2);
  while (b.childNodes.length - (del ? 1 : 0) > max) b.removeChild(b.firstChild);
  return d;
}
const jolt = (cls, ms) => {
  const b = el('bios'); if (!b) return;
  b.classList.add(cls);
  setTimeout(() => b.classList.remove(cls), ms);
};

/* a counter that runs in jerks, stalls, and says what it thinks of that */
function memCount(line, step, tick, stallAt, onStall, done) {
  let k = 0, stalled = false;
  const mine = runId;
  const go = () => {
    if (!alive || mine !== runId || !CRT.on) return;
    k = Math.min(640, k + step + Math.floor(Math.random() * step));
    line.textContent = 'Memory test: ' + k + 'K';
    if (!stalled && stallAt && k >= stallAt) { stalled = true; onStall(() => setTimeout(go, tick)); return; }
    if (k >= 640) { line.textContent = 'Memory test: 640K ' + (stallAt ? 'OK (1 BLOCK REMAPPED)' : 'OK'); done(); return; }
    setTimeout(go, tick);
  };
  go();
}

/* ---- the reveal: the temple comes up like a tube warming ---------------- */
function reveal() {
  const sp = el('splash');
  sp.classList.remove('posting', 'flashing');
  if (P.warm) { sp.classList.add('revealing'); setTimeout(() => sp.classList.remove('revealing'), 900); }
  const b = el('bios'); b.style.display = 'none'; b.textContent = '';
}

function prompt(box, done) {
  const p = document.createElement('div');
  p.className = 'bootprompt';
  p.textContent = 'PRESS [~] TO ENTER ';
  const cur = document.createElement('span');
  cur.id = 'bootcursor';
  cur.className = 'blink';
  cur.textContent = '█';
  p.appendChild(cur);
  box.appendChild(p);
  if (snd()) { beep(660, 70); setTimeout(() => beep(990, 90), 90); }
  done();
}

/* ---- the quick boot ------------------------------------------------------ */
function quick(done) {
  const box = el('bootlines');
  box.textContent = ''; box.className = '';
  biosOpen();
  at(0, () => { whir(700, 55, 150); });
  at(120, () => { print('HOLYTRON DM-640 BIOS v0.97'); beep(880, 70); });
  at(380, () => {
    const m = memSteps(P.memtest, false);
    if (!m) { print('Memory test: 640K OK (SKIPPED)'); return; }
    const l = print('Memory test: 0K');
    memCount(l, m.step, m.tick, 0, null, () => {});
  });
  at(1150, () => { const l = print('IDE0: ST351A 20MB ...'); at(300, () => { l.textContent += ' OK'; seek(2); }); });
  at(1750, () => { print('Booting from IDE0 ...'); });
  /* POST HOLD SCREEN (SETUP, ADVANCED): the BIOS waits, counting down, for a hand that is slow to reach DEL */
  const holdMs = P.holdSecs * 1000;
  if (holdMs) at(1850, () => {
    const l = print(holdLine(P.holdSecs), 'warn');
    for (let s = P.holdSecs - 1; s >= 0; s--) at((P.holdSecs - s) * 1000, () => { l.textContent = holdLine(s); });
  });
  at(2150 + holdMs, () => {
    reveal();
    let i = 0;
    const step = () => {
      if (!alive || !CRT.on) return;
      if (i >= BOOT_LINES.length) { prompt(box, () => { alive = false; done(); }); return; }
      const d = document.createElement('div');
      d.className = 'bootline ' + BOOT_LINES[i][1];
      d.textContent = BOOT_LINES[i][0];
      box.appendChild(d);
      i++;
      at(130, step);
    };
    step();
  });
}

/* ---- the long boot ------------------------------------------------------- */
function crawl(box, done) {
  box.textContent = '';
  box.className = 'crawling';
  const block = document.createElement('div');
  block.className = 'crawltxt';
  BIRTHDAY_TEXT.forEach(([cls, t]) => {
    const d = document.createElement('div');
    d.className = 'bootline ' + (cls === 'h' ? 'y big' : cls);
    d.textContent = t || ' ';
    block.appendChild(d);
  });
  box.appendChild(block);
  const panel = box.clientHeight, h = block.scrollHeight;
  const from = panel, to = Math.min(0, panel * 0.62 - h);
  block.style.transform = 'translateY(' + from + 'px)';
  const fin = () => block.style.transform = 'translateY(' + to + 'px)';
  if (block.animate) {
    const a = block.animate([{ transform: 'translateY(' + from + 'px)' }, { transform: 'translateY(' + to + 'px)' }],
      { duration: LONG_MS - STRUGGLE_MS, easing: 'linear', fill: 'forwards' });
    a.onfinish = fin;
  } else at(LONG_MS - STRUGGLE_MS, fin);
}

function long(done) {
  const box = el('bootlines');
  box.textContent = ''; box.className = '';
  biosOpen();
  if (window.Music && window.Music.bootStruggle) window.Music.bootStruggle(STRUGGLE_MS / 1000);

  at(0,    () => { whir(1500, 38, 120); });
  at(300,  () => { print('HOLYTRON DM-640 BIOS v0.97  (C) 1994'); beep(880, 110); });
  at(800,  () => { const l = print('CPU: 80486DX-33 ......'); at(520, () => { l.textContent += ' OK'; }); });
  at(1250, () => {
    const l = print('Memory test: 0K');
    memCount(l, 22, 46, 216, resume => {
      beep(180, 260);
      jolt('jit', 500);
      const w = print('  BAD BLOCK 0x0003A7F0 ... RETRY', 'warn');
      at(380, () => { w.textContent += ' 1'; seek(2); });
      at(700, () => { w.textContent += ' 2'; seek(2); lampDip(); });
      at(1020, () => { w.textContent += ' REMAPPED'; resume(); });
    }, () => {});
  });
  at(3600, () => { print('FAN 0: 312 RPM   (LOW)', 'warn'); lampDip(); beep(220, 90); });
  at(3850, () => { print('CPU TEMP: 97C    !!', 'bad'); jolt('roll', 420); beep(180, 140); });
  at(4150, () => {
    const l = print('IDE0: spinning up ');
    let n = 0;
    const mine = runId;
    const dots = setInterval(() => {
      if (!alive || mine !== runId) { clearInterval(dots); return; }
      l.textContent += '.'; seek(1);
      if (++n >= 4) { clearInterval(dots); l.textContent += ' TIMEOUT'; l.classList.add('warn'); jolt('jit', 300); }
    }, 200);
  });
  at(5150, () => { const l = print('IDE0: retry ... ST351A 20MB'); seek(3); at(260, () => l.classList.add('ok')); });
  at(5500, () => { print('Reading boot sector ... CRC ERROR 0x1F3', 'bad'); seek(4); jolt('jit', 320); });
  at(5800, () => {                                         /* the freeze: nothing moves, the picture shakes */
    const b = el('bios'); b.classList.add('frozen'); whir(560, 230, 60);
    at(560, () => b.classList.remove('frozen'));
  });
  at(6400, () => {
    const l = print('Loading Adam (task 0) [..........]  0%');
    const seq = [9, 17, 14, 11, 26, 24, 41, 38, 55, 82, 100];
    seq.forEach((v, i) => at(i * 52, () => {
      const f = Math.round(v / 10);
      l.textContent = 'Loading Adam (task 0) [' + '█'.repeat(f) + '.'.repeat(10 - f) + '] ' + v + '%';
    }));
  });
  at(6850, () => { print('Spawning Seth ... HolyC ... DolDoc ... OK'); print('RECOVERED.', 'ok'); seek(2); });

  /* the reveal, and the text */
  at(6930, () => { el('splash').classList.add('flashing'); beep(1320, 50); });
  at(STRUGGLE_MS, () => {
    reveal();
    if (snd()) { whir(600, 90, 260); [523, 659, 784].forEach((f, i) => setTimeout(() => beep(f, 90), i * 100)); }
    crawl(box, done);
  });
  at(LONG_MS, () => { prompt(box, () => { alive = false; done(); }); });
}

/* mode: 'long' | 'quick'; done() once the prompt is up and ~ is the only way on */
export function runBootSequence(mode, done) {
  cancelBoot();
  P = biosPost(loadBios());
  alive = true;
  if (mode === 'long') long(done); else quick(done);
}
