/* The arithmetic and the in-page probes for scripts/check-contrast.mjs.
   The pure half (ratio, hex) runs in Node; `probes` are source strings for page.evaluate / addInitScript, so the same code runs in Electron (the check) and in any
   Playwright page (when something is being tuned by hand). WCAG 2 relative luminance and contrast ratio. */

export const hex = h => { h = String(h).replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)); };
export const lum = c => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
export const ratio = (a, b) => { const x = lum(typeof a === 'string' ? hex(a) : a), y = lum(typeof b === 'string' ? hex(b) : b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };

/* Informative text has to be 4.5:1 or better; a control that is switched off, or a decorative label, 3:1. */
export const TEXT_MIN = 4.5, OFF_MIN = 3;

/* Every text node under `window.__target`: its colour against what is really behind it (the first ancestor with a background, opacity folded in).
   Returns the ones below the minimum. Skips what is not on screen, the blinking cursor, and anything a stylesheet hides. */
export const auditDom = `(() => {
  const TEXT_MIN = ${TEXT_MIN}, OFF_MIN = ${OFF_MIN};
  const parse = c => { const m = c.match(/rgba?\\(([^)]+)\\)/); if (!m) return null; const p = m[1].split(/[ ,\\/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  const lum = ({ r, g, b }) => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const mix = (top, bot) => ({ r: top.r * top.a + bot.r * (1 - top.a), g: top.g * top.a + bot.g * (1 - top.a), b: top.b * top.a + bot.b * (1 - top.a), a: 1 });
  const ratio = (a, b) => { const l1 = lum(a), l2 = lum(b); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); };
  const win = window.__target; if (!win || !document.contains(win)) return null;
  const wr = win.getBoundingClientRect(), out = [], walker = document.createTreeWalker(win, NodeFilter.SHOW_TEXT);
  let n;
  while ((n = walker.nextNode())) {
    const txt = n.textContent.trim(); if (!txt) continue;
    const e = n.parentElement; if (!e || e.closest('.cur')) continue;
    const cs = getComputedStyle(e); if (cs.visibility === 'hidden' || cs.display === 'none') continue;
    const r = e.getBoundingClientRect(); if (r.width < 2 || r.height < 2) continue;
    if (r.bottom < wr.top || r.top > wr.bottom || r.right < wr.left || r.left > wr.right) continue;
    const fg = parse(cs.color); if (!fg) continue;
    let op = 1, bg = null;
    for (let a = e; a && a !== document.documentElement; a = a.parentElement) {
      const s = getComputedStyle(a); op *= parseFloat(s.opacity);
      if (!bg) { const c = parse(s.backgroundColor); if (c && c.a > 0) { bg = c; if (c.a >= 0.99) break; } }
    }
    if (!bg) bg = { r: 0, g: 0, b: 0, a: 1 };
    if (bg.a < 1) bg = mix(bg, { r: 0, g: 0, b: 0, a: 1 });
    const fg2 = mix({ r: fg.r, g: fg.g, b: fg.b, a: fg.a * op }, bg), cr = ratio(fg2, bg);
    const off = !!e.closest('button:disabled, [disabled], .locked, .off, .dis');
    if (cr < (off ? OFF_MIN : TEXT_MIN)) out.push({ sel: e.tagName.toLowerCase() + (typeof e.className === 'string' && e.className ? '.' + e.className.trim().split(/\\s+/).slice(0, 2).join('.') : ''),
      txt: txt.slice(0, 26), cr: +cr.toFixed(2), px: parseFloat(cs.fontSize), fg: [fg2.r, fg2.g, fg2.b].map(Math.round).join(','), bg: [bg.r, bg.g, bg.b].map(Math.round).join(','), off: off });
  }
  return out;
})()`;

/* What can be pressed in the window: tabs, shelves, lessons, rows. Numbers them so a click can find them again. */
export const clickables = `(() => {
  const win = window.__target; if (!win) return [];
  return [...win.querySelectorAll('button, [role=tab], .shoptab, .mgtab, .tr-area, .tr-b, .hc-tab, .g-tab, .ck-lv, [data-tab], .nrow, .helptopic')]
    .filter(e => { const r = e.getBoundingClientRect(), s = getComputedStyle(e); return r.width > 4 && r.height > 4 && s.visibility !== 'hidden' && s.display !== 'none' && !e.disabled; })
    .map((e, i) => { e.dataset.cx = i; return { i: i, t: (e.textContent || e.title || '').trim().slice(0, 24) }; });
})()`;

/* Canvas text: fillText is wrapped, and for each distinct (canvas, colour, size, words) the colour under the text box is read BEFORE the text is drawn. */
export const canvasHook = `(() => {
  if (window.__txHooked) return; window.__txHooked = true;
  window.__tx = new Map(); window.__txOn = false;
  const parse = c => { if (typeof c !== 'string') return null; let m = c.match(/^#([0-9a-f]{3})$/i); if (m) return m[1].split('').map(x => parseInt(x + x, 16)); m = c.match(/^#([0-9a-f]{6})/i); if (m) return [0, 2, 4].map(i => parseInt(m[1].slice(i, i + 2), 16)); m = c.match(/rgba?\\(([^)]+)\\)/); if (m) return m[1].split(',').slice(0, 3).map(Number); return null; };
  const L = c => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
  const R = (a, b) => { const x = L(a), y = L(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const orig = CanvasRenderingContext2D.prototype.fillText;
  CanvasRenderingContext2D.prototype.fillText = function (text, x, y, mw) {
    try {
      if (window.__txOn && String(text).trim().length > 1 && window.__tx.size < 4000) {
        const fg = parse(this.fillStyle), px = parseFloat((this.font.match(/(\\d+(?:\\.\\d+)?)px/) || [0, 12])[1]);
        const key = this.canvas.className + '|' + String(this.fillStyle) + '|' + px + '|' + String(text).slice(0, 14);
        if (fg && !window.__tx.has(key)) {
          const w = Math.max(2, Math.min(300, Math.ceil(this.measureText(String(text)).width))), t = this.getTransform(), cx = this.canvas.width, cy = this.canvas.height;
          const sx = Math.max(0, Math.min(cx - 1, Math.round(x * t.a + t.e))), sy = Math.max(0, Math.min(cy - 1, Math.round(y * t.d + t.f - px * t.d * 0.8)));
          const sw = Math.max(1, Math.min(cx - sx, Math.ceil(w * Math.abs(t.a)))), sh = Math.max(1, Math.min(cy - sy, Math.ceil(px * Math.abs(t.d))));
          const d = this.getImageData(sx, sy, sw, sh).data, cnt = new Map();
          for (let i = 0; i < d.length; i += 4) { const k = d[i] + ',' + d[i + 1] + ',' + d[i + 2]; cnt.set(k, (cnt.get(k) || 0) + 1); }
          let best = null, bc = 0; cnt.forEach((v, k) => { if (v > bc) { bc = v; best = k; } });
          window.__tx.set(key, { txt: String(text).slice(0, 26), fg: String(this.fillStyle), bg: best, cr: +R(fg, best.split(',').map(Number)).toFixed(2), px: px, cls: this.canvas.className });
        }
      }
    } catch (e) { /* a probe never breaks a game */ }
    return orig.call(this, text, x, y, mw);
  };
})()`;

/* Open `id`, walk its buttons (never the ones that destroy), and gather every low-contrast text kind seen on the way. `page` is any Playwright page that has booted the machine. */
export async function auditApp(page, id, o = {}) {
  const skip = o.skip || /DELETE|RESET|ERASE|WIPE|QUIT|CLOSE|EXIT|SELL|REMOVE|EMPTY|FORMAT|NEW GAME|CLEAR|PURGE|SHUTDOWN|POWER|REBOOT|BURN|DEGAUSS|TRASH/i;
  const seen = new Map();
  const grab = async tag => {
    const r = await page.evaluate(auditDom); if (!r) return;
    r.forEach(x => { const k = x.sel + '|' + x.fg + '|' + x.bg + '|' + x.txt; if (!seen.has(k)) seen.set(k, { ...x, tag, area: 'dom' }); });
  };
  await page.evaluate(canvasHook).catch(() => {});
  await page.evaluate(async ([id, args]) => {
    const wm = await import('/kernel/wm.js'), before = new Set(document.querySelectorAll('.win'));
    await wm.openWindow(id, args);
    await new Promise(r => setTimeout(r, 500));
    const now = [...document.querySelectorAll('.win')].filter(w => !before.has(w));
    window.__target = now[now.length - 1] || null; window.__before = before; window.__tx.clear(); window.__txOn = true;
  }, [id, (o.args && o.args[id]) || {}]);
  await page.waitForTimeout(o.settle || 1300);
  await grab('open');
  /* scenes that cannot be reached by clicking the buttons the window shows (a level, a deal, a bench opened by a key): the caller drives, each step is measured */
  for (const [name, step] of (o.steps && o.steps[id]) || []) { await step(page); await page.waitForTimeout(350); await grab(name); }
  let clicks = 0;
  const done = new Set();
  for (let round = 0; round < 3 && clicks < (o.clicks || 30); round++) {
    const list = await page.evaluate(clickables);
    for (const c of list) {
      if (clicks >= (o.clicks || 30)) break;
      if (done.has(c.t + '|' + round) || skip.test(c.t)) continue;
      done.add(c.t + '|' + round);
      await page.evaluate(() => { document.querySelectorAll('.win').forEach(w => { if (w !== window.__target && !window.__before.has(w)) w.remove(); }); });
      const ok = await page.evaluate(i => { const e = window.__target && window.__target.querySelector('[data-cx="' + i + '"]'); if (!e) return false; e.click(); return true; }, c.i).catch(() => false);
      if (!ok) continue;
      clicks++;
      await page.waitForTimeout(220);
      await grab('after "' + c.t + '"');
      if (!(await page.evaluate(() => document.contains(window.__target)))) break;
    }
    if (!(await page.evaluate(() => document.contains(window.__target)))) break;
  }
  const cv = await page.evaluate(() => [...window.__tx.values()].filter(x => x.cr < 4.5 && !(x.fg === '#000000' && x.cr < 1.5)));
  cv.forEach(x => seen.set('cv|' + x.cls + '|' + x.fg + '|' + x.txt, { ...x, sel: 'canvas.' + x.cls, off: false, tag: 'canvas', area: 'canvas' }));
  await page.evaluate(() => { window.__txOn = false; document.querySelectorAll('.win').forEach(w => { if (!window.__before.has(w)) w.remove(); }); });
  return { id, clicks, found: [...seen.values()].sort((a, b) => a.cr - b.cr) };
}
