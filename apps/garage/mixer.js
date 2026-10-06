/* The desk: a strip for every track and one for the master, with the things a mix is
   made of. Per track: fader, pan, three bands of EQ, compressor, drive, and sends to the
   room and the echo, with a meter. The master has its fader, a limiter you can set, a
   stereo meter with peak hold, loudness, and the spectrum of what is coming out. */
import { el, btn, slider } from './ui.js';
import { colourOf } from './tracks.js';
import { vmeter, holder, spectrum, toDb } from './meters.js';

const LIMITS = [['OFF', null], ['-1 dB', -1], ['-3 dB', -3], ['-6 dB', -6], ['-9 dB', -9], ['-12 dB', -12]];

export function makeMixer(host, api) {
  const wrap = el('div', 'g-mixer');
  host.appendChild(wrap);
  const strips = new Map(), holds = new Map();
  let master = null;

  /* a labelled control: a slider with its value shown beside it */
  const knob = (lb, lo, hi, step, get, set, fmt, vertical) => {
    const box = el('div', 'g-mk' + (vertical ? ' v' : ''));
    const val = el('span', 'g-mkv', fmt(get()));
    const s = slider(lo, hi, get(), step, v => { set(v); val.textContent = fmt(v); });
    s.addEventListener('dblclick', () => { /* a double-click puts it back where it started */ s.value = String(lo < 0 && hi > 0 ? 0 : (lb === 'VOL' ? 0.8 : lo)); s.dispatchEvent(new Event('input')); });
    if (vertical) s.classList.add('vert');
    box.append(vertical ? val : el('span', 'g-mkl', lb), s, vertical ? el('span', 'g-mkl', lb) : val);
    return box;
  };
  const pct = v => Math.round(v * 100) + '';
  const dbs = v => (v > 0 ? '+' : '') + v.toFixed(0);

  function render() {
    const G = api.G, song = G.song;
    wrap.replaceChildren(); strips.clear();
    song.tracks.forEach((t, i) => {
      const s = el('div', 'g-strip' + (i === G.sel ? ' sel' : ''));
      s.style.borderTopColor = colourOf(song, i);
      s.appendChild(el('div', 'g-sname', t.name));
      const row = el('div', 'g-srow');
      const meter = el('canvas', 'g-smeter'); meter.width = 10; meter.height = 110;
      const eq = el('div', 'g-seq');
      t.eq = t.eq || [0, 0, 0];
      [['LO', 0], ['MID', 1], ['HI', 2]].forEach(([lb, k]) => eq.appendChild(knob(lb, -12, 12, 0.5, () => t.eq[k], v => { t.eq[k] = v; api.changed('mix'); }, dbs, true)));
      row.append(meter, knob('VOL', 0, 1, 0.01, () => t.vol == null ? 0.8 : t.vol, v => { t.vol = v; api.changed('mix'); }, pct, true), eq);
      s.appendChild(row);
      s.append(
        knob('PAN', -1, 1, 0.01, () => t.pan || 0, v => { t.pan = v; api.changed('mix'); }, v => v === 0 ? 'C' : (v < 0 ? 'L' : 'R') + Math.round(Math.abs(v) * 100)),
        knob('COMP', 0, 1, 0.01, () => t.comp || 0, v => { t.comp = v; api.changed('mix'); }, pct),
        knob('DRIVE', 0, 1, 0.01, () => t.drive || 0, v => { t.drive = v; api.changed('mix'); }, pct),
        knob('ROOM', 0, 1, 0.01, () => t.reverb == null ? 0.15 : t.reverb, v => { t.reverb = v; api.changed('mix'); }, pct),
        knob('ECHO', 0, 1, 0.01, () => t.echo || 0, v => { t.echo = v; api.changed('mix'); }, pct));
      const mb = el('div', 'g-sbtns');
      mb.append(btn('M', 'g-sm' + (t.mute ? ' on' : ''), () => { t.mute = !t.mute; api.changed('mix'); }, 'MUTE'), btn('S', 'g-sm' + (t.solo ? ' on' : ''), () => { t.solo = !t.solo; api.changed('mix'); }, 'SOLO'));
      s.appendChild(mb);
      s.addEventListener('mousedown', () => { if (G.sel !== i) api.selectTrack(i); });
      wrap.appendChild(s);
      strips.set(t.id, { meter, hold: holds.get(t.id) || holder() });
      holds.set(t.id, strips.get(t.id).hold);
    });
    /* the master */
    const m = el('div', 'g-strip g-master');
    m.appendChild(el('div', 'g-sname', 'MASTER'));
    const mr = el('div', 'g-srow');
    const ml = el('canvas', 'g-smeter'), mrc = el('canvas', 'g-smeter');
    ml.width = mrc.width = 14; ml.height = mrc.height = 110;
    mr.append(ml, mrc, knob('OUT', 0, 1, 0.01, () => api.studio.user, v => { api.studio.user = v; api.studio.relevel(); }, pct, true));
    m.appendChild(mr);
    const sel = el('select', 'g-sel');
    LIMITS.forEach(([lb, v]) => sel.appendChild(new Option('LIMITER ' + lb, String(v))));
    sel.value = String(song.limit === undefined ? -9 : song.limit);
    sel.addEventListener('change', () => { song.limit = sel.value === 'null' ? null : parseFloat(sel.value); const p = api.player(); if (p) p.mix.setLimit(song.limit); api.changed('mix'); });
    sel.addEventListener('mousedown', ev => ev.stopPropagation());
    m.appendChild(sel);
    const mono = btn('MONO', 'g-tog' + (api.G.mono ? ' on' : ''), (ev, b) => { api.G.mono = !api.G.mono; b.classList.toggle('on', api.G.mono); const p = api.player(); if (p) p.mix.setMono(api.G.mono); }, 'SUM THE TWO SIDES TO ONE SPEAKER, TO HEAR WHETHER ANYTHING DISAPPEARS (IT SHOULD NOT)');
    m.appendChild(mono);
    const rd = el('div', 'g-read', 'PEAK -- dB'), rd2 = el('div', 'g-read', 'RMS -- dB'), rd3 = el('div', 'g-read', 'LIMITER 0 dB');
    m.append(rd, rd2, rd3);
    const sp = el('canvas', 'g-spec'); sp.width = 240; sp.height = 80;
    wrap.appendChild(m);
    const side = el('div', 'g-strip g-spechost');
    side.append(el('div', 'g-sname', 'SPECTRUM'), sp);
    wrap.appendChild(side);
    master = { ml, mr: mrc, rd, rd2, rd3, sp, hl: holder(), hr: holder(), rms: [] };
    spectrum(sp, null, 44100);
  }

  /* called every frame while something plays (and once more when it stops, with null) */
  function level(lv, now) {
    strips.forEach((s, id) => { const x = lv && lv.tracks[id]; vmeter(s.meter, x ? x.peak : 0, s.hold.feed(x ? x.peak : 0, now)); });
    if (!master) return;
    const l = lv ? lv.l : { peak: 0, rms: 0 }, r = lv ? lv.r : { peak: 0, rms: 0 };
    const hl = master.hl.feed(l.peak, now), hr = master.hr.feed(r.peak, now);
    vmeter(master.ml, l.peak, hl); vmeter(master.mr, r.peak, hr);
    const pk = Math.max(hl, hr);
    master.rd.textContent = 'PEAK ' + (pk > 0.0001 ? toDb(pk).toFixed(1) : '--') + ' dB';
    master.rd.classList.toggle('hot', pk >= 0.99);
    master.rms.push(Math.max(l.rms, r.rms)); if (master.rms.length > 90) master.rms.shift();
    const rms = Math.sqrt(master.rms.reduce((a, b) => a + b * b, 0) / master.rms.length);
    master.rd2.textContent = 'RMS  ' + (rms > 0.0001 ? toDb(rms).toFixed(1) : '--') + ' dB';
    master.rd3.textContent = 'LIMITER ' + (lv && lv.reduction < -0.1 ? lv.reduction.toFixed(1) : '0') + ' dB';
    const p = api.player();
    spectrum(master.sp, p ? p.mix.spectrum() : null, window.Snd && window.Snd.ctx ? window.Snd.ctx.sampleRate : 44100);
  }
  return { render, level, el: wrap };
}
