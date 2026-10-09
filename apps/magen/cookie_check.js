/* node apps/magen/cookie_check.js -- Biscu's cookie as Magen's star (pure Node: no window). It is drawn the size the star is, in the machine's colours, nothing else about the star
   moves, and it is only offered once the cookie has been given. */
import { drawCookie, createCookie } from './cookie.js';

let fails = 0, checks = 0;
const ok = (c, label, detail) => { checks++; if (c) { console.log('OK   ' + label.padEnd(84) + (detail || '')); return true; } fails++; console.log('FAIL ' + label + '   ' + (detail || '')); return false; };

for (const rr of [55, 62, 66]) {
  const rects = [], R = (x, y, w, h, c) => rects.push([x, y, w, h, c]);
  drawCookie(R, 150, 120, rr);
  const xs0 = Math.min(...rects.map(r => r[0])), xs1 = Math.max(...rects.map(r => r[0] + r[2])), ys0 = Math.min(...rects.map(r => r[1])), ys1 = Math.max(...rects.map(r => r[1] + r[3]));
  ok(rects.length > 40 && rects.every(r => [0, 6, 14].includes(r[4])), 'a cookie for a star of ' + rr + ': ' + rects.length + ' rectangles, only black, brown and yellow');
  ok(xs1 - xs0 >= rr * 1.7 && xs1 - xs0 <= rr * 2.2 && ys1 - ys0 >= rr * 1.7 && ys1 - ys0 <= rr * 2.2, '... about as wide and as tall as the star (' + (xs1 - xs0) + ' by ' + (ys1 - ys0) + ' for a radius of ' + rr + ')');
  ok(Math.abs((xs0 + xs1) / 2 - 150) <= 3 && Math.abs((ys0 + ys1) / 2 - 120) <= 3, '... and centred where the star was');
  ok(rects.every(r => r[2] % 2 === 0 && r[3] === 2), '... in whole two-pixel steps, never smoothed');
}
/* the button: hidden, and the star a star, until the cookie is given */
{
  const els = { style: {}, textContent: '', title: '', handlers: {}, addEventListener(t, f) { this.handlers[t] = f; } };
  let has = false; const L = [];
  globalThis.window = globalThis; globalThis.Gifts = { has: id => has && id === 'cookie', given: () => [] };
  globalThis.addEventListener = (t, f) => L.push([t, f]); globalThis.removeEventListener = (t, f) => { const i = L.findIndex(x => x[0] === t && x[1] === f); if (i >= 0) L.splice(i, 1); };
  const store = {}; globalThis.localStorage = { getItem: k => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); } };
  const heard = []; const ck = createCookie(els, on => heard.push(on));
  ok(els.style.display === 'none' && !ck.isCookie(), 'without the cookie the button is not there and the star is a star');
  els.handlers.mousedown && els.handlers.mousedown();
  ok(heard.length === 0 && !ck.isCookie(), 'and pressing where it would be does nothing');
  has = true; L.filter(x => x[0] === 'gift-given').forEach(([, f]) => f({ detail: { id: 'cookie' } }));
  ok(els.style.display === '' && ck.isCookie() && els.textContent === 'STAR: A COOKIE' && heard.join() === 'true', 'the moment the cookie is given the button is there and the cookie is the star');
  els.handlers.mousedown();
  ok(!ck.isCookie() && els.textContent === 'STAR: A STAR' && store['templeos.magen.cookie.v1'] === '0', 'pressed, it is the star again, and that is remembered');
  els.handlers.mousedown();
  ok(ck.isCookie() && store['templeos.magen.cookie.v1'] === '1', 'and pressed again, the cookie');
  ck.dispose(); ok(L.filter(x => x[0] === 'gift-given').length === 0, 'closing the window stops it listening for gifts');
}
console.log(fails ? '\n' + fails + ' FAILED of ' + checks : '\nmagen cookie: all ' + checks + ' ok');
process.exit(fails ? 1 : 0);
