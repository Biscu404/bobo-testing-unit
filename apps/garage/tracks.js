/* The track list and its mixer: one card per track, with the instrument,
   mute, solo, delete, and (on the card you are on, or all of them with MIXER)
   volume, pan and room. */
import { el, btn, slider } from './ui.js';
import { HEX, TRACK_COLORS, MAX_TRACKS } from './model.js';

export function makeTracks(host, api) {
  const list = el('div', 'g-tracks');
  host.appendChild(list);
  const foot = el('div', 'g-tfoot');
  host.appendChild(foot);

  function render() {
    const G = api.G, song = G.song;
    list.replaceChildren();
    song.tracks.forEach((t, i) => {
      const on = i === G.sel, col = HEX[TRACK_COLORS[i % TRACK_COLORS.length]];
      const card = el('div', 'g-card' + (on ? ' sel' : ''));
      card.style.borderLeftColor = col;
      const top = el('div', 'g-ctop');
      const chip = el('span', 'g-chip'); chip.style.background = col;
      const nm = el('span', 'g-cname', t.name);
      nm.title = 'DOUBLE-CLICK TO RENAME';
      nm.addEventListener('dblclick', ev => { ev.stopPropagation(); api.ctx.ask('NAME THIS TRACK', t.name, v => { if (v && v.trim()) { t.name = v.trim().toUpperCase().slice(0, 12); api.changed('edit'); } }); });
      top.append(chip, nm,
        btn('M', 'g-sm' + (t.mute ? ' on' : ''), () => { t.mute = !t.mute; api.changed('mix'); }, 'MUTE: HUSH THIS TRACK'),
        btn('S', 'g-sm' + (t.solo ? ' on' : ''), () => { t.solo = !t.solo; api.changed('mix'); }, 'SOLO: ONLY HEAR THIS ONE'),
        btn('X', 'g-sm g-del', () => { if (song.tracks.length > 1) { song.tracks.splice(i, 1); G.sel = Math.min(G.sel, song.tracks.length - 1); api.changed('edit'); } }, 'TAKE THIS TRACK AWAY'));
      card.appendChild(top);
      const inst = api.instrumentName(t.inst);
      card.appendChild(btn(inst + '  ▼', 'g-inst', () => api.pickInstrument(i), 'CHOOSE A DIFFERENT INSTRUMENT'));
      if (on || G.mixerOpen) {
        const mix = el('div', 'g-cmix');
        [['VOL', 0, 1, t.vol, 'vol'], ['PAN', -1, 1, t.pan, 'pan'], ['ROOM', 0, 1, t.reverb, 'reverb']].forEach(([lb, lo, hi, v, k]) => {
          const row = el('div', 'g-mrow');
          row.append(el('span', 'g-mlbl', lb), slider(lo, hi, v, 0.01, val => { t[k] = val; api.changed('mix'); }));
          mix.appendChild(row);
        });
        card.appendChild(mix);
      }
      if (on && t.inst !== 'drums') {
        const oct = el('div', 'g-octrow');
        oct.append(el('span', 'g-mlbl', 'HIGHER'), btn('▲', 'g-sm', () => { t.lo = Math.min(84, t.lo + 12); api.changed('view'); }, 'SHOW HIGHER NOTES'),
          btn('▼', 'g-sm', () => { t.lo = Math.max(24, t.lo - 12); api.changed('view'); }, 'SHOW LOWER NOTES'));
        card.appendChild(oct);
      }
      card.addEventListener('mousedown', ev => { if (ev.button === 0 && G.sel !== i) { G.sel = i; api.changed('select'); } });
      list.appendChild(card);
    });
    foot.replaceChildren();
    foot.append(
      btn('+ TRACK', 'g-wide', () => api.addTrack(), 'ADD ANOTHER INSTRUMENT'),
      btn(api.G.mixerOpen ? 'MIXER: ON' : 'MIXER', 'g-wide' + (api.G.mixerOpen ? ' on' : ''), () => { api.G.mixerOpen = !api.G.mixerOpen; render(); }, 'SHOW VOLUME, PAN AND ROOM FOR EVERY TRACK'));
    const mrow = el('div', 'g-mrow g-master');
    mrow.append(el('span', 'g-mlbl', 'MASTER'), slider(0, 1, api.studio.user, 0.01, v => { api.studio.user = v; api.studio.relevel(); }));
    foot.appendChild(mrow);
    foot.querySelector('button').disabled = song.tracks.length >= MAX_TRACKS;
  }
  render();
  return { render };
}
