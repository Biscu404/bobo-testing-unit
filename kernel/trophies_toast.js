/* THE CARD IS OVER THE APP. It is anchored inside the window you are using (its bottom-right corner, above everything else on the machine: windows, menus and the
   taskbar are all under it), and it comes the moment the trophy does, in a run, a fight or a bench as well: while a run is on (`hold`) it is the compact kind (the name and the
   SUN, no description) and it takes no clicks, so it can never be in the way of the game under it; the full card is for when you are free to read it. It used to wait for the
   end of the run, so a trophy never seemed to arrive where you were.
   The trophy card, and the little cup on the taskbar. A trophy gets a card of its own, not the one-line toast that file operations share: anchored over the taskbar at the right
   (beside the SUN counter), 4.2 seconds, a frame in the tier's colour, the cup, the name, the exact condition, and the SUN. One card at a time, up to four waiting; more than four
   fold into one card that says how many. A trophy is recorded the instant it happens; only the card waits, while a run, a fight, a blackout or the boot is on (`hold`), and is shown
   on release (or three seconds after the end screen). A joke is allowed to interrupt, because that is the joke. The sound is a figure on the SFX bus (silent at SFX 0): three rising
   notes of C major pentatonic for bronze, four for silver, four and a shimmer for gold; a lower, slower figure for a secret; the style meter's top chord (C6 G6 C7 G7) for a seal.
   `prefers-reduced-motion`: no slide and no sparkle, the card appears and goes. The card is an aria-live region and says its tier aloud. */
import { cup, wearOf, TIER_NAME } from '../apps/trophy_art.js';
import { openWins } from './wm.js';

const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
const SHOW_MS = 4200, GAP_MS = 350, MAX_WAIT = 4;
/* the toys have no score and no fail state, so their cards are the quiet kind: the same frame and words, no sparkle and one soft chime whatever the tier (docs/achievements/toys.md) */
const QUIET = { elephant: 1, crayon: 1, garage: 1, hifi: 1, notes: 1, tools: 1 };

export function makeToast(T, o) {
  const Snd = () => window.Snd;
  let host = null, cur = null, timer = 0, waiting = [], releaseT = 0, cupEl = null, countEl = null;

  /* ---- the sound ---------------------------------------------------------------------------------------------------------------- */
  const tone = (f, ms, opt) => { try { if (Snd()) Snd().tone(f, ms, opt); } catch (e) { /* no sound on this machine */ } };
  const FIGURE = {
    B: () => [523, 659, 784].forEach((f, i) => tone(f, 120, { type: 'triangle', delay: i * 0.085, vol: 0.045 })),
    S: () => { [523, 659, 784, 1046].forEach((f, i) => tone(f, 130, { type: 'triangle', delay: i * 0.085, vol: 0.045 })); tone(2093, 260, { type: 'sine', delay: 0.34, vol: 0.012 }); },
    G: () => { [523, 659, 784, 1046].forEach((f, i) => tone(f, 150, { type: 'triangle', delay: i * 0.085, vol: 0.05 })); tone(262, 700, { type: 'sine', vol: 0.03 });
      [2093, 1568, 2637, 2093, 3136].forEach((f, i) => tone(f, 120, { type: 'sine', delay: 0.38 + i * 0.06, vol: 0.016 })); },
    secret: () => { [220, 262, 330].forEach((f, i) => tone(f, 210, { type: 'triangle', delay: i * 0.16, vol: 0.05, to: f * 0.99 })); tone(1318, 360, { type: 'sine', delay: 0.56, vol: 0.02 }); },
    meta: () => { [1046, 1568, 2093, 3136].forEach((f, i) => { tone(f, 210, { type: 'sine', delay: i * 0.1, vol: 0.04 }); tone(f, 210, { type: 'sine', delay: i * 0.1 + 0.18, vol: 0.014 }); }); },
    joke: () => { tone(440, 70, { type: 'square', to: 880, vol: 0.03 }); tone(660, 90, { type: 'square', to: 1320, delay: 0.1, vol: 0.03 }); }
  };
  const calm = d => !!QUIET[d.app] && !d.secret && !d.mastery;
  const sound = d => calm(d) ? [660, 784].forEach((f, i) => tone(f, 170, { type: 'sine', delay: i * 0.11, vol: 0.03 })) : (FIGURE[d.kind === 'joke' ? 'joke' : wearOf(d)] || FIGURE.B)();
  T.sound = sound;

  /* ---- the card ----------------------------------------------------------------------------------------------------------------- */
  /* over the window in use: its bottom-right corner, inset; with none open, the corner of the desktop it always was */
  function place() {
    if (!host) return;
    const shell = document.getElementById('shell'); if (!shell) return;
    const act = openWins.find(r => r.btn.classList.contains('active') && !r.win.classList.contains('hidden'));
    const sr = shell.getBoundingClientRect(), k = shell.offsetWidth ? sr.width / shell.offsetWidth : 1;
    if (!act) { host.style.right = '8px'; host.style.bottom = '32px'; host.style.left = ''; host.style.top = ''; return; }
    const wr = act.win.getBoundingClientRect(), W = Math.min(host.offsetWidth || 360, 360);
    const right = Math.max(8, (sr.right - wr.right) / k + 12), bottom = Math.max(30, (sr.bottom - wr.bottom) / k + 12);
    host.style.left = ''; host.style.top = ''; host.style.right = Math.round(Math.min(right, shell.offsetWidth - W - 8)) + 'px'; host.style.bottom = Math.round(bottom) + 'px';
  }
  function ensure() {
    if (host && host.isConnected) return host;
    const shell = document.getElementById('shell'); if (!shell) return null;
    host = el('div', 'tcard-host'); host.setAttribute('aria-live', 'polite'); host.setAttribute('role', 'status');
    shell.appendChild(host); return host;
  }
  function paint(d, extra) {
    const wear = wearOf(d), c = el('div', 'tcard w-' + wear + (d.kind === 'joke' ? ' joke' : ''));
    const icon = el('div', 'tc-cup'); icon.innerHTML = cup(wear);
    const body = el('div', 'tc-body');
    const top = el('div', 'tc-top');
    top.append(el('span', 'tc-kind', (d.secret ? 'SECRET FOUND' : d.mastery ? 'MASTERY' : 'TROPHY') + ' - ' + (TIER_NAME[d.tier] || 'BRONZE')), el('span', 'tc-pay', d.pay > 0 ? '+' + d.pay + ' SUN' : ''));
    body.append(top, el('div', 'tc-name', o.nameOf(d)), el('div', 'tc-desc', o.descOf(d)));
    if (extra) body.appendChild(el('div', 'tc-more', extra));
    c.append(icon, body);
    if ((wear === 'G' || wear === 'meta') && !calm(d)) for (let i = 0; i < 7; i++) { const s = el('i', 'tc-spark'); s.style.left = (10 + i * 13) + '%'; s.style.animationDelay = (i * 0.17) + 's'; c.appendChild(s); }
    c.addEventListener('mousedown', ev => { ev.stopPropagation(); hide(true); if (o.open) o.open(d.id); });
    c.dataset.id = d.id;
    return c;
  }
  function show(d, extra) {
    const h = ensure(); if (!h) return;
    if (!extra && d.reward && d.reward.length) extra = 'REWARD: ' + d.reward.map(r => r.name).join(', ') + '  (ON DAVE\'S SHELVES)';
    clearTimeout(timer);
    h.innerHTML = ''; cur = paint(d, extra); h.appendChild(cur);
    h.classList.toggle('held', T.held() > 0);                       /* mid-run: compact, and no clicks */
    place();
    sound(d);
    timer = setTimeout(() => hide(false), SHOW_MS);
  }
  function hide(quick) {
    clearTimeout(timer); if (!cur) return;
    const c = cur; cur = null; c.classList.add('out');
    setTimeout(() => { c.remove(); next(); }, quick ? 80 : 420);
  }
  function next() {
    if (cur || !waiting.length) return;
    if (waiting.length > MAX_WAIT) {
      const n = waiting.length; waiting = [];
      show({ id: 'many', name: n + ' TROPHIES', desc: 'Open TROPHIES.EXE to see them.', tier: 'S', kind: 'meta', pay: 0 }); return;
    }
    const id = waiting.shift(), d = T.get(id); if (d) setTimeout(() => { if (!cur) show(d); }, GAP_MS);
  }

  T.onChange((evt, d) => {
    if (evt === 'trophy-earned') {
      const def = T.get(d.id); if (!def) return;
      if (!def.legacy) waiting.push(d.id);
      pulseCup(def); refreshCup();
      next();
    } else if (evt === 'trophy-release') {
      if (T.held() === 0) { clearTimeout(releaseT); releaseT = setTimeout(next, o.releaseDelay == null ? 3000 : o.releaseDelay); }
    } else if (evt === 'trophies-changed') refreshCup();
  });

  /* ---- the cup on the taskbar ------------------------------------------------------------------------------------------------------- */
  function mountCup() {
    const bar = document.getElementById('taskbar'); if (!bar || document.getElementById('trophybox')) return;
    const box = el('div', 'trophybox'); box.id = 'trophybox'; box.title = 'TROPHIES. Earned across the machine. Open the ledger.';
    cupEl = el('span', 'tb-cup'); cupEl.innerHTML = cup('G');
    countEl = el('span', 'tb-n', '0');
    box.append(cupEl, countEl);
    box.addEventListener('mousedown', ev => { ev.stopPropagation(); if (Snd()) Snd().click(); if (o.open) o.open(null); });
    const anchor = document.getElementById('sunbox') || document.getElementById('clock');
    bar.insertBefore(box, anchor);
    refreshCup();
  }
  function refreshCup() { if (countEl) countEl.textContent = String(T.count()); }
  function pulseCup(def) { if (!cupEl) return; cupEl.classList.remove('pulse'); void cupEl.offsetWidth; cupEl.innerHTML = cup(wearOf(def)); cupEl.classList.add('pulse'); setTimeout(() => { if (cupEl) cupEl.innerHTML = cup('G'); }, 4800); }

  const live = () => { T.cardsLive = true; const ids = T.pendingCards.splice(0); ids.forEach(id => { const d = T.get(id); if (d && !d.legacy) waiting.push(id); }); next(); };
  return { show: show, mountCup: mountCup, refresh: refreshCup, flush: next, sound: sound, live: live };
}
