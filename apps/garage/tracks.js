/* The track list: one card per track, with its instrument, mute, solo, a level, and a
   menu of what can be done to the track as a whole (duplicate, move, clear, delete).
   The mixer proper (EQ, compressor, sends, meters) is its own panel. */
import { el, btn, slider, menu } from './ui.js';
import { HEX, TRACK_COLORS, MAX_TRACKS } from './model.js';
import * as E from './edit.js';

export const colourOf = (song, i) => HEX[song.tracks[i].color != null ? song.tracks[i].color : TRACK_COLORS[i % TRACK_COLORS.length]];

export function makeTracks(host, api) {
  const list = el('div', 'g-tracks');
  host.appendChild(list);
  const foot = el('div', 'g-tfoot');
  host.appendChild(foot);
  const meters = new Map();                         /* track id -> its little level meter */

  function trackMenu(anchor, i) {
    const G = api.G, song = G.song, t = song.tracks[i], L = api.lang;
    menu(api.root, anchor, [
      ['RENAME', () => api.ctx.ask('NAME THIS TRACK', t.name, v => { if (v && v.trim()) { t.name = v.trim().toUpperCase().slice(0, 12); api.changed('edit'); } })],
      ['DUPLICATE TRACK', () => {
        if (song.tracks.length >= MAX_TRACKS) { api.toast('THAT IS ALL THE TRACKS THERE ARE ROOM FOR (' + MAX_TRACKS + ').'); return; }
        const c = L.newTrack(JSON.parse(JSON.stringify(Object.assign({}, t, { id: undefined }))));
        c.name = (t.name + ' 2').slice(0, 12);
        song.tracks.splice(i + 1, 0, c); G.sel = i + 1; api.selectTrack(i + 1, true); api.changed('edit');
      }],
      ['MOVE UP', () => { if (i > 0) { [song.tracks[i - 1], song.tracks[i]] = [song.tracks[i], song.tracks[i - 1]]; G.sel = i - 1; api.changed('edit'); } }, '', i === 0],
      ['MOVE DOWN', () => { if (i < song.tracks.length - 1) { [song.tracks[i + 1], song.tracks[i]] = [song.tracks[i], song.tracks[i + 1]]; G.sel = i + 1; api.changed('edit'); } }, '', i === song.tracks.length - 1],
      ['NEXT COLOUR', () => { const cur = t.color != null ? t.color : TRACK_COLORS[i % TRACK_COLORS.length], k = TRACK_COLORS.indexOf(cur); t.color = TRACK_COLORS[(k + 1) % 8]; api.changed('edit'); }],
      null,
      ['CLEAR ALL NOTES', () => { E.itemsOf(t).length = 0; api.clearSel(); api.changed('edit'); api.toast('TRACK CLEARED. CTRL+Z BRINGS IT BACK.'); }],
      ['DELETE TRACK', () => { if (song.tracks.length > 1) { song.tracks.splice(i, 1); api.selectTrack(Math.min(G.sel, song.tracks.length - 1), true); api.changed('edit'); api.toast('TRACK DELETED. CTRL+Z BRINGS IT BACK.'); } }, '', song.tracks.length < 2]
    ]);
  }

  function render() {
    const G = api.G, song = G.song;
    list.replaceChildren(); meters.clear();
    song.tracks.forEach((t, i) => {
      const on = i === G.sel, col = colourOf(song, i);
      const card = el('div', 'g-card' + (on ? ' sel' : '') + (t.mute ? ' muted' : ''));
      card.style.borderLeftColor = col;
      const top = el('div', 'g-ctop');
      const chip = el('span', 'g-chip'); chip.style.background = col;
      const nm = el('span', 'g-cname', t.name);
      nm.title = 'DOUBLE-CLICK TO RENAME';
      nm.addEventListener('dblclick', ev => { ev.stopPropagation(); api.ctx.ask('NAME THIS TRACK', t.name, v => { if (v && v.trim()) { t.name = v.trim().toUpperCase().slice(0, 12); api.changed('edit'); } }); });
      const mt = btn('M', 'g-sm' + (t.mute ? ' on' : ''), () => { t.mute = !t.mute; api.changed('mix'); }, 'MUTE: HUSH THIS TRACK');
      const so = btn('S', 'g-sm' + (t.solo ? ' on' : ''), () => { t.solo = !t.solo; api.changed('mix'); }, 'SOLO: ONLY HEAR THIS ONE');
      const more = btn('…', 'g-sm', (ev, b) => trackMenu(b, i), 'MORE: DUPLICATE, MOVE, CLEAR, DELETE');
      top.append(chip, nm, mt, so, more);
      card.appendChild(top);
      card.appendChild(btn(api.instrumentName(t.inst) + '  ▼', 'g-inst', () => api.pickInstrument(i), 'CHOOSE A DIFFERENT INSTRUMENT'));
      const row = el('div', 'g-mrow');
      row.append(el('span', 'g-mlbl', 'VOL'), slider(0, 1, t.vol == null ? 0.8 : t.vol, 0.01, val => { t.vol = val; api.changed('mix'); }));
      const mc = el('canvas', 'g-cmeter'); mc.width = 40; mc.height = 6; meters.set(t.id, mc);
      row.appendChild(mc);
      card.appendChild(row);
      if (on) {
        [['PAN', -1, 1, t.pan || 0, 'pan'], ['ROOM', 0, 1, t.reverb == null ? 0.15 : t.reverb, 'reverb']].forEach(([lb, lo, hi, v, k]) => {
          const r = el('div', 'g-mrow');
          r.append(el('span', 'g-mlbl', lb), slider(lo, hi, v, 0.01, val => { t[k] = val; api.changed('mix'); }));
          card.appendChild(r);
        });
      }
      card.addEventListener('mousedown', ev => { if (ev.button === 0 && G.sel !== i) api.selectTrack(i); });
      list.appendChild(card);
    });
    foot.replaceChildren();
    const add = btn('+ TRACK', 'g-wide', () => api.addTrack(), 'ADD ANOTHER INSTRUMENT');
    add.disabled = song.tracks.length >= MAX_TRACKS;
    foot.append(add);
  }
  /* the level on each card, from the player's meters */
  function level(lv) {
    meters.forEach((cv, id) => {
      const g = cv.getContext('2d'), m = lv && lv.tracks[id], x = m ? Math.min(1, Math.pow(m.peak, 0.5)) : 0;
      g.fillStyle = '#000'; g.fillRect(0, 0, 40, 6);
      g.fillStyle = x > 0.9 ? '#FF5555' : x > 0.65 ? '#FFFF55' : '#55FF55'; g.fillRect(0, 0, Math.round(40 * x), 6);
    });
  }
  render();
  return { render, level };
}
