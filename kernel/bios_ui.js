/* The BIOS setup screen: text mode, blue, one screen deep. Two ways in, one screen: holding DEL while the machine powers up (kernel/boot.js puts it over
   the splash and runs POST again when it is left) and the CMOS window on the desktop (apps/cmos). The items and what they do are bios_cfg.js. */
import { ITEMS, PAGES, load, save, step, same, defaults, item } from './bios_cfg.js';

const two = n => String(n).padStart(2, '0');
const clock = () => { const d = new Date(); return two(d.getHours()) + ':' + two(d.getMinutes()) + ':' + two(d.getSeconds()); };
const date = () => { const d = new Date(); return d.getFullYear() + '-' + two(d.getMonth() + 1) + '-' + two(d.getDate()); };
const el = (cls, txt, tag) => { const e = document.createElement(tag || 'div'); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };

/* the rows of each screen: [label, value | fn, help] for a fact, { item } for a setting, { act } for an action on EXIT */
function rows(info) {
  const ago = info.away == null ? 'NEVER' : info.away < 90 ? 'JUST NOW' : info.away < 5400 ? Math.round(info.away / 60) + ' MIN AGO' : Math.round(info.away / 3600) + ' H AGO';
  return {
    MAIN: [
      ['System Time', clock, 'The real time of the room the machine is in.', 'time'],
      ['System Date', date, 'The real date. It has been the same date for as long as you have been looking at it.', 'date'],
      ['BIOS Version', 'HOLYTRON DM-640 v0.97 (C) 1994', 'The only BIOS this machine has had.'],
      ['Processor', '80486DX-33', 'It is running faster than it should. Nobody has asked it to stop.'],
      ['Base Memory', '640K', 'It is enough. It was always enough.'],
      ['Primary Master', 'ST351A 20MB  CHS 40/2/8', 'The disk the temple is kept on.'],
      ['Video', 'VGA 640x480 16 colour', 'Sixteen colours, none of them antialiased.'],
      ['God', 'PRESENT', 'Not an option. It was never an option.']
    ],
    ADVANCED: ITEMS.map(i => ({ item: i.id })).concat([
      ['Ring', '0 (only)', 'There is one ring and everything runs in it.'],
      ['Memory Hole', 'DISABLED', 'There is nothing to hide the other half of the memory in.']
    ]),
    BOOT: [
      ['Boot Device 1', 'IDE0  ST351A', 'The disk with the temple on it.'],
      ['Boot Device 2', 'NONE', 'There is no second place to boot from.'],
      ['Network Boot', 'NOT INSTALLED', 'No network stack was ever written.'],
      ['Last Power-Off', ago, 'Read from the heartbeat the machine keeps while it runs.'],
      ['Cold Start', info.cold ? 'DUE' : 'NOT DUE', 'After eight hours away the machine is cold, and it is not happy about it. That boot cannot be skipped.'],
      ['Cold After', '8 HOURS (FIXED)', 'Not a setting. The long boot is not for negotiating with.']
    ],
    EXIT: [
      { act: 'save', label: 'Save Changes & Exit', key: 'F10', help: 'Keep what you changed. The machine runs POST again.' },
      { act: 'quit', label: 'Discard Changes & Exit', key: 'ESC', help: 'Leave the settings as they were.' },
      { act: 'defaults', label: 'Load Setup Defaults', key: 'F9', help: 'Put every item back the way it came from the factory. Nothing is kept until you save.' }
    ]
  };
}

export function createSetup(host, o) {
  o = o || {};
  const info = o.info || (() => ({ away: null, cold: false }));
  let page = 0, row = 0, cfg = load(), dead = false, ask = null, clockT = null;
  const saved = load();
  const R = () => rows(info())[PAGES[page]];
  const dirty = () => !same(cfg, saved);
  const blip = (f, ms) => { try { if (o.snd && o.snd.tone) o.snd.tone(f, ms || 30, { mech: true, type: 'square', vol: 0.025 }); } catch (e) { /* silent */ } };

  const root = el('bsu' + (o.windowed ? ' win' : ''));
  host.appendChild(root);

  function finish(didSave) { if (dead) return; if (didSave) save(cfg); destroy(); if (o.onExit) o.onExit(!!didSave, cfg); }

  function act(a) {
    if (a === 'save') { blip(880, 60); if (o.onSave) o.onSave(cfg, !same(cfg, saved)); finish(true); }
    else if (a === 'quit') { if (dirty() && !ask) { ask = { q: 'Discard changes and exit?', yes: () => finish(false) }; paint(); } else finish(false); }
    else if (a === 'defaults') { cfg = defaults(); blip(660, 50); paint(); }
  }

  function paint() {
    if (dead) return;
    root.textContent = '';
    root.appendChild(el('bsu-title', 'HOLYTRON BIOS SETUP UTILITY  v0.97'));
    const tabs = el('bsu-tabs');
    PAGES.forEach((p, i) => {
      const t = el('bsu-tab' + (i === page ? ' on' : ''), p);
      t.addEventListener('mousedown', ev => { ev.preventDefault(); ev.stopPropagation(); page = i; row = 0; blip(520); paint(); });
      tabs.appendChild(t);
    });
    root.appendChild(tabs);

    const body = el('bsu-body'), list = el('bsu-list'), side = el('bsu-help');
    const rs = R();
    row = Math.max(0, Math.min(rs.length - 1, row));
    let helpText = '';
    rs.forEach((r, i) => {
      const line = el('bsu-row' + (i === row ? ' sel' : ''));
      let help = '';
      if (r.act) {
        line.appendChild(el('k', r.label)); line.appendChild(el('v', '[' + r.key + ']'));
        help = r.help;
        line.addEventListener('mousedown', ev => { ev.preventDefault(); ev.stopPropagation(); row = i; act(r.act); });
      } else if (r.item) {
        const it = item(r.item), changed = cfg[it.id] !== saved[it.id];
        line.appendChild(el('k', it.label));
        const v = el('v ed' + (changed ? ' changed' : ''), '[' + it.values[cfg[it.id]] + ']');
        line.appendChild(v); help = it.help;
        line.addEventListener('mousedown', ev => { ev.preventDefault(); ev.stopPropagation(); if (row === i) { cfg = step(cfg, it.id, 1); blip(700); } else { row = i; blip(520); } paint(); });
      } else {
        line.appendChild(el('k', r[0]));
        const v = el('v ro', typeof r[1] === 'function' ? r[1]() : r[1]);
        if (r[3]) v.dataset.live = r[3];
        line.appendChild(v); help = r[2];
        line.addEventListener('mousedown', ev => { ev.preventDefault(); ev.stopPropagation(); row = i; blip(520); paint(); });
      }
      if (i === row) helpText = help;
      list.appendChild(line);
    });
    side.appendChild(el('bsu-h', 'Item Help'));
    side.appendChild(el('bsu-ht', helpText));
    if (dirty()) side.appendChild(el('bsu-dirty', 'CHANGES NOT SAVED'));
    body.appendChild(list); body.appendChild(side);
    root.appendChild(body);

    const foot = el('bsu-foot');
    ['←→ Select Screen', '↑↓ Select Item', '+/- Change Value', 'F9 Defaults', 'F10 Save & Exit', 'ESC Exit'].forEach(t => foot.appendChild(el('', t, 'span')));
    root.appendChild(foot);

    if (ask) {
      const box = el('bsu-ask'); box.appendChild(el('', ask.q)); box.appendChild(el('bsu-ay', '[Y] Yes   [N] No'));
      root.appendChild(box);
    }
  }

  /* the live rows (the time) are rewritten in place so a second ticking over does not rebuild the screen */
  const tick = () => { root.querySelectorAll('[data-live]').forEach(v => { v.textContent = v.dataset.live === 'time' ? clock() : date(); }); };
  clockT = setInterval(tick, 1000);

  function key(ev) {
    if (dead) return false;
    const k = ev.key;
    if (ask) {
      if (k === 'y' || k === 'Y' || k === 'Enter') { const y = ask.yes; ask = null; y(); }
      else if (k === 'n' || k === 'N' || k === 'Escape') { ask = null; paint(); }
      return true;
    }
    const rs = R(), cur = rs[row];
    if (k === 'ArrowDown') { row = (row + 1) % rs.length; blip(500, 18); paint(); return true; }
    if (k === 'ArrowUp') { row = (row - 1 + rs.length) % rs.length; blip(500, 18); paint(); return true; }
    if (k === 'ArrowRight' || k === 'Tab') { page = (page + (ev.shiftKey ? -1 : 1) + PAGES.length) % PAGES.length; row = 0; blip(560, 24); paint(); return true; }
    if (k === 'ArrowLeft') { page = (page - 1 + PAGES.length) % PAGES.length; row = 0; blip(560, 24); paint(); return true; }
    if (k === 'F10') { act('save'); return true; }
    if (k === 'F9') { act('defaults'); return true; }
    if (k === 'Escape') { act('quit'); return true; }
    if (cur && cur.item) {
      const dir = k === '+' || k === '=' || k === 'PageUp' || k === 'Enter' || k === ' ' ? 1 : k === '-' || k === '_' || k === 'PageDown' ? -1 : 0;
      if (dir) { cfg = step(cfg, cur.item, dir); blip(700, 30); paint(); return true; }
    }
    if (cur && cur.act && (k === 'Enter' || k === ' ')) { act(cur.act); return true; }
    return k.length === 1 || k.startsWith('F') || k.startsWith('Arrow') || k === 'Delete' || k === 'Backspace';
  }

  function destroy() { dead = true; clearInterval(clockT); if (root.parentNode) root.parentNode.removeChild(root); }
  paint();
  return { key, destroy, root, get cfg() { return cfg; }, get dirty() { return dirty(); } };
}
