#!/usr/bin/env node
/* node scripts/check-theme.mjs -- the schemes as a whole look (pure Node).
   A scheme is a gradient map over everything under it (kernel/theme_fx.js), so what has to be true is about the pixels that come out:
   - the ramp is a ramp: from the background to the top the brightness only moves one way;
   - what is text on VGA stays text: white, light grey, yellow, light green, light cyan, the machine's own inks, mapped through each scheme, still read against the
     scheme's mapped black at 4.5:1; the dimmer colours that carry information (light red, light magenta, light blue, brown, dark grey) at 3:1;
   - every scheme has its own filter, VGA has none, and the filter is made of well-formed table values. */
import { SCHEMES } from '../kernel/cos_data.js';
import { rampOf, mapColour, contrast, relLum, filterOf, varsOf, deskOf, GAMMA } from '../kernel/theme_fx.js';

let bad = 0, n = 0;
const ok = (c, m) => { n++; if (!c) { bad++; console.log('FAIL ' + m); } };
const H = c => { const x = parseInt(c.slice(1), 16); return [(x >> 16) & 255, (x >> 8) & 255, x & 255]; };
const TEXT = { WHITE: '#FFFFFF', LGREY: '#AAAAAA', YELLOW: '#FFFF55', LGREEN: '#55FF55', LCYAN: '#55FFFF' };
const INFO = { LRED: '#FF5555', LMAGENTA: '#FF55FF', LBLUE: '#5555FF', BROWN: '#AA5500', DGREY: '#555555' };

for (const s of SCHEMES) {
  const r = rampOf(s.v), bgL = relLum(r[0]);
  if (s.id === 'vga') continue;            /* the default look has no filter: nothing is mapped */
  const up = s.id === 'paper' || relLum(r[0]) > relLum(r[3]);          /* a light scheme's ramp runs from light to dark */
  for (let i = 1; i < r.length; i++) ok(up ? relLum(r[i]) <= relLum(r[i - 1]) + 1e-6 : relLum(r[i]) >= relLum(r[i - 1]) - 1e-6, s.id + ': the ramp moves one way (stop ' + i + ')');
  const black = mapColour(s.v, [0, 0, 0]);
  ok(contrast(black, r[0]) < 1.4, s.id + ': black maps to the scheme\'s own background (' + contrast(black, r[0]).toFixed(2) + ')');
  for (const k in TEXT) { const c = contrast(mapColour(s.v, H(TEXT[k])), black); ok(c >= 4.5, s.id + ': ' + k + ' text is ' + c.toFixed(2) + ':1 on the scheme\'s black, under 4.5'); }
  for (const k in INFO) { const c = contrast(mapColour(s.v, H(INFO[k])), black); ok(c >= 3, s.id + ': ' + k + ' is ' + c.toFixed(2) + ':1 on the scheme\'s black, under 3'); }
  /* the desk is distinguishable from the glass around it, and from white text */
  ok(contrast(H(deskOf(s.v, s.id)), H(s.v.bg)) < 3, s.id + ': the desktop colour is a shade of the scheme, not another colour');
  const v = varsOf(s, false), w = varsOf(s, true);
  ok(s.id === 'vga' ? v['--th-filter'] === 'none' : v['--th-filter'] === 'url(#th-' + s.id + ')', s.id + ': filter variable');
  ok(!('--sch-bg' in w) && w['--th-filter'] === v['--th-filter'], s.id + ': a window gets the filter and none of the inks (nothing is recoloured twice)');
  if (s.id !== 'vga') { const f = filterOf(s.id, s.v); ok(/id="th-/.test(f) && !/NaN|undefined/.test(f) && (f.match(/tableValues="/g) || []).length === 3, s.id + ': filter markup'); }
}
ok(GAMMA > 0.5 && GAMMA < 1, 'the lift is a lift');
ok(SCHEMES.some(s => s.id === 'vga'), 'the default scheme exists');
console.log(bad ? '\nFAILED ' + bad + ' of ' + n : 'ok  - ' + SCHEMES.length + ' schemes as whole looks (' + n + ' checks)');
process.exit(bad ? 1 : 0);
