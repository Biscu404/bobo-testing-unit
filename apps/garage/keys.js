/* The keyboard under the grid: two octaves of piano for a pitched track, a row
   of pads for the kit. It plays live, holds a note as long as the key is held,
   and (with REC on and the song playing) writes what you play into the track.
   The computer keys work too:  A S D F G H J K L  are the white keys, W E T Y U O P
   the black ones, Z and X move the octave. With MAGIC NOTES on, keys that are
   not in the song's key are greyed out and silent. */
import { el } from './ui.js';
import { DRUM_ROWS, HEX, TRACK_COLORS, sortTrack } from './model.js';

const WHITE = [0, 2, 4, 5, 7, 9, 11], BLACK = { 1: 0, 3: 1, 6: 3, 8: 4, 10: 5 };
const KW = 'asdfghjkl;\'', KB = { w: 1, e: 3, t: 6, y: 8, u: 10, o: 13, p: 15 };
const PADS = [['kick', 'a'], ['snare', 's'], ['hat', 'd'], ['clap', 'f'], ['lotom', 'g'], ['hitom', 'h'], ['crash', 'j'], ['cowbell', 'k']];

export function makeKeys(host, api) {
  const wrap = el('div', 'g-keys');
  host.appendChild(wrap);
  const held = new Map();                    /* key id -> { off, start, note } */

  function press(id, midiOrKey) {
    if (held.has(id)) return;
    const G = api.G, tr = G.song.tracks[G.sel];
    if (!tr) return;
    const h = { off: null, start: null, el: wrap.querySelector('[data-k="' + id + '"]') };
    h.off = api.studio.live(tr.inst, midiOrKey, 0.85, { vol: tr.vol, pan: tr.pan, reverb: tr.reverb });
    if (h.el) h.el.classList.add('down');
    if (G.rec && api.player()) {
      h.start = Math.round(api.player().beat() * 4) / 4;
      h.at = api.player().beat();
      h.value = midiOrKey;
      if (tr.inst === 'drums') { (tr.hits = tr.hits || []).push([h.start % (G.song.bars * G.song.beats), midiOrKey, 0.9]); sortTrack(tr); api.changed('edit'); }
    }
    held.set(id, h);
  }
  function release(id) {
    const h = held.get(id);
    if (!h) return;
    held.delete(id);
    if (h.off) h.off.off();
    if (h.el) h.el.classList.remove('down');
    const G = api.G, tr = G.song.tracks[G.sel];
    if (G.rec && api.player() && h.start != null && tr && tr.inst !== 'drums') {
      const len = G.song.bars * G.song.beats;
      const dur = Math.max(0.25, Math.round((api.player().beat() - h.at) * 4) / 4);
      tr.notes.push([h.start % len, Math.min(dur, 4), h.value, 0.85]);
      sortTrack(tr); api.changed('edit');
    }
  }

  function render() {
    const G = api.G, song = G.song, tr = song.tracks[G.sel];
    wrap.replaceChildren();
    if (!tr) return;
    const col = HEX[TRACK_COLORS[G.sel % TRACK_COLORS.length]];
    if (tr.inst === 'drums') {
      const row = el('div', 'g-pads');
      PADS.forEach(([k, kb]) => {
        const p = el('div', 'g-pad');
        p.dataset.k = k;
        p.style.borderColor = col;
        p.append(el('b', '', DRUM_ROWS.find(d => d[0] === k)[1]), el('i', '', kb.toUpperCase()));
        const down = ev => { ev.preventDefault(); press(k, k); };
        p.addEventListener('pointerdown', down);
        p.addEventListener('pointerup', () => release(k));
        p.addEventListener('pointerleave', () => release(k));
        row.appendChild(p);
      });
      wrap.appendChild(row);
      return;
    }
    const base = 60 + G.oct * 12;
    const octs = 2, kb = el('div', 'g-piano');
    wrap.appendChild(el('div', 'g-octlbl', 'C' + (Math.floor(base / 12) - 1) + '   Z/X = OCTAVE'));
    for (let o = 0; o < octs; o++) WHITE.forEach(d => {
      const m = base + o * 12 + d, ok = !G.magic || api.lang.inScale(m, song.key, song.scale);
      const k = el('div', 'g-wk' + (ok ? '' : ' off') + (api.lang.noteToMidi(song.key + '4') % 12 === m % 12 ? ' root' : ''));
      k.dataset.k = 'm' + m; k.style.setProperty('--c', col);
      k.appendChild(el('span', '', api.lang.pcName(m)));
      if (ok) {
        k.addEventListener('pointerdown', ev => { ev.preventDefault(); press('m' + m, m); });
        k.addEventListener('pointerup', () => release('m' + m));
        k.addEventListener('pointerleave', () => release('m' + m));
      }
      kb.appendChild(k);
    });
    const wkW = 100 / (octs * 7);
    for (let o = 0; o < octs; o++) Object.keys(BLACK).forEach(d => {
      const m = base + o * 12 + +d, ok = !G.magic || api.lang.inScale(m, song.key, song.scale);
      const k = el('div', 'g-bk' + (ok ? '' : ' off'));
      k.dataset.k = 'm' + m;
      const wi = o * 7 + BLACK[d];
      k.style.left = ((wi + 1) * wkW - wkW * 0.3) + '%'; k.style.width = (wkW * 0.6) + '%';
      if (ok) {
        k.addEventListener('pointerdown', ev => { ev.preventDefault(); ev.stopPropagation(); press('m' + m, m); });
        k.addEventListener('pointerup', () => release('m' + m));
        k.addEventListener('pointerleave', () => release('m' + m));
      }
      kb.appendChild(k);
    });
    wrap.appendChild(kb);
  }

  /* the computer keyboard, while the Garage window has the focus */
  function keydown(ev) {
    if (ev.ctrlKey || ev.metaKey || ev.altKey || /input|textarea|select/i.test(ev.target.tagName)) return false;
    const G = api.G, tr = G.song.tracks[G.sel], k = ev.key.toLowerCase();
    if (k === 'z' || k === 'x') { if (!ev.repeat) { G.oct = Math.max(-2, Math.min(2, G.oct + (k === 'x' ? 1 : -1))); render(); } return true; }
    if (!tr) return false;
    if (tr.inst === 'drums') { const p = PADS.find(x => x[1] === k); if (p) { if (!ev.repeat) press(p[0], p[0]); return true; } return false; }
    const base = 60 + G.oct * 12;
    let m = null;
    const wi = KW.indexOf(k);
    if (wi >= 0) m = base + Math.floor(wi / 7) * 12 + WHITE[wi % 7];
    else if (KB[k] != null) { const b = KB[k]; m = base + (b >= 12 ? 12 + (b - 12) : b); }
    if (m == null) return false;
    if (G.magic && !api.lang.inScale(m, G.song.key, G.song.scale)) return true;
    if (!ev.repeat) press('c' + k, m);
    return true;
  }
  function keyup(ev) { const k = ev.key.toLowerCase(); if (held.has('c' + k)) release('c' + k); else { const p = PADS.find(x => x[1] === k); if (p) release(p[0]); } }
  return { render, keydown, keyup, releaseAll() { [...held.keys()].forEach(release); } };
}
