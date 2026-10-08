/* BAND IN A BOX: drums, bass and chords in the song's key, from a style and a chord progression.
   The old band goes, the melody stays, and it can be undone. */
import { el, btn, modal } from './ui.js';
import { MAX_TRACKS } from './model.js';

export function bandMenu(root, api, defaultLo) {
  const G = api.G, L = api.lang, S = api.studio;
  const m = modal(root, 'BAND IN A BOX', 'g-small');
  let style = 'pop', prog = Object.keys(L.PROGRESSIONS)[0];
  m.body.append(el('div', 'g-p', 'A BAND THAT PLAYS IN THE KEY OF THE SONG (' + G.song.key + ' ' + (L.SCALES[G.song.scale] || {}).name + '), SO IT ALWAYS FITS.'));
  const pick = (head, items, get, set) => {
    m.body.appendChild(el('div', 'g-famhead', head));
    const row = el('div', 'g-bandrow'), bs = [];
    items.forEach(k => { const b = btn(k[1], 'g-big', () => { set(k[0]); bs.forEach((x, i) => x.classList.toggle('on', items[i][0] === get())); }); b.classList.toggle('on', get() === k[0]); bs.push(b); row.appendChild(b); });
    m.body.appendChild(row);
  };
  pick('STYLE', Object.keys(L.STYLES).map(k => [k, L.STYLES[k].name]), () => style, v => { style = v; });
  pick('CHORDS', Object.keys(L.PROGRESSIONS).map(k => [k, L.PROGRESSIONS[k].name]), () => prog, v => { prog = v; });
  const foot = el('div', 'g-boxfoot');
  foot.append(btn('ADD THE BAND', 'g-go', () => {
    const add = L.accompany(G.song, style, prog);
    G.song.tracks = G.song.tracks.filter(t => !/^(DRUMS|BASS|CHORDS|PAD)$/.test(t.name));
    add.forEach(t => { t.lo = defaultLo(t.inst, t); if (G.song.tracks.length < MAX_TRACKS) G.song.tracks.push(t); });
    S.preload(G.song).then(() => { if (!api.player()) api.toggle(); });
    api.selectTrack(Math.min(G.sel, G.song.tracks.length - 1), true);
    api.trophy.band(); api.changed('edit'); m.close();
  }), btn('CANCEL', '', () => m.close()));
  m.body.append(foot, el('div', 'g-p g-dim', 'TIP: PLAY IT, THEN DRAW A MELODY OVER THE TOP.'));
}
