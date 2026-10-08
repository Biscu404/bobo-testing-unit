/* TROPHIES.EXE, the ledger. Every trophy on the machine, by game, nearest to completion first, with the live numbers on each; secrets as ??? and a rumour until they are found;
   a seal for each game finished; a strip of what was just earned and what is nearly there. Everything is read from window.Trophies and nothing is kept here but the filter and
   the pin. Keyboard: arrows move, Enter pins a card (its progress is echoed in the title bar), Tab flips between the list of games and the cards, Esc closes. */
import { areas, cards, totals, ORDER } from './model.js';
import { renderCard } from './cards.js';
import { cup } from '../trophy_art.js';
import { whenGone } from '../lifecycle.js';

const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
const snd = () => window.Snd;
const click = () => { try { if (snd()) snd().click(); } catch (e) { /* no sound */ } };
const KINDS = [['progress', 'P', 'PROGRESSION'], ['skill', 'S', 'SKILL'], ['explore', 'E', 'EXPLORE'], ['creative', 'C', 'CREATIVE'], ['joke', 'J', 'JOKE']];

export default {
  id: 'trophies',
  title: 'TROPHIES.EXE',
  width: 820,
  height: 580,
  resizable: true,
  fluid: true,

  mount(root, ctx, args) {
    args = args || {};
    const T = window.Trophies;
    const css = el('link'); css.rel = 'stylesheet'; css.href = 'apps/trophies/style.css'; root.appendChild(css);
    root.classList.add('tr'); root.tabIndex = 0;
    if (!T) { root.appendChild(el('div', 'tr-none', 'THE LEDGER IS NOT LOADED.')); return; }
    T.emit('meta', 'view', {});

    const S = { area: 'all', filter: 'all', kinds: [], query: '', sel: null, side: false, flash: null };
    const head = el('div', 'tr-head'), recent = el('div', 'tr-recent'), body = el('div', 'tr-bodyrow'), side = el('div', 'tr-side'), main = el('div', 'tr-mainpane'), list = el('div', 'tr-list');
    list.setAttribute('role', 'list');
    main.append(el('div', 'tr-area'), list); body.append(side, main);
    root.append(head, recent, body);

    /* ---- the head: the count, the tiers, the secrets, the filters ---------------------------------------------------------------------- */
    const btn = (label, cls, fn, title) => { const b = el('button', 'tr-b ' + (cls || ''), label); if (title) b.title = title; b.addEventListener('mousedown', ev => { if (ev.button !== 0) return; ev.stopPropagation(); click(); fn(b); }); b.addEventListener('keydown', ev => { ev.stopPropagation(); if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); fn(b); } }); return b; };
    const filt = {}; ['all', 'open', 'done'].forEach(f => { filt[f] = btn(f.toUpperCase(), 'f', () => { S.filter = f; draw(); }); });
    const kb = {}; KINDS.forEach(k => { kb[k[0]] = btn(k[1], 'kind k-' + k[1], () => { const i = S.kinds.indexOf(k[0]); if (i >= 0) S.kinds.splice(i, 1); else S.kinds.push(k[0]); draw(); }, k[2]); });
    const lang = btn('EN', 'lang', () => { T.st.lang = T.st.lang === 'both' ? 'en' : 'both'; T.save(); draw(); }, 'Bekkedal\'s trophies are bilingual: English only, or both');
    const search = el('input', 'tr-search'); search.placeholder = 'SEARCH'; search.spellcheck = false; search.maxLength = 30;
    search.addEventListener('input', () => { S.query = search.value; draw(); }); search.addEventListener('keydown', ev => { ev.stopPropagation(); if (ev.key === 'Escape') { search.value = ''; S.query = ''; draw(); root.focus(); } });
    const bigIcon = el('div', 'tr-bigcup'); bigIcon.innerHTML = cup('G');
    const countEl = el('div', 'tr-count'), tiersEl = el('div', 'tr-tiers'), secEl = el('div', 'tr-secs');
    const l1 = el('div', 'tr-h1'); l1.append(bigIcon, countEl, tiersEl, secEl);
    const l2 = el('div', 'tr-h2'); l2.append(filt.all, filt.open, filt.done, el('span', 'tr-gap'), ...KINDS.map(k => kb[k[0]]), el('span', 'tr-gap'), lang, search);
    head.append(l1, l2);

    /* ---- drawing ---------------------------------------------------------------------------------------------------------------------- */
    let raf = 0;
    const schedule = () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; draw(); }); };
    function draw() {
      const tt = totals(T);
      countEl.textContent = tt.done + ' / ' + tt.total;
      tiersEl.innerHTML = '';
      [['B', tt.B], ['S', tt.S], ['G', tt.G]].forEach(x => { const s = el('span', 'tr-tier t-' + x[0]); s.append(el('b', '', x[0]), document.createTextNode(' ' + x[1].done + '/' + x[1].total)); tiersEl.appendChild(s); });
      secEl.textContent = tt.secrets + ' SECRET' + (tt.secrets === 1 ? '' : 'S') + ' UNFOUND' + (tt.secretsDone ? '   ' + tt.secretsDone + ' FOUND' : '');
      Object.keys(filt).forEach(f => filt[f].classList.toggle('on', S.filter === f));
      KINDS.forEach(k => kb[k[0]].classList.toggle('on', S.kinds.indexOf(k[0]) >= 0));
      lang.textContent = T.st.lang === 'both' ? 'EN+NO' : 'EN'; lang.classList.toggle('on', T.st.lang === 'both');
      drawRecent(); drawSide(); drawList();
      ctx.setTitle('TROPHIES.EXE' + pinText());
      if (T.damaged && T.damaged()) recent.textContent = 'THE TROPHY SAVE COULD NOT BE READ. A COPY IS KEPT AS templeos.trophies.v1.bak.';
    }
    function pinText() { const d = T.st.pinned && T.get(T.st.pinned); if (!d) return ''; const p = T.progressOf(d); return '  -  ' + T.plainName(d) + (p ? ' ' + p[0] + '/' + p[1] : T.earned(d.id) ? ' DONE' : ''); }
    function drawRecent() {
      recent.innerHTML = ''; recent.appendChild(el('span', 'tr-rl', 'RECENT'));
      const rows = (T.st.recent || []).slice(0, 4);
      if (!rows.length) { recent.appendChild(el('span', 'tr-rn', 'NOTHING YET. THE FIRST ONE IS EASY.')); return; }
      rows.forEach(r => {
        const d = T.get(r.id); if (!d) return;
        const a = el('span', 'tr-ritem ' + r.kind, (r.kind === 'near' ? 'NEARLY: ' : 'EARNED: ') + (d.secret && !T.earned(d.id) ? '???' : T.plainName(d)) + (r.kind === 'near' ? ' ' + r.have + ' / ' + r.need : ''));
        a.addEventListener('mousedown', ev => { ev.stopPropagation(); click(); focusOn(d.id); }); recent.appendChild(a);
      });
    }
    function drawSide() {
      side.innerHTML = '';
      const row = (id, label, done, total, seal) => {
        const r = el('div', 'tr-srow' + (S.area === id ? ' on' : '')); r.dataset.area = id;
        r.append(el('span', 'tr-sn', label), el('span', 'tr-sc', done + '/' + total));
        if (seal) { const s = el('span', 'tr-seal'); s.innerHTML = cup('meta'); s.title = 'MASTERED'; r.appendChild(s); }
        const bar = el('div', 'tr-sbar'), f = el('i'); f.style.width = total ? Math.round(100 * done / total) + '%' : '0%'; bar.appendChild(f); r.appendChild(bar);
        r.addEventListener('mousedown', ev => { ev.stopPropagation(); click(); S.area = id; S.sel = null; draw(); list.scrollTop = 0; });
        return r;
      };
      const tt = totals(T); side.appendChild(row('all', 'NEXT UP', tt.done, tt.total, false));
      areas(T).forEach(a => side.appendChild(row(a.id, (T.names[a.id] || a.id.toUpperCase()), a.done, a.total, a.mastered)));
    }
    function drawList() {
      const keep = list.scrollTop; list.innerHTML = '';
      const area = main.firstChild, a = areas(T).find(x => x.id === S.area);
      area.innerHTML = '';
      area.append(el('span', 'tr-an', S.area === 'all' ? 'NEXT UP: THE NEAREST ONES, FROM EVERY GAME' : (T.names[S.area] || S.area.toUpperCase())), el('span', 'tr-ac', a ? a.done + ' / ' + a.total : ''));
      if (a && a.sealed) area.appendChild(el('span', 'tr-seal2' + (a.mastered ? ' on' : ''), a.mastered ? 'MASTERED' : 'MASTER SEAL: ' + a.done + '/' + a.total));
      const got = cards(T, S.area, { filter: S.filter, kinds: S.kinds, query: S.query });
      if (!got.own.length && !got.mirrors.length) list.appendChild(el('div', 'tr-empty', S.filter === 'done' ? 'NOTHING EARNED HERE YET.' : S.filter === 'open' ? 'NOTHING LEFT TO EARN HERE.' : 'NOTHING MATCHES.'));
      got.own.forEach(d => list.appendChild(wireCard(renderCard(T, d))));
      if (got.mirrors.length) {
        list.appendChild(el('div', 'tr-sub', 'THE GAME\'S OWN ACHIEVEMENTS  ' + got.mirrors.filter(d => T.earned(d.id)).length + ' / ' + got.mirrors.length + '   (SHOWN HERE: THEY PAY NOTHING AND COUNT NOWHERE)'));
        got.mirrors.forEach(d => list.appendChild(wireCard(renderCard(T, d))));
      }
      list.scrollTop = keep;
      if (S.sel) { const c = list.querySelector('[data-id="' + S.sel + '"]'); if (c) c.classList.add('sel'); }
      if (S.flash) { const c = list.querySelector('[data-id="' + S.flash + '"]'); if (c) { c.classList.add('flash'); c.scrollIntoView({ block: 'center' }); } S.flash = null; }
    }
    function wireCard(c) {
      c.addEventListener('mousedown', ev => { if (ev.button !== 0) return; ev.stopPropagation(); select(c.dataset.id); if (ev.target.classList && ev.target.classList.contains('tr-pin')) pin(c.dataset.id); });
      c.addEventListener('dblclick', () => pin(c.dataset.id));
      return c;
    }
    function select(id) { S.sel = id; list.querySelectorAll('.tr-card.sel').forEach(x => x.classList.remove('sel')); const c = list.querySelector('[data-id="' + id + '"]'); if (c) { c.classList.add('sel'); c.scrollIntoView({ block: 'nearest' }); } try { if (snd()) snd().select(); } catch (e) { /* no sound */ } }
    function pin(id) { T.pin(id); try { if (snd()) snd().pin(); } catch (e) { /* no sound */ } ctx.toast(T.isPinned(id) ? 'PINNED: ' + T.plainName(T.get(id)) + '  (' + T.pinsList().length + ' IN THE CORNER)' : 'UNPINNED.'); }
    function focusOn(id) {
      const d = T.get(id); if (!d) return;
      S.area = ORDER.indexOf(d.app) >= 0 ? d.app : 'all'; S.filter = 'all'; S.kinds = []; S.query = ''; search.value = ''; S.sel = id; S.flash = id; draw();
    }

    /* ---- keys ------------------------------------------------------------------------------------------------------------------------- */
    root.addEventListener('keydown', ev => {
      const k = ev.key;
      if (k === 'Escape') { ev.preventDefault(); ev.stopPropagation(); ctx.close(); return; }
      if (k === 'Tab') { ev.preventDefault(); S.side = !S.side; root.classList.toggle('sidefocus', S.side); click(); return; }
      if (k === '/') { ev.preventDefault(); search.focus(); return; }
      const ids = S.side ? ['all'].concat(areas(T).map(a => a.id)) : [...list.querySelectorAll('.tr-card')].map(c => c.dataset.id);
      const i = S.side ? ids.indexOf(S.area) : ids.indexOf(S.sel);
      if (k === 'ArrowDown' || k === 'ArrowUp') {
        ev.preventDefault(); const j = Math.max(0, Math.min(ids.length - 1, (i < 0 ? 0 : i + (k === 'ArrowDown' ? 1 : -1))));
        if (S.side) { S.area = ids[j]; S.sel = null; click(); draw(); } else if (ids[j]) select(ids[j]);
      } else if (k === 'ArrowRight' && S.side) { S.side = false; root.classList.remove('sidefocus'); const f = list.querySelector('.tr-card'); if (f) select(f.dataset.id); }
      else if (k === 'ArrowLeft' && !S.side) { S.side = true; root.classList.add('sidefocus'); }
      else if (k === 'Enter' && !S.side && S.sel) { ev.preventDefault(); pin(S.sel); }
    });
    ctx.setTitle('TROPHIES.EXE');
    if (args.focus) focusOn(args.focus); else draw();
    root.focus();
    const un = T.onChange(() => schedule());
    whenGone(root, () => { un(); if (raf) cancelAnimationFrame(raf); });
  },
  unmount() {}
};
