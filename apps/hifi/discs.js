export const HFP = {
  black:  '#0a0a0c', case_:  '#1c1d21', panel:  '#33353c', panelHi:'#4a4d56',
  brush:  '#6e727d', brushHi:'#9aa0ad', screw:  '#25262b', wood:   '#4a3220',
  woodHi: '#63432b', lcd:    '#0d2018', lcdOn:  '#5bff9e', lcdDim: '#1d5c3a',
  amber:  '#ffb43c', amberDim:'#6b4a18', red:   '#ff4a3c', green:  '#5bff6e',
  cyan:   '#4fe3ff', white:  '#e8ecf2'
};

export const HFN = {
  A1:55.00, B1:61.74, C2:65.41, D2:73.42, E2:82.41, F2:87.31, G2:98.00,
  A2:110.00, Bb2:116.54, B2:123.47, C3:130.81, D3:146.83, E3:164.81, F3:174.61,
  Fs3:185.00, G3:196.00, A3:220.00, Bb3:233.08, B3:246.94, C4:261.63, Cs4:277.18,
  D4:293.66, E4:329.63, F4:349.23, Fs4:369.99, G4:392.00, A4:440.00, Bb4:466.16,
  B4:493.88, C5:523.25, Cs5:554.37, D5:587.33, E5:659.26, F5:698.46, Fs5:739.99,
  G5:783.99, A5:880.00, Bb5:932.33, C6:1046.50, D6:1174.66, E6:1318.51
};
/* ---- 28.3 pressing a record ---------------------------------------------
   One OfflineAudioContext per disc. Same voices as the machine's own
   speaker — squares and triangles and filtered noise — just given room to
   breathe and a stereo spread, because this is the good hi-fi. */
export function hifiPress(spec, rate) {
  const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  if (!OAC) return Promise.resolve(null);
  const step = 15 / spec.bpm;                       /* one sixteenth */
  const barLen = spec.len * step;
  const total = barLen * spec.reps + 2.2;
  let oc;
  try { oc = new OAC(2, Math.ceil(rate * total), rate); } catch (e) { return Promise.resolve(null); }

  const out = oc.createGain(); out.gain.value = 0.82; out.connect(oc.destination);
  /* a gentle roll-off so the squares are not all edge */
  const soft = oc.createBiquadFilter(); soft.type = 'lowpass';
  soft.frequency.value = 5200; soft.Q.value = 0.5; soft.connect(out);

  const bus = (panv, level) => {
    const p = oc.createStereoPanner ? oc.createStereoPanner() : null;
    const g = oc.createGain(); g.gain.value = level;
    if (p) { p.pan.value = panv; g.connect(p); p.connect(soft); } else g.connect(soft);
    return g;
  };
  const leadB = bus(0.18, 0.34), bassB = bus(0, 0.46), padB = bus(-0.26, 0.22),
        arpB  = bus(0.34, 0.18), drumB = bus(0, 0.40);

  const note = (dest, f, at, dur, type, vol, glide, detune) => {
    if (!f || !(vol > 0)) return;
    const o = oc.createOscillator(), g = oc.createGain();
    o.type = type; o.frequency.setValueAtTime(f, at);
    if (glide) o.frequency.exponentialRampToValueAtTime(Math.max(20, glide), at + dur);
    if (detune) o.detune.setValueAtTime(detune, at);
    const atk = Math.min(0.012, dur * 0.3);
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(vol, at + atk);
    g.gain.setValueAtTime(vol, at + Math.max(atk, dur * 0.6));
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    o.connect(g); g.connect(dest); o.start(at); o.stop(at + dur + 0.05);
  };
  /* a note is [name | hertz, at, length, extras?] -- the extras are what the
     lobby variants use (glide ratio g, volume v, detune d, type t, octave o) */
  const pitch = n => (typeof n === 'number' ? n : HFN[n]);
  const tb = Object.assign({ lead: 'square', bass: 'square', pad: 'triangle', arp: 'triangle' }, spec.timbre || {});
  const rel = Object.assign({ lead: 1, bass: 1, pad: 1, arp: 1, drum: 1 }, spec.rel || {});
  const layer = (dest, list, key, at, lenK, vol, fade) => (list || []).forEach(n => {
    const x = n[3] || {}, f = pitch(n[0]) * (x.o || 1);
    note(dest, f, at(n[1]), n[2] * step * lenK, x.t || tb[key], vol * rel[key] * (x.v || 1) * fade,
         x.g ? f * x.g : 0, x.d || 0);
  });
  const hit = (dest, at, ms, freq, q, vol) => {
    const n = Math.max(1, Math.floor(rate * ms / 1000));
    const buf = oc.createBuffer(1, n, rate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2);
    const s = oc.createBufferSource(); s.buffer = buf;
    const f = oc.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
    const g = oc.createGain(); g.gain.value = vol;
    s.connect(f); f.connect(g); g.connect(dest); s.start(at);
  };

  for (let r = 0; r < spec.reps; r++) {
    const t0 = r * barLen;
    const at = i => t0 + i * step;
    const fade = r === 0 ? 0.55 : (r >= spec.reps - 2 ? 0.6 : 1);   /* in at the top, out at the end */
    layer(bassB, spec.bass, 'bass', at, 0.92, 0.30, fade);
    layer(padB,  spec.pad,  'pad',  at, 0.96, 0.22, fade);
    layer(leadB, spec.lead, 'lead', at, 0.90, 0.26, fade);
    if (spec.arp && r > 0) layer(arpB, spec.arp, 'arp', at, 0.7, 0.20, fade);
    if (r > 0) {
      const dk = rel.drum;
      (spec.kick  || []).forEach(i => note(drumB, 132, at(i), 0.17, 'sine', 0.55 * fade * dk, 44));
      (spec.snare || []).forEach(i => { hit(drumB, at(i), 140, 1850, 0.9, 0.32 * fade * dk); note(drumB, 190, at(i), 0.09, 'triangle', 0.16 * fade * dk, 92); });
      (spec.hat   || []).forEach(i => hit(drumB, at(i), 28, 8200, 1.7, 0.14 * fade * dk));
    }
  }
  return oc.startRendering();
}

/* ---- 28.4 what a file says about itself ---------------------------------
   Minimal ID3v2: enough for a title, an artist and the cover art, and
   nothing else. Anything unparseable falls back to the filename. */
export function hifiTags(ab) {
  const out = { title: null, artist: null, art: null };
  try {
    const v = new DataView(ab), u = new Uint8Array(ab);
    if (u.length < 10 || u[0] !== 0x49 || u[1] !== 0x44 || u[2] !== 0x33) return out;
    const major = u[3];
    const syncsafe = o => (u[o] << 21) | (u[o + 1] << 14) | (u[o + 2] << 7) | u[o + 3];
    const size = syncsafe(6);
    let p = 10;
    const end = Math.min(u.length, 10 + size);
    const str = (off, len, enc) => {
      const b = u.subarray(off, off + len);
      if (enc === 1 || enc === 2) {
        try { return new TextDecoder(enc === 1 ? 'utf-16' : 'utf-16be').decode(b).replace(/\0+$/, ''); }
        catch (e) { return ''; }
      }
      try { return new TextDecoder(enc === 3 ? 'utf-8' : 'iso-8859-1').decode(b).replace(/\0+$/, ''); }
      catch (e) { return ''; }
    };
    while (p + 10 <= end) {
      const id = String.fromCharCode(u[p], u[p + 1], u[p + 2], u[p + 3]);
      if (!/^[A-Z0-9]{4}$/.test(id)) break;
      const fs = major >= 4 ? syncsafe(p + 4) : v.getUint32(p + 4);
      if (fs <= 0 || p + 10 + fs > end) break;
      const body = p + 10;
      if (id === 'TIT2' || id === 'TPE1') {
        const s = str(body + 1, fs - 1, u[body]);
        if (s) { if (id === 'TIT2') out.title = s; else out.artist = s; }
      } else if (id === 'APIC' && !out.art) {
        const enc = u[body];
        let q = body + 1;
        while (q < body + fs && u[q] !== 0) q++;          /* mime */
        const mime = str(body + 1, q - body - 1, 0) || 'image/jpeg';
        q++; q++;                                         /* skip picture type */
        if (enc === 1 || enc === 2) { while (q + 1 < body + fs && !(u[q] === 0 && u[q + 1] === 0)) q += 2; q += 2; }
        else { while (q < body + fs && u[q] !== 0) q++; q++; }
        if (q < body + fs) out.art = new Blob([u.subarray(q, body + fs)], { type: mime });
      }
      p = body + fs;
    }
  } catch (e) { /* a tag we cannot read is a tag we do not need */ }
  return out;
}

