/* The instrument picker: every instrument, grouped, each one a card you can
   press to hear. */
import { el, btn, modal } from './ui.js';
import { FAMILIES, BLURB } from './model.js';
import { packOf, owns } from './packs.js';

let auditioning = null;

export function audition(api, id) {
  const L = api.lang, S = api.studio;
  if (auditioning) { auditioning.stop(); auditioning = null; }
  S.ins.load(id).then(bank => {
    let song;
    if (id === 'drums') song = L.buildSong({ bpm: 120, bars: 1, tracks: [{ name: 'D', drums: { kick: 'x...x...x...x...', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.x.' } }] });
    else {
      const lo = bank.meta.samples[0].midi, hi = bank.meta.samples[bank.meta.samples.length - 1].midi;
      let c = Math.round(((lo + hi) / 2) / 12) * 12;                     /* the C nearest the middle of its range */
      if (c < lo) c += 12;
      song = L.buildSong({ bpm: 112, bars: 1, tracks: [{ name: 'T', inst: id, reverb: 0.25, notes: L.midiToName(c) + ':q ' + L.midiToName(c + 4) + ' ' + L.midiToName(c + 7) + ' ' + L.midiToName(c + 12) + ':q' }] });
    }
    auditioning = S.play(song, { loop: false });
  }).catch(() => {});
}
export const stopAudition = () => { if (auditioning) { auditioning.stop(); auditioning = null; } };

export function openPicker(root, api, current, onPick) {
  const m = modal(root, 'PICK AN INSTRUMENT', 'g-picker');
  let chosen = current;
  const info = el('div', 'g-pickinfo', 'PRESS ONE TO HEAR IT');
  const grid = el('div', 'g-pickgrid');
  const all = api.studio.ins.listed();
  const cards = {};
  FAMILIES.forEach(([fam, label]) => {
    const mine = all.filter(i => (i.family || 'DRUMS') === fam);
    if (!mine.length) return;
    grid.appendChild(el('div', 'g-famhead', fam + '  -  ' + label));
    const row = el('div', 'g-famrow');
    mine.forEach(i => {
      const pack = packOf(i.id), have = owns(i.id) || i.id === current;
      const c = el('div', 'g-icard' + (i.id === current ? ' sel' : '') + (have ? '' : ' locked'));
      c.append(el('b', '', i.name), el('i', '', have ? (BLURB[i.id] || '') : (pack.name + '  ' + pack.price + ' SUN')));
      c.addEventListener('mousedown', ev => {
        if (ev.button !== 0) return;
        ev.stopPropagation();
        chosen = i.id;
        Object.values(cards).forEach(k => k.classList.remove('sel'));
        c.classList.add('sel');
        info.textContent = i.name + ' - ' + (BLURB[i.id] || '') + (have ? '' : '   [ ' + pack.name + ', ' + pack.price + ' SUN AT DAVE\'S: PRESS GET IT ]');
        go.textContent = have ? 'USE IT' : 'GET IT AT DAVE\'S';
        audition(api, i.id);
      });
      c.addEventListener('dblclick', () => { if (!owns(chosen) && chosen !== current) return; stopAudition(); onPick(chosen); m.close(); });
      cards[i.id] = c;
      row.appendChild(c);
    });
    grid.appendChild(row);
  });
  m.body.append(grid, info);
  const foot = el('div', 'g-boxfoot');
  const go = btn('USE IT', 'g-go', () => {
    if (!owns(chosen) && chosen !== current) { stopAudition(); m.close(); api.openShop && api.openShop('garage'); return; }
    stopAudition(); onPick(chosen); m.close();
  });
  foot.append(go, btn('CANCEL', '', () => { stopAudition(); m.close(); }));
  m.body.appendChild(foot);
  return m;
}
