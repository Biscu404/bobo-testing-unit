/* Biscu's cookie, for the star. Once the credits have given it (apps/gifts_scope.js), a button in the bottom bar swaps the star on the stage for the cookie and back; the choice is kept
   (templeos.magen.cookie.v1). Nothing about the game changes: it is the same thing to press, the same size, with the same glow and the same glint. The cookie is the one the credits tray and the
   Garden's COOKIEBLOOM use (apps/gifts_art.js), made at the size the star happens to be this frame and drawn at two pixels to a pixel of it. */
import { cookie, runsOf } from '../gifts_art.js';
import { gifts, onGiven } from '../gifts_scope.js';

const KEY = 'templeos.magen.cookie.v1';
const read = () => { try { return localStorage.getItem(KEY) === '1'; } catch (e) { return false; } };
const write = on => { try { localStorage.setItem(KEY, on ? '1' : '0'); } catch (e) { /* kept for this sitting */ } };
const mem = { runs: {} };
const runs = n => mem.runs[n] || (mem.runs[n] = runsOf(cookie(n)));

/* the cookie where the star would be: centre (cx, cy) and the star's radius rr; R(x, y, w, h, colourIndex) fills a rectangle on the stage */
export function drawCookie(R, cx, cy, rr) {
  const n = Math.max(24, Math.round(rr)), x0 = cx - n, y0 = cy - n;
  runs(n).forEach(([x, y, len, d]) => R(x0 + x * 2, y0 + y * 2, len * 2, 2, d));
}

/* the button, and whether the cookie is the star now. `btn` is the bar's button: hidden until there is a cookie. `onChange` hears the swap. */
export function createCookie(btn, onChange) {
  let on = read();
  const show = () => {
    const has = gifts().has('cookie');
    btn.style.display = has ? '' : 'none';
    btn.textContent = on && has ? 'STAR: A COOKIE' : 'STAR: A STAR';
    btn.title = 'BISCU\'S COOKIE CAN BE THE STAR. NOTHING ELSE ABOUT IT CHANGES.';
  };
  btn.addEventListener('mousedown', () => { if (!gifts().has('cookie')) return; on = !on; write(on); show(); if (onChange) onChange(on); });
  const off = onGiven(id => { if (id === 'cookie') { on = true; write(true); show(); if (onChange) onChange(true); } });          /* the moment it is given it is the star, and can be put back */
  show();
  return { isCookie: () => on && gifts().has('cookie'), dispose: off };
}
