/* The front door: the campaign, or the plain game in its three sizes. */
import { CLASSIC, REGIONS } from './data.js';
import { CLASSIC_SUN } from './pay.js';
import { backdrop, weather, mask } from './art.js';

export function createTitle(env) {
  const T = { sel: 0, hits: [] };
  const rg = REGIONS[0];
  const items = () => [
    { id: 'camp', label: env.hasCamp() ? 'CONTINUE THE DESCENT' : 'BEGIN THE DESCENT', sub: 'CAMPAIGN  /  THE SUNKEN KINGDOM  /  18 ROOMS  /  PAYS SUN' },
    ...CLASSIC.map(l => ({ id: l.id, label: l.name + '   ' + l.c + 'x' + l.r, sub: 'CLASSIC  /  ' + l.m + ' LARVAE  /  ' + CLASSIC_SUN[l.id] + ' SUN' + (env.best(l.id) != null ? '  /  BEST ' + env.best(l.id) + 's' : '') }))
  ];
  T.draw = (G, now) => {
    G.fill('#000'); backdrop(G, rg); weather(G, rg, now);
    G.a(0.55); G.R(0, 0, 960, 640, '#000'); G.a(1);
    mask(G, 440, 40, 8, 'full');
    G.T('DUNGEON', 480, 138, '#9fb4d8', 44, 'center');
    G.T('SWEEPER', 480, 214, '#e8e2d4', 110, 'center');
    G.R(280, 226, 400, 3, rg.pal.ink); G.R(466, 220, 28, 15, '#000'); G.R(472, 224, 16, 7, rg.pal.ink);
    G.T('A DESCENT IN LARVAE', 480, 262, rg.pal.glow, 30, 'center');
    T.hits = [];
    items().forEach((it, i) => {
      const y = 290 + i * (i ? 58 : 66) + (i ? 18 : 0), big = i === 0, h = big ? 62 : 50, on = T.sel === i;
      G.a(on ? 0.9 : 0.6); G.R(210, y, 540, h, on ? '#26324f' : '#0b0e18'); G.a(1);
      G.R(210, y, 540, 2, on ? '#fff' : rg.pal.ink); G.R(210, y + h - 2, 540, 2, on ? '#fff' : '#3a4256');
      G.T((on ? '> ' : '  ') + it.label, 232, y + (big ? 30 : 24), on ? '#fff' : '#cfd8e0', big ? 34 : 28);
      G.T(it.sub, 232, y + (big ? 54 : 44), on ? rg.pal.glow : '#7d877f', 18);
      T.hits.push({ id: i, x: 210, y, w: 540, h });
    });
    const st = window.Sweeper.st;
    G.T('ROOMS WON ' + st.won + ' OF ' + st.played + '    STREAK ' + st.streak + ' (BEST ' + (st.bestStreak || 0) + ')', 480, 596, '#7d877f', 20, 'center');
    G.T('UP / DOWN + ENTER, OR CLICK.  F11: FULLSCREEN', 480, 620, '#98a2b8', 18, 'center');
    if (env.hasCamp()) G.T('DEL: FORGET THE CAMPAIGN', 946, 620, '#b08888', 18, 'right');
  };
  const pick = i => { const it = items()[i]; env.snd.click(); if (it.id === 'camp') env.startCampaign(); else env.startClassic(it.id); };
  T.mouse = (type, ev, lx, ly) => {
    const h = T.hits.find(q => lx >= q.x && lx <= q.x + q.w && ly >= q.y && ly <= q.y + q.h);
    if (!h) return;
    if (type === 'move') T.sel = h.id; else if (type === 'down') pick(h.id);
  };
  T.key = ev => {
    const n = items().length;
    if (ev.key === 'ArrowDown') { T.sel = (T.sel + 1) % n; env.snd.click(); return true; }
    if (ev.key === 'ArrowUp') { T.sel = (T.sel + n - 1) % n; env.snd.click(); return true; }
    if (ev.key === 'Enter' || ev.key === ' ') { pick(T.sel); return true; }
    if (ev.key === 'Delete' && env.hasCamp()) { env.forget(); return true; }
    return false;
  };
  return T;
}
