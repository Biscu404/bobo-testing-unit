/* Getting a song out: a WAV (16 or 24 bit, 44.1 or 48 kHz, optionally brought up to a
   peak level, with the whole song, the picked stretch or the loop), a WAV for every
   track (stems, to mix somewhere else), or a MIDI file. What is bounced is rendered
   offline through the same desk that plays it, so it sounds the same, and the dialog
   reports the peak and loudness it came out at. */
import { el, btn, modal } from './ui.js';
import { toDb } from './meters.js';

const name = (song, extra) => (song.title || 'SONG').replace(/[^A-Za-z0-9 _-]/g, '').trim().replace(/\s+/g, '_') + (extra ? '_' + extra : '');
function download(file, blob) {
  const a = document.createElement('a');
  a.download = file; a.href = URL.createObjectURL(blob);
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 8000);
}
function stats(buf) {
  let pk = 0, sq = 0, n = 0;
  for (let c = 0; c < buf.numberOfChannels; c++) { const d = buf.getChannelData(c); for (let i = 0; i < d.length; i += 3) { const v = Math.abs(d[i]); if (v > pk) pk = v; sq += v * v; n++; } }
  return { peak: toDb(pk), rms: toDb(Math.sqrt(sq / Math.max(1, n))) };
}

export function exportDialog(root, api) {
  const G = api.G, S = api.studio, song = G.song;
  const m = modal(root, 'EXPORT', 'g-small g-export');
  const row = (label, node) => { const r = el('div', 'g-erow'); r.append(el('span', 'g-elbl', label), node); m.body.appendChild(r); return node; };
  const sel = (opts, def) => { const s = el('select', 'g-sel'); opts.forEach(([lb, v]) => s.appendChild(new Option(lb, String(v)))); s.value = String(def); return s; };
  const where = [['THE WHOLE SONG', 'all']];
  if (G.range) where.unshift(['THE PICKED STRETCH', 'range']);
  if (G.loop && G.range) where.push(['THE LOOP', 'range']);
  const range = row('PART', sel(where, G.range ? 'range' : 'all'));
  const bits = row('BIT DEPTH', sel([['16 BIT (DITHERED)', 16], ['24 BIT', 24]], 24));
  const rate = row('SAMPLE RATE', sel([['44.1 kHz', 44100], ['48 kHz', 48000]], 44100));
  const norm = row('LEVEL', sel([['AS MIXED', 'null'], ['PEAK AT -1 dB', -1], ['PEAK AT -3 dB', -3]], 'null'));
  const tail = row('TAIL', sel([['NONE', 0], ['2 SECONDS', 2], ['4 SECONDS (ROOM RINGS OUT)', 4]], 2));
  const out = el('div', 'g-p g-dim', 'PICK WHAT YOU WANT, THEN PRESS A BUTTON.');
  m.body.appendChild(out);
  const opts = () => {
    const r = range.value === 'range' && G.range;
    return { from: r ? G.range.a : 0, to: r ? G.range.b : song.bars * song.beats, sampleRate: +rate.value, tail: +tail.value, limit: song.limit === undefined ? -9 : song.limit, level: 0.9 };
  };
  const wavOpts = () => ({ bits: +bits.value, normalize: norm.value === 'null' ? null : +norm.value, dither: true });
  const busy = on => foot.querySelectorAll('button').forEach(b => { b.disabled = on; });
  const foot = el('div', 'g-boxfoot');
  foot.append(
    btn('WAV', 'g-go', async () => {
      busy(true); out.textContent = 'RENDERING...';
      try {
        const buf = await S.render(song, opts()), s = stats(buf);
        download(name(song) + '.wav', S.wav(buf, wavOpts()));
        out.textContent = 'DONE. PEAK ' + s.peak.toFixed(1) + ' dBFS, LOUDNESS ' + s.rms.toFixed(1) + ' dBFS (RMS). IN YOUR DOWNLOADS.';
      } catch (e) { out.textContent = 'THAT FAILED: ' + e.message; }
      busy(false);
    }),
    btn('STEMS', '', async () => {
      busy(true);
      try {
        for (let i = 0; i < song.tracks.length; i++) {
          const t = song.tracks[i]; out.textContent = 'RENDERING ' + t.name + ' (' + (i + 1) + ' OF ' + song.tracks.length + ')...';
          const buf = await S.render(song, Object.assign(opts(), { only: t.id }));
          download(name(song, (i + 1) + '_' + t.name.replace(/[^A-Za-z0-9]/g, '')) + '.wav', S.wav(buf, wavOpts()));
          await new Promise(r => setTimeout(r, 350));
        }
        out.textContent = 'DONE. ONE WAV PER TRACK, ALL THE SAME LENGTH, SO THEY LINE UP.';
      } catch (e) { out.textContent = 'THAT FAILED: ' + e.message; }
      busy(false);
    }),
    btn('MIDI', '', () => {
      try { download(name(song) + '.mid', new Blob([S.midi.toMidi(song)], { type: 'audio/midi' })); out.textContent = 'DONE. A .MID FILE IN YOUR DOWNLOADS: THE NOTES AND THE TEMPO, NOT THE SOUNDS.'; }
      catch (e) { out.textContent = 'THAT FAILED: ' + e.message; }
    }),
    btn('CLOSE', '', () => m.close()));
  m.body.appendChild(foot);
}
